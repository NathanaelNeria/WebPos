// src/Components/Owner/RiwayatMutasi/RouteAnalytics.jsx
import { useState } from "react";
import {
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatJam = (jam) => {
  if (!jam) return "-";
  return `${jam.toFixed(1)} jam`;
};

export const RouteAnalytics = ({ routeStats = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const displayStats = expanded ? routeStats : routeStats.slice(0, 5);

  if (routeStats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-darkblue mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Analytics Rute
        </h3>
        <p className="text-center text-gray-500 py-4">Belum ada data rute</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-darkblue flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Analytics Rute
        </h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {routeStats.length} Rute
        </span>
      </div>

      <div className="space-y-3">
        {displayStats.map((route, index) => (
          <div
            key={index}
            className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-darkblue">
                  {route.asal}
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-darkblue">
                  {route.tujuan}
                </span>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {route.count}x
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Total Berat</p>
                <p className="font-medium text-darkblue">
                  {format2(route.totalBerat)} kg
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Rata-rata Waktu</p>
                <p className="font-medium text-darkblue flex items-center gap-1">
                  <Clock size={12} className="text-gray-400" />
                  {formatJam(route.avgWaktu)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Selisih Rata-rata</p>
                <p
                  className={`font-medium ${route.avgSelisih > 0 ? "text-amber-600" : "text-green-600"}`}
                >
                  {route.avgSelisih > 0 ? "+" : ""}
                  {format2(route.avgSelisih)} kg
                </p>
              </div>
            </div>

            {/* Progress bar frekuensi */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 h-1.5 rounded-full">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{
                    width: `${(route.count / routeStats[0]?.count) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {routeStats.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-primary hover:text-midblue flex items-center gap-1 mx-auto"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              Tampilkan Lebih Sedikit
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Tampilkan {routeStats.length - 5} Rute Lagi
            </>
          )}
        </button>
      )}
    </div>
  );
};
