// src/Services/suratJalanService.js
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

/* ======================================================
   CONSTANTS
====================================================== */
const SURAT_JALAN_COLLECTION = "suratJalan";
const USERS_COLLECTION = "users";
const STOCK_LEDGER_COLLECTION = "stockLedger";

// Tipe surat jalan yang valid
export const SJ_TIPE = {
  BARANG_MASUK: "BARANG_MASUK",
  MUTASI: "MUTASI",
};

// Status surat jalan
export const SJ_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

/* ======================================================
   HELPER FUNCTIONS
====================================================== */
const formatDateForQuery = (date) => {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
};

const getGudangNamaFromId = (gudangId) => {
  if (!gudangId) return "-";
  const match = gudangId.match(/gudang_(.+)/);
  return match ? match[1].toUpperCase() : gudangId;
};

// Cache users
const userCache = new Map();

const getUserData = async (userId) => {
  if (!userId) return null;

  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userCache.set(userId, userData);
      return userData;
    }
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }

  return null;
};

const getMultipleUsers = async (userIds) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const result = new Map();
  const uncachedIds = [];

  uniqueIds.forEach((id) => {
    if (userCache.has(id)) {
      result.set(id, userCache.get(id));
    } else {
      uncachedIds.push(id);
    }
  });

  for (let i = 0; i < uncachedIds.length; i += 10) {
    const batch = uncachedIds.slice(i, i + 10);
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      where("__name__", "in", batch),
    );

    try {
      const usersSnap = await getDocs(usersQuery);
      usersSnap.docs.forEach((doc) => {
        const userData = doc.data();
        userCache.set(doc.id, userData);
        result.set(doc.id, userData);
      });
    } catch (error) {
      console.error("Error fetching users batch:", error);
    }
  }

  return result;
};

const normalizeSuratJalan = async (doc, userMap = new Map()) => {
  const data = doc.data();
  const id = doc.id;

  let arah = null;
  if (data.tipe === "MUTASI") {
    if (data.gudang_asal) arah = "KELUAR";
    if (data.gudang_tujuan) arah = "MASUK";
  } else if (data.tipe === "BARANG_MASUK") {
    arah = "MASUK";
  }

  const createdByUser =
    userMap.get(data.created_by) || (await getUserData(data.created_by));
  const receivedByUser =
    userMap.get(data.received_by) || (await getUserData(data.received_by));

  // Untuk BARANG_MASUK, cari informasi supplier dari metadata
  let supplierNama = null;
  let supplierRef = null;

  if (data.tipe === "BARANG_MASUK") {
    supplierNama =
      data.metadata?.supplier ||
      data.metadata?.supplier_name ||
      data.metadata?.supplier_nama ||
      data.supplier_nama ||
      data.supplier ||
      "-";

    supplierRef =
      data.metadata?.referensi_supplier || data.referensi_supplier || null;
  }

  return {
    id,
    nomor_surat: id,
    tipe: data.tipe || "MUTASI",
    status: data.status || "pending",

    // Untuk MUTASI - gudang asal
    gudang_asal: data.gudang_asal || null,
    gudang_asal_nama: data.gudang_asal
      ? getGudangNamaFromId(data.gudang_asal)
      : null,

    // Untuk BARANG_MASUK - supplier
    supplier_nama: supplierNama,
    supplier_ref: supplierRef,

    // Gudang tujuan
    gudang_tujuan: data.gudang_tujuan || null,
    gudang_tujuan_nama:
      data.gudang_tujuan_nama ||
      (data.gudang_tujuan ? getGudangNamaFromId(data.gudang_tujuan) : null),

    // Items
    items: data.items || [],
    total_roll: data.total_roll || data.items?.length || 0,
    total_berat: data.total_berat || 0,

    // Timestamps
    created_at: data.created_at || null,
    approved_at: data.approved_at || null,
    completed_at: data.completed_at || null,
    received_at: data.received_at || null,

    // Users
    created_by: data.created_by || null,
    created_by_name:
      createdByUser?.nama || createdByUser?.email || data.created_by || "-",
    created_by_email: createdByUser?.email || null,

    received_by: data.received_by || null,
    received_by_name:
      receivedByUser?.nama || receivedByUser?.email || data.received_by || "-",
    received_by_email: receivedByUser?.email || null,

    // Additional
    catatan: data.catatan || "",
    metadata: data.metadata || {},

    arah,
  };
};

