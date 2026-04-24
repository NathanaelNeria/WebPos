// src/Components/Owner/LaporanPenjualan/TurnoverMetrics.jsx
import { RotateCw, Calendar, TrendingUp } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

const MetricCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
}) => {
  const colors = {
    primary: "bg-primary/10 text-primary",
    purple: "bg-purple-500/10 text-purple-600",
    green: "bg-green-500/10 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 hover:shadow-medium transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-darkblue">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );
};

const MetricCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
  </div>
);

export const TurnoverMetrics = ({
  loading,
  turnoverRatio,
  turnoverDays,
  stockValue,
  cogs,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }

  const isTurnoverGood = turnoverRatio > 4; // >4 kali setahun dianggap baik
  const isDaysGood = turnoverDays < 90; // <90 hari per siklus dianggap baik

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Turnover Ratio */}
      <MetricCard
        title="Turnover Ratio"
        value={`${format2(turnoverRatio)}x`}
        subValue={`${isTurnoverGood ? "✅ Baik" : "⚠️ Rendah"} (target >4x)`}
        icon={RotateCw}
        color={isTurnoverGood ? "green" : "primary"}
      />

      {/* Turnover Days */}
      <MetricCard
        title="Turnover Days"
        value={`${Math.round(turnoverDays)} hari`}
        subValue={`${isDaysGood ? "✅ Cepat" : "⚠️ Lambat"} (target <90 hari)`}
        icon={Calendar}
        color={isDaysGood ? "green" : "purple"}
      />

      {/* Rata-rata Nilai Stok */}
      <MetricCard
        title="Rata-rata Stok"
        value={formatRupiah(stockValue)}
        subValue={`Modal ${formatRupiah(cogs)} terjual`}
        icon={TrendingUp}
        color="primary"
      />
    </div>
  );
};
