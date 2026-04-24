// BulkUpload.jsx
import React, { useState } from "react";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "../Services/firebase";

// --- Masukkan daftar item yang Anda berikan (satu string per item) ---
const items = [
  "krem",
  "hitam",
  "putih",
  "pete",
  "BBB",
  "maroon",
  "misty 20s",
  // pastikan semua item dimasukkan — sesuaikan bila perlu
];

const COLLECTION_NAME = "produk"; // ganti sesuai koleksi Anda

const sanitizeId = (str) =>
  str
    .replace(/[/.#$[]]/g, "_") // ganti karakter terlarang
    .trim();

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function BulkUpload() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState({ done: 0, total: items.length });

  const handleUpload = async () => {
    setStatus("running");
    try {
      const chunks = chunkArray(items, 450);
      let done = 0;

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        const collRef = collection(
          db,
          COLLECTION_NAME,
          "Pique TC",
          "dataBarang"
        );

        chunk.forEach((name) => {
          const docId = sanitizeId(name);
          const docRef = doc(collRef, docId);
          batch.set(docRef, {
            name: name,
            kategori: "Pique TC",
            stokRol: 0,
            stokEcer: 0,
            totalBerat: 0,
            harga: 0,
            CreatedAt: new Date(),
          });
        });

        await batch.commit();
        done += chunk.length;
        setProgress({ done, total: items.length });
      }

      setStatus("done");
      console.log("✅ Semua dokumen berhasil ditulis dengan ID = nama item");
    } catch (err) {
      console.error("❌ Gagal upload:", err);
      setStatus("error");
    }
  };

  return (
    <div>
      <h3>Upload Data ke Firestore</h3>
      <p>Status: {status}</p>
      <p>
        Progress: {progress.done} / {progress.total}
      </p>
      <button onClick={handleUpload} disabled={status === "running"}>
        Upload Sekarang
      </button>
    </div>
  );
}
