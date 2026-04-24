// src/Services/mutasiService.js
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

const SURAT_JALAN_COLLECTION = "suratJalan";
const USERS_COLLECTION = "users";

const formatDateForQuery = (date) => {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
};

const getGudangNamaFromId = (gudangId) => {
  if (!gudangId) return "-";
  const match = gudangId.match(/gudang_(.+)/);
  return match ? match[1].toUpperCase() : gudangId;
};

const getUserName = async (userId) => {
  if (!userId) return null;
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.nama || userData.email || userId;
    }
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }
  return userId;
};

const normalizeMutasi = async (doc) => {
  const data = doc.data();
  const id = doc.id;

  const pengirimNama = await getUserName(data.created_by);
  const penerimaNama = await getUserName(data.received_by);

  let status = data.status;
  let statusLabel = data.status;

  if (status === "completed") statusLabel = "sampai";
  else if (status === "approved") statusLabel = "dikirim";
  else if (status === "pending") statusLabel = "dalam_perjalanan";
  else if (status === "cancelled") statusLabel = "dibatalkan";
  else statusLabel = status;

  // Hitung selisih berat (jika ada berat terima)
  let selisihBerat = 0;
  let persenSelisih = 0;
  // HAPUS baris ini: let beratTerima = data.berat_terima || data.total_berat;

  if (data.berat_terima) {
    selisihBerat = data.berat_terima - (data.total_berat || 0);
    persenSelisih =
      data.total_berat > 0 ? (selisihBerat / data.total_berat) * 100 : 0;
  }

  // Hitung waktu tempuh (jika ada received_at)
  let waktuTempuh = null;
  if (data.created_at && data.received_at) {
    const created = data.created_at.toDate?.() || new Date(data.created_at);
    const received = data.received_at.toDate?.() || new Date(data.received_at);
    const diffMs = received - created;
    waktuTempuh = diffMs / (1000 * 60 * 60); // dalam jam
  }

  return {
    id,
    nomor_surat: id,
    tanggal: data.created_at,
    tanggal_formatted: data.created_at
      ? new Date(
          data.created_at?.toDate?.() || data.created_at,
        ).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",

    asal: getGudangNamaFromId(data.gudang_asal),
    asal_id: data.gudang_asal,
    asal_nama: data.gudang_asal ? getGudangNamaFromId(data.gudang_asal) : null,

    tujuan: getGudangNamaFromId(data.gudang_tujuan),
    tujuan_id: data.gudang_tujuan,
    tujuan_nama:
      data.gudang_tujuan_nama ||
      (data.gudang_tujuan ? getGudangNamaFromId(data.gudang_tujuan) : null),

    pengirim: data.created_by,
    pengirim_nama: pengirimNama,

    penerima: data.received_by,
    penerima_nama: penerimaNama,

    items: data.items || [],
    total_roll: data.total_roll || data.items?.length || 0,
    total_berat: data.total_berat || 0,
    berat_terima: data.berat_terima || null,
    selisih_berat: selisihBerat,
    persen_selisih: persenSelisih,

    status: statusLabel,
    status_original: data.status,

    created_at: data.created_at,
    approved_at: data.approved_at,
    received_at: data.received_at,
    completed_at: data.completed_at,

    waktu_tempuh: waktuTempuh,

    catatan: data.catatan || "",
    metadata: data.metadata || {},

    get nama_barang() {
      const produkSet = new Set();
      this.items?.forEach((item) => {
        if (item.produkNama) produkSet.add(item.produkNama);
      });
      return Array.from(produkSet).join(", ") || "-";
    },
  };
};

/* ======================================================
   GET MUTASI RIWAYAT
====================================================== */
export const getMutasiRiwayat = async (
  startDate,
  endDate,
  limitCount = 1000,
) => {
  try {
    console.log("📋 Fetching mutasi riwayat...");
    console.log("📅 Period:", { startDate, endDate });

    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", "MUTASI"),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);
    console.log(`📦 Found ${snap.size} mutasi`);

    const mutasi = await Promise.all(
      snap.docs.map((doc) => normalizeMutasi(doc)),
    );

    return mutasi;
  } catch (error) {
    console.error("❌ Error getting mutasi riwayat:", error);
    return [];
  }
};

