// src/Pages/Owner/LaporanPenjualan.jsx
import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import { getSalesReport } from "../../Services/laporanService";

// Components
import {
  FilterBar,
  RevenueMetrics,
  ProfitCards,
  SalesChart,
  TransactionsTable,
  StockValueTable,
  WasteAnalysis,
  TurnoverMetrics,
  ExportButtons,
} from "../../Components/Owner/LaporanPenjualan";

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
          <FileText className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Laporan Penjualan</h1>
          <p className="text-sm text-gray-300">
            Owner • {userEmail} • Update: {formatTanggalFull(lastUpdate)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ExportButtons onExport={onExport} />
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
   MAIN COMPONENT
====================================================== */
export default function LaporanPenjualan() {
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
  const [reportData, setReportData] = useState({
    revenue: 0,
    totalBerat: 0,
    totalTransaksi: 0,
    rataRataPerKg: 0,
    rataRataPerTransaksi: 0,
    cogs: 0,
    grossProfit: 0,
    grossMargin: 0,
    totalRol: 0,
    totalBeratStok: 0,
    stockValue: 0,
    stockPerGudang: [],
    turnoverRatio: 0,
    turnoverDays: 0,
    totalWaste: 0,
    wasteValue: 0,
    wastePercentage: 0,
    wastePerGudang: [],
    transactions: [],
    dailySales: [],
  });

  /* ======================================================
     LOAD DATA
  ===================================================== */
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const { startDate, endDate } = getDateRange(periode, customRange);

      const report = await getSalesReport(startDate, endDate);

      setReportData(report);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading sales report:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat laporan",
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

  const handleExport = (format) => {
    console.log(`Exporting to ${format}...`, reportData);
    // Implementasi export Excel/PDF akan ditambahkan
  };

  /* ======================================================
     RENDER
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

      {/* Filter Bar */}
      <FilterBar
        periode={periode}
        setPeriode={setPeriode}
        customRange={customRange}
        setCustomRange={setCustomRange}
        onApply={handleApplyPeriode}
        options={PERIODE_OPTIONS}
      />

      {/* Revenue Metrics */}
      <RevenueMetrics
        loading={loading}
        revenue={reportData.revenue}
        totalBerat={reportData.totalBerat}
        totalTransaksi={reportData.totalTransaksi}
      />

      {/* Profit Cards - Owner Only */}
      <ProfitCards
        loading={loading}
        cogs={reportData.cogs}
        grossProfit={reportData.grossProfit}
        grossMargin={reportData.grossMargin}
      />

      {/* Sales Chart */}
      <SalesChart data={reportData.dailySales} loading={loading} />

      {/* Transactions Table - dengan periode untuk empty state */}
      <TransactionsTable
        data={reportData.transactions}
        loading={loading}
        periode={periode}
      />

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Value per Gudang */}
        <StockValueTable
          data={reportData.stockPerGudang}
          totalRol={reportData.totalRol}
          totalBerat={reportData.totalBeratStok}
          totalValue={reportData.stockValue}
          loading={loading}
        />

        {/* Waste Analysis */}
        <WasteAnalysis
          totalWaste={reportData.totalWaste}
          wastePercentage={reportData.wastePercentage}
          wasteValue={reportData.wasteValue}
          perGudang={reportData.wastePerGudang}
          loading={loading}
        />
      </div>

      {/* Turnover Metrics */}
      <TurnoverMetrics
        loading={loading}
        turnoverRatio={reportData.turnoverRatio}
        turnoverDays={reportData.turnoverDays}
        stockValue={reportData.stockValue}
        cogs={reportData.cogs}
      />
    </div>
  );
}