/* ======================================================
   GET SURAT JALAN BY DATE RANGE
====================================================== */
export const getSuratJalan = async (startDate, endDate, limitCount = 1000) => {
  try {
    console.log("📋 Fetching surat jalan...");
    console.log("📅 Period:", { startDate, endDate });

    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);
    console.log(`📦 Found ${snap.size} surat jalan`);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    const suratJalan = await Promise.all(
      snap.docs.map((doc) => normalizeSuratJalan(doc, userMap)),
    );

    return suratJalan;
  } catch (error) {
    console.error("❌ Error getting surat jalan:", error);
    return [];
  }
};

/* ======================================================
   GET SURAT JALAN STATS
====================================================== */
export const getSuratJalanStats = async (startDate, endDate) => {
  try {
    const suratJalan = await getSuratJalan(startDate, endDate);

    const stats = {
      total: suratJalan.length,
      byTipe: {},
      byStatus: {},
      totalBerat: 0,
      totalRoll: 0,
      mutasi: 0,
      barangMasuk: 0,
    };

    suratJalan.forEach((sj) => {
      stats.byTipe[sj.tipe] = (stats.byTipe[sj.tipe] || 0) + 1;
      stats.byStatus[sj.status] = (stats.byStatus[sj.status] || 0) + 1;
      stats.totalBerat += sj.total_berat || 0;
      stats.totalRoll += sj.total_roll || 0;

      if (sj.tipe === "MUTASI") stats.mutasi++;
      else if (sj.tipe === "BARANG_MASUK") stats.barangMasuk++;
    });

    return stats;
  } catch (error) {
    console.error("❌ Error getting surat jalan stats:", error);
    return {
      total: 0,
      byTipe: {},
      byStatus: {},
      totalBerat: 0,
      totalRoll: 0,
      mutasi: 0,
      barangMasuk: 0,
    };
  }
};

/* ======================================================
   GET SURAT JALAN BY ID
====================================================== */
export const getSuratJalanById = async (id) => {
  try {
    const docRef = doc(db, SURAT_JALAN_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const userIds = [];
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);

      const userMap = await getMultipleUsers(userIds);

      return await normalizeSuratJalan(docSnap, userMap);
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting surat jalan by id:", error);
    return null;
  }
};

/* ======================================================
   GET SURAT JALAN BY TIPE
====================================================== */
export const getSuratJalanByTipe = async (
  tipe,
  startDate,
  endDate,
  limitCount = 100,
) => {
  try {
    if (!Object.values(SJ_TIPE).includes(tipe)) {
      console.warn(`⚠️ Tipe ${tipe} tidak valid`);
      return [];
    }

    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", tipe),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    return await Promise.all(
      snap.docs.map((doc) => normalizeSuratJalan(doc, userMap)),
    );
  } catch (error) {
    console.error("❌ Error getting surat jalan by tipe:", error);
    return [];
  }
};

/* ======================================================
   GET SURAT JALAN BY STATUS
====================================================== */
export const getSuratJalanByStatus = async (
  status,
  startDate,
  endDate,
  limitCount = 100,
) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("status", "==", status),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    return await Promise.all(
      snap.docs.map((doc) => normalizeSuratJalan(doc, userMap)),
    );
  } catch (error) {
    console.error("❌ Error getting surat jalan by status:", error);
    return [];
  }
};

/* ======================================================
   GET SURAT JALAN MUTASI
====================================================== */
export const getSuratJalanMutasi = async (
  startDate,
  endDate,
  limitCount = 100,
) => {
  return await getSuratJalanByTipe(
    SJ_TIPE.MUTASI,
    startDate,
    endDate,
    limitCount,
  );
};

/* ======================================================
   GET SURAT JALAN BARANG MASUK
====================================================== */
export const getSuratJalanBarangMasuk = async (
  startDate,
  endDate,
  limitCount = 100,
) => {
  return await getSuratJalanByTipe(
    SJ_TIPE.BARANG_MASUK,
    startDate,
    endDate,
    limitCount,
  );
};

