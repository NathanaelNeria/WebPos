import { formatCurrency } from "../../../Utils/formatters";
import { useMemo } from "react";
const GrafikPenjualan = ({ data }) => {
  // Cari nilai maksimum untuk skala
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 100000000;
    return Math.max(...data.map((item) => item.total), 1);
  }, [data]);

  // Fungsi untuk membuat titik-titik grafik
  const getPoints = () => {
    if (!data || data.length === 0) return "";

    const width = 100;
    const height = 40;
    const points = data
      .map((item, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - (item.total / maxValue) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return points;
  };

  // Y-axis labels (5 tingkatan)
  const yLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * (4 - i);
      labels.push(formatCurrency(value));
    }
    return labels;
  }, [maxValue]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-darkblue mb-6">
          Grafik Penjualan 7 Hari Terakhir
        </h3>
        <div className="h-40 flex items-center justify-center text-gray-400">
          Tidak ada data penjualan
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="text-lg font-semibold text-darkblue mb-6">
        Grafik Penjualan 7 Hari Terakhir
      </h3>

      {/* Y-axis labels */}
      <div className="flex mb-4">
        <div className="w-16 flex-shrink-0"></div>
        <div className="flex-1 grid grid-cols-5 gap-2 text-xs text-gray-500">
          {yLabels.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative h-40 mb-6">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = i * 10;
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="0.2"
              />
            );
          })}

          {/* Line chart */}
          <polyline
            points={getPoints()}
            fill="none"
            stroke="#243A8C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 40 - (item.total / maxValue) * 40;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="#243A8C"
                stroke="white"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
      </div>

      {/* X-axis labels (dates) */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-gray-600 font-medium">
            {item.date}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrafikPenjualan;
