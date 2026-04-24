import {
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  limit,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../Services/firebase";
import { SJ_TIPE, SJ_STATUS } from "../Constants/barangMasukConstants";
import { getTodayString, format2 } from "../Utils/barangMasukUtils";

// ============================================================================
// HELPER FUNCTIONS (di luar object agar tidak bermasalah dengan this)
// ============================================================================

/**
 * Generate random numbers dengan panjang tertentu
 */
const generateRandomNumbers = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};

/**
 * Generate full timestamp dengan miliseconds (15 digit)
 * @deprecated Not currently used, kept for potential future use
 */
// eslint-disable-next-line no-unused-vars
const generateFullTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${year}${month}${day}${hour}${minute}${second}${ms}`;
};

/**
 * Cek keunikan roll ID di database
 */
const isUniqueRollId = async (rollId) => {
  try {
    const rollRef = doc(db, "stockRolls", rollId);
    const rollSnap = await getDoc(rollRef);
    return !rollSnap.exists();
  } catch (error) {
    console.error("Error checking uniqueness:", error);
    return false;
  }
};

// ============================================================================
// MAIN SERVICE OBJECT
// ============================================================================

export const barangMasukService = {
  // --------------------------------------------------------------------------
  // PRODUCT FUNCTIONS
  // --------------------------------------------------------------------------

  loadProduk: async () => {
    try {
      const snap = await getDocs(collection(db, "produk"));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.status === "active" || p.status === undefined);
    } catch (error) {
      console.error("Error loading produk:", error);
      throw new Error("Gagal memuat produk: " + error.message);
    }
  },

  getProductById: async (productId) => {
    try {
      const docRef = doc(db, "produk", productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting product:", error);
      throw new Error("Gagal mengambil data produk");
    }
  },

  // --------------------------------------------------------------------------
  // ROLL ID GENERATION - FORMAT: KATEGORI + ANGKA RANDOM
  // --------------------------------------------------------------------------

  /**
   * Generate unique Roll ID berdasarkan kategori
   * Format: [KATEGORI_TANPA_SPASI][ANGKA_RANDOM]
   * Total 16 karakter:
   * - Kategori 6 karakter → +10 angka random
   * - Kategori 5 karakter → +11 angka random
   * - Lainnya → random 16 digit
   */
  generateRollIdForProduct: async (produkData) => {
    try {
      console.log("🟢 Generating Roll ID untuk:", {
        id: produkData.id,
        kode: produkData.kode,
        nama: produkData.nama,
        kategori: produkData.kategori,
      });

      let kategori = produkData.kategori || "";
      const cleanKategori = kategori.replace(/\s/g, "").toUpperCase();
      const kategoriLength = cleanKategori.length;

      let rollId;
      let isUnique = false;
      let retryCount = 0;
      const MAX_RETRY = 5;

      while (!isUnique && retryCount < MAX_RETRY) {
        if (kategoriLength === 6) {
          const random = generateRandomNumbers(10);
          rollId = `${cleanKategori}${random}`;
        } else if (kategoriLength === 5) {
          const random = generateRandomNumbers(11);
          rollId = `${cleanKategori}${random}`;
        } else {
          rollId = generateRandomNumbers(16);
        }

        isUnique = await isUniqueRollId(rollId);
        if (!isUnique) {
          retryCount++;
          console.log(
            `⚠️ Duplicate: ${rollId}, retry ${retryCount}/${MAX_RETRY}`,
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!isUnique) {
        // Fallback terakhir: timestamp + random
        const ms = Date.now().toString();
        const random = generateRandomNumbers(4);
        rollId = `${ms.slice(-8)}${random}`.substring(0, 16);
        console.log("⚠️ FINAL FALLBACK Roll ID:", rollId);
      }

      console.log("✅ FINAL Roll ID:", rollId);
      return rollId;
    } catch (error) {
      console.error("❌ Error generating roll ID:", error);
      return generateRandomNumbers(16);
    }
  },

  /**
   * Generate multiple unique roll IDs
   */
  generateMultipleRollIds: async (rollsToGenerate, produkList) => {
    if (!rollsToGenerate || rollsToGenerate.length === 0) {
      return [];
    }

    const results = [];
    const usedIds = new Set();

    try {
      for (let idx = 0; idx < rollsToGenerate.length; idx++) {
        const item = rollsToGenerate[idx];
        const produkData = produkList.find((p) => p.id === item.productId);
        if (!produkData) continue;

        let kategori = produkData.kategori || "";
        const cleanKategori = kategori.replace(/\s/g, "").toUpperCase();
        const kategoriLength = cleanKategori.length;

        let rollId;
        let isUnique = false;
        let retryCount = 0;
        const MAX_RETRY = 5;

        while (!isUnique && retryCount < MAX_RETRY) {
          if (kategoriLength === 6) {
            rollId = `${cleanKategori}${generateRandomNumbers(10)}`;
          } else if (kategoriLength === 5) {
            rollId = `${cleanKategori}${generateRandomNumbers(11)}`;
          } else {
            rollId = generateRandomNumbers(16);
          }

          if (!usedIds.has(rollId)) {
            const unique = await isUniqueRollId(rollId);
            if (unique) {
              isUnique = true;
              usedIds.add(rollId);
            }
          }
          if (!isUnique) {
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        if (!isUnique) {
          // Fallback: timestamp + index
          const ms = Date.now().toString().slice(-10);
          const suffix = String(idx).padStart(2, "0");
          rollId = `${ms}${suffix}`.padEnd(16, "0").substring(0, 16);
          usedIds.add(rollId);
        }

        results.push({
          productId: item.productId,
          rollIndex: item.rollIndex,
          rollId,
          produkNama: item.produkNama || produkData.nama,
        });
      }
      return results;
    } catch (error) {
      console.error("❌ Error generating multiple roll IDs:", error);
      const fallbackResults = [];
      const baseTime = Date.now();
      for (let i = 0; i < rollsToGenerate.length; i++) {
        const item = rollsToGenerate[i];
        const timestamp = (baseTime + i).toString().slice(-10);
        const random = generateRandomNumbers(6);
        const rollId = `${timestamp}${random}`.substring(0, 16);
        fallbackResults.push({
          productId: item.productId,
          rollIndex: item.rollIndex,
          rollId,
          produkNama: item.produkNama,
        });
      }
      return fallbackResults;
    }
  },

  /**
   * Generate all roll IDs (untuk kompatibilitas)
   */
  generateAllRollIds: async (items, produkList) => {
    const rollsWithIds = [];
    try {
      for (const item of items) {
        const produkData = produkList.find((p) => p.id === item.productId);
        for (const [index, roll] of item.rolls.entries()) {
          const berat = parseFloat(roll.berat);
          if (!berat || berat <= 0 || isNaN(berat)) {
            throw new Error(
              `Roll ${item.produkNama} #${index + 1}: berat tidak valid`,
            );
          }
          let rollId;
          if (!roll.rollId) {
            rollId = await this.generateRollIdForProduct(
              produkData || { kategori: item.kategori, nama: item.produkNama },
            );
            rollsWithIds.push({
              rollId,
              produkNama: item.produkNama,
              berat: format2(berat),
              productId: item.productId,
              rollIndex: index,
              kategori: item.kategori,
              alreadyPrinted: false,
            });
          } else {
            rollsWithIds.push({
              rollId: roll.rollId,
              produkNama: item.produkNama,
              berat: format2(berat),
              productId: item.productId,
              rollIndex: index,
              kategori: item.kategori,
              alreadyPrinted: roll.isPrinted,
            });
          }
        }
      }
      return rollsWithIds;
    } catch (error) {
      console.error("❌ Error generating all roll IDs:", error);
      throw error;
    }
  },

  getNextRollCounter: async () => Math.floor(Math.random() * 9000) + 1000,

  // --------------------------------------------------------------------------
  // VALIDATION FUNCTIONS
  // --------------------------------------------------------------------------

  validateNomorSuratJalan: async (nomor) => {
    if (!nomor?.trim()) {
      return {
        valid: false,
        message: "Nomor surat jalan supplier wajib diisi",
      };
    }
    try {
      const q = query(
        collection(db, "suratJalan"),
        where("referensi_supplier", "==", nomor.trim()),
        where("tipe", "==", SJ_TIPE.BARANG_MASUK),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return {
          valid: false,
          message: `Nomor surat jalan supplier ${nomor} sudah terdaftar`,
        };
      }
      return { valid: true };
    } catch (error) {
      console.error("Error validating nomor surat jalan:", error);
      return { valid: false, message: "Gagal validasi nomor surat jalan" };
    }
  },

  validateSupplier: async (supplierId) => {
    try {
      const docRef = doc(db, "suppliers", supplierId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { valid: true, data: docSnap.data() };
      }
      return { valid: false, message: "Supplier tidak ditemukan" };
    } catch (error) {
      console.error("Error validating supplier:", error);
      return { valid: false, message: "Gagal validasi supplier" };
    }
  },

  // --------------------------------------------------------------------------
  // SURAT JALAN FUNCTIONS
  // --------------------------------------------------------------------------

  generateSuratJalanId: async () => {
    try {
      const dateStr = getTodayString();
      const seqRef = doc(db, "rollSequences", "suratJalanIN");
      const seq = await runTransaction(db, async (trx) => {
        const snap = await trx.get(seqRef);
        let lastNumber = 1;
        if (snap.exists()) {
          lastNumber = snap.data().lastNumber + 1;
          trx.update(seqRef, { lastNumber, updatedAt: serverTimestamp() });
        } else {
          trx.set(seqRef, {
            lastNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        return lastNumber;
      });
      return `SJ-IN-${dateStr}-${String(seq).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating surat jalan ID:", error);
      const timestamp = Date.now();
      return `SJ-IN-${getTodayString()}-F${timestamp.toString().slice(-6)}`;
    }
  },

  getSuratJalanById: async (sjId) => {
    try {
      const docRef = doc(db, "suratJalan", sjId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting surat jalan:", error);
      throw new Error("Gagal mengambil data surat jalan");
    }
  },

  getSuratJalanBySupplierRef: async (supplierRef) => {
    try {
      const q = query(
        collection(db, "suratJalan"),
        where("referensi_supplier", "==", supplierRef),
        where("tipe", "==", SJ_TIPE.BARANG_MASUK),
        orderBy("created_at", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting surat jalan by supplier ref:", error);
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // TRANSACTION FUNCTIONS
  // --------------------------------------------------------------------------

  saveTransaction: async (data) => {
    const {
      sjId,
      nomorSuratJalanSupplier,
      supplier,
      tanggalTerima,
      noPO,
      catatan,
      gudangId,
      itemsForDb,
      totalRolls,
      totalBerat,
      user,
      gudangNama,
    } = data;

    const now = serverTimestamp();
    const userUid = user?.uid || "system";

    await runTransaction(db, async (trx) => {
      const sjRef = doc(collection(db, "suratJalan"), sjId);
      trx.set(sjRef, {
        id: sjId,
        tipe: SJ_TIPE.BARANG_MASUK,
        referensi_supplier: nomorSuratJalanSupplier,
        gudang_asal: null,
        gudang_tujuan: gudangId,
        status: SJ_STATUS.COMPLETED,
        supplier_nama: supplier,
        no_po: noPO || null,
        catatan: catatan || "",
        tanggal_terima: tanggalTerima,
        items: itemsForDb,
        total_roll: totalRolls,
        total_berat: parseFloat(totalBerat.toFixed(2)),
        created_by: userUid,
        created_at: now,
        approved_at: now,
        completed_at: now,
        metadata: {
          userRole: user?.role || "UNKNOWN",
          userEmail: user?.email || "unknown",
          ipAddress: "web-app",
        },
      });

      for (const item of itemsForDb) {
        const ledgerId = `LEDG-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}-${item.rollId.slice(-4)}`;
        const ledgerRef = doc(collection(db, "stockLedger"), ledgerId);
        trx.set(ledgerRef, {
          id: ledgerId,
          roll_id: item.rollId,
          tipe: "IN",
          berat: item.berat,
          gudang_asal: null,
          gudang_tujuan: gudangId,
          ref_surat_jalan: sjId,
          user_id: userUid,
          user_role: user?.role || "UNKNOWN",
          timestamp: now,
          metadata: {
            supplier,
            no_po: noPO || null,
            catatan: catatan || "",
            nomor_surat_jalan_supplier: nomorSuratJalanSupplier,
          },
        });
      }

      for (const item of itemsForDb) {
        const stockRollRef = doc(collection(db, "stockRolls"), item.rollId);
        trx.set(stockRollRef, {
          id: item.rollId,
          kode_barcode: item.rollId,
          gudang_id: gudangId,
          berat_sisa: item.berat,
          status: "AVAILABLE",
          produk_id: item.produkId,
          produk_nama: item.produkNama,
          kategori: item.kategori,
          supplier_id: null,
          supplier_name: supplier,
          tanggal_masuk: now,
          is_rol_dibuka: item.is_roll_dibuka || false,
          tanggal_buka: item.is_roll_dibuka ? now : null,
          surat_jalan_id: sjId,
          created_by: userUid,
          created_at: now,
          last_updated: now,
        });
      }

      const activityId = `ACT-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 6)}`;
      const activityRef = doc(collection(db, "userActivities"), activityId);
      trx.set(activityRef, {
        id: activityId,
        user_id: userUid,
        user_role: user?.role || "UNKNOWN",
        user_email: user?.email || "unknown",
        action_type: "BARANG_MASUK",
        entity_type: "SURAT_JALAN",
        entity_id: sjId,
        action_details: `Barang masuk dari ${supplier} ke ${gudangNama}, ${totalRolls} roll, ${format2(totalBerat)} kg`,
        gudang_id: gudangId,
        ip_address: "web-app",
        timestamp: now,
        metadata: {
          referensi_supplier: nomorSuratJalanSupplier,
          total_roll: totalRolls,
          total_berat: totalBerat,
          supplier,
          gudang_nama: gudangNama,
        },
      });
    });
  },

  // --------------------------------------------------------------------------
  // STOCK FUNCTIONS
  // --------------------------------------------------------------------------

  getStockByGudang: async (gudangId) => {
    try {
      const q = query(
        collection(db, "stockRolls"),
        where("gudang_id", "==", gudangId),
        where("status", "==", "AVAILABLE"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting stock by gudang:", error);
      return [];
    }
  },

  getStockByRollId: async (rollId) => {
    try {
      const docRef = doc(db, "stockRolls", rollId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting stock by roll ID:", error);
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // REPORT FUNCTIONS
  // --------------------------------------------------------------------------

  getTransactionsByDateRange: async (startDate, endDate) => {
    try {
      const q = query(
        collection(db, "suratJalan"),
        where("tipe", "==", SJ_TIPE.BARANG_MASUK),
        where("tanggal_terima", ">=", startDate),
        where("tanggal_terima", "<=", endDate),
        orderBy("tanggal_terima", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting transactions by date range:", error);
      return [];
    }
  },

  getSummaryBySupplier: async (supplier) => {
    try {
      const q = query(
        collection(db, "suratJalan"),
        where("supplier_nama", "==", supplier),
        where("tipe", "==", SJ_TIPE.BARANG_MASUK),
      );
      const snap = await getDocs(q);
      const transactions = snap.docs.map((doc) => doc.data());
      const totalRolls = transactions.reduce(
        (sum, t) => sum + (t.total_roll || 0),
        0,
      );
      const totalBerat = transactions.reduce(
        (sum, t) => sum + (t.total_berat || 0),
        0,
      );
      return {
        total_transactions: transactions.length,
        total_rolls: totalRolls,
        total_berat: totalBerat,
        transactions,
      };
    } catch (error) {
      console.error("Error getting summary by supplier:", error);
      return {
        total_transactions: 0,
        total_rolls: 0,
        total_berat: 0,
        transactions: [],
      };
    }
  },
};
