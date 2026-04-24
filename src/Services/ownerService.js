// src/Services/ownerService.js
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ======================================================
   CONSTANTS
====================================================== */
const TRANSACTIONS_COLLECTION = "transaksiPenjualan";
const SURAT_JALAN_COLLECTION = "suratJalan";
const STOCK_LEDGER_COLLECTION = "stockLedger";
const STOCK_ROLLS_COLLECTION = "stockRolls";

export const OWNER_LEDGER_TYPE = {
  OWNER_ADJUSTMENT: "OWNER_ADJUSTMENT",
  OWNER_DELETE: "OWNER_DELETE",
};

/* ======================================================
   UPDATE DETAIL LOG - UNTUK OWNER
====================================================== */

const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
};

export const ownerUpdateRollBerat = async ({
  rollId,
  newBerat,
  reason,
  owner,
}) => {
  if (!rollId || !newBerat || newBerat <= 0) {
    throw new Error("Data edit berat tidak valid");
  }

  await runTransaction(db, async (trx) => {
    const rollRef = doc(db, STOCK_ROLLS_COLLECTION, rollId);
    const rollSnap = await trx.get(rollRef);

    if (!rollSnap.exists()) {
      throw new Error("Roll tidak ditemukan");
    }

    const roll = rollSnap.data();
    const oldBerat = roll.berat_sisa || 0;
    const selisih = newBerat - oldBerat;

    // 1️⃣ Update stockRolls
    trx.update(rollRef, {
      berat_sisa: newBerat,
      last_updated: serverTimestamp(),
    });

    // 2️⃣ Ledger ADMIN (audit)

    const ledgerId = generateId("LEDG-OWN-EDIT");
    const ledgerRef = doc(collection(db, STOCK_LEDGER_COLLECTION), ledgerId);

    trx.set(ledgerRef, {
      id: ledgerId,
      roll_id: rollId,
      tipe: OWNER_LEDGER_TYPE.OWNER_ADJUSTMENT,
      berat: selisih,
      gudang_asal: roll.gudang_id,
      gudang_tujuan: null,
      timestamp: serverTimestamp(),
      user_id: owner.nama,
      user_role: "OWNER",
      metadata: {
        old_berat: oldBerat,
        new_berat: newBerat,
        reason,
      },
    });
  });
};

export const ownerSoftDeleteRoll = async ({ rollId, reason, owner }) => {
  if (!rollId || !reason) {
    throw new Error("Alasan penghapusan wajib diisi");
  }

  await runTransaction(db, async (trx) => {
    const rollRef = doc(db, STOCK_ROLLS_COLLECTION, rollId);
    const rollSnap = await trx.get(rollRef);

    if (!rollSnap.exists()) {
      throw new Error("Roll tidak ditemukan");
    }

    const roll = rollSnap.data();

    // 1️⃣ Soft delete
    trx.update(rollRef, {
      status: "INVALID",
      deleted_at: serverTimestamp(),
      deleted_by: owner.nama,
      deleted_reason: reason,
      last_updated: serverTimestamp(),
    });

    // 2️⃣ Ledger DELETE

    const ledgerId = generateId("LEDG-OWN-DEL");
    const ledgerRef = doc(collection(db, STOCK_LEDGER_COLLECTION), ledgerId);

    trx.set(ledgerRef, {
      id: ledgerId,
      roll_id: rollId,
      tipe: OWNER_LEDGER_TYPE.OWNER_DELETE,
      berat: roll.berat_sisa || 0,
      gudang_asal: roll.gudang_id,
      timestamp: serverTimestamp(),
      user_id: owner.uid,
      user_role: "OWNER",
      metadata: {
        reason,
        snapshot: {
          produk_id: roll.produk_id,
          produk_nama: roll.produk_nama,
          kategori: roll.kategori,
          berat_sisa: roll.berat_sisa,
          status: roll.status,
        },
      },
    });
  });
};

