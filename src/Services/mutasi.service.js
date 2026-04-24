// src/Services/mutasi.service.js
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { STATUS_FOR_MUTATION, getRollStatus } from "../Constants/rollStatus";

/* ======================================================
   HELPER: FORMAT TIMESTAMP
====================================================== */
const formatDate = (timestamp) => {
  if (!timestamp) return "";
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

/* ======================================================
   GET STATUS DISPLAY
====================================================== */
const getStatusDisplay = (status) => {
  const statusObj = getRollStatus(status);
  return statusObj.label;
};

/* ======================================================
   FETCH MUTASI DATA - SINCRON DENGAN MANAJEMEN BARANG
====================================================== */
export const fetchMutasiData = async ({ gudangId, userId }) => {
  try {
    console.log("📦 [MUTASI] Starting fetch for gudang:", gudangId);

    // 1. FETCH STOK ROLLS - HANYA YANG BISA DIMUTASI (AVAILABLE)
    let stokRolls = [];
    try {
      const stokQuery = query(
        collection(db, "stockRolls"),
        where("gudangId", "==", gudangId),
        orderBy("updatedAt", "desc"),
        limit(100),
      );

      const stokSnap = await getDocs(stokQuery);
      console.log("📊 Total rolls in database:", stokSnap.size);

      // Process rolls - filter hanya AVAILABLE
      stokRolls = stokSnap.docs
        .map((doc) => {
          const data = doc.data();
          const statusObj = getRollStatus(data.status);

          return {
            id: doc.id,
            documentId: doc.id,
            rollId: data.rollId || doc.id.substring(0, 8).toUpperCase(),
            namaProduk: data.namaProduk || data.produkNama || "Unknown",
            productId: data.productId || "unknown",
            kategori: data.kategori || "TANPA KATEGORI",
            beratAwal: parseFloat(data.beratAwal || data.beratKg || 0),
            beratSisa: parseFloat(data.beratSisa || data.beratAwal || 0),
            status: statusObj.code,
            statusLabel: statusObj.label,
            statusColor: statusObj.color,
            badgeClass: statusObj.badgeClass,
            kondisi: data.kondisi || "UTUH",
            gudangId: data.gudangId,
            createdAt: formatDate(data.createdAt),
            updatedAt: formatDate(data.updatedAt),
          };
        })
        // HANYA ROLL YANG BISA DIMUTASI (AVAILABLE)
        .filter((roll) => STATUS_FOR_MUTATION.includes(roll.status));

      console.log("✅ Available rolls for mutasi:", stokRolls.length);

      // Debug: Tampilkan distribusi status
      const statusCount = {};
      stokSnap.docs.forEach((doc) => {
        const status = getRollStatus(doc.data().status).code;
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      console.log("📊 Status distribution:", statusCount);
    } catch (stokError) {
      console.error("❌ Error loading stok rolls:", stokError);
      stokRolls = [];
    }

    // 2. FETCH GUDANG LIST (kecuali gudang sendiri)
    let gudangList = [];
    try {
      const gudangSnap = await getDocs(collection(db, "gudang"));
      gudangList = gudangSnap.docs
        .map((doc) => ({
          id: doc.id,
          nama: doc.data().nama || doc.id,
          kode: doc.data().kode || "",
          alamat: doc.data().alamat || "",
          status: doc.data().status || "active",
        }))
        .filter((g) => g.id !== gudangId && g.status !== "inactive");

      console.log("✅ Gudang list loaded:", gudangList.length);
    } catch (gudangError) {
      console.error("❌ Error loading gudang list:", gudangError);
      gudangList = [];
    }

    // 3. FETCH MUTASI KELUAR (DRAFT & IN_TRANSIT)
    let mutasiKeluar = [];
    try {
      const mutasiKeluarQuery = query(
        collection(db, "suratJalan"),
        where("fromGudangId", "==", gudangId),
        where("tipe", "==", "MUTASI"),
        where("status", "in", ["DRAFT", "IN_TRANSIT"]),
        orderBy("createdAt", "desc"),
        limit(30),
      );

      const mutasiKeluarSnap = await getDocs(mutasiKeluarQuery);
      mutasiKeluar = mutasiKeluarSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sjId: doc.id,
          ...data,
          createdAt: formatDate(data.createdAt),
          updatedAt: formatDate(data.updatedAt),
          statusDisplay: getStatusDisplay(data.status),
        };
      });
      console.log("✅ Mutasi keluar loaded:", mutasiKeluar.length);
    } catch (keluarError) {
      console.error("❌ Error loading mutasi keluar:", keluarError);
      mutasiKeluar = [];
    }

    // 4. FETCH MUTASI MASUK (IN_TRANSIT)
    let mutasiMasuk = [];
    try {
      const mutasiMasukQuery = query(
        collection(db, "suratJalan"),
        where("toGudangId", "==", gudangId),
        where("tipe", "==", "MUTASI"),
        where("status", "==", "IN_TRANSIT"),
        orderBy("createdAt", "desc"),
        limit(30),
      );

      const mutasiMasukSnap = await getDocs(mutasiMasukQuery);
      mutasiMasuk = mutasiMasukSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sjId: doc.id,
          ...data,
          createdAt: formatDate(data.createdAt),
          updatedAt: formatDate(data.updatedAt),
          statusDisplay: getStatusDisplay(data.status),
        };
      });
      console.log("✅ Mutasi masuk loaded:", mutasiMasuk.length);
    } catch (masukError) {
      console.error("❌ Error loading mutasi masuk:", masukError);
      mutasiMasuk = [];
    }

    // 5. FETCH MUTASI SELESAI (COMPLETED & CANCELLED)
    let mutasiSelesai = [];
    try {
      const mutasiSelesaiQuery = query(
        collection(db, "suratJalan"),
        where("fromGudangId", "==", gudangId),
        where("tipe", "==", "MUTASI"),
        where("status", "in", ["COMPLETED", "CANCELLED"]),
        orderBy("createdAt", "desc"),
        limit(20),
      );

      const mutasiSelesaiSnap = await getDocs(mutasiSelesaiQuery);
      mutasiSelesai = mutasiSelesaiSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sjId: doc.id,
          ...data,
          createdAt: formatDate(data.createdAt),
          updatedAt: formatDate(data.updatedAt),
          statusDisplay: getStatusDisplay(data.status),
        };
      });
      console.log("✅ Mutasi selesai loaded:", mutasiSelesai.length);
    } catch (selesaiError) {
      console.error("❌ Error loading mutasi selesai:", selesaiError);
      mutasiSelesai = [];
    }

    return {
      stokRolls,
      gudangList,
      mutasiKeluar,
      mutasiMasuk,
      mutasiSelesai,
    };
  } catch (error) {
    console.error("❌ [MUTASI] Global fetch error:", error);
    throw error;
  }
};

