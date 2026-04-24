// src/Components/Owner/AktivitasUser/ActivityStats.jsx
import { Activity, Users, Clock, TrendingUp } from "lucide-react";

const formatNumber = (n) => {
  return new Intl.NumberFormat("id-ID").format(n || 0);
};

// Mapping untuk menampilkan nama tipe
const TYPE_LABELS = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PENJUALAN: "Penjualan",
  VOID_NOTA: "Void Nota",
  OVERRIDE_HARGA: "Override Harga",
  MUTASI_KELUAR: "Mutasi Keluar",
  MUTASI_MASUK: "Mutasi Masuk",
  BARANG_MASUK: "Barang Masuk",
  CREATE_USER: "Tambah User",
  UPDATE_USER: "Update User",
  DELETE_USER: "Hapus User",
  DEFAULT: "Aktivitas Lain",
};

// Mapping warna untuk setiap tipe - TANPA APPROVE
const TYPE_COLORS = {
  LOGIN: "bg-blue-500",
  LOGOUT: "bg-blue-500",
  PENJUALAN: "bg-green-500",
  VOID_NOTA: "bg-red-500",
  OVERRIDE_HARGA: "bg-yellow-500",
  MUTASI_KELUAR: "bg-orange-500",
  MUTASI_MASUK: "bg-emerald-500",
  BARANG_MASUK: "bg-purple-500",
  CREATE_USER: "bg-indigo-500",
  UPDATE_USER: "bg-indigo-500",
  DELETE_USER: "bg-red-500",
  DEFAULT: "bg-gray-500",
};
const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
}) => {
  const colors = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-green-500/10 text-green-600",
    purple: "bg-purple-500/10 text-purple-600",
    orange: "bg-orange-500/10 text-orange-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    red: "bg-red-500/10 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 hover:shadow-medium transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-darkblue">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-300 rounded w-32"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

export const ActivityStats = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  // Hitung breakdown per tipe dengan label yang ramah
  const typeBreakdown = Object.entries(stats.byType || {})
    .map(([type, count]) => ({
      type,
      label: TYPE_LABELS[type] || type,
      count,
      percentage: stats.total > 0 ? (count / stats.total) * 100 : 0,
      color: TYPE_COLORS[type] || TYPE_COLORS.DEFAULT,
    }))
    .sort((a, b) => b.count - a.count); // Urutkan dari yang terbanyak

  // Cari tipe terbanyak
  const topType = typeBreakdown[0] || { label: "-", percentage: 0 };

  // Hitung aktivitas per jam (simulasi)
  const now = new Date();
  const hour = now.getHours();
  const aktivitasPerJam = stats.timeline ? Math.round(stats.total / 24) : 0;

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Aktivitas"
          value={formatNumber(stats.total)}
          subValue={`Dalam ${stats.timeRange === "today" ? "hari ini" : "periode ini"}`}
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="User Aktif"
          value={formatNumber(stats.uniqueUsers || 0)}
          subValue="User dengan aktivitas"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Rata-rata per Hari"
          value={formatNumber(Math.round((stats.total || 0) / 7))}
          subValue="7 hari terakhir"
          icon={Clock}
          color="green"
        />
        <StatCard
          title="Tipe Terbanyak"
          value={topType.label}
          subValue={`${topType.count || 0} aktivitas (${topType.percentage.toFixed(1)}%)`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Type Breakdown */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-darkblue mb-3 flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          Breakdown per Tipe Aktivitas
        </h3>
        <div className="space-y-3">
          {typeBreakdown.slice(0, 8).map((item) => (
            <div key={item.type}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-darkblue">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`${item.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}

          {typeBreakdown.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              Belum ada data aktivitas
            </p>
          )}
        </div>
      </div>

      {/* Aktivitas Terbaru (Preview) */}
      {stats.recent && stats.recent.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-transparent p-3 rounded-lg border border-primary/10">
          <h4 className="text-xs font-medium text-darkblue mb-2 flex items-center gap-1">
            <Clock size={12} className="text-primary" />
            Aktivitas Terbaru
          </h4>
          <div className="space-y-1.5">
            {stats.recent.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="text-xs text-gray-600 flex items-center gap-1"
              >
                <span className="text-gray-400">•</span>
                <span className="truncate">
                  {item.action_details || "Aktivitas"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