export const ownerUpdateRollBeratDanStatus = async ({
  rollId,
  newBerat,
  newStatus,
  reason,
  owner,
}) => {
  if (!rollId || !newBerat || newBerat <= 0 || !newStatus || !reason) {
    throw new Error("Data edit roll tidak valid");
  }

  await runTransaction(db, async (trx) => {
    const rollRef = doc(db, STOCK_ROLLS_COLLECTION, rollId);
    const rollSnap = await trx.get(rollRef);

    if (!rollSnap.exists()) {
      throw new Error("Roll tidak ditemukan");
    }

    const roll = rollSnap.data();

    const oldBerat = roll.berat_sisa || 0;
    const oldStatus = roll.status;
    const selisihBerat = newBerat - oldBerat;

    // ✅ VALIDASI STATUS (AMAN)
    const ALLOWED_STATUS = ["AVAILABLE", "OPENED", "USED", "DAMAGED", "SOLD"];
    if (!ALLOWED_STATUS.includes(newStatus)) {
      throw new Error("Status tidak diizinkan untuk diubah manual");
    }

    // 1️⃣ UPDATE stockRolls
    trx.update(rollRef, {
      berat_sisa: newBerat,
      status: newStatus,
      last_updated: serverTimestamp(),
    });

    // 2️⃣ LEDGER OWNER (AUDIT)
    const ledgerId = generateId("LEDG-OWN-EDIT");
    const ledgerRef = doc(collection(db, STOCK_LEDGER_COLLECTION), ledgerId);

    trx.set(ledgerRef, {
      id: ledgerId,
      roll_id: rollId,
      tipe: OWNER_LEDGER_TYPE.OWNER_ADJUSTMENT,
      berat: selisihBerat,
      gudang_asal: roll.gudang_id,
      gudang_tujuan: null,
      timestamp: serverTimestamp(),
      user_id: owner?.uid || owner?.nama || "OWNER",
      user_role: "OWNER",
      metadata: {
        old_berat: oldBerat,
        new_berat: newBerat,
        old_status: oldStatus,
        new_status: newStatus,
        reason,
      },
    });
  });
};

/* ======================================================
   HELPER FUNCTIONS
====================================================== */
const formatDateForQuery = (date) => {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
};

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// HAPUS getEndOfDay karena tidak dipakai

/* ======================================================
   GET STOCK SUMMARY - UNTUK SEMUA GUDANG
====================================================== */
export const getStockSummary = async () => {
  try {
    console.log("📦 Getting stock summary from ALL gudang...");

    // ============= 1. TOTAL STOK SEMUA GUDANG =============
    const rollsQuery = query(
      collection(db, STOCK_ROLLS_COLLECTION),
      where("status", "in", ["AVAILABLE", "OPENED"]),
    );

    const rollsSnap = await getDocs(rollsQuery);

    let totalRol = 0;
    let totalBeratStok = 0;

    rollsSnap.forEach((doc) => {
      const data = doc.data();
      totalRol += 1;
      totalBeratStok += data.berat_sisa || 0;
    });

    // ============= 2. PENJUALAN HARI INI =============
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const salesQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", today),
      where("tanggal_transaksi", "<", tomorrow),
    );

    const salesSnap = await getDocs(salesQuery);

    let penjualanHariIni = 0;
    salesSnap.forEach((doc) => {
      penjualanHariIni += doc.data().total_harga || 0;
    });

    // ============= 3. MUTASI HARI INI (DARI SURAT JALAN) =============
    const mutasiQuery = query(
      collection(db, SURAT_JALAN_COLLECTION),
      where("tipe", "==", "MUTASI"),
      where("status", "in", ["completed", "approved"]),
      where("created_at", ">=", today),
      where("created_at", "<", tomorrow),
    );

    const mutasiSnap = await getDocs(mutasiQuery);

    let totalMutasiItem = 0;
    let totalMutasiRol = 0;
    let totalMutasiBerat = 0;

    mutasiSnap.forEach((doc) => {
      const data = doc.data();
      totalMutasiRol += data.total_roll || 0;
      totalMutasiBerat += data.total_berat || 0;
      totalMutasiItem += data.items?.length || 0;
    });

    const result = {
      totalRol,
      totalBerat: totalBeratStok,
      penjualanHariIni,
      mutasiHariIni: {
        item: totalMutasiItem,
        rol: totalMutasiRol,
        berat: totalMutasiBerat,
      },
    };

    console.log("✅ Stock summary result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting stock summary:", error);
    return {
      totalRol: 0,
      totalBerat: 0,
      penjualanHariIni: 0,
      mutasiHariIni: { item: 0, rol: 0, berat: 0 },
    };
  }
};

