// src/Pages/Kasir/DashboardKasir.jsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  FileText,
  TrendingUp,
  Package,
  AlertCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  User,
  Calendar,
  BarChart3,
  Shield,
  Database,
  Lock,
  CheckCircle,
  XCircle,
  Wallet,
  Banknote,
  CreditCard,
} from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import { useGudang } from "../../Hooks/useGudang";
import { getDashboardData } from "../../Services/kasirService";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatWaktu = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

/* ======================================================
   SKELETON LOADING COMPONENTS
====================================================== */
const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-7 bg-gray-300 rounded w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

const TransactionSkeleton = () => (
  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg animate-pulse bg-white">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
    <div className="w-24 h-8 bg-gray-200 rounded"></div>
  </div>
);

/* ======================================================
   STAT CARD COMPONENT
====================================================== */
const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
  tooltip,
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
  };

  const classes = colorClasses[color] || colorClasses.primary;

  return (
    <div
      className={`bg-white rounded-xl shadow-soft border ${classes.border} p-5 hover:shadow-medium transition-all duration-300 group hover:scale-[1.02] relative overflow-hidden`}
      title={tooltip || subValue}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${classes.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              {title}
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
const QuickAction = ({
  title,
  description,
  link,
  icon: Icon,
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
      className={`${bgClass} p-6 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-[1.02] group border-0 relative overflow-hidden block`}
    >
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
            </div>
            <p className={`text-sm ${textColor}/80 mb-4 line-clamp-2`}>
              {description}
            </p>
            <div
              className={`flex items-center gap-2 ${textColor}/80 text-sm font-medium group-hover:gap-3 transition-all`}
            >
              <span>
                {gradient === "primary"
                  ? "Mulai Transaksi"
                  : gradient === "secondary"
                    ? "Lihat Riwayat"
                    : "Monitoring"}
              </span>
              <ChevronRight
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
   TRANSACTION ITEM COMPONENT
====================================================== */
const TransactionItem = ({ transaction }) => {
  const status = transaction.status_pembayaran || "PAID";
  const metode = transaction.metode_pembayaran || "TUNAI";
  const isPaid = status === "PAID";
  const isUnpaid = status === "UNPAID";
  const isPartial = status === "PARTIAL";

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
          <CheckCircle size={10} />
          LUNAS
        </span>
      );
    }
    if (isUnpaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle size={10} />
          BELUM LUNAS
        </span>
      );
    }
    if (isPartial) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle size={10} />
          DP
        </span>
      );
    }
    return null;
  };

  const getMetodeIcon = () => {
    switch (metode) {
      case "CASH":
        return <Wallet size={10} className="text-emerald-600" />;
      case "TRANSFER":
        return <Banknote size={10} className="text-blue-600" />;
      case "QRIS":
        return <CreditCard size={10} className="text-purple-600" />;
      case "CARD":
        return <CreditCard size={10} className="text-indigo-600" />;
      case "TEMPO":
        return <Clock size={10} className="text-amber-600" />;
      default:
        return null;
    }
  };

  const getMetodeBadge = () => {
    const metodeClasses = {
      CASH: "bg-emerald-100 text-emerald-800 border-emerald-200",
      TRANSFER: "bg-blue-100 text-blue-800 border-blue-200",
      QRIS: "bg-purple-100 text-purple-800 border-purple-200",
      CARD: "bg-indigo-100 text-indigo-800 border-indigo-200",
      TEMPO: "bg-amber-100 text-amber-800 border-amber-200",
    };

    const className =
      metodeClasses[metode] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${className}`}
      >
        {getMetodeIcon()}
        {metode}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-primary/30 hover:shadow-soft transition-all group bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-darkblue">
            {transaction.nomor_nota}
          </span>
          {getStatusBadge()}
          {getMetodeBadge()}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock size={12} className="text-primary" />
            {formatWaktu(transaction.tanggal_transaksi)}
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Package size={12} className="text-primary" />
            {transaction.items?.length || 0} item
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Package size={12} className="text-primary" />
            {format2(transaction.total_berat)} kg
          </div>
          {transaction.total_ujung > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <Package size={12} className="text-primary" />
              ujung {format2(transaction.total_ujung)} kg
            </div>
          )}
        </div>

        {transaction.customer && (
          <div className="mt-1 text-xs text-primary flex items-center gap-1">
            <User size={10} />
            {transaction.customer.nama}{" "}
            {transaction.customer.no_telp &&
              `• ${transaction.customer.no_telp}`}
          </div>
        )}
      </div>

      <div className="text-right ml-4">
        <div className="font-bold text-primary">
          {formatRupiah(transaction.total_harga)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatTanggal(transaction.tanggal_transaksi)}
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   MAIN DASHBOARD COMPONENT
====================================================== */
export default function DashboardKasir() {
  const { user } = useAuth();
  const { activeGudangId, gudangNama, ensureGudang } = useGudang();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [data, setData] = useState({
    totalPenjualan: 0,
    totalBerat: 0,
    totalUjung: 0,
    totalTransaksi: 0,
    rataKg: 0,
    unpaidNota: 0,
    transaksiHariIni: [],
  });

  const loadData = useCallback(async () => {
    if (!activeGudangId) return;

    try {
      setRefreshing(true);
      const result = await getDashboardData(activeGudangId);
      setData(result);
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
  }, [activeGudangId]);

  useEffect(() => {
    const isGudangValid = ensureGudang();
    if (isGudangValid && activeGudangId) {
      loadData();
    }
  }, [activeGudangId, ensureGudang, loadData]);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  if (!ensureGudang()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="bg-white p-8 rounded-xl shadow-hard max-w-md text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-darkblue mb-3">
            Gudang Tidak Terdeteksi
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan pilih gudang terlebih dahulu untuk mengakses dashboard kasir
          </p>
          <button
            onClick={() => (window.location.href = "/admin/gudang")}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-midblue transition-colors shadow-soft hover:shadow-medium"
          >
            Pilih Gudang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-card p-6 rounded-xl shadow-soft border border-white/10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                <LayoutDashboard className="w-6 h-6 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-white">Dashboard Kasir</h1>
              <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30 ml-2">
                Kasir
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Package size={14} className="text-secondary" />
                <span>Gudang: </span>
                <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-full">
                  {gudangNama}
                </span>
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-secondary" />
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-secondary" />
                Update: {formatTanggal(lastUpdate)}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <User size={14} className="text-secondary" />
                {user?.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg transition border border-white/20 text-white ${
                refreshing
                  ? "bg-white/5 cursor-not-allowed"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
            <p className="text-xs text-gray-300 mb-1">Total Penjualan</p>
            <p className="text-xl font-bold text-white">
              {loading ? "-" : formatRupiah(data.totalPenjualan)}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
            <p className="text-xs text-gray-300 mb-1">Total Berat</p>
            <p className="text-xl font-bold text-white">
              {loading ? "-" : `${format2(data.totalBerat)} kg`}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 backdrop-blur-xs">
            <p className="text-xs text-gray-300 mb-1">Jumlah Transaksi</p>
            <p className="text-xl font-bold text-white">
              {loading ? "-" : data.totalTransaksi}
            </p>
          </div>
          <div
            className={`rounded-lg p-3 backdrop-blur-xs ${
              !loading && data.unpaidNota > 0 ? "bg-rose-500/20" : "bg-white/5"
            }`}
          >
            <p className="text-xs text-gray-300 mb-1">Nota Belum Lunas</p>
            <p
              className={`text-xl font-bold ${
                !loading && data.unpaidNota > 0 ? "text-rose-300" : "text-white"
              }`}
            >
              {loading ? "-" : data.unpaidNota}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards with Skeleton Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Penjualan"
              value={formatRupiah(data.totalPenjualan)}
              icon={TrendingUp}
              color="primary"
              tooltip="Total penjualan hari ini"
            />
            <StatCard
              title="Total Berat"
              value={`${format2(data.totalBerat)} kg`}
              subValue={`${data.totalTransaksi} transaksi`}
              icon={Package}
              color="blue"
              tooltip="Total berat terjual hari ini"
            />
            <StatCard
              title="Rata-rata per kg"
              value={formatRupiah(data.rataKg)}
              icon={BarChart3}
              color="green"
              tooltip="Rata-rata harga per kilogram"
            />
            <StatCard
              title="Nota Belum Lunas"
              value={data.unpaidNota}
              icon={AlertCircle}
              color={data.unpaidNota > 0 ? "red" : "green"}
              subValue={data.unpaidNota > 0 ? "Perlu perhatian" : "Semua lunas"}
              tooltip="Jumlah nota dengan status UNPAID atau PARTIAL"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="Penjualan Baru"
          description="Transaksi ecer atau rol utuh"
          link="/Kasir/penjualan"
          icon={ShoppingCart}
          gradient="primary"
        />
        <QuickAction
          title="Riwayat Transaksi"
          description="Lihat dan cetak ulang nota"
          link="/Kasir/riwayat"
          icon={History}
          gradient="secondary"
        />
        <QuickAction
          title="Monitoring Nota"
          description="Cek status nota dan pembayaran"
          link="/Kasir/monitoring-nota"
          icon={FileText}
          gradient="card"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-midblue p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Clock size={18} className="text-white" />
              </div>
              Transaksi Terakhir
            </h3>
            <Link
              to="/Kasir/riwayat"
              className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              Lihat Semua
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </div>
          ) : data.transaksiHariIni.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Belum ada transaksi hari ini</p>
              <p className="text-sm text-gray-400 mt-1">
                Mulai transaksi baru dengan tombol di bawah
              </p>
              <Link
                to="/Kasir/penjualan"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition"
              >
                <ShoppingCart size={16} />
                Mulai Transaksi
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-auto">
              {data.transaksiHariIni.map((trx) => (
                <TransactionItem
                  key={trx.id || `temp-${Math.random()}`}
                  transaction={trx}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && data.transaksiHariIni.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 text-sm text-gray-600 flex justify-between items-center">
            <span>
              Menampilkan {data.transaksiHariIni.length} transaksi terakhir
            </span>
            <span className="text-primary font-medium">
              Total: {formatRupiah(data.totalPenjualan)}
            </span>
          </div>
        )}
      </div>

      {/* Info Card - Arsitektur Immutable */}
      <div className="bg-gradient-card rounded-xl shadow-soft p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Shield className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-semibold text-white">Informasi Kasir</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-secondary" />
                <span className="font-medium text-sm">User</span>
              </div>
              <p className="text-xs text-white/80">
                {user?.email} • Role: Kasir
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Package size={14} className="text-secondary" />
                <span className="font-medium text-sm">Gudang</span>
              </div>
              <p className="text-xs text-white/80">{gudangNama}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart size={14} className="text-secondary" />
                <span className="font-medium text-sm">Penjualan Ecer</span>
              </div>
              <p className="text-xs text-white/80">
                Input berat jual + ujung kain (waste)
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Package size={14} className="text-secondary" />
                <span className="font-medium text-sm">Penjualan Rol</span>
              </div>
              <p className="text-xs text-white/80">Jual roll utuh tanpa buka</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={14} className="text-secondary" />
                <span className="font-medium text-sm">Immutable</span>
              </div>
              <p className="text-xs text-white/80">
                Transaksi tidak bisa diubah setelah selesai. Koreksi via nota
                koreksi.
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Database size={14} className="text-secondary" />
                <span className="font-medium text-sm">Ledger-Based</span>
              </div>
              <p className="text-xs text-white/80">
                Setiap transaksi tercatat di stockLedger sebagai source of
                truth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
