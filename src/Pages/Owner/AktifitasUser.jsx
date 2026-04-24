// src/Pages/Owner/AktivitasUser.jsx
import { useState, useEffect, useCallback } from "react";
import { History, RefreshCw, Download } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import { getUserActivities } from "../../Services/aktivitasService";

// Components
import {
  FilterBar,
  ActivityStats,
  ActivityTable,
  ActivityDetailModal,
} from "../../Components/Owner/AktivitasUser";

/* ======================================================
   CONSTANTS - SESUAI DENGAN DATA REAL
====================================================== */
const ACTIVITY_TYPES = [
  { value: "ALL", label: "Semua Aktivitas" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "PENJUALAN", label: "Penjualan" },
  { value: "VOID_NOTA", label: "Void Nota" },
  { value: "OVERRIDE_HARGA", label: "Override Harga" },
  { value: "MUTASI_KELUAR", label: "Mutasi Keluar" },
  { value: "MUTASI_MASUK", label: "Mutasi Masuk" },
  { value: "BARANG_MASUK", label: "Barang Masuk" },
  { value: "CREATE_USER", label: "Tambah User" },
  { value: "UPDATE_USER", label: "Update User" },
  { value: "DELETE_USER", label: "Hapus User" },
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
      second: "2-digit",
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
          <History className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Aktivitas User</h1>
          <p className="text-sm text-gray-300">
            Owner • {userEmail} • Update: {formatTanggalFull(lastUpdate)}
          </p>
          <p className="text-xs text-secondary/80 mt-1">
            ✦ Immutable • Tidak dapat dihapus • Audit Trail
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
export default function AktivitasUser() {
  const { user } = useAuth();

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filter State
  const [periode, setPeriode] = useState("week");
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [selectedTypes, setSelectedTypes] = useState(["ALL"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("ALL");

  // Data State
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    byUser: {},
    recent: [],
  });

  // Detail Modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  /* ======================================================
     LOAD DATA
  ===================================================== */
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const { startDate, endDate } = getDateRange(periode, customRange);

      const data = await getUserActivities(startDate, endDate);

      setActivities(data.activities);
      setUsers(data.users);
      setStats(data.stats);
      setLastUpdate(new Date());

      // Reset filter ke "ALL" setelah load data baru
      setSelectedTypes(["ALL"]);
      setSelectedUserId("ALL");
      setSearchTerm("");
    } catch (error) {
      console.error("Error loading user activities:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat aktivitas user",
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
     FILTER HANDLERS - MEMAKAI action_type
  ===================================================== */
  const applyFilters = useCallback(() => {
    let filtered = [...activities];

    // Filter by type - menggunakan action_type, bukan tipe
    if (!selectedTypes.includes("ALL")) {
      filtered = filtered.filter((a) => selectedTypes.includes(a.action_type));
      console.log("Filter by types:", selectedTypes, "->", filtered.length);
    }

    // Filter by user
    if (selectedUserId !== "ALL") {
      filtered = filtered.filter((a) => a.user_id === selectedUserId);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.user_email?.toLowerCase().includes(term) ||
          a.action_details?.toLowerCase().includes(term) ||
          a.entity_id?.toLowerCase().includes(term),
      );
    }

    console.log("Final filtered count:", filtered.length);
    setFilteredActivities(filtered);
  }, [activities, selectedTypes, selectedUserId, searchTerm]);

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
    if (filteredActivities.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Data",
        text: "Tidak ada aktivitas untuk diexport",
        confirmButtonColor: "#243A8C",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Timestamp",
      "User",
      "Email",
      "Role",
      "Tipe Aktivitas",
      "Detail",
      "Entity ID",
      "Gudang",
      "IP Address",
    ];

    const rows = filteredActivities.map((a) => [
      formatTanggalFull(a.timestamp),
      a.user_name || "-",
      a.user_email || "-",
      Array.isArray(a.user_role) ? a.user_role.join(", ") : a.user_role || "-",
      a.action_type || "-",
      a.action_details || "-",
      a.entity_id || "-",
      a.gudang_nama || a.gudang_id || "-",
      a.ip_address || "-",
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aktivitas-user-${periode}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: "success",
      title: "Export Berhasil",
      text: `${filteredActivities.length} aktivitas telah diexport`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleViewDetail = (activity) => {
    setSelectedActivity(activity);
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
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        users={users}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
      />

      {/* Stats Cards */}
      <ActivityStats
        stats={{
          total: filteredActivities.length,
          byType: stats.byType,
          uniqueUsers: users.length,
          timeRange: periode,
          recent: filteredActivities.slice(0, 3),
        }}
        loading={loading}
      />

      {/* Activities Table */}
      <ActivityTable
        data={filteredActivities}
        loading={loading}
        onViewDetail={handleViewDetail}
      />

      {/* Detail Modal */}
      <ActivityDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        activity={selectedActivity}
      />
    </div>
  );
}
