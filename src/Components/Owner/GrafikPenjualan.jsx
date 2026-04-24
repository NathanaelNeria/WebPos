import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Filter } from "lucide-react";

const data = [
  { tanggal: "15/08/2023", total: 20000000 },
  { tanggal: "16/08/2023", total: 30000000 },
  { tanggal: "17/08/2023", total: 55000000 },
  { tanggal: "18/08/2023", total: 70000000 },
  { tanggal: "19/08/2023", total: 90000000 },
  { tanggal: "20/08/2023", total: 80000000 },
  { tanggal: "21/08/2023", total: 25000000 },
];

const formatRupiah = (value) =>
  `Rp. ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const GrafikPenjualan = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-2xl px-5 py-3 text-white"
        style={{
          background: "linear-gradient(90deg, #000B42 0%, #142370 90%)",
        }}
      >
        <h2 className="text-base font-semibold">
          Grafik Penjualan 7 Hari Terakhir
        </h2>
        <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition text-white px-4 py-1.5 rounded-full text-sm">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Grafik */}
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#DCE3F0"
            />
            <XAxis
              dataKey="tanggal"
              tick={{ fontSize: 12, fill: "#4B5563" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRupiah}
              tick={{ fontSize: 12, fill: "#4B5563" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              formatter={(value) => [formatRupiah(value), "Total Penjualan"]}
              contentStyle={{
                borderRadius: "8px",
                borderColor: "#E5E7EB",
              }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="url(#colorBar)" />
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrafikPenjualan;
