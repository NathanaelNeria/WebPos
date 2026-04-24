import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Services/firebase";

export async function GenerateNomor(page) {
  // Tentukan nama collection
  let collectionName = "";
  switch (page) {
    case "kasir":
      collectionName = "transaksiPenjualan";
      break;
    case "mutasi":
      collectionName = "mutasi_pabrik";
      break;
    case "barangMasuk":
      collectionName = "barang_masuk";
      break;
    default:
      return null;
  }

  // Format tanggal hari ini
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}${mm}${dd}`;

  // Ambil semua doc di collection
  const snap = await getDocs(collection(db, collectionName));

  // Filter manual berdasarkan document ID yang mulai dengan prefix
  const filtered = snap.docs.filter((doc) => doc.id.startsWith(`INV-${today}`));

  // Tentukan nomor berikutnya
  const nextNumber = (filtered.length + 1).toString().padStart(3, "0");

  if (page === "kasir") return `INV-${today}-${nextNumber}`;
}