/* ======================================================
   CREATE MUTASI DRAFT
====================================================== */
export const createMutasiDraft = async ({
  fromGudangId,
  toGudangId,
  rollIds,
  userId,
  userName,
  userEmail,
}) => {
  try {
    console.log("📝 [MUTASI] Creating draft...");

    // Validasi
    if (!fromGudangId || !toGudangId) {
      throw new Error("Gudang asal/tujuan harus diisi");
    }
    if (fromGudangId === toGudangId) {
      throw new Error("Tidak bisa mengirim ke gudang yang sama");
    }
    if (!rollIds || rollIds.length === 0) {
      throw new Error("Pilih minimal 1 roll");
    }

    // Get roll data
    const rollPromises = rollIds.map((rollId) =>
      getDoc(doc(db, "stockRolls", rollId)),
    );
    const rollDocs = await Promise.all(rollPromises);
    const rolls = [];

    // Process rolls dengan validasi status
    for (const doc of rollDocs) {
      if (!doc.exists()) {
        throw new Error(`Roll ${doc.id} tidak ditemukan`);
      }

      const data = doc.data();
      const status = getRollStatus(data.status).code;

      // Validasi: hanya roll AVAILABLE yang bisa dimutasi
      if (!STATUS_FOR_MUTATION.includes(status)) {
        const rollId = data.rollId || doc.id.substring(0, 8);
        throw new Error(
          `Roll ${rollId} tidak tersedia untuk mutasi (Status: ${status})`,
        );
      }

      rolls.push({
        documentId: doc.id,
        rollId: data.rollId || doc.id.substring(0, 8).toUpperCase(),
        namaProduk: data.namaProduk || data.produkNama || "Unknown",
        productId: data.productId || "unknown",
        kategori: data.kategori || "TANPA KATEGORI",
        beratAwal: parseFloat(data.beratAwal || data.beratKg || 0),
        beratSisa: parseFloat(data.beratSisa || data.beratAwal || 0),
        status: status,
        kondisi: data.kondisi || "UTUH",
        gudangId: data.gudangId,
      });
    }

    if (rolls.length !== rollIds.length) {
      throw new Error("Beberapa roll tidak ditemukan");
    }

    // Calculate totals
    const totalBerat = rolls.reduce(
      (sum, roll) => sum + (roll.beratAwal || 0),
      0,
    );
    const totalRoll = rolls.length;

    // Get gudang names
    let toGudangNama = toGudangId;
    let fromGudangNama = fromGudangId;

    try {
      const [toGudangDoc, fromGudangDoc] = await Promise.all([
        getDoc(doc(db, "gudang", toGudangId)),
        getDoc(doc(db, "gudang", fromGudangId)),
      ]);

      if (toGudangDoc.exists()) {
        toGudangNama = toGudangDoc.data().nama || toGudangId;
      }
      if (fromGudangDoc.exists()) {
        fromGudangNama = fromGudangDoc.data().nama || fromGudangId;
      }
    } catch (e) {
      console.log("Could not get gudang names:", e);
    }

    // Create DRAFT surat jalan
    const result = await runTransaction(db, async (transaction) => {
      const sjRef = doc(collection(db, "suratJalan"));
      const sjId = sjRef.id;

      const suratJalanData = {
        sjId,
        tipe: "MUTASI",
        status: "DRAFT",
        fromGudangId,
        fromGudangNama,
        toGudangId,
        toGudangNama,
        rollIds: rolls.map((r) => r.documentId),
        rollDetails: rolls.map((roll) => ({
          rollId: roll.rollId,
          documentId: roll.documentId,
          productId: roll.productId,
          namaProduk: roll.namaProduk,
          kategori: roll.kategori,
          beratAwal: roll.beratAwal,
          beratSisa: roll.beratSisa,
          kondisi: roll.kondisi || "UTUH",
          gudangAsalId: fromGudangId,
          gudangAsalNama: fromGudangNama,
          status: roll.status,
        })),
        totalRoll,
        totalBerat,
        createdBy: userId,
        createdByName: userName,
        createdByEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(sjRef, suratJalanData);
      console.log("📄 Created DRAFT surat jalan:", sjId);

      // Mark rolls as DRAFT (not yet IN_TRANSIT)
      rolls.forEach((roll) => {
        const rollRef = doc(db, "stockRolls", roll.documentId);
        transaction.update(rollRef, {
          status: "DRAFT", // Sementara DRAFT
          mutasiDraftId: sjId,
          updatedAt: serverTimestamp(),
        });
      });

      return {
        sjId,
        totalRoll,
        totalBerat,
        fromGudangId,
        fromGudangNama,
        toGudangId,
        toGudangNama,
        status: "DRAFT",
      };
    });

    console.log("✅ Draft created:", result.sjId);
    return result;
  } catch (error) {
    console.error("❌ Error creating draft:", error);
    throw error;
  }
};

/* ======================================================
   START MUTASI TRANSIT (SETELAH PRINT)
====================================================== */
export const startMutasiTransit = async (sjId, userId, userName) => {
  try {
    console.log("🚚 [MUTASI] Starting transit for:", sjId);

    // Get surat jalan
    const sjRef = doc(db, "suratJalan", sjId);
    const sjSnap = await getDoc(sjRef);

    if (!sjSnap.exists()) {
      throw new Error("Surat jalan tidak ditemukan");
    }

    const sjData = sjSnap.data();

    // Validate status
    if (sjData.status !== "DRAFT") {
      throw new Error(
        `Surat jalan sudah ${sjData.status}, tidak bisa diproses`,
      );
    }

    const rollIds = sjData.rollIds || [];
    const fromGudangId = sjData.fromGudangId;
    const toGudangId = sjData.toGudangId;

    const result = await runTransaction(db, async (transaction) => {
      // 1. Update surat jalan ke IN_TRANSIT
      transaction.update(sjRef, {
        status: "IN_TRANSIT",
        startedBy: userId,
        startedByName: userName,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Update rolls ke IN_TRANSIT
      for (const rollDocId of rollIds) {
        const rollRef = doc(db, "stockRolls", rollDocId);
        const rollSnap = await transaction.get(rollRef);

        if (rollSnap.exists()) {
          const rollData = rollSnap.data();

          transaction.update(rollRef, {
            status: "IN_TRANSIT",
            mutasiId: sjId,
            mutasiDraftId: null,
            mutasiToGudangId: toGudangId,
            mutasiToGudangNama: sjData.toGudangNama,
            updatedAt: serverTimestamp(),
          });

          // 3. Create stock ledger OUT entry
          const ledgerRef = doc(collection(db, "stockLedger"));
          transaction.set(ledgerRef, {
            source: "MUTASI_KELUAR",
            type: "OUT",
            gudangId: fromGudangId,
            rollId: rollData.rollId || rollDocId.substring(0, 8),
            productId: rollData.productId || "unknown",
            namaProduk: rollData.namaProduk || rollData.produkNama || "Unknown",
            berat: rollData.beratAwal || rollData.beratKg || 0,
            qtyRoll: 1,
            kondisi: rollData.kondisi || "NORMAL",
            refType: "suratJalan",
            refId: sjId,
            notes: `Mutasi ke ${sjData.toGudangNama}`,
            status: "IN_TRANSIT",
            createdAt: serverTimestamp(),
            createdBy: userId,
            createdByName: userName,
          });
        }
      }

      return {
        sjId,
        totalRoll: sjData.totalRoll,
        totalBerat: sjData.totalBerat,
        status: "IN_TRANSIT",
        message: "Mutasi dalam perjalanan",
      };
    });

    console.log("✅ Transit started:", sjId);
    return result;
  } catch (error) {
    console.error("❌ Error starting transit:", error);
    throw error;
  }
};

/* ======================================================
   CONFIRM MUTASI MASUK
====================================================== */
export const confirmMutasiMasuk = async (sjId, userId, userName) => {
  try {
    console.log("📥 [MUTASI] Confirming masuk:", sjId);

    const sjRef = doc(db, "suratJalan", sjId);
    const sjSnap = await getDoc(sjRef);

    if (!sjSnap.exists()) {
      throw new Error("Surat jalan tidak ditemukan");
    }

    const sjData = sjSnap.data();

    // Validate status
    if (sjData.status !== "IN_TRANSIT") {
      throw new Error(
        `Surat jalan sudah ${sjData.status}, tidak bisa diterima`,
      );
    }

    const rollIds = sjData.rollIds || [];
    const toGudangId = sjData.toGudangId;

    const result = await runTransaction(db, async (transaction) => {
      // 1. Update surat jalan to COMPLETED
      transaction.update(sjRef, {
        status: "COMPLETED",
        receivedBy: userId,
        receivedByName: userName,
        receivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Process rolls
      for (const rollDocId of rollIds) {
        const rollRef = doc(db, "stockRolls", rollDocId);
        const rollSnap = await transaction.get(rollRef);

        if (rollSnap.exists()) {
          const rollData = rollSnap.data();

          // Update roll ke AVAILABLE di gudang baru
          transaction.update(rollRef, {
            gudangId: toGudangId,
            status: "AVAILABLE", // Kembali ke AVAILABLE di gudang baru
            mutasiId: null,
            mutasiDraftId: null,
            mutasiToGudangId: null,
            mutasiToGudangNama: null,
            updatedAt: serverTimestamp(),
          });

          // 3. Create stock ledger IN entry
          const ledgerRef = doc(collection(db, "stockLedger"));
          transaction.set(ledgerRef, {
            source: "MUTASI_MASUK",
            type: "IN",
            gudangId: toGudangId,
            rollId: rollData.rollId || rollDocId.substring(0, 8),
            productId: rollData.productId || "unknown",
            namaProduk: rollData.namaProduk || rollData.produkNama || "Unknown",
            berat: rollData.beratAwal || rollData.beratKg || 0,
            qtyRoll: 1,
            kondisi: rollData.kondisi || "NORMAL",
            refType: "suratJalan",
            refId: sjId,
            notes: `Mutasi dari ${sjData.fromGudangNama}`,
            status: "COMPLETED",
            createdAt: serverTimestamp(),
            createdBy: userId,
            createdByName: userName,
          });

          // 4. Update ledger keluarnya jadi COMPLETED
          const ledgerOutQuery = query(
            collection(db, "stockLedger"),
            where("refId", "==", sjId),
            where("type", "==", "OUT"),
            limit(1),
          );

          const ledgerOutSnap = await getDocs(ledgerOutQuery);
          if (!ledgerOutSnap.empty) {
            const ledgerOutDoc = ledgerOutSnap.docs[0];
            transaction.update(ledgerOutDoc.ref, {
              status: "COMPLETED",
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      return {
        sjId,
        totalRoll: sjData.totalRoll,
        totalBerat: sjData.totalBerat,
        status: "COMPLETED",
        message: "Barang berhasil diterima",
      };
    });

    console.log("✅ Masuk confirmed:", sjId);
    return result;
  } catch (error) {
    console.error("❌ Error confirming masuk:", error);
    throw error;
  }
};

/* ======================================================
   CANCEL MUTASI
====================================================== */
export const cancelMutasi = async (sjId, userId, userName) => {
  try {
    console.log("❌ [MUTASI] Cancelling:", sjId);

    const sjRef = doc(db, "suratJalan", sjId);
    const sjSnap = await getDoc(sjRef);

    if (!sjSnap.exists()) {
      throw new Error("Surat jalan tidak ditemukan");
    }

    const sjData = sjSnap.data();
    const rollIds = sjData.rollIds || [];

    const result = await runTransaction(db, async (transaction) => {
      // 1. Update surat jalan
      transaction.update(sjRef, {
        status: "CANCELLED",
        cancelledBy: userId,
        cancelledByName: userName,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Return rolls to AVAILABLE
      for (const rollDocId of rollIds) {
        const rollRef = doc(db, "stockRolls", rollDocId);
        const rollSnap = await transaction.get(rollRef);

        if (rollSnap.exists()) {
          const rollData = rollSnap.data();
          const currentStatus = rollData.status || "AVAILABLE";

          // Kembalikan ke AVAILABLE jika sebelumnya DRAFT atau IN_TRANSIT
          const newStatus =
            currentStatus === "DRAFT" || currentStatus === "IN_TRANSIT"
              ? "AVAILABLE"
              : currentStatus;

          transaction.update(rollRef, {
            status: newStatus,
            mutasiId: null,
            mutasiDraftId: null,
            mutasiToGudangId: null,
            mutasiToGudangNama: null,
            updatedAt: serverTimestamp(),
          });

          // 3. Update ledger jika ada
          const ledgerQuery = query(
            collection(db, "stockLedger"),
            where("refId", "==", sjId),
            where("rollId", "==", rollData.rollId || rollDocId.substring(0, 8)),
            limit(1),
          );

          const ledgerSnap = await getDocs(ledgerQuery);
          if (!ledgerSnap.empty) {
            const ledgerDoc = ledgerSnap.docs[0];
            transaction.update(ledgerDoc.ref, {
              status: "CANCELLED",
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      return {
        sjId,
        message: "Mutasi berhasil dibatalkan",
        status: "CANCELLED",
      };
    });

    console.log("✅ Cancelled:", sjId);
    return result;
  } catch (error) {
    console.error("❌ Error cancelling:", error);
    throw error;
  }
};

/* ======================================================
   GENERATE SURAT JALAN FOR PRINT
====================================================== */
export const generateSuratJalanMutasi = async (sjId) => {
  try {
    console.log("🖨️ [MUTASI] Generating surat jalan:", sjId);

    const sjRef = doc(db, "suratJalan", sjId);
    const sjSnap = await getDoc(sjRef);

    if (!sjSnap.exists()) {
      throw new Error("Surat jalan tidak ditemukan");
    }

    const sjData = sjSnap.data();

    // Get roll details
    const rollDetails = [];
    const rollIds = sjData.rollIds || [];

    for (const rollDocId of rollIds) {
      try {
        const rollRef = doc(db, "stockRolls", rollDocId);
        const rollSnap = await getDoc(rollRef);

        if (rollSnap.exists()) {
          const rollData = rollSnap.data();
          rollDetails.push({
            rollId: rollData.rollId || rollDocId.substring(0, 8),
            namaProduk: rollData.namaProduk || rollData.produkNama || "Unknown",
            kategori: rollData.kategori || "TANPA KATEGORI",
            berat: rollData.beratAwal || rollData.beratKg || 0,
            kondisi: rollData.kondisi || "UTUH",
            status: rollData.status || "AVAILABLE",
          });
        }
      } catch (rollError) {
        console.error("Error getting roll:", rollError);
      }
    }

    return {
      // Header
      tipe: "MUTASI",
      sjId: sjData.sjId || sjId,
      tanggal: formatDate(sjData.createdAt),

      // Gudang
      fromGudangId: sjData.fromGudangId,
      fromGudangNama: sjData.fromGudangNama,
      toGudangId: sjData.toGudangId,
      toGudangNama: sjData.toGudangNama,

      // Pengirim
      createdByName: sjData.createdByName || "User",
      createdByEmail: sjData.createdByEmail || "",

      // Barang
      totalRoll: sjData.totalRoll || rollDetails.length,
      totalBerat:
        sjData.totalBerat ||
        rollDetails.reduce((sum, r) => sum + (r.berat || 0), 0),
      rollDetails,

      // Status
      status: sjData.status,
      statusDisplay: getStatusDisplay(sjData.status),
    };
  } catch (error) {
    console.error("❌ Error generating surat jalan:", error);
    throw error;
  }
};

/* ======================================================
   GET MUTASI STATS
====================================================== */
export const getMutasiStats = async (gudangId) => {
  try {
    // Query untuk mutasi keluar aktif (DRAFT + IN_TRANSIT)
    const keluarAktifQuery = query(
      collection(db, "suratJalan"),
      where("fromGudangId", "==", gudangId),
      where("tipe", "==", "MUTASI"),
      where("status", "in", ["DRAFT", "IN_TRANSIT"]),
    );

    // Query untuk mutasi masuk aktif (IN_TRANSIT)
    const masukAktifQuery = query(
      collection(db, "suratJalan"),
      where("toGudangId", "==", gudangId),
      where("tipe", "==", "MUTASI"),
      where("status", "==", "IN_TRANSIT"),
    );

    const [keluarAktifSnap, masukAktifSnap] = await Promise.all([
      getDocs(keluarAktifQuery),
      getDocs(masukAktifQuery),
    ]);

    // Calculate totals
    const totalDalamPerjalanan = keluarAktifSnap.docs.reduce((sum, doc) => {
      return sum + (doc.data().totalRoll || 0);
    }, 0);

    const totalPendingMasuk = masukAktifSnap.docs.reduce((sum, doc) => {
      return sum + (doc.data().totalRoll || 0);
    }, 0);

    return {
      totalDalamPerjalanan,
      totalPendingMasuk,
      countDalamPerjalanan: keluarAktifSnap.docs.length,
      countPendingMasuk: masukAktifSnap.docs.length,
    };
  } catch (error) {
    console.error("❌ Error getting stats:", error);
    return {
      totalDalamPerjalanan: 0,
      totalPendingMasuk: 0,
      countDalamPerjalanan: 0,
      countPendingMasuk: 0,
    };
  }
};

/* ======================================================
   GET MUTASI DETAIL
====================================================== */
export const getMutasiDetail = async (sjId) => {
  try {
    const sjRef = doc(db, "suratJalan", sjId);
    const sjSnap = await getDoc(sjRef);

    if (!sjSnap.exists()) {
      throw new Error("Mutasi tidak ditemukan");
    }

    const sjData = sjSnap.data();

    // Get roll details
    const rollDetails = [];
    const rollIds = sjData.rollIds || [];

    for (const rollDocId of rollIds) {
      try {
        const rollRef = doc(db, "stockRolls", rollDocId);
        const rollSnap = await getDoc(rollRef);

        if (rollSnap.exists()) {
          const data = rollSnap.data();
          const statusObj = getRollStatus(data.status);

          rollDetails.push({
            documentId: rollSnap.id,
            rollId: data.rollId || rollSnap.id.substring(0, 8),
            namaProduk: data.namaProduk || data.produkNama || "Unknown",
            productId: data.productId || "unknown",
            kategori: data.kategori || "TANPA KATEGORI",
            beratAwal: data.beratAwal || data.beratKg || 0,
            beratSisa: data.beratSisa || data.beratAwal || 0,
            status: statusObj.code,
            statusLabel: statusObj.label,
            statusColor: statusObj.color,
            kondisi: data.kondisi || "UTUH",
          });
        }
      } catch (rollError) {
        console.error("Error getting roll:", rollError);
      }
    }

    return {
      id: sjSnap.id,
      sjId: sjSnap.id,
      ...sjData,
      rollDetails,
      createdAt: formatDate(sjData.createdAt),
      updatedAt: formatDate(sjData.updatedAt),
      statusDisplay: getStatusDisplay(sjData.status),
    };
  } catch (error) {
    console.error("❌ Error getting detail:", error);
    throw error;
  }
};
