// src/Components/Owner/RingkasanUmum/SalesChart.jsx
import { TrendingUp } from "lucide-react"; // Hapus Calendar yang tidak dipakai

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const formatTanggal = (date) => {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/* ======================================================
   SALES CHART COMPONENT
====================================================== */
export const SalesChart = ({ data = [], loading = false }) => {
  // Generate dummy data jika tidak ada data real
  const chartData = data.length > 0 ? data : generateDummyData();

  // Cari nilai maksimum untuk skala chart
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Tinggi maksimum chart dalam pixel
  const chartHeight = 180;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-darkblue from-primary to-midblue p-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-secondary" />
          <h3 className="font-semibold text-white">
            Grafik Penjualan 7 Hari Terakhir
          </h3>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-4">
        {/* Y-Axis Labels */}
        <div className="flex mb-2">
          <div className="w-16 flex flex-col justify-between text-[10px] text-gray-400">
            <div>Rp 100,000,000</div>
            <div>Rp 80,000,000</div>
            <div>Rp 60,000,000</div>
            <div>Rp 40,000,000</div>
            <div>Rp 20,000,000</div>
            <div>Rp 0</div>
          </div>

          {/* Bars Container */}
          <div className="flex-1 flex items-end justify-around h-[200px]">
            {chartData.map((item, idx) => {
              const height = (item.value / maxValue) * chartHeight;

              return (
                <div key={idx} className="flex flex-col items-center w-12">
                  {/* Bar */}
                  <div
                    className="w-8 bg-gradient-to-t from-primary to-midblue rounded-t-md transition-all duration-300 hover:from-secondary hover:to-amber-500 cursor-pointer group relative"
                    style={{ height: `${height}px` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatRupiah(item.value)}
                    </div>
                  </div>

                  {/* Date Label */}
                  <span className="text-[10px] text-gray-500 mt-2">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Line */}
        <div className="border-t border-gray-200 mt-2"></div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-4 animate-pulse">
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
};

// Fungsi untuk generate dummy data
const generateDummyData = () => {
  const today = new Date();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      label: formatTanggal(date),
      value: Math.floor(Math.random() * 90000000) + 10000000, // Random 10jt - 100jt
      date: date,
    });
  }

  return data;
};
