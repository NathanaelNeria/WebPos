// WarehouseDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../Services/firebase";
import { useGudang } from "../../Hooks/useGudang";
import { useAuth } from "../../Hooks/useAuth";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Package,
  Clock,
  AlertCircle,
  ArrowLeftRight,
  Factory,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  Download,
  Printer,
  Activity,
  Calendar,
  Layers,
  BarChart3,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  Printer as PrinterIcon,
  User,
  Shield,
  Database,
  Lock,
  FileCheck,
  HardDrive,
} from "lucide-react";

/* ======================================================
   UTIL & CONSTANTS
====================================================== */
const format2 = (n) => parseFloat(n || 0).toFixed(2);

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const formatWaktu = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

/* ======================================================
   STAT CARD COMPONENT
====================================================== */
const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
  trend,
}) => {
  const colorClasses = {
    primary: {
      bgLight: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      gradient: "from-primary/5 to-transparent",
    },
    secondary: {
      bgLight: "bg-secondary/10",
      text: "text-secondary",
      border: "border-secondary/20",
      gradient: "from-secondary/5 to-transparent",
    },
    green: {
      bgLight: "bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-200",
      gradient: "from-emerald-500/5 to-transparent",
    },
    blue: {
      bgLight: "bg-sky-500/10",
      text: "text-sky-600",
      border: "border-sky-200",
      gradient: "from-sky-500/5 to-transparent",
    },
    yellow: {
      bgLight: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-200",
      gradient: "from-amber-500/5 to-transparent",
    },
    red: {
      bgLight: "bg-rose-500/10",
      text: "text-rose-600",
      border: "border-rose-200",
      gradient: "from-rose-500/5 to-transparent",
    },
    purple: {
      bgLight: "bg-purple-500/10",
      text: "text-purple-600",
      border: "border-purple-200",
      gradient: "from-purple-500/5 to-transparent",
    },
    indigo: {
      bgLight: "bg-indigo-500/10",
      text: "text-indigo-600",
      border: "border-indigo-200",
      gradient: "from-indigo-500/5 to-transparent",
    },
    gray: {
      bgLight: "bg-gray-500/10",
      text: "text-gray-600",
      border: "border-gray-200",
      gradient: "from-gray-500/5 to-transparent",
    },
  };

  const classes = colorClasses[color] || colorClasses.primary;

  return (
    <div
      className={`bg-white rounded-xl shadow-soft border ${classes.border} p-5 hover:shadow-medium transition-all duration-300 group hover:scale-[1.02] relative overflow-hidden`}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${classes.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              {title}
              {trend && (
                <span
                  className={`text-xs ${trend > 0 ? "text-emerald-600" : "text-rose-600"} flex items-center`}
                >
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </span>
              )}
            </p>
            <p className={`text-2xl font-bold ${classes.text}`}>{value}</p>
            {subValue && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Package size={12} className="text-gray-400" />
                {subValue}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${classes.bgLight} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`w-6 h-6 ${classes.text}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   QUICK ACTION CARD
====================================================== */
const QuickActionCard = ({
  title,
  description,
  link,
  icon: Icon,
  count,
  gradient = "primary",
}) => {
  const gradientClasses = {
    primary: "bg-gradient-primary",
    secondary: "bg-gradient-secondary",
    card: "bg-gradient-card",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-darkblue",
    card: "text-white",
  };

  const bgClass = gradientClasses[gradient] || gradientClasses.primary;
  const textColor = textColors[gradient] || "text-white";

  return (
    <Link
      to={link}
      className={`${bgClass} p-6 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-[1.02] group border-0 relative overflow-hidden`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-xs group-hover:bg-white/30 transition-colors">
                <Icon className={`w-5 h-5 ${textColor}`} />
              </div>
              <h3 className={`font-semibold ${textColor} text-lg`}>{title}</h3>
              {count !== undefined && count > 0 && (
                <span
                  className={`ml-auto bg-white/30 ${textColor} text-xs px-2 py-1 rounded-full backdrop-blur-xs`}
                >
                  {count} {count === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <p className={`text-sm ${textColor}/80 mb-4 line-clamp-2`}>
              {description}
            </p>
            <div
              className={`flex items-center gap-2 ${textColor}/80 text-sm font-medium group-hover:gap-3 transition-all`}
            >
              <span>
                {gradient === "primary"
                  ? "Kelola Barang"
                  : gradient === "secondary"
                    ? "Barang Masuk"
                    : "Mutasi Gudang"}
              </span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ======================================================
   ACTIVITY ITEM COMPONENT
====================================================== */
const ActivityItem = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Tidak ada aktivitas terbaru</p>
      </div>
    );
  }

  // Kelompokkan berdasarkan tanggal
  const activitiesByDate = items.reduce((acc, item) => {
    const dateKey = formatTanggal(item.timestamp || item.created_at);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {});

  // Urutkan tanggal descending
  const sortedDates = Object.keys(activitiesByDate).sort((a, b) => {
    const dateA = new Date(a.split("/").reverse().join("-"));
    const dateB = new Date(b.split("/").reverse().join("-"));
    return dateB - dateA;
  });

  const getActivityIcon = (activity) => {
    switch (activity.action_type) {
      case "MUTASI_MASUK":
        return <ArrowLeft size={16} className="text-green-600" />;
      case "MUTASI_KELUAR":
        return <ArrowRight size={16} className="text-blue-600" />;
      case "BARANG_MASUK":
        return <Factory size={16} className="text-emerald-600" />;
      case "APPROVE":
        return <CheckCircle size={16} className="text-primary" />;
      case "CREATE":
        return <Package size={16} className="text-purple-600" />;
      case "UPDATE":
        return <RefreshCw size={16} className="text-amber-600" />;
      case "DELETE":
        return <XCircle size={16} className="text-rose-600" />;
      case "LOGIN":
        return <User size={16} className="text-indigo-600" />;
      case "PRINT":
        return <PrinterIcon size={16} className="text-gray-600" />;
      default:
        return <Activity size={16} className="text-gray-400" />;
    }
  };

  const getActivityColor = (action_type) => {
    switch (action_type) {
      case "MUTASI_MASUK":
        return "border-green-500 bg-green-50";
      case "MUTASI_KELUAR":
        return "border-blue-500 bg-blue-50";
      case "BARANG_MASUK":
        return "border-emerald-500 bg-emerald-50";
      case "APPROVE":
        return "border-primary bg-primary/5";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date} className="animate-fade-in-up">
          <div className="text-sm font-semibold text-darkblue mb-3 flex items-center gap-2 bg-primary/5 p-2 rounded-lg border-l-4 border-primary">
            <Calendar size={14} className="text-primary" />
            {date}
          </div>
          <div className="space-y-3 pl-4">
            {activitiesByDate[date].map((activity, idx) => {
              const borderColor = getActivityColor(activity.action_type);
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 text-sm py-2 border-l-2 pl-4 hover:border-primary transition-colors group ${borderColor}`}
                >
                  <span className="mt-0.5 flex-shrink-0 p-1.5 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    {getActivityIcon(activity)}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">
                      {activity.action_details || "Aktivitas tidak diketahui"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={10} className="text-gray-400" />
                        {formatWaktu(activity.timestamp || activity.created_at)}
                      </span>
                      {activity.user_email &&
                        activity.user_email !== "unknown" && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User size={10} className="text-gray-400" />
                              <span className="text-primary">
                                {activity.user_email}
                              </span>
                            </span>
                          </>
                        )}
                      {activity.metadata?.gudang_asal && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Truck size={10} className="text-gray-400" />
                            {activity.metadata.gudang_asal} →{" "}
                            {activity.metadata.gudang_tujuan}
                          </span>
                        </>
                      )}
                      {activity.metadata?.total_roll && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Package size={10} className="text-gray-400" />
                            {activity.metadata.total_roll} roll
                          </span>
                        </>
                      )}
                    </div>
                    {activity.entity_id && (
                      <div className="mt-1 text-xs font-mono text-gray-400">
                        {activity.entity_id}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ======================================================
   MAIN DASHBOARD COMPONENT
====================================================== */
export default function WarehouseDashboard() {
  const { activeGudangId, gudangNama } = useGudang();
  const { user } = useAuth();

  // Cek role user
  const userRoles = user?.role || [];
  const isOwner = userRoles.includes("owner");
  const isAdmin = userRoles.includes("admin");
  const isKasir = userRoles.includes("kasir");

  /* =======================
     STATE
  ======================= */
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRoll: 0,
    totalBerat: 0,
    availableRoll: 0,
    availableBerat: 0,
    inTransitRoll: 0,
    inTransitBerat: 0,
    openedRoll: 0,
    openedBerat: 0,
    usedRoll: 0,
    usedBerat: 0,
    damagedRoll: 0,
    damagedBerat: 0,
    uniqueProducts: 0,
  });

  // Data
  const [pendingMutasi, setPendingMutasi] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [totalValue, setTotalValue] = useState(0);
  const [mutasiHariIni, setMutasiHariIni] = useState(0);

  /* ======================================================
     LOAD DASHBOARD DATA
  ===================================================== */
  const loadDashboardData = useCallback(async () => {
    if (!activeGudangId) {
      // Jika owner dan belum pilih gudang, tampilkan data kosong
      if (isOwner) {
        setStats({
          totalRoll: 0,
          totalBerat: 0,
          uniqueProducts: 0,
          availableRoll: 0,
          availableBerat: 0,
          inTransitRoll: 0,
          inTransitBerat: 0,
          openedRoll: 0,
          openedBerat: 0,
          usedRoll: 0,
          usedBerat: 0,
          damagedRoll: 0,
          damagedBerat: 0,
        });
        setTotalValue(0);
        setPendingMutasi([]);
        setLowStockProducts([]);
        setActivities([]);
        setMutasiHariIni(0);
        setLoading(false);
        return;
      }
      return;
    }

    try {
      setLoading(true);

      // 1. LOAD STOCK ROLLS
      const stockQuery = query(
        collection(db, "stockRolls"),
        where("gudang_id", "==", activeGudangId),
      );

      const stockSnap = await getDocs(stockQuery);
      const rolls = stockSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Hitung stats
      const totalRoll = rolls.length;
      const totalBerat = rolls.reduce((sum, r) => sum + (r.berat_sisa || 0), 0);

      const available = rolls.filter((r) => r.status === "AVAILABLE");
      const inTransit = rolls.filter((r) => r.status === "IN_TRANSIT");
      const opened = rolls.filter((r) => r.status === "OPENED");
      const used = rolls.filter((r) => r.status === "USED");
      const damaged = rolls.filter((r) => r.status === "DAMAGED");

      // Hitung unique products
      const uniqueProducts = new Set(
        rolls.map((r) => r.produk_id).filter(Boolean),
      ).size;

      // Hitung total nilai (estimasi) - hanya untuk owner
      if (isOwner) {
        const totalVal = rolls.reduce(
          (sum, r) => sum + (r.berat_sisa || 0) * 10000,
          0,
        );
        setTotalValue(totalVal);
      }

      setStats({
        totalRoll,
        totalBerat,
        uniqueProducts,
        availableRoll: available.length,
        availableBerat: available.reduce(
          (sum, r) => sum + (r.berat_sisa || 0),
          0,
        ),
        inTransitRoll: inTransit.length,
        inTransitBerat: inTransit.reduce(
          (sum, r) => sum + (r.berat_sisa || 0),
          0,
        ),
        openedRoll: opened.length,
        openedBerat: opened.reduce((sum, r) => sum + (r.berat_sisa || 0), 0),
        usedRoll: used.length,
        usedBerat: used.reduce((sum, r) => sum + (r.berat_sisa || 0), 0),
        damagedRoll: damaged.length,
        damagedBerat: damaged.reduce((sum, r) => sum + (r.berat_sisa || 0), 0),
      });

      // 2. PENDING MUTASI MASUK
      const pendingQuery = query(
        collection(db, "suratJalan"),
        where("tipe", "==", "MUTASI"),
        where("gudang_tujuan", "==", activeGudangId),
        where("status", "==", "approved"),
        orderBy("created_at", "desc"),
        limit(5),
      );

      const pendingSnap = await getDocs(pendingQuery);
      const pendingData = pendingSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingMutasi(pendingData);

      // 3. LOW STOCK PRODUCTS
      const productMap = new Map();
      rolls.forEach((roll) => {
        const key = roll.produk_id || roll.produk_nama;
        if (!key) return;
        const existing = productMap.get(key) || {
          produkNama: roll.produk_nama,
          totalRoll: 0,
          totalBerat: 0,
          minStock: roll.min_stock || 5,
        };
        existing.totalRoll += 1;
        existing.totalBerat += roll.berat_sisa || 0;
        productMap.set(key, existing);
      });

      const lowStock = Array.from(productMap.values())
        .filter((p) => p.totalRoll < (p.minStock || 5))
        .sort((a, b) => a.totalRoll - b.totalRoll)
        .slice(0, 5);
      setLowStockProducts(lowStock);

      // 4. RECENT ACTIVITIES (untuk gudang ini)
      const activitiesQuery = query(
        collection(db, "userActivities"),
        where("gudang_id", "==", activeGudangId),
        orderBy("timestamp", "desc"),
        limit(50),
      );

      const activitiesSnap = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActivities(activitiesData);

      // Hitung mutasi hari ini
      const mutasiHariIniCount = activitiesData.filter((act) => {
        if (
          act.action_type !== "MUTASI_MASUK" &&
          act.action_type !== "MUTASI_KELUAR"
        )
          return false;
        const actDate = act.timestamp?.toDate?.() || new Date(act.timestamp);
        return actDate.toDateString() === new Date().toDateString();
      }).length;
      setMutasiHariIni(mutasiHariIniCount);

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat dashboard",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeGudangId, isOwner]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, activeGudangId]);

  /* ======================================================
     RENDER
  ===================================================== */
  if (!activeGudangId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="bg-white p-8 rounded-xl shadow-hard max-w-md text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-darkblue mb-3">
            {isOwner
              ? "Pilih Gudang Terlebih Dahulu"
              : "Gudang Tidak Terdeteksi"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isOwner
              ? "Silakan pilih gudang dari dropdown di pojok kanan atas untuk melihat data"
              : "Silakan pilih gudang terlebih dahulu untuk mengakses dashboard"}
          </p>
          {!isOwner && (
            <Link
              to="/admin/gudang"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-midblue transition-colors shadow-soft hover:shadow-medium"
            >
              Pilih Gudang
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-card p-6 rounded-xl shadow-soft border border-white/10 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                <LayoutDashboard className="w-6 h-6 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Dashboard Gudang
              </h1>
              {/* Role Badge */}
              <div className="flex gap-1 ml-2">
                {isOwner && (
                  <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                    Owner
                  </span>
                )}
                {isAdmin && (
                  <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                    Admin
                  </span>
                )}
                {isKasir && !isAdmin && (
                  <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30">
                    Kasir
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Package size={14} className="text-secondary" />
                <span>Gudang: </span>
                <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {gudangNama || activeGudangId}
                  {isOwner && (
                    <ChevronDown size={12} className="text-white/70" />
                  )}
                </span>
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-secondary" />
                Update: {formatTanggal(lastUpdate)} {formatWaktu(lastUpdate)}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <Eye size={14} className="text-secondary" />
                Status:{" "}
                <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white"
              title="Download Report"
            >
              <Download size={18} />
            </button>
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white"
              title="Print Dashboard"
            >
              <Printer size={18} />
            </button>
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white"
              title="Filter"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
            <p className="text-xs text-gray-300 mb-1">Total Roll</p>
            <p className="text-xl font-bold text-white">{stats.totalRoll}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
            <p className="text-xs text-gray-300 mb-1">Total Berat</p>
            <p className="text-xl font-bold text-white">
              {format2(stats.totalBerat)} kg
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
            <p className="text-xs text-gray-300 mb-1">Unique Products</p>
            <p className="text-xl font-bold text-white">
              {stats.uniqueProducts}
            </p>
          </div>
          {/* Estimasi Nilai - Hanya untuk Owner */}
          {isOwner ? (
            <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
              <p className="text-xs text-gray-300 mb-1">Estimasi Nilai</p>
              <p className="text-xl font-bold text-white">
                Rp {format2(totalValue / 1000000)}jt
              </p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs opacity-50">
              <p className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                <EyeOff size={12} className="text-gray-400" />
                Estimasi Nilai
              </p>
              <p className="text-xl font-bold text-white/50">•••••••</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-soft">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={24} className="text-primary opacity-50" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Memuat data dashboard...
          </p>
          <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Roll"
              value={stats.totalRoll}
              subValue={`${format2(stats.totalBerat)} kg`}
              icon={Package}
              color="primary"
            />
            <StatCard
              title="Tersedia"
              value={stats.availableRoll}
              subValue={`${format2(stats.availableBerat)} kg`}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Dalam Perjalanan"
              value={stats.inTransitRoll}
              subValue={`${format2(stats.inTransitBerat)} kg`}
              icon={Truck}
              color="blue"
            />
            <StatCard
              title="Dibuka"
              value={stats.openedRoll}
              subValue={`${format2(stats.openedBerat)} kg`}
              icon={AlertCircle}
              color="yellow"
            />
            <StatCard
              title="Terpakai"
              value={stats.usedRoll}
              subValue={`${format2(stats.usedBerat)} kg`}
              icon={XCircle}
              color="purple"
            />
            <StatCard
              title="Rusak"
              value={stats.damagedRoll}
              subValue={`${format2(stats.damagedBerat)} kg`}
              icon={AlertTriangle}
              color="red"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Manajemen Barang"
              description="Kelola data produk dan stok di gudang"
              link="/Warehouse/ManajemenBarang"
              icon={Layers}
              count={stats.uniqueProducts}
              gradient="primary"
            />

            <QuickActionCard
              title="Barang Masuk"
              description="Catat penerimaan barang dari supplier"
              link="/Warehouse/BarangMasuk"
              icon={Factory}
              count={pendingMutasi.length}
              gradient="secondary"
            />

            <QuickActionCard
              title="Mutasi Gudang"
              description="Proses pemindahan stok antar gudang"
              link="/Warehouse/MutasiGudang"
              icon={ArrowLeftRight}
              count={mutasiHariIni}
              gradient="card"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Mutasi Masuk Pending */}
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-midblue p-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Clock size={18} className="text-white" />
                    </div>
                    Mutasi Masuk Pending
                    {pendingMutasi.length > 0 && (
                      <span className="ml-auto bg-white/30 text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-xs">
                        {pendingMutasi.length}{" "}
                        {pendingMutasi.length === 1 ? "mutasi" : "mutasi"}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="p-4">
                  {pendingMutasi.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle
                        size={48}
                        className="mx-auto text-emerald-300 mb-3"
                      />
                      <p className="text-sm text-gray-600 font-medium">
                        Tidak ada mutasi pending
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Semua mutasi telah diproses
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingMutasi.map((mutasi, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-100 rounded-lg p-3 hover:border-primary/30 hover:shadow-soft transition-all group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {mutasi.id || `MUT-${idx + 1}`}
                                </span>
                              </div>
                              <p className="font-medium text-darkblue">
                                {mutasi.items?.length || 0} roll barang
                              </p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Truck size={10} className="text-gray-400" />
                                Dari: {mutasi.gudang_asal}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock size={10} className="text-gray-400" />
                                {formatTanggal(mutasi.created_at)}
                              </p>
                            </div>
                            <Link
                              to="/Warehouse/MutasiGudang?tab=masuk"
                              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors group-hover:bg-primary group-hover:text-white"
                            >
                              Konfirmasi
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stok Menipis */}
              <div className="bg-gradient-card rounded-xl shadow-soft overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <AlertTriangle size={18} className="text-white" />
                    </div>
                    Stok Menipis
                  </h3>
                </div>
                <div className="p-4">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle
                        size={48}
                        className="mx-auto text-emerald-300 mb-3"
                      />
                      <p className="text-sm text-gray-600 font-medium">
                        Semua stok aman
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tidak ada produk dengan stok menipis
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 hover:border-amber-300 transition-all"
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium text-darkblue block mb-1">
                              {product.produkNama}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-white text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
                                {product.totalRoll} roll
                              </span>
                              <span className="text-xs text-gray-500">
                                {format2(product.totalBerat)} kg
                              </span>
                            </div>
                          </div>
                          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${Math.min((product.totalRoll / (product.minStock || 5)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Aktivitas Stok */}
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-midblue p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <Activity size={18} className="text-white" />
                      </div>
                      Aktivitas Stok Terbaru
                    </h3>
                    <div className="relative w-full md:w-72">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Cari aktivitas..."
                        className="w-full pl-9 pr-4 py-2 border border-white/20 bg-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-white placeholder-white/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <ActivityItem
                    items={activities.filter(
                      (act) =>
                        act.action_details
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        act.user_email
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        act.entity_id
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )}
                  />
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
                  <h3 className="font-semibold text-darkblue mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <BarChart3 size={16} className="text-primary" />
                    </div>
                    Distribusi Stok
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tersedia</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${stats.totalRoll > 0 ? (stats.availableRoll / stats.totalRoll) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-darkblue">
                        {stats.availableRoll} roll
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Dalam Perjalanan
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{
                              width: `${stats.totalRoll > 0 ? (stats.inTransitRoll / stats.totalRoll) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-darkblue">
                        {stats.inTransitRoll} roll
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dibuka</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${stats.totalRoll > 0 ? (stats.openedRoll / stats.totalRoll) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-darkblue">
                        {stats.openedRoll} roll
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Terpakai</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{
                              width: `${stats.totalRoll > 0 ? (stats.usedRoll / stats.totalRoll) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-darkblue">
                        {stats.usedRoll} roll
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rusak</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{
                              width: `${stats.totalRoll > 0 ? (stats.damagedRoll / stats.totalRoll) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-darkblue">
                        {stats.damagedRoll} roll
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
                  <h3 className="font-semibold text-darkblue mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Package size={16} className="text-primary" />
                    </div>
                    Ringkasan Berat (kg)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Berat</span>
                      <span className="text-lg font-bold text-primary">
                        {format2(stats.totalBerat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm text-emerald-600">Tersedia</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {format2(stats.availableBerat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                      <span className="text-sm text-sky-600">
                        Dalam Perjalanan
                      </span>
                      <span className="text-lg font-bold text-sky-600">
                        {format2(stats.inTransitBerat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm text-amber-600">Dibuka</span>
                      <span className="text-lg font-bold text-amber-600">
                        {format2(stats.openedBerat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-purple-600">Terpakai</span>
                      <span className="text-lg font-bold text-purple-600">
                        {format2(stats.usedBerat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                      <span className="text-sm text-rose-600">Rusak</span>
                      <span className="text-lg font-bold text-rose-600">
                        {format2(stats.damagedBerat)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER INFO CARD - ARSITEKTUR IMMUTABLE */}
          <div className="mt-8 space-y-4">
            {/* Main Info Card */}
            <div className="bg-gradient-card rounded-xl shadow-soft p-6 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-secondary/20 rounded-xl">
                    <Shield className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Arsitektur Immutable & Ledger-Based
                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
                        Production Ready
                      </span>
                    </h3>
                    <p className="text-sm text-white/70">
                      Sistem Manajemen Stok Kain • Versi 4.0
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock size={18} className="text-secondary" />
                      <span className="font-semibold">Immutable</span>
                    </div>
                    <p className="text-xs text-white/80">
                      Tidak ada edit/delete setelah transaksi COMPLETED. Koreksi
                      via surat jalan koreksi.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Database size={18} className="text-secondary" />
                      <span className="font-semibold">Ledger-Based</span>
                    </div>
                    <p className="text-xs text-white/80">
                      stockLedger sebagai source of truth, append-only, setiap
                      transaksi tercatat.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <FileCheck size={18} className="text-secondary" />
                      <span className="font-semibold">Surat Jalan</span>
                    </div>
                    <p className="text-xs text-white/80">
                      Semua pergerakan stok wajib memiliki surat jalan sebagai
                      parent transaksi.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <HardDrive size={18} className="text-secondary" />
                      <span className="font-semibold">Barcode Level</span>
                    </div>
                    <p className="text-xs text-white/80">
                      Tracking per roll dengan ID unik, riwayat lengkap dari
                      masuk hingga keluar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
