// src/Components/Owner/RiwayatMutasi/AnomalyList.jsx
import { AlertTriangle, Clock, Scale, ArrowRight } from "lucide-react";

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

export const AnomalyList = ({ anomalies = [] }) => {
  if (anomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-darkblue mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-primary" />
          Deteksi Anomali
        </h3>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Scale size={20} className="text-green-600" />
          </div>
          <p className="text-sm text-gray-600">Tidak ada anomali terdeteksi</p>
          <p className="text-xs text-gray-500 mt-1">
            Semua mutasi dalam batas normal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-darkblue flex items-center gap-2">
          <AlertTriangle size={18} className="text-primary" />
          Deteksi Anomali
        </h3>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
          {anomalies.length} Anomali
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {anomalies.map((item, index) => (
          <div
            key={index}
            className="border-l-4 border-red-400 bg-red-50 p-3 rounded-r-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs font-mono text-red-700 mb-1">
                  <span>{item.nomor_surat}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <span>{item.asal}</span>
                  <ArrowRight size={10} />
                  <span>{item.tujuan}</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span>{formatTanggal(item.created_at)}</span>
                </div>

                {/* Jenis Anomali */}
                {item.jenis === "selisih_berat" && (
                  <div className="flex items-center gap-2">
                    <Scale size={12} className="text-red-500" />
                    <span className="text-xs text-red-700">
                      Selisih berat: {item.selisih > 0 ? "+" : ""}
                      {format2(item.selisih)} kg ({format2(item.persenSelisih)}
                      %)
                    </span>
                  </div>
                )}

                {item.jenis === "waktu_tempuh" && (
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-amber-500" />
                    <span className="text-xs text-amber-700">
                      Waktu tempuh: {item.waktuTempuh} jam (di atas rata-rata)
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                {item.persenSelisih > 10 ? "KRITIS" : "WARNING"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          * Anomali terdeteksi jika selisih berat {">"} 5% atau waktu tempuh di
          atas rata-rata
        </p>
      </div>
    </div>
  );
};
