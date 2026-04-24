import React from "react";
import { db } from "../Services/firebase";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import dataPenjualan from "./dataTransaksi";

// 🔹 Data barang baru
const items = ["gulungan"];

// 🔸 Ganti karakter ilegal untuk Firestore doc ID
// const sanitizeId = (str) => str.replace(/[.#$/[\]]/g, "_").trim();

export default function UpdateItemFirestore() {
  const uploadData = async () => {
    const batch = writeBatch(db);
    // const namaKategori = "Plastik";

    // 📁 Semua dokumen akan disimpan di koleksi "produk"
    const baseCollection = collection(db, "transaksi");

    dataPenjualan.forEach((item) => {
      const docRef = doc(baseCollection, item.invoice);
      const preparedData = { ...item, updatedAt: serverTimestamp() };

      batch.set(docRef, preparedData);
    });

    try {
      await batch.commit();
      alert(`✅ Semua data berhasil diupload!}!`);
    } catch (error) {
      console.error("❌ Error upload:", error);
    }
  };

  return (
    <div>
      <button
        onClick={uploadData}
        className="border rounded-md px-2 py-1 w-1/2 focus:ring-2 focus:ring-[#243A8C]"
      >
        Upload ke Firestore
      </button>
    </div>
  );
}