/* ======================================================
   GET OWNER DASHBOARD DATA
====================================================== */
export const getOwnerDashboardData = async (startDate, endDate) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
      orderBy("tanggal_transaksi", "desc"),
    );

    const snap = await getDocs(transactionsQuery);
    const transactions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Hitung total
    const totalPenjualan = transactions.reduce(
      (sum, t) => sum + (t.total_harga || 0),
      0,
    );

    const totalBerat = transactions.reduce(
      (sum, t) => sum + (t.total_berat || 0),
      0,
    );

    const totalTransaksi = transactions.length;

    // Unique customers & products
    const uniqueCustomers = new Set();
    const uniqueProducts = new Set();

    transactions.forEach((t) => {
      if (t.customer?.id) uniqueCustomers.add(t.customer.id);
      t.items?.forEach((item) => {
        if (item.produkId) uniqueProducts.add(item.produkId);
      });
    });

    const rataKg = totalBerat > 0 ? totalPenjualan / totalBerat : 0;

    // Growth calculation
    const periodLength = end - start;
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime() - 1);

    const prevTransactions = await getTransactionsByDateRange(
      prevStart,
      prevEnd,
    );
    const prevTotal = prevTransactions.reduce(
      (sum, t) => sum + (t.total_harga || 0),
      0,
    );
    const prevUniqueCustomers = new Set(
      prevTransactions.map((t) => t.customer?.id).filter(Boolean),
    );

    const growth =
      prevTotal > 0 ? ((totalPenjualan - prevTotal) / prevTotal) * 100 : 0;

    return {
      totalPenjualan,
      totalBerat,
      totalTransaksi,
      totalCustomer: uniqueCustomers.size,
      totalProduk: uniqueProducts.size,
      rataKg,
      pertumbuhan: {
        penjualan: growth,
        transaksi: totalTransaksi - prevTransactions.length,
        customer: uniqueCustomers.size - prevUniqueCustomers.size,
      },
    };
  } catch (error) {
    console.error("Error getting owner dashboard:", error);
    throw error;
  }
};

/* ======================================================
   GET TOP PRODUCTS
====================================================== */
export const getTopProducts = async (startDate, endDate, limitCount = 10) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
    );

    const snap = await getDocs(transactionsQuery);
    const productMap = new Map();

    snap.docs.forEach((doc) => {
      const data = doc.data();
      data.items?.forEach((item) => {
        const key = item.produkId || item.produkNama;
        if (!key) return;

        if (!productMap.has(key)) {
          productMap.set(key, {
            id: item.produkId,
            nama: item.produkNama,
            kategori: item.kategori || "Umum",
            qty: 0,
            berat: 0,
            total: 0,
          });
        }

        const prod = productMap.get(key);
        prod.qty += 1;
        prod.berat +=
          item.tipe === "ROL" ? item.berat || 0 : item.berat_jual || 0;
        prod.total += item.subtotal || 0;
      });
    });

    const products = Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limitCount);

    const maxTotal = products[0]?.total || 1;

    return products.map((p) => ({
      ...p,
      percentage: (p.total / maxTotal) * 100,
    }));
  } catch (error) {
    console.error("Error getting top products:", error);
    return [];
  }
};

