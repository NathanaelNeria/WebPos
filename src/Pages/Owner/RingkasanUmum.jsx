// src/Pages/Owner/RingkasanUmum.jsx
import { useState, useEffect, useCallback } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import {
  getOwnerDashboardData,
  getTopProducts,
  getTopCustomers,
  getPaymentMethodStats,
  getStockSummary,
  getTodayTransactions,
  getStockActivities,
} from "../../Services/ownerService";

// Import components from Owner/RingkasanUmum
import {
  StatCardsGroup,
  PeriodeSelector,
  TopProductsTable,
  TopCustomersTable,
  PaymentMethodsChart,
  DailySummaryTable,
  SalesChart,
  StockActivity,
} from "../../Components/Owner/RingkasanUmum";

/* ======================================================
   CONSTANTS
====================================================== */
const PERIODE_OPTIONS = [
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "year", label: "Tahun Ini" },
  { value: "custom", label: "Kustom" },
];

/* ======================================================
   UTILS
====================================================== */
const formatTanggalFull = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

// Tambahkan fungsi formatBerat
const formatBerat = (n) => {
  return parseFloat(n || 0).toFixed(2);
};

const getDateRange = (periode, customRange) => {
  const today = new Date();
  let startDate, endDate;

  switch (periode) {
    case "today":
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date();
      break;

    case "yesterday":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "week": {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      firstDay.setHours(0, 0, 0, 0);
      startDate = firstDay;
      endDate = new Date();
      break;
    }

    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date();
      break;

    case "year":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date();
      break;

    case "custom":
      startDate = new Date(customRange.start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customRange.end);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date();
  }

  return { startDate, endDate };
};

