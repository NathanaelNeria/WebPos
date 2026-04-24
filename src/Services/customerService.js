// src/Services/customerService.js
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

/* ======================================================
   CONSTANTS
====================================================== */
const COLLECTION = "customers"; // ← Sesuai dengan nama collection di Firestore

/* ======================================================
   HELPER FUNCTIONS
====================================================== */
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Hapus diakritik (é, è, dll)
    .replace(/[^a-z0-9]/g, ""); // Hanya huruf dan angka
};

/* ======================================================
   SEARCH CUSTOMERS - CASE INSENSITIVE
   Mencari berdasarkan nama, telepon, atau kode
====================================================== */
export const searchCustomers = async (searchTerm, limitCount = 10) => {
  try {
    console.log("🔍 Searching customers with term:", searchTerm);

    if (!searchTerm || searchTerm.length < 1) return [];

    const searchLower = searchTerm.toLowerCase();
    const searchNormalized = normalizeText(searchTerm);

    // Ambil semua customers (untuk filter manual karena Firestore case sensitive)
    const allQuery = query(
      collection(db, COLLECTION),
      orderBy("nama"), // Urutkan berdasarkan nama
      limit(50), // Batasi 50 customer untuk performa
    );

    const snapshot = await getDocs(allQuery);

    const results = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const nama = data.nama || "";
      const telepon = data.telepon || "";
      const kode = data.kode || "";

      // Case insensitive search dengan berbagai metode
      const matches =
        nama.toLowerCase().includes(searchLower) ||
        telepon.includes(searchTerm) ||
        kode.toLowerCase().includes(searchLower) ||
        normalizeText(nama).includes(searchNormalized);

      if (matches) {
        results.push({
          id: doc.id,
          nama: data.nama || "",
          telepon: data.telepon || "",
          alamat: data.alamat || "",
          kode: data.kode || "",
          email: data.email || "",
          totalTransaksi: data.totalTransaksi || 0,
          totalBelanja: data.totalBelanja || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => {
      const aStartsWith = a.nama.toLowerCase().startsWith(searchLower);
      const bStartsWith = b.nama.toLowerCase().startsWith(searchLower);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Then by total transaksi (pelanggan loyal lebih dulu)
      return (b.totalTransaksi || 0) - (a.totalTransaksi || 0);
    });

    console.log(`✅ Found ${results.length} customers`);
    return results.slice(0, limitCount);
  } catch (error) {
    console.error("❌ Error searching customers:", error);
    return [];
  }
};

/* ======================================================
   GET CUSTOMER BY ID
====================================================== */
export const getCustomerById = async (customerId) => {
  try {
    const docRef = doc(db, COLLECTION, customerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting customer:", error);
    return null;
  }
};

/* ======================================================
   SAVE CUSTOMER (CREATE OR UPDATE)
====================================================== */
export const saveCustomer = async (customerData) => {
  try {
    console.log("💾 Saving customer:", customerData);

    const { id, ...data } = customerData;

    // Prepare data dengan field untuk pencarian
    const payload = {
      ...data,
      nama: data.nama || "",
      nama_lower: (data.nama || "").toLowerCase(), // Untuk case insensitive search
      nama_normalized: normalizeText(data.nama || ""), // Untuk search tanpa diakritik
      telepon: data.telepon || "",
      alamat: data.alamat || "",
      email: data.email || "",
      updatedAt: serverTimestamp(),
    };

    if (id) {
      // Update existing customer
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, payload);
      console.log("✅ Customer updated:", id);
      return { id, ...data };
    } else {
      // Create new customer
      const kode = await generateCustomerCode();
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...payload,
        kode,
        totalTransaksi: 0,
        totalBelanja: 0,
        createdAt: serverTimestamp(),
      });
      console.log("✅ Customer created:", docRef.id);
      return {
        id: docRef.id,
        kode,
        ...data,
      };
    }
  } catch (error) {
    console.error("❌ Error saving customer:", error);
    throw error;
  }
};

/* ======================================================
   GENERATE CUSTOMER CODE
====================================================== */
const generateCustomerCode = async () => {
  try {
    const seqRef = doc(db, "sequences", "customer_counter");
    const seqSnap = await getDoc(seqRef);

    let lastNumber = 1;
    if (seqSnap.exists()) {
      lastNumber = seqSnap.data().lastNumber + 1;
      await updateDoc(seqRef, {
        lastNumber,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(seqRef, {
        lastNumber,
        createdAt: serverTimestamp(),
      });
    }

    return `CUST-${String(lastNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating customer code:", error);
    return `CUST-${Date.now().toString().slice(-5)}`;
  }
};

/* ======================================================
   UPDATE CUSTOMER STATS (setelah transaksi)
====================================================== */
export const updateCustomerStats = async (customerId, totalBelanja) => {
  try {
    console.log(
      "📊 Updating stats for customer:",
      customerId,
      "amount:",
      totalBelanja,
    );

    const docRef = doc(db, COLLECTION, customerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updates = {
        totalTransaksi: (data.totalTransaksi || 0) + 1,
        totalBelanja: (data.totalBelanja || 0) + totalBelanja,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updates);
      console.log("✅ Stats updated:", updates);
      return updates;
    }

    return null;
  } catch (error) {
    console.error("Error updating customer stats:", error);
    throw error;
  }
};

/* ======================================================
   GET TOP CUSTOMERS (untuk dashboard)
====================================================== */
export const getTopCustomers = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("totalTransaksi", ">", 0),
      orderBy("totalBelanja", "desc"),
      limit(limitCount),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting top customers:", error);
    return [];
  }
};

/* ======================================================
   GET RECENT CUSTOMERS
====================================================== */
export const getRecentCustomers = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting recent customers:", error);
    return [];
  }
};

/* ======================================================
   DELETE CUSTOMER (hati-hati!)
====================================================== */
export const deleteCustomer = async (customerId) => {
  try {
    const docRef = doc(db, COLLECTION, customerId);
    await updateDoc(docRef, {
      status: "DELETED",
      deletedAt: serverTimestamp(),
    });
    // Atau bisa juga pake deleteDoc(docRef) kalau mau hapus permanen
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

/* ======================================================
   MIGRATE: ADD SEARCH FIELDS TO EXISTING CUSTOMERS
   Jalankan sekali untuk menambahkan field pencarian
====================================================== */
export const migrateCustomers = async () => {
  try {
    console.log("🔄 Starting customer migration...");

    const snapshot = await getDocs(collection(db, COLLECTION));
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const updates = {};

      // Add lowercase field if not exists
      if (data.nama && !data.nama_lower) {
        updates.nama_lower = data.nama.toLowerCase();
      }

      // Add normalized field if not exists
      if (data.nama && !data.nama_normalized) {
        updates.nama_normalized = normalizeText(data.nama);
      }

      if (Object.keys(updates).length > 0) {
        batch.update(docSnap.ref, updates);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} customers`);
    } else {
      console.log("✅ No migration needed");
    }

    return { success: true, migrated: count };
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
};

/* ======================================================
   GET ALL CUSTOMERS (UNTUK DEBUG)
====================================================== */
export const getAllCustomers = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("📋 Total customers:", customers.length);
    return customers;
  } catch (error) {
    console.error("Error getting all customers:", error);
    return [];
  }
};
