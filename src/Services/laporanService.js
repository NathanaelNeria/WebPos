// src/Services/laporanService.js
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "./firebase";

/* ======================================================
   CONSTANTS
====================================================== */
const TRANSACTIONS_COLLECTION = "transaksiPenjualan";
const STOCK_ROLLS_COLLECTION = "stockRolls";
const PRODUK_COLLECTION = "produk";
const WASTE_COLLECTION = "sisaUjungKain";

/* ======================================================
   HELPER FUNCTIONS
====================================================== */
const formatDateForQuery = (date) => {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
};

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatPersen = (n) => `${parseFloat(n || 0).toFixed(2)}%`;

/* ======================================================
   GET PRODUCTS DATA (untuk harga referensi)
====================================================== */
const getProductsData = async () => {
  try {
    console.log("📦 Fetching products data...");
    const produkSnap = await getDocs(collection(db, PRODUK_COLLECTION));
    const produkMap = new Map();

    produkSnap.forEach((doc) => {
      const data = doc.data();
      produkMap.set(doc.id, {
        id: doc.id,
        nama: data.nama || "Unknown",
        hargaReferensi: data.hargaReferensi || 0,
        kategori: data.kategori || "Umum",
      });
    });

    console.log(`✅ Found ${produkMap.size} products`);
    return produkMap;
  } catch (error) {
    console.error("❌ Error getting products data:", error);
    return new Map();
  }
};

/* ======================================================
   GET STOCK VALUE PER GUDANG (BERDASARKAN HARGA REFERENSI)
====================================================== */
const getStockValue = async () => {
  try {
    console.log("📦 Fetching stock data...");

    // Ambil semua roll yang tersedia
    const stockQuery = query(
      collection(db, STOCK_ROLLS_COLLECTION),
      where("status", "in", ["AVAILABLE", "OPENED"]),
    );

    const stockSnap = await getDocs(stockQuery);
    console.log(`📦 Found ${stockSnap.size} rolls in stock`);

    // Ambil semua produk untuk mendapatkan harga referensi
    const produkMap = await getProductsData();

    if (stockSnap.empty) {
      console.log("⚠️ No stock data found");
      return {
        totalRol: 0,
        totalBeratStok: 0,
        stockValue: 0,
        stockPerGudang: [],
      };
    }

    let totalRol = 0;
    let totalBeratStok = 0;
    let totalNilaiStok = 0;
    const stockPerGudang = new Map();

    stockSnap.forEach((doc) => {
      const data = doc.data();
      const berat = data.berat_sisa || 0;

      // Ambil harga referensi dari produk
      const produk = produkMap.get(data.produk_id);
      const hargaReferensi = produk?.hargaReferensi || 0;

      // Hitung nilai stok berdasarkan harga referensi
      const nilaiRoll = hargaReferensi * berat;

      totalRol += 1;
      totalBeratStok += berat;
      totalNilaiStok += nilaiRoll;

      const gudangId = data.gudang_id || "unknown";
      const gudangNama =
        data.gudang_nama ||
        (gudangId === "gudang_aa17"
          ? "AA17"
          : gudangId === "gudang_a38"
            ? "A38"
            : gudangId === "gudang_cideng"
              ? "CIDENG"
              : gudangId);

      if (!stockPerGudang.has(gudangId)) {
        stockPerGudang.set(gudangId, {
          id: gudangId,
          nama: gudangNama,
          rol: 0,
          berat: 0,
          nilai: 0,
        });
      }

      const g = stockPerGudang.get(gudangId);
      g.rol += 1;
      g.berat += berat;
      g.nilai += nilaiRoll;
    });

    console.log("📊 Stock per Gudang:", Array.from(stockPerGudang.values()));
    console.log("💰 Total Nilai Stok:", formatRupiah(totalNilaiStok));

    return {
      totalRol,
      totalBeratStok,
      stockValue: totalNilaiStok,
      stockPerGudang: Array.from(stockPerGudang.values()),
    };
  } catch (error) {
    console.error("❌ Error getting stock value:", error);
    return {
      totalRol: 0,
      totalBeratStok: 0,
      stockValue: 0,
      stockPerGudang: [],
    };
  }
};