const exportToCSV = (
  periode,
  customRange,
  summary,
  stockSummary,
  todayTransactions,
) => {
  const periodeLabel =
    periode === "custom"
      ? `${customRange.start} s/d ${customRange.end}`
      : PERIODE_OPTIONS.find((p) => p.value === periode)?.label || periode;

  const rows = [
    ["Periode", periodeLabel],
    ["", ""],
    ["RINGKASAN UMUM (SEMUA GUDANG)", ""],
    ["Total Penjualan", summary.totalPenjualan],
    ["Total Berat (kg)", summary.totalBerat],
    ["Jumlah Transaksi", summary.totalTransaksi],
    ["Rata-rata per kg", summary.rataKg],
    ["Total Customer", summary.totalCustomer],
    ["Total Produk Terjual", summary.totalProduk],
    ["", ""],
    ["STOK SAAT INI (SEMUA GUDANG)", ""],
    ["Total Rol", stockSummary.totalRol],
    ["Total Berat Stok (kg)", stockSummary.totalBerat],
    ["", ""],
    ["MUTASI HARI INI (SEMUA GUDANG)", ""],
    ["Penjualan Hari Ini", stockSummary.penjualanHariIni],
    ["Total Item Terjual", stockSummary.mutasiHariIni.item],
    ["Total Rol Terjual", stockSummary.mutasiHariIni.rol],
    ["Total Berat Terjual (kg)", stockSummary.mutasiHariIni.berat],
    ["", ""],
    ["TRANSAKSI HARI INI", ""],
    ...todayTransactions.map((t, i) => [
      `Transaksi ${i + 1}`,
      t.nomor_nota,
      t.customer?.nama || "-",
      t.gudang_nama || "-",
      t.total_harga,
      t.kasir_nama || "-",
      t.metode_pembayaran,
      t.status_pembayaran,
    ]),
  ];

  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ringkasan-semua-gudang-${periode}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/* ======================================================
   INITIAL STATE
====================================================== */
const initialSummaryState = {
  totalPenjualan: 0,
  totalBerat: 0,
  totalTransaksi: 0,
  totalCustomer: 0,
  totalProduk: 0,
  rataKg: 0,
  transaksiHarian: [],
  pertumbuhan: {
    penjualan: 0,
    transaksi: 0,
    customer: 0,
  },
};

const initialStockState = {
  totalRol: 0,
  totalBerat: 0,
  penjualanHariIni: 0,
  mutasiHariIni: {
    item: 0,
    rol: 0,
    berat: 0,
  },
};

/* ======================================================
   HEADER COMPONENT
====================================================== */
const Header = ({ userEmail, lastUpdate, onExport, onRefresh, refreshing }) => (
  <div className="bg-gradient-card p-6 rounded-xl shadow-soft border border-white/10 text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
          <BarChart3 className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Ringkasan Umum</h1>
          <p className="text-sm text-gray-300">
            Owner • {userEmail} • Update: {formatTanggalFull(lastUpdate)}
          </p>
          <p className="text-xs text-secondary mt-1">
            Data dari SEMUA Gudang (AA17, A38, CIDENG)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white flex items-center gap-2"
          title="Export ke CSV"
        >
          <Download size={16} />
          <span className="hidden md:inline">Export</span>
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={`p-2 rounded-lg transition border border-white/20 text-white ${
            refreshing
              ? "bg-white/5 cursor-not-allowed"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title="Refresh"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  </div>
);

/* ======================================================
   CHART SKELETON
====================================================== */
const ChartSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      <div className="h-4 bg-gray-200 rounded w-3/6"></div>
    </div>
  </div>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function RingkasanUmum() {
  const { user } = useAuth();

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filter State
  const [periode, setPeriode] = useState("month");
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Data State
  const [summary, setSummary] = useState(initialSummaryState);
  const [stockSummary, setStockSummary] = useState(initialStockState);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [stockActivities, setStockActivities] = useState([]);

  /* ======================================================
     LOAD DATA - SEMUA GUDANG
  ===================================================== */
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const { startDate, endDate } = getDateRange(periode, customRange);

      // Ambil data dari SEMUA gudang (tanpa filter gudang)
      const [
        ownerData,
        stockData,
        products,
        customers,
        payments,
        todayTrans,
        activities,
      ] = await Promise.all([
        getOwnerDashboardData(startDate, endDate),
        getStockSummary(),
        getTopProducts(startDate, endDate, 10),
        getTopCustomers(startDate, endDate, 10),
        getPaymentMethodStats(startDate, endDate),
        getTodayTransactions(),
        getStockActivities(100),
      ]);

      setSummary(ownerData);
      setStockSummary(stockData);
      setTopProducts(products);
      setTopCustomers(customers);
      setPaymentMethods(payments);
      setTodayTransactions(todayTrans);
      setStockActivities(activities);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading owner dashboard:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat ringkasan",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periode, customRange]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ======================================================
     HANDLERS
  ===================================================== */
  const handleApplyPeriode = () => {
    setLoading(true);
    loadData();
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleExport = () => {
    exportToCSV(periode, customRange, summary, stockSummary, todayTransactions);
  };

  /* ======================================================
     RENDER - LAYOUT VERTIKAL (KE BAWAH)
  ===================================================== */
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <Header
        userEmail={user?.email}
        lastUpdate={lastUpdate}
        onExport={handleExport}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Periode Selector */}
      <PeriodeSelector
        periode={periode}
        setPeriode={setPeriode}
        customRange={customRange}
        setCustomRange={setCustomRange}
        onApply={handleApplyPeriode}
        options={PERIODE_OPTIONS}
      />

      {/* Stat Cards - Data dari SEMUA gudang */}
      <StatCardsGroup loading={loading} stockSummary={stockSummary} />

      {/* Daily Summary - Transaksi Hari Ini dari SEMUA gudang */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <DailySummaryTable data={todayTransactions} loading={loading} />
      )}

      {/* KOMPONEN 1: Aktivitas Stok (Full Width) */}
      <div className="w-full">
        <StockActivity data={stockActivities} loading={loading} />
      </div>

      {/* KOMPONEN 2: Grafik Penjualan (Full Width) */}
      <div className="w-full">
        <SalesChart loading={loading} />
      </div>

      {/* 3 Kolom Charts - Top Products, Top Customers, Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-1">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <TopProductsTable products={topProducts} />
          )}
        </div>

        {/* Top Customers */}
        <div className="lg:col-span-1">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <TopCustomersTable customers={topCustomers} />
          )}
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-1">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <PaymentMethodsChart methods={paymentMethods} />
          )}
        </div>
      </div>

      {/* Footer dengan total ringkasan (opsional) */}
      {!loading && (
        <div className="bg-gradient-card rounded-xl p-4 text-white text-sm flex justify-between items-center">
          <span>
            Total Penjualan Periode Ini: {formatRupiah(summary.totalPenjualan)}
          </span>
          <span>Total Berat: {formatBerat(summary.totalBerat)} kg</span>
          <span>Total Transaksi: {summary.totalTransaksi}</span>
        </div>
      )}
    </div>
  );
}

// Helper formatRupiah untuk footer
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};
