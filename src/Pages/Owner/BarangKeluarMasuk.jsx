// src/Pages/Owner/BarangMasukKeluar.jsx
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Truck } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import { getSuratJalan } from "../../Services/barangMasukKeluar/suratJalanService";

// Components
import {
  FilterBar,
  StatCards,
  SuratJalanTable,
  SuratJalanDetailModal,
  RollDetailModal,
} from "../../Components/Owner/BarangMasukKeluar";

/* ======================================================
   CONSTANTS
====================================================== */
const TIPE_OPTIONS = [
  // { value: "ALL", label: "Semua Tipe" },
  { value: "BARANG_MASUK", label: "Barang Masuk" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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

const formatTanggalUntukPencarian = (timestamp) => {
  if (!timestamp)
    return {
      string: "",
      normal: "",
      bulan: "",
      hari: "",
      tanggal: "",
      bulanAngka: "",
      tahun: "",
    };

  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

    return {
      string: date.toLocaleDateString("id-ID"), // "15/01/2024"
      normal: date.toISOString().split("T")[0], // "2024-01-15"
      bulan: date.toLocaleDateString("id-ID", { month: "long" }).toLowerCase(), // "januari"
      hari: date.toLocaleDateString("id-ID", { weekday: "long" }).toLowerCase(), // "senin"
      tanggal: date.getDate().toString(),
      bulanAngka: (date.getMonth() + 1).toString().padStart(2, "0"),
      tahun: date.getFullYear().toString(),
    };
  } catch {
    return {
      string: "",
      normal: "",
      bulan: "",
      hari: "",
      tanggal: "",
      bulanAngka: "",
      tahun: "",
    };
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
    "No. Surat Jalan",
    "Tipe",
    "Tanggal",
    "Status",
    "Asal",
    "Tujuan",
    "Total Roll",
    "Total Berat",
    "Catatan",
  ];

  const rows = data.map((item) => [
    item.nomor_surat || item.id,
    item.tipe === "BARANG_MASUK" ? "Barang Masuk" : "Mutasi",
    formatTanggalFull(item.created_at),
    item.status,
    item.tipe === "BARANG_MASUK"
      ? item.supplier_nama || item.metadata?.supplier || "-"
      : item.gudang_asal_nama || item.gudang_asal || "-",
    item.gudang_tujuan_nama || item.gudang_tujuan || "-",
    item.total_roll || 0,
    item.total_berat ? item.total_berat.toFixed(2) : "0",
    item.catatan || "-",
  ]);

  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `barang-masuk-keluar-${periode}-${new Date().toISOString().split("T")[0]}.csv`;
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
          <Truck className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Barang Masuk Supplier
          </h1>
          <p className="text-sm text-gray-300">
            Owner • {userEmail} • Update: {formatTanggalFull(lastUpdate)}
          </p>
          <p className="text-xs text-secondary/80 mt-1">
            ✦ Berbasis surat jalan • View-only • Immutable
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
export default function BarangMasukKeluar() {
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
  const [selectedTipe, setSelectedTipe] = useState("BARANG_MASUK");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGudang, setSelectedGudang] = useState("ALL");

  // Data State
  const [allSuratJalan, setAllSuratJalan] = useState([]);
  const [filteredSuratJalan, setFilteredSuratJalan] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    barangMasuk: 0,
    mutasi: 0,
    totalBerat: 0,
    totalRoll: 0,
  });

  // Modal State
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState(null);
  const [showRollModal, setShowRollModal] = useState(false);

  /* ======================================================
     LOAD DATA
  ===================================================== */
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const { startDate, endDate } = getDateRange(periode, customRange);

      const data = await getSuratJalan(startDate, endDate);

      setAllSuratJalan(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading surat jalan:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat surat jalan",
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
     FILTER HANDLERS - DITINGKATKAN DENGAN SEARCH LENGKAP
  ===================================================== */
  const applyFilters = useCallback(() => {
    let filtered = [...allSuratJalan];

    // Filter by tipe
    if (selectedTipe !== "ALL") {
      filtered = filtered.filter((s) => s.tipe === selectedTipe);
    }

    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter((s) => s.status === selectedStatus);
    }

    // Filter by gudang
    if (selectedGudang !== "ALL") {
      console.log(`🔍 Filtering by gudang: ${selectedGudang}`);
      filtered = filtered.filter((s) => {
        // Untuk BARANG_MASUK, cek gudang_tujuan
        if (s.tipe === "BARANG_MASUK") {
          return (
            s.gudang_tujuan === selectedGudang ||
            s.gudang_tujuan_id === selectedGudang
          );
        }

        // Untuk MUTASI, cek gudang_asal atau gudang_tujuan
        return (
          s.gudang_asal === selectedGudang ||
          s.gudang_asal_id === selectedGudang ||
          s.gudang_tujuan === selectedGudang ||
          s.gudang_tujuan_id === selectedGudang
        );
      });
    }

    // 🔍 FILTER SEARCH YANG DITINGKATKAN - Mencari no surat, tanggal, supplier
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();

      filtered = filtered.filter((s) => {
        // 1. Cari di nomor surat
        const matchNoSurat =
          s.nomor_surat?.toLowerCase().includes(term) ||
          s.id?.toLowerCase().includes(term) ||
          s.no_surat_jalan?.toLowerCase().includes(term);

        // 2. Cari di tanggal (menggunakan formatTanggalUntukPencarian)
        let matchTanggal = false;
        if (s.created_at || s.tanggal) {
          const tglData = s.created_at || s.tanggal;
          const tgl = formatTanggalUntukPencarian(tglData);

          matchTanggal =
            tgl.string.includes(term) || // "15/01/2024"
            tgl.normal.includes(term) || // "2024-01-15"
            tgl.bulan.includes(term) || // "januari"
            tgl.hari.includes(term) || // "senin"
            tgl.tanggal.includes(term) || // "15"
            tgl.bulanAngka.includes(term) || // "01"
            tgl.tahun.includes(term); // "2024"
        }

        // 3. Cari di supplier (untuk BARANG_MASUK)
        let matchSupplier = false;
        if (s.tipe === "BARANG_MASUK") {
          const supplier =
            s.supplier_nama ||
            s.metadata?.supplier ||
            s.supplier?.nama ||
            s.supplier_name ||
            "";
          matchSupplier = supplier.toLowerCase().includes(term);
        }

        // 4. Cari di asal/tujuan (untuk MUTASI)
        let matchAsalTujuan = false;
        if (s.tipe === "MUTASI") {
          const asal = s.gudang_asal_nama || s.gudang_asal || s.asal || "";
          const tujuan =
            s.gudang_tujuan_nama || s.gudang_tujuan || s.tujuan || "";
          matchAsalTujuan =
            asal.toLowerCase().includes(term) ||
            tujuan.toLowerCase().includes(term);
        }

        // 5. Cari di catatan (opsional)
        const matchCatatan = s.catatan?.toLowerCase().includes(term) || false;

        // Return true jika ada yang match
        return (
          matchNoSurat ||
          matchTanggal ||
          matchSupplier ||
          matchAsalTujuan ||
          matchCatatan
        );
      });
    }

    setFilteredSuratJalan(filtered);
  }, [allSuratJalan, selectedTipe, selectedStatus, selectedGudang, searchTerm]);

  // Update stats ketika filteredSuratJalan berubah
  useEffect(() => {
    const newStats = {
      total: filteredSuratJalan.length,
      barangMasuk: filteredSuratJalan.filter((s) => s.tipe === "BARANG_MASUK")
        .length,
      mutasi: filteredSuratJalan.filter((s) => s.tipe === "MUTASI").length,
      totalBerat: filteredSuratJalan.reduce(
        (sum, s) => sum + (s.total_berat || 0),
        0,
      ),
      totalRoll: filteredSuratJalan.reduce(
        (sum, s) => sum + (s.total_roll || 0),
        0,
      ),
    };

    setStats(newStats);
    console.log("📈 Stats updated:", newStats);
  }, [filteredSuratJalan]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Debug: lihat perubahan selectedGudang
  useEffect(() => {
    console.log("🏢 Selected Gudang changed to:", selectedGudang);
  }, [selectedGudang]);

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
    exportToCSV(filteredSuratJalan, periode, customRange);
  };

  const handleViewSurat = (surat) => {
    setSelectedSurat(surat);
    setShowDetailModal(true);
  };

  const handleViewRoll = (roll) => {
    setSelectedRoll(roll);
    setShowRollModal(true);
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
        tipeOptions={TIPE_OPTIONS}
        selectedTipe={selectedTipe}
        setSelectedTipe={setSelectedTipe}
        statusOptions={STATUS_OPTIONS}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedGudang={selectedGudang}
        setSelectedGudang={setSelectedGudang}
      />

      {/* Stat Cards */}
      <StatCards stats={stats} loading={loading} />

      {/* Surat Jalan Table */}
      <SuratJalanTable
        data={filteredSuratJalan}
        loading={loading}
        onViewDetail={handleViewSurat}
      />

      {/* Detail Modal */}
      <SuratJalanDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        surat={selectedSurat}
        onViewRoll={handleViewRoll}
      />

      {/* Roll Detail Modal */}
      <RollDetailModal
        isOpen={showRollModal}
        onClose={() => setShowRollModal(false)}
        roll={selectedRoll}
      />
    </div>
  );
}
