// src/Components/Owner/LaporanPenjualan/ProfitCards.jsx
import { TrendingUp, Percent, DollarSign } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const formatPersen = (n) => `${parseFloat(n || 0).toFixed(2)}%`;

const ProfitCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
  trend = null,
  trendValue = null,
}) => {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-600",
    red: "bg-red-500/10 text-red-600",
    yellow: "bg-yellow-500/10 text-yellow-600",
  };

  const trendColors = {
    up: "text-green-600 bg-green-100",
    down: "text-red-600 bg-red-100",
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 hover:shadow-medium transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}
          >
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-darkblue">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
};

const ProfitCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
    <div className="h-6 bg-gray-300 rounded w-32"></div>
  </div>
);

export const ProfitCards = ({ loading, cogs, grossProfit, grossMargin }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProfitCardSkeleton />
        <ProfitCardSkeleton />
        <ProfitCardSkeleton />
      </div>
    );
  }

  // Tentukan status profit
  const isProfitPositive = grossProfit > 0;
  const isProfitZero = grossProfit === 0;
  const isMarginHealthy = grossMargin > 30;
  const isMarginLow = grossMargin > 0 && grossMargin <= 30;
  const isMarginZero = grossMargin === 0;

  // Tentukan teks status
  const getProfitStatus = () => {
    if (isProfitPositive) return "Untung";
    if (isProfitZero) return "Impasse";
    return "Rugi";
  };

  const getMarginStatus = () => {
    if (isMarginHealthy) return "Sehat";
    if (isMarginLow) return "Kurang";
    if (isMarginZero) return "Nol";
    return "Perlu Evaluasi";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* COGS */}
      <ProfitCard
        title="COGS (HPP)"
        value={formatRupiah(cogs)}
        subValue="Modal barang terjual"
        icon={DollarSign}
        color="yellow"
      />

      {/* Gross Profit */}
      <ProfitCard
        title="Gross Profit"
        value={formatRupiah(grossProfit)}
        subValue={getProfitStatus()}
        icon={TrendingUp}
        color={isProfitPositive ? "green" : isProfitZero ? "yellow" : "red"}
        trend={isProfitPositive ? "up" : "down"}
        trendValue={isProfitPositive ? "+" : ""}
      />

      {/* Gross Margin */}
      <ProfitCard
        title="Gross Margin"
        value={formatPersen(grossMargin)}
        subValue={getMarginStatus()}
        icon={Percent}
        color={isMarginHealthy ? "green" : isMarginLow ? "yellow" : "red"}
      />
    </div>
  );
};
