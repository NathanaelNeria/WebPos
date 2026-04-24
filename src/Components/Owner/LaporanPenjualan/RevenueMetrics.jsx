// src/Components/Owner/LaporanPenjualan/RevenueMetrics.jsx
import { DollarSign, Package, ShoppingCart } from "lucide-react";

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
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-green-500/10 text-green-600",
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

const MetricCardSkeleton = () => (
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

export const RevenueMetrics = ({
  loading,
  revenue,
  totalBerat,
  totalTransaksi,
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

  // Hitung rata-rata dengan aman
  const rataRataPerKg = totalBerat > 0 ? revenue / totalBerat : 0;
  const rataRataPerTransaksi =
    totalTransaksi > 0 ? revenue / totalTransaksi : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Revenue */}
      <MetricCard
        title="Total Revenue"
        value={formatRupiah(revenue)}
        subValue={`${format2(totalBerat)} kg terjual`}
        icon={DollarSign}
        color="primary"
      />

      {/* Total Berat */}
      <MetricCard
        title="Total Berat"
        value={`${format2(totalBerat)} kg`}
        subValue={`Rata-rata ${formatRupiah(rataRataPerKg)}/kg`}
        icon={Package}
        color="blue"
      />

      {/* Total Transaksi */}
      <MetricCard
        title="Total Transaksi"
        value={totalTransaksi}
        subValue={`Rata-rata ${formatRupiah(rataRataPerTransaksi)}/transaksi`}
        icon={ShoppingCart}
        color="green"
      />
    </div>
  );
};