/* ======================================================
   GET WASTE ANALYSIS
====================================================== */
const getWasteAnalysis = async (startDate, endDate) => {
  try {
    console.log("🗑️ Fetching waste data...");

    const wasteQuery = query(
      collection(db, WASTE_COLLECTION),
      where("tanggal", ">=", startDate),
      where("tanggal", "<=", endDate),
    );

    const wasteSnap = await getDocs(wasteQuery);
    console.log(`🗑️ Found ${wasteSnap.size} waste entries`);

    if (wasteSnap.empty) {
      return {
        totalWaste: 0,
        totalNilaiWaste: 0,
        wastePerGudang: [],
      };
    }

    let totalWaste = 0;
    let totalNilaiWaste = 0;
    const wastePerGudang = new Map();

    wasteSnap.forEach((doc) => {
      const data = doc.data();
      const berat = data.berat || 0;
      totalWaste += berat;

      // Estimasi nilai waste: Rp 10.000/kg (bisa disesuaikan)
      const nilaiWaste = berat * 10000;
      totalNilaiWaste += nilaiWaste;

      const gudangId = data.gudang_id || "unknown";
      const gudangNama = data.gudang_nama || gudangId;

      if (!wastePerGudang.has(gudangId)) {
        wastePerGudang.set(gudangId, {
          id: gudangId,
          nama: gudangNama,
          waste: 0,
          nilai: 0,
        });
      }

      const g = wastePerGudang.get(gudangId);
      g.waste += berat;
      g.nilai += nilaiWaste;
    });

    // Hitung persentase waste per gudang
    const wastePerGudangArray = Array.from(wastePerGudang.values()).map(
      (g) => ({
        ...g,
        percentage: totalWaste > 0 ? (g.waste / totalWaste) * 100 : 0,
      }),
    );

    return {
      totalWaste,
      totalNilaiWaste,
      wastePerGudang: wastePerGudangArray,
    };
  } catch (error) {
    console.error("❌ Error getting waste analysis:", error);
    return {
      totalWaste: 0,
      totalNilaiWaste: 0,
      wastePerGudang: [],
    };
  }
};

/* ======================================================
   CALCULATE COGS (HPP) DARI TRANSAKSI
====================================================== */
const calculateCOGS = (transactions, produkMap) => {
  let cogs = 0;
  let totalItems = 0;

  transactions.forEach((t) => {
    t.items?.forEach((item) => {
      const produk = produkMap.get(item.produkId);
      // Gunakan harga referensi sebagai modal
      const hargaModal = produk?.hargaReferensi || item.harga_per_kg * 0.7;
      const berat =
        item.tipe === "ROL" ? item.berat || 0 : item.berat_jual || 0;
      cogs += hargaModal * berat;
      totalItems++;
    });
  });

  console.log(
    `📊 COGS calculated from ${totalItems} items:`,
    formatRupiah(cogs),
  );
  return cogs;
};

/* ======================================================
   PROCESS DAILY SALES UNTUK CHART
====================================================== */
const processDailySales = (transactions) => {
  const dailyMap = new Map();

  transactions.forEach((t) => {
    const date = new Date(
      t.tanggal_transaksi?.toDate?.() || t.tanggal_transaksi,
    );
    const dateStr = date.toISOString().split("T")[0];

    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, {
        date,
        value: 0,
        count: 0,
        berat: 0,
      });
    }

    const day = dailyMap.get(dateStr);
    day.value += t.total_harga || 0;
    day.count += 1;
    day.berat += t.total_berat || 0;
  });

  return Array.from(dailyMap.values()).sort((a, b) => a.date - b.date);
};

/* ======================================================
   CALCULATE TURNOVER METRICS
====================================================== */
const calculateTurnover = (cogs, stockValue) => {
  const turnoverRatio = stockValue > 0 ? cogs / stockValue : 0;
  const turnoverDays = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

  return {
    turnoverRatio,
    turnoverDays,
  };
};

