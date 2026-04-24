// src/Components/Owner/RingkasanUmum/StatCards.jsx
import { TrendingUp, Package, Layers, ArrowUpRight } from "lucide-react";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
};

const formatNumber = (n) => {
  return new Intl.NumberFormat("id-ID").format(n || 0);
};

/* ======================================================
   MAIN STAT CARD - DARK BLUE THEME
====================================================== */
export const MainStatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend = null,
  trendValue = null,
  iconColor = "text-white",
}) => {
  return (
    <div className="bg-gradient-card rounded-xl shadow-soft border border-white/10 p-5 hover:shadow-medium transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative">
        {/* Header dengan icon putih dan trend */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-xs group-hover:bg-white/20 transition-colors">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-medium border border-green-500/30">
              <ArrowUpRight size={14} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Content - Value dengan warna secondary (kuning emas) */}
        <div>
          <p className="text-sm text-gray-300 mb-1">{title}</p>
          <p className="text-xl font-bold text-secondary">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Layers size={12} className="text-gray-400" />
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   STAT CARDS GROUP
====================================================== */
export const StatCardsGroup = ({
  loading = false,
  stockSummary = {
    totalRol: 0,
    totalBerat: 0,
    penjualanHariIni: 0,
    mutasiHariIni: {
      item: 0,
      rol: 0,
      berat: 0,
    },
  },
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gradient-card rounded-xl border border-white/10 p-5 animate-pulse"
          >
            <div className="w-10 h-10 bg-white/10 rounded-lg mb-3"></div>
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-6 bg-white/20 rounded w-32 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  const hasPenjualan = stockSummary.penjualanHariIni > 0;

  // Data mutasi
  const mutasi = stockSummary.mutasiHariIni || { item: 0, rol: 0, berat: 0 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Card 1: Total Stok */}
      <MainStatCard
        title="Total Stok"
        value={`${formatNumber(stockSummary.totalRol)} rol`}
        subValue={`${format2(stockSummary.totalBerat)} kg`}
        icon={Package}
      />

      {/* Card 2: Penjualan Hari Ini */}
      <MainStatCard
        title="Penjualan Hari Ini"
        value={formatRupiah(stockSummary.penjualanHariIni)}
        icon={TrendingUp}
        trend={hasPenjualan ? "up" : null}
        trendValue={hasPenjualan ? "+12.5%" : null}
      />

      {/* Card 3: Mutasi Hari Ini */}
      <MainStatCard
        title="Mutasi Hari Ini"
        value={`${formatNumber(mutasi.item)} mutasi`}
        subValue={`${mutasi.rol} rol | ${format2(mutasi.berat)} kg`}
        icon={Layers}
        iconColor="text-amber-300"
      />
    </div>
  );
};

/* ======================================================
   SKELETON LOADING
====================================================== */
export const MainStatCardSkeleton = () => (
  <div className="bg-gradient-card rounded-xl border border-white/10 p-5 animate-pulse">
    <div className="w-10 h-10 bg-white/10 rounded-lg mb-3"></div>
    <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
    <div className="h-6 bg-white/20 rounded w-32 mb-2"></div>
    <div className="h-3 bg-white/10 rounded w-20"></div>
  </div>
);
