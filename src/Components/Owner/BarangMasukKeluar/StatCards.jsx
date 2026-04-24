// src/Components/Owner/BarangMasukKeluar/StatCards.jsx
import { Package, ArrowDown, Scale } from "lucide-react";

const formatNumber = (n) => {
  return new Intl.NumberFormat("id-ID").format(n || 0);
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
}) => {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-600",
    blue: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
    orange: "bg-orange-500/10 text-orange-600",
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

export const StatCards = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  // Pastikan stats memiliki nilai default
  const total = stats.total || 0;
  const barangMasuk = stats.barangMasuk || 0;
  const totalBerat = stats.totalBerat || 0;
  const totalRoll = stats.totalRoll || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Surat Jalan */}
      <StatCard
        title="Total Surat Jalan"
        value={formatNumber(total)}
        icon={Package}
        color="primary"
      />

      {/* Barang Masuk */}
      <StatCard
        title="Barang Masuk"
        value={formatNumber(barangMasuk)}
        subValue={`${((barangMasuk / (total || 1)) * 100).toFixed(1)}%`}
        icon={ArrowDown}
        color="green"
      />

      {/* Mutasi */}
      {/* <StatCard
        title="Mutasi"
        value={formatNumber(mutasi)}
        subValue={`${((mutasi / (total || 1)) * 100).toFixed(1)}%`}
        icon={Truck}
        color="purple"
      /> */}

      {/* Total Berat */}
      <StatCard
        title="Total Berat"
        value={`${format2(totalBerat)} kg`}
        subValue={`${totalRoll} roll`}
        icon={Scale}
        color="blue"
      />
    </div>
  );
};
