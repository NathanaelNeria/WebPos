// src/Services/user.service.js
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";

const USERS_COLLECTION = "users";

// Helper untuk build payload user
export const buildUserPayload = (userData) => {
  const payload = {
    nama: userData.nama,
    email: userData.email,
    role: userData.role || [],
    isActive: userData.isActive ?? true,
    updatedAt: new Date().toISOString(),
  };

  // Handle gudang fields
  if (userData.role?.includes("owner")) {
    payload.gudangId = null;
    payload.gudangNama = null;
    payload.kasirGudangIds = [];
  } else {
    payload.gudangId = userData.gudangId || null;
    payload.gudangNama = userData.gudangNama || null;
    payload.kasirGudangIds = userData.kasirGudangIds || [];
  }

  return payload;
};

// Fetch semua users
export const fetchUsers = async () => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);

    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Urutkan berdasarkan createdAt terbaru
    return users.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Gagal mengambil data users");
  }
};

// Fetch daftar gudang
export const fetchGudang = async () => {
  try {
    const gudangRef = collection(db, "gudang");
    const snapshot = await getDocs(gudangRef);

    const gudang = [];
    snapshot.forEach((doc) => {
      gudang.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return gudang;
  } catch (error) {
    console.error("Error fetching gudang:", error);
    throw new Error("Gagal mengambil data gudang");
  }
};

// Create user baru (dengan Firebase Auth)
export const createUser = async (userData) => {
  // Pisahkan ownerPassword dari data user
  const { ownerPassword, ...newUserData } = userData;

  // Validasi password owner
  if (!ownerPassword) {
    throw new Error("Password owner diperlukan untuk membuat user baru");
  }

  try {
    // Validasi email sudah terdaftar di Firestore
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where("email", "==", newUserData.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error("Email sudah terdaftar");
    }

    // 1. Buat user di Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newUserData.email,
      newUserData.password,
    );

    const firebaseUser = userCredential.user;

    // 2. Buat payload untuk Firestore
    const payload = {
      ...buildUserPayload(newUserData),
      createdAt: new Date().toISOString(),
      uid: firebaseUser.uid,
    };

    // 3. Simpan data user ke Firestore
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    await setDoc(userRef, payload);

    console.log("✅ User baru berhasil dibuat:", firebaseUser.uid);

    return {
      id: firebaseUser.uid,
      ...payload,
    };
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === "auth/email-already-in-use") {
      throw new Error("Email sudah terdaftar di Authentication");
    }
    throw new Error(error.message || "Gagal membuat user baru");
  }
};

// Update user (tanpa mengubah password)
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Cek apakah user ada
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User tidak ditemukan");
    }

    const payload = buildUserPayload(userData);

    // Gunakan setDoc dengan merge: true untuk update sebagian field
    await setDoc(userRef, payload, { merge: true });

    console.log("✅ User berhasil diupdate:", userId);

    return {
      id: userId,
      ...payload,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error(error.message || "Gagal mengupdate user");
  }
};

// Toggle active status user
export const toggleUserActive = async (userId, isActive) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Cek apakah user ada
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User tidak ditemukan");
    }

    await setDoc(
      userRef,
      {
        isActive: isActive,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log(
      `✅ User ${userId} status diubah menjadi: ${isActive ? "Active" : "Inactive"}`,
    );

    return { id: userId, isActive };
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw new Error(error.message || "Gagal mengubah status user");
  }
};

// DELETE USER
export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Cek apakah user ada
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User tidak ditemukan");
    }

    // Hapus dari Firestore
    await deleteDoc(userRef);

    console.log(`✅ User ${userId} berhasil dihapus dari Firestore`);

    return {
      success: true,
      message: "User berhasil dihapus dari Firestore",
    };
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw new Error(error.message || "Gagal menghapus user");
  }
};

// Fungsi untuk mendapatkan user by ID
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user:", error);
    throw new Error("Gagal mengambil data user");
  }
};

// Batch delete multiple users
export const deleteMultipleUsers = async (userIds) => {
  try {
    const batch = writeBatch(db);

    userIds.forEach((userId) => {
      const userRef = doc(db, USERS_COLLECTION, userId);
      batch.delete(userRef);
    });

    await batch.commit();

    return {
      success: true,
      message: `${userIds.length} user berhasil dihapus dari Firestore`,
    };
  } catch (error) {
    console.error("Error batch deleting users:", error);
    throw new Error("Gagal menghapus multiple users");
  }
};
