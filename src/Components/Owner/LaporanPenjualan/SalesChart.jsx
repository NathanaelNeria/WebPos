// src/Components/Owner/LaporanPenjualan/SalesChart.jsx
import { TrendingUp } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const formatTanggal = (date) => {
  if (!date) return "-";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "-";
  }
};

// Fungsi untuk memproses data menjadi 7 hari terakhir
const processLast7Days = (data = []) => {
  const today = new Date();
  const last7Days = [];

  // Buat array 7 hari terakhir
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Cari data yang cocok dengan tanggal ini
    const existingData = data.find((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === date.getTime();
    });

    last7Days.push({
      date,
      value: existingData?.value || 0,
      hasData: !!existingData,
    });
  }

  return last7Days;
};

// HAPUS fungsi generateDummyData karena tidak digunakan

export const SalesChart = ({ data = [], loading = false }) => {
  // Proses data untuk 7 hari terakhir
  const chartData = processLast7Days(data);
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const chartHeight = 200;

  // Hitung total dan rata-rata
  const totalPenjualan = chartData.reduce((sum, d) => sum + d.value, 0);
  const rataRata = totalPenjualan / 7;
  const hariDenganData = chartData.filter((d) => d.hasData).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-midblue p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-secondary" />
            <h3 className="font-semibold text-white">
              Grafik Penjualan 7 Hari Terakhir
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <span>Total: {formatRupiah(totalPenjualan)}</span>
            <span>•</span>
            <span>Rata²: {formatRupiah(rataRata)}/hari</span>
            <span>•</span>
            <span>{hariDenganData} hari ada transaksi</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="flex items-end h-[200px] gap-1">
          {chartData.map((item, idx) => {
            const height = (item.value / maxValue) * chartHeight;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                {/* Bar dengan warna berbeda jika tidak ada data */}
                <div
                  className={`w-full rounded-t-md transition-all cursor-pointer group relative ${
                    item.hasData
                      ? "bg-gradient-to-t from-primary to-midblue hover:from-secondary hover:to-amber-500"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  style={{ height: `${height || 4}px` }} // Minimal height 4px untuk visibility
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.hasData
                      ? formatRupiah(item.value)
                      : "Tidak ada transaksi"}
                  </div>
                </div>

                {/* Tanggal */}
                <span className="text-xs text-gray-500 mt-2">
                  {formatTanggal(item.date)}
                </span>

                {/* Indikator ada data/tidak */}
                {!item.hasData && (
                  <span className="text-[8px] text-gray-400 mt-0.5">(0)</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-t from-primary to-midblue rounded"></div>
            <span>Ada Transaksi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Tidak Ada Transaksi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
