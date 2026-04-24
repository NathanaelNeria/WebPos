// src/Components/Owner/LaporanPenjualan/WasteAnalysis.jsx
import { Trash2, TrendingDown, AlertTriangle } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatPersen = (n) => `${parseFloat(n || 0).toFixed(2)}%`;

export const WasteAnalysis = ({
  totalWaste = 0,
  wastePercentage = 0,
  wasteValue = 0,
  perGudang = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isWasteHigh = wastePercentage > 5;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="bg-darkblue from-orange-500 to-orange-700 p-4">
        <div className="flex items-center gap-2">
          <Trash2 size={18} className="text-secondary" />
          <h3 className="font-semibold text-secondary">
            Analisis Waste Ujung Kain
          </h3>
        </div>
      </div>

      <div className="p-4">
        {/* Warning jika waste tinggi */}
        {isWasteHigh && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Waste Tinggi!</p>
              <p className="text-xs text-red-600">
                Waste melebihi 5% dari total penjualan. Perlu evaluasi.
              </p>
            </div>
          </div>
        )}

        {/* Stat Utama */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-xs text-orange-600 mb-1">Total Waste</p>
            <p className="text-xl font-bold text-orange-700">
              {format2(totalWaste)} kg
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-xs text-orange-600 mb-1">Nilai Waste</p>
            <p className="text-xl font-bold text-orange-700">
              {formatRupiah(wasteValue)}
            </p>
          </div>
        </div>

        {/* Persentase terhadap Penjualan */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">% dari Total Penjualan</span>
            <span
              className={`font-medium ${isWasteHigh ? "text-red-600" : "text-green-600"}`}
            >
              {formatPersen(wastePercentage)}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className={`h-2 rounded-full ${isWasteHigh ? "bg-red-500" : "bg-orange-500"}`}
              style={{ width: `${Math.min(wastePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Waste per Gudang */}
        {perGudang.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-darkblue mb-3">
              Waste per Gudang
            </h4>
            <div className="space-y-3">
              {perGudang.map((gudang) => (
                <div key={gudang.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{gudang.nama}</span>
                    <span className="font-medium text-darkblue">
                      {format2(gudang.waste)} kg (
                      {formatPersen(gudang.percentage)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full">
                    <div
                      className="bg-orange-400 h-1.5 rounded-full"
                      style={{ width: `${gudang.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimasi Kerugian */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-sm text-gray-600">Estimasi Kerugian</span>
            </div>
            <span className="text-sm font-bold text-red-600">
              {formatRupiah(wasteValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