/* ======================================================
   GET MUTASI KELUAR
====================================================== */
export const getMutasiKeluar = async (
  gudangId,
  startDate,
  endDate,
  limitCount = 50,
) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", SJ_TIPE.MUTASI),
      where("gudang_asal", "==", gudangId),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    const results = await Promise.all(
      snap.docs.map(async (doc) => ({
        ...(await normalizeSuratJalan(doc, userMap)),
        arah: "KELUAR",
      })),
    );

    return results;
  } catch (error) {
    console.error("❌ Error getting mutasi keluar:", error);
    return [];
  }
};

/* ======================================================
   GET MUTASI MASUK
====================================================== */
export const getMutasiMasuk = async (
  gudangId,
  startDate,
  endDate,
  limitCount = 50,
) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", SJ_TIPE.MUTASI),
      where("gudang_tujuan", "==", gudangId),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    const results = await Promise.all(
      snap.docs.map(async (doc) => ({
        ...(await normalizeSuratJalan(doc, userMap)),
        arah: "MASUK",
      })),
    );

    return results;
  } catch (error) {
    console.error("❌ Error getting mutasi masuk:", error);
    return [];
  }
};

/* ======================================================
   GET PENDING MUTASI MASUK
====================================================== */
export const getPendingMutasiMasuk = async (gudangId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", SJ_TIPE.MUTASI),
      where("gudang_tujuan", "==", gudangId),
      where("status", "in", ["approved", "pending"]),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    return await Promise.all(
      snap.docs.map((doc) => normalizeSuratJalan(doc, userMap)),
    );
  } catch (error) {
    console.error("❌ Error getting pending mutasi masuk:", error);
    return [];
  }
};

/* ======================================================
   GET COMPLETED MUTASI
====================================================== */
export const getCompletedMutasi = async (gudangId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", SJ_TIPE.MUTASI),
      where("status", "==", "completed"),
      where("gudang_asal", "==", gudangId),
      orderBy("completed_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    return await Promise.all(
      snap.docs.map((doc) => normalizeSuratJalan(doc, userMap)),
    );
  } catch (error) {
    console.error("❌ Error getting completed mutasi:", error);
    return [];
  }
};

/* ======================================================
   GET MUTASI BY GUDANG (KELUAR & MASUK)
====================================================== */
export const getMutasiByGudang = async (gudangId, limitCount = 50) => {
  try {
    const [keluar, masuk] = await Promise.all([
      getMutasiKeluar(gudangId, new Date(0), new Date(), limitCount),
      getMutasiMasuk(gudangId, new Date(0), new Date(), limitCount),
    ]);

    const semua = [...keluar, ...masuk].sort((a, b) => {
      const dateA = a.created_at?.toDate?.() || new Date(0);
      const dateB = b.created_at?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return semua;
  } catch (error) {
    console.error("❌ Error getting mutasi by gudang:", error);
    return [];
  }
};

/* ======================================================
   SEARCH SURAT JALAN
====================================================== */
export const searchSuratJalan = async (searchTerm, limitCount = 20) => {
  try {
    if (!searchTerm || searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      orderBy("created_at", "desc"),
      // limit(100),
    );

    const snap = await getDocs(q);

    const userIds = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.created_by) userIds.push(data.created_by);
      if (data.received_by) userIds.push(data.received_by);
    });

    const userMap = await getMultipleUsers(userIds);

    const results = [];

    for (const doc of snap.docs) {
      const data = await normalizeSuratJalan(doc, userMap);

      if (data.id?.toLowerCase().includes(term)) {
        results.push(data);
        continue;
      }

      if (data.supplier_nama?.toLowerCase().includes(term)) {
        results.push(data);
        continue;
      }

      if (
        data.items?.some((item) => item.rollId?.toLowerCase().includes(term))
      ) {
        results.push(data);
        continue;
      }

      if (data.catatan?.toLowerCase().includes(term)) {
        results.push(data);
        continue;
      }
    }

    return results.slice(0, limitCount);
  } catch (error) {
    console.error("❌ Error searching surat jalan:", error);
    return [];
  }
};
