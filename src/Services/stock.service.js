import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * STATUS RESMI SISTEM
 * AVAILABLE  → stok bebas
 * OPEN       → stok terbuka (tidak bisa mutasi)
 * DRAFT      → dikunci mutasi
 * IN_TRANSIT → dalam perjalanan
 * SOLD       → habis
 */
export const VALID_STOCK_STATUS = ["AVAILABLE", "OPEN"];

const normalizeStatus = (status = "") => status.toString().toUpperCase().trim();

/**
 * SINGLE SOURCE OF TRUTH STOK GUDANG
 * Semua halaman WAJIB pakai ini
 */
export const fetchStokGudang = async (gudangId) => {
  if (!gudangId) return [];

  const q = query(
    collection(db, "stockRolls"),
    where("gudangId", "==", gudangId),
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        rollId: d.rollId || doc.id.substring(0, 8),
        productId: d.productId || "unknown",
        namaProduk: d.namaProduk || d.produkNama || "Unknown",
        kategori: d.kategori || "TANPA KATEGORI",
        beratAwal: Number(d.beratAwal || d.beratKg || 0),
        beratSisa: Number(d.beratSisa || d.beratAwal || 0),
        status: normalizeStatus(d.status),
        kondisi: d.kondisi || "UTUH",
        gudangId: d.gudangId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    })
    .filter((r) => VALID_STOCK_STATUS.includes(r.status));
};