/* ======================================================
   GET MUTASI ANALYTICS
====================================================== */
export const getMutasiAnalytics = async (startDate, endDate) => {
  try {
    const mutasi = await getMutasiRiwayat(startDate, endDate);

    // Route statistics
    const routeMap = new Map();
    let totalSusut = 0;
    let totalLebih = 0;
    let countSusut = 0;
    let countLebih = 0;
    const anomalies = [];

    mutasi.forEach((m) => {
      // Route stats
      const routeKey = `${m.asal}->${m.tujuan}`;
      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          asal: m.asal,
          tujuan: m.tujuan,
          count: 0,
          totalBerat: 0,
          totalWaktu: 0,
          countWaktu: 0,
          totalSelisih: 0,
        });
      }

      const route = routeMap.get(routeKey);
      route.count++;
      route.totalBerat += m.total_berat || 0;

      if (m.waktu_tempuh) {
        route.totalWaktu += m.waktu_tempuh;
        route.countWaktu++;
      }

      route.totalSelisih += m.selisih_berat || 0;

      // Weight difference stats
      if (m.selisih_berat < 0) {
        totalSusut += Math.abs(m.selisih_berat);
        countSusut++;

        // Deteksi anomali susut > 5%
        if (Math.abs(m.persen_selisih) > 5) {
          anomalies.push({
            nomor_surat: m.nomor_surat,
            asal: m.asal,
            tujuan: m.tujuan,
            created_at: m.created_at,
            jenis: "selisih_berat",
            selisih: m.selisih_berat,
            persenSelisih: m.persen_selisih,
            tingkat: Math.abs(m.persen_selisih) > 10 ? "kritis" : "warning",
          });
        }
      } else if (m.selisih_berat > 0) {
        totalLebih += m.selisih_berat;
        countLebih++;

        // Deteksi anomali lebih > 5%
        if (m.persen_selisih > 5) {
          anomalies.push({
            nomor_surat: m.nomor_surat,
            asal: m.asal,
            tujuan: m.tujuan,
            created_at: m.created_at,
            jenis: "selisih_berat",
            selisih: m.selisih_berat,
            persenSelisih: m.persen_selisih,
            tingkat: m.persen_selisih > 10 ? "kritis" : "warning",
          });
        }
      }

      // Deteksi anomali waktu tempuh (di atas 48 jam)
      if (m.waktu_tempuh && m.waktu_tempuh > 48) {
        anomalies.push({
          nomor_surat: m.nomor_surat,
          asal: m.asal,
          tujuan: m.tujuan,
          created_at: m.created_at,
          jenis: "waktu_tempuh",
          waktuTempuh: m.waktu_tempuh,
          tingkat: m.waktu_tempuh > 72 ? "kritis" : "warning",
        });
      }
    });

    // Hitung rata-rata per route
    const routeStats = Array.from(routeMap.values()).map((route) => ({
      ...route,
      avgWaktu: route.countWaktu > 0 ? route.totalWaktu / route.countWaktu : 0,
      avgSelisih: route.count > 0 ? route.totalSelisih / route.count : 0,
    }));

    // Sort by count descending
    routeStats.sort((a, b) => b.count - a.count);

    // Hitung rata-rata susut/lebih
    const avgSusut = countSusut > 0 ? totalSusut / countSusut : 0;
    const avgLebih = countLebih > 0 ? totalLebih / countLebih : 0;

    // Sort anomalies by tingkat
    anomalies.sort((a, b) => {
      if (a.tingkat === "kritis" && b.tingkat !== "kritis") return -1;
      if (a.tingkat !== "kritis" && b.tingkat === "kritis") return 1;
      return 0;
    });

    return {
      routeStats,
      weightDifferences: {
        totalSusut,
        totalLebih,
        avgSusut,
        avgLebih,
      },
      anomalies,
    };
  } catch (error) {
    console.error("❌ Error getting mutasi analytics:", error);
    return {
      routeStats: [],
      weightDifferences: {
        totalSusut: 0,
        totalLebih: 0,
        avgSusut: 0,
        avgLebih: 0,
      },
      anomalies: [],
    };
  }
};

/* ======================================================
   GET MUTASI BY ID
====================================================== */
export const getMutasiById = async (id) => {
  try {
    const docRef = doc(db, SURAT_JALAN_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().tipe === "MUTASI") {
      return await normalizeMutasi(docSnap);
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting mutasi by id:", error);
    return null;
  }
};

/* ======================================================
   GET MUTASI BY STATUS
====================================================== */
export const getMutasiByStatus = async (
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
      where("tipe", "==", "MUTASI"),
      where("status", "==", status),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    return await Promise.all(snap.docs.map((doc) => normalizeMutasi(doc)));
  } catch (error) {
    console.error("❌ Error getting mutasi by status:", error);
    return [];
  }
};

/* ======================================================
   GET MUTASI BY GUDANG
====================================================== */
export const getMutasiByGudang = async (
  gudangId,
  startDate,
  endDate,
  limitCount = 100,
) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", "MUTASI"),
      where("gudang_asal", "==", gudangId),
      where("created_at", ">=", start),
      where("created_at", "<=", end),
      orderBy("created_at", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);

    return await Promise.all(snap.docs.map((doc) => normalizeMutasi(doc)));
  } catch (error) {
    console.error("❌ Error getting mutasi by gudang:", error);
    return [];
  }
};
