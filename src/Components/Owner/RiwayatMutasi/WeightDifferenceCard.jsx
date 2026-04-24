// src/Components/Owner/RiwayatMutasi/WeightDifferenceCard.jsx
import { Scale, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatPersen = (n) => `${parseFloat(n || 0).toFixed(2)}%`;

export const WeightDifferenceCard = ({ analytics }) => {
  const { weightDifferences } = analytics;

  const totalMutasi = analytics.routeStats.reduce((sum, r) => sum + r.count, 0);
  const mutasiDenganSelisih = analytics.anomalies?.length || 0;
  const persenAnomali =
    totalMutasi > 0 ? (mutasiDenganSelisih / totalMutasi) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-darkblue mb-4 flex items-center gap-2">
        <Scale size={18} className="text-primary" />
        Analisis Selisih Berat
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Susut */}
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-amber-600 font-medium">
              Total Susut
            </span>
            <TrendingDown size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {format2(weightDifferences.totalSusut)} kg
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Rata-rata {format2(weightDifferences.avgSusut)} kg/mutasi
          </p>
        </div>

        {/* Total Lebih */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-600 font-medium">
              Total Lebih
            </span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {format2(weightDifferences.totalLebih)} kg
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Rata-rata {format2(weightDifferences.avgLebih)} kg/mutasi
          </p>
        </div>

        {/* Mutasi dengan Anomali */}
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-red-600 font-medium">
              Anomali Selisih
            </span>
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">
            {mutasiDenganSelisih}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {formatPersen(persenAnomali)} dari total mutasi
          </p>
        </div>

        {/* Rata-rata Selisih */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-medium">
              Rata-rata Selisih
            </span>
            <Scale size={16} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-700">
            {format2(
              Math.abs(
                weightDifferences.totalSusut - weightDifferences.totalLebih,
              ),
            )}{" "}
            kg
          </p>
          <p className="text-xs text-gray-600 mt-1">Per mutasi</p>
        </div>
      </div>
    </div>
  );
};
