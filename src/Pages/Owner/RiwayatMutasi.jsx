// src/Pages/Owner/RiwayatMutasi.jsx
import { useState, useEffect, useCallback } from "react";
import { History, RefreshCw, Download, Filter } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import {
  getMutasiRiwayat,
  getMutasiAnalytics,
} from "../../Services/RiwayatMutasi/mutasiSerivce";

// Components
import {
  FilterBar,
  MutasiTable,
  MutasiDetailModal,
  RouteAnalytics,
  WeightDifferenceCard,
  AnomalyList,
} from "../../Components/Owner/RiwayatMutasi";

/* ======================================================
   CONSTANTS
====================================================== */
const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "dikirim", label: "Dikirim" },
  { value: "dalam_perjalanan", label: "Dalam Perjalanan" },
  { value: "sampai", label: "Sampai" },
  { value: "diterima", label: "Diterima" },
  { value: "draft", label: "Draft" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const GUDANG_OPTIONS = [
  { value: "ALL", label: "Semua Gudang" },
  { value: "AA17", label: "AA17" },
  { value: "A38", label: "A38" },
  { value: "CIDENG", label: "CIDENG" },
];

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

const exportToCSV = (data, periode, customRange) => {
  const headers = [
    "Tanggal",
    "Nomor Surat Jalan",
    "Nama Barang",
    "Asal",
    "Tujuan",
    "Pengirim",
    "Penerima",
    "Jumlah Rol",
    "Berat Kirim",
    "Berat Terima",
    "Selisih (kg)",
    "Selisih (%)",
    "Status",
  ];

  const rows = data.map((item) => {
    const selisih = (item.berat_terima || 0) - (item.total_berat || 0);
    const persenSelisih =
      item.total_berat > 0 ? (selisih / item.total_berat) * 100 : 0;

    return [
      item.tanggal_formatted || "-",
      item.nomor_surat || item.id,
      item.nama_barang || "-",
      item.asal || "-",
      item.tujuan || "-",
      item.pengirim_nama || item.pengirim || "-",
      item.penerima_nama || item.penerima || "-",
      item.total_roll || 0,
      item.total_berat ? item.total_berat.toFixed(2) : "0",
      item.berat_terima ? item.berat_terima.toFixed(2) : "-",
      selisih.toFixed(2),
      persenSelisih.toFixed(2),
      item.status_label || item.status || "-",
    ];
  });

  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `riwayat-mutasi-${periode}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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
          <History className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Mutasi</h1>
          <p className="text-sm text-gray-300">
            Owner • {userEmail} • Update: {formatTanggalFull(lastUpdate)}
          </p>
          <p className="text-xs text-secondary/80 mt-1">
            ✦ Tracking mutasi • Selisih berat • Deteksi anomali
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white flex items-center gap-2"
          title="Export CSV"
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
   MAIN COMPONENT
====================================================== */
export default function RiwayatMutasi() {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedAsal, setSelectedAsal] = useState("ALL");
  const [selectedTujuan, setSelectedTujuan] = useState("ALL");

  // Data State
  const [allMutasi, setAllMutasi] = useState([]);
  const [filteredMutasi, setFilteredMutasi] = useState([]);
  const [analytics, setAnalytics] = useState({
    routeStats: [],
    weightDifferences: {
      totalSusut: 0,
      totalLebih: 0,
      avgSusut: 0,
      avgLebih: 0,
    },
    anomalies: [],
  });

  // Modal State
  const [selectedMutasi, setSelectedMutasi] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  /* ======================================================
     LOAD DATA
  ===================================================== */
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const { startDate, endDate } = getDateRange(periode, customRange);

      const [mutasiData, analyticsData] = await Promise.all([
        getMutasiRiwayat(startDate, endDate),
        getMutasiAnalytics(startDate, endDate),
      ]);

      console.log("📦 Data loaded:", mutasiData.length, "mutasi");
      setAllMutasi(mutasiData);
      setAnalytics(analyticsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading mutasi:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat riwayat mutasi",
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
     FILTER HANDLERS
  ===================================================== */
  const applyFilters = useCallback(() => {
    let filtered = [...allMutasi];

    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter((m) => m.status === selectedStatus);
    }

    // Filter by asal
    if (selectedAsal !== "ALL") {
      filtered = filtered.filter((m) => m.asal === selectedAsal);
    }

    // Filter by tujuan
    if (selectedTujuan !== "ALL") {
      filtered = filtered.filter((m) => m.tujuan === selectedTujuan);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.nomor_surat?.toLowerCase().includes(term) ||
          m.id?.toLowerCase().includes(term) ||
          m.nama_barang?.toLowerCase().includes(term),
      );
    }

    console.log(
      `📊 Filtered: ${filtered.length} dari ${allMutasi.length} mutasi`,
    );
    setFilteredMutasi(filtered);
  }, [allMutasi, selectedStatus, selectedAsal, selectedTujuan, searchTerm]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
    exportToCSV(filteredMutasi, periode, customRange);
  };

  const handleResetFilter = () => {
    setSelectedStatus("ALL");
    setSelectedAsal("ALL");
    setSelectedTujuan("ALL");
    setSearchTerm("");
  };

  const handleViewDetail = (mutasi) => {
    setSelectedMutasi(mutasi);
    setShowDetailModal(true);
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
        periodeOptions={PERIODE_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        gudangOptions={GUDANG_OPTIONS}
        selectedAsal={selectedAsal}
        setSelectedAsal={setSelectedAsal}
        selectedTujuan={selectedTujuan}
        setSelectedTujuan={setSelectedTujuan}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onReset={handleResetFilter}
      />

      {/* Analytics Cards - Selisih Berat */}
      {!loading && <WeightDifferenceCard analytics={analytics} />}

      {/* Route Analytics & Anomaly Detection */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Analytics */}
          <div className="lg:col-span-2">
            <RouteAnalytics routeStats={analytics.routeStats} />
          </div>

          {/* Anomaly List */}
          <div className="lg:col-span-1">
            <AnomalyList anomalies={analytics.anomalies} />
          </div>
        </div>
      )}

      {/* Info Summary */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Total Mutasi:{" "}
            <span className="font-bold text-primary">
              {filteredMutasi.length}
            </span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            Total Roll:{" "}
            <span className="font-bold text-darkblue">
              {filteredMutasi.reduce((sum, m) => sum + (m.total_roll || 0), 0)}
            </span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            Total Berat:{" "}
            <span className="font-bold text-green-600">
              {filteredMutasi
                .reduce((sum, m) => sum + (m.total_berat || 0), 0)
                .toFixed(2)}{" "}
              kg
            </span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            Selisih:{" "}
            <span className="font-bold text-amber-600">
              {analytics.weightDifferences.totalSusut.toFixed(2)} kg (susut)
            </span>
          </span>
        </div>
        <button
          onClick={handleResetFilter}
          className="text-sm text-primary hover:text-midblue flex items-center gap-1"
        >
          <Filter size={14} />
          Reset Filter
        </button>
      </div>

      {/* Mutasi Table */}
      <MutasiTable
        data={filteredMutasi}
        loading={loading}
        onViewDetail={handleViewDetail}
      />

      {/* Detail Modal */}
      <MutasiDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        mutasi={selectedMutasi}
      />
    </div>
  );
}