/* ======================================================
   GET COMPLETE SALES REPORT
====================================================== */
export const getSalesReport = async (startDate, endDate) => {
  try {
    console.log("📊 Fetching sales report...");
    console.log("📅 Period:", { startDate, endDate });

    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    // Parallel queries untuk efisiensi
    const [transactionsSnap, produkMap, stockData] = await Promise.all([
      getDocs(
        query(
          collection(db, TRANSACTIONS_COLLECTION),
          where("tanggal_transaksi", ">=", start),
          where("tanggal_transaksi", "<=", end),
          orderBy("tanggal_transaksi", "desc"),
        ),
      ),
      getProductsData(),
      getStockValue(),
    ]);

    console.log("📦 Stock data:", {
      totalRol: stockData.totalRol,
      totalBerat: stockData.totalBeratStok,
      totalValue: stockData.stockValue,
      gudangCount: stockData.stockPerGudang.length,
    });

    const transactions = transactionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📦 Found ${transactions.length} transactions`);

    // Hitung metrics dasar
    const revenue = transactions.reduce(
      (sum, t) => sum + (t.total_harga || 0),
      0,
    );
    const totalBerat = transactions.reduce(
      (sum, t) => sum + (t.total_berat || 0),
      0,
    );
    const totalTransaksi = transactions.length;

    // Hitung COGS dan Profit (gunakan harga referensi)
    const cogs = calculateCOGS(transactions, produkMap);
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Hitung turnover
    const { turnoverRatio, turnoverDays } = calculateTurnover(
      cogs,
      stockData.stockValue,
    );

    // Ambil waste analysis untuk periode yang sama
    const wasteData = await getWasteAnalysis(start, end);

    // Hitung persentase waste dari total penjualan
    const wastePercentage =
      totalBerat > 0 ? (wasteData.totalWaste / totalBerat) * 100 : 0;

    // Daily sales untuk chart
    const dailySales = processDailySales(transactions);

    const result = {
      // Revenue Metrics
      revenue,
      totalBerat,
      totalTransaksi,
      rataRataPerKg: totalBerat > 0 ? revenue / totalBerat : 0,
      rataRataPerTransaksi: totalTransaksi > 0 ? revenue / totalTransaksi : 0,

      // Profit Metrics
      cogs,
      grossProfit,
      grossMargin,

      // Stock Metrics
      totalRol: stockData.totalRol,
      totalBeratStok: stockData.totalBeratStok,
      stockValue: stockData.stockValue,
      stockPerGudang: stockData.stockPerGudang,

      // Turnover Metrics
      turnoverRatio,
      turnoverDays,

      // Waste Metrics
      totalWaste: wasteData.totalWaste,
      wasteValue: wasteData.totalNilaiWaste,
      wastePercentage,
      wastePerGudang: wasteData.wastePerGudang,

      // Transactions
      transactions,
      dailySales,
    };

    console.log("✅ Report generated:", {
      revenue: formatRupiah(revenue),
      totalBerat: format2(totalBerat),
      totalTransaksi,
      grossMargin: formatPersen(grossMargin),
      stockValue: formatRupiah(stockData.stockValue),
      turnoverRatio: format2(turnoverRatio),
    });

    return result;
  } catch (error) {
    console.error("❌ Error getting sales report:", error);
    return {
      // Revenue Metrics
      revenue: 0,
      totalBerat: 0,
      totalTransaksi: 0,
      rataRataPerKg: 0,
      rataRataPerTransaksi: 0,

      // Profit Metrics
      cogs: 0,
      grossProfit: 0,
      grossMargin: 0,

      // Stock Metrics
      totalRol: 0,
      totalBeratStok: 0,
      stockValue: 0,
      stockPerGudang: [],

      // Turnover Metrics
      turnoverRatio: 0,
      turnoverDays: 0,

      // Waste Metrics
      totalWaste: 0,
      wasteValue: 0,
      wastePercentage: 0,
      wastePerGudang: [],

      // Transactions
      transactions: [],
      dailySales: [],
    };
  }
};

/* ======================================================
   GET DAILY SALES (untuk chart)
====================================================== */
export const getDailySales = async (startDate, endDate) => {
  try {
    const report = await getSalesReport(startDate, endDate);
    return report.dailySales;
  } catch (error) {
    console.error("Error getting daily sales:", error);
    return [];
  }
};

/* ======================================================
   GET TOP PRODUCTS
====================================================== */
export const getTopProducts = async (startDate, endDate, limit = 10) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
    );

    const snap = await getDocs(q);
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
            total: 0,
            berat: 0,
          });
        }

        const prod = productMap.get(key);
        prod.qty += 1;
        prod.total += item.subtotal || 0;
        prod.berat +=
          item.tipe === "ROL" ? item.berat || 0 : item.berat_jual || 0;
      });
    });

    const products = Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

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
   GET PAYMENT METHOD STATS
====================================================== */
export const getPaymentMethodStats = async (startDate, endDate) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
    );

    const snap = await getDocs(q);
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
   GET EXPORT DATA (untuk Excel/PDF)
====================================================== */
export const getExportData = async (startDate, endDate) => {
  try {
    const report = await getSalesReport(startDate, endDate);

    return {
      summary: [
        { metric: "Total Revenue", value: formatRupiah(report.revenue) },
        { metric: "Total Berat (kg)", value: format2(report.totalBerat) },
        { metric: "Total Transaksi", value: report.totalTransaksi },
        {
          metric: "Rata-rata per kg",
          value: formatRupiah(report.rataRataPerKg),
        },
        { metric: "COGS (HPP)", value: formatRupiah(report.cogs) },
        { metric: "Gross Profit", value: formatRupiah(report.grossProfit) },
        { metric: "Gross Margin", value: formatPersen(report.grossMargin) },
        { metric: "Nilai Stok", value: formatRupiah(report.stockValue) },
        { metric: "Turnover Ratio", value: format2(report.turnoverRatio) },
        { metric: "Turnover Days", value: Math.round(report.turnoverDays) },
        { metric: "Total Waste (kg)", value: format2(report.totalWaste) },
        { metric: "Nilai Waste", value: formatRupiah(report.wasteValue) },
        {
          metric: "Waste Percentage",
          value: formatPersen(report.wastePercentage),
        },
      ],
      transactions: report.transactions,
      stockPerGudang: report.stockPerGudang,
      wastePerGudang: report.wastePerGudang,
      dailySales: report.dailySales,
    };
  } catch (error) {
    console.error("Error getting export data:", error);
    return null;
  }
};