/* ======================================================
   GET TOP CUSTOMERS
====================================================== */
export const getTopCustomers = async (startDate, endDate, limitCount = 10) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
    );

    const snap = await getDocs(transactionsQuery);
    const customerMap = new Map();

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const customer = data.customer;
      if (!customer?.id) return;

      if (!customerMap.has(customer.id)) {
        customerMap.set(customer.id, {
          id: customer.id,
          nama: customer.nama,
          kode: customer.kode || "-",
          totalTransaksi: 0,
          totalBelanja: 0,
        });
      }

      const cust = customerMap.get(customer.id);
      cust.totalTransaksi += 1;
      cust.totalBelanja += data.total_harga || 0;
    });

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalBelanja - a.totalBelanja)
      .slice(0, limitCount);

    const maxTotal = customers[0]?.totalBelanja || 1;

    return customers.map((c) => ({
      ...c,
      percentage: (c.totalBelanja / maxTotal) * 100,
    }));
  } catch (error) {
    console.error("Error getting top customers:", error);
    return [];
  }
};

/* ======================================================
   GET PAYMENT METHOD STATS
====================================================== */
export const getPaymentMethodStats = async (startDate, endDate) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
    );

    const snap = await getDocs(transactionsQuery);
    const methodMap = new Map();

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const metode = data.metode_pembayaran || "CASH";

      if (!methodMap.has(metode)) {
        methodMap.set(metode, {
          metode,
          count: 0,
          total: 0,
        });
      }

      const m = methodMap.get(metode);
      m.count += 1;
      m.total += data.total_harga || 0;
    });

    const methods = Array.from(methodMap.values());
    const grandTotal = methods.reduce((sum, m) => sum + m.total, 0);

    return methods.map((m) => ({
      ...m,
      percentage: grandTotal > 0 ? (m.total / grandTotal) * 100 : 0,
      average: m.count > 0 ? m.total / m.count : 0,
    }));
  } catch (error) {
    console.error("Error getting payment stats:", error);
    return [];
  }
};

/* ======================================================
   GET TRANSACTIONS BY DATE RANGE
====================================================== */
export const getTransactionsByDateRange = async (startDate, endDate) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
      orderBy("tanggal_transaksi", "desc"),
    );

    const snap = await getDocs(transactionsQuery);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
};

/* ======================================================
   GET TODAY'S TRANSACTIONS
====================================================== */
export const getTodayTransactions = async () => {
  try {
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", today),
      where("tanggal_transaksi", "<", tomorrow),
      orderBy("tanggal_transaksi", "desc"),
    );

    const snap = await getDocs(transactionsQuery);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting today's transactions:", error);
    return [];
  }
};

/* ======================================================
   GET STOCK ACTIVITIES
====================================================== */
export const getStockActivities = async (limitCount = 100) => {
  try {
    const ledgerQuery = query(
      collection(db, STOCK_LEDGER_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(ledgerQuery);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting stock activities:", error);
    return [];
  }
};

/* ======================================================
   GET GUDANG LIST
====================================================== */
export const getGudangList = async () => {
  return [
    { id: "gudang_aa17", nama: "AA17" },
    { id: "gudang_a38", nama: "A38" },
    { id: "gudang_cideng", nama: "CIDENG" },
  ];
};

/* ======================================================
   GET TOTAL REVENUE BY PERIOD
====================================================== */
export const getTotalRevenueByPeriod = async (startDate, endDate) => {
  try {
    const transactions = await getTransactionsByDateRange(startDate, endDate);
    return transactions.reduce((sum, t) => sum + (t.total_harga || 0), 0);
  } catch (error) {
    console.error("Error getting total revenue:", error);
    return 0;
  }
};
