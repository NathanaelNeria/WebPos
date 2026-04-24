// src/Components/Owner/RiwayatMutasi/MutasiDetailModal.jsx
import {
  X,
  Calendar,
  MapPin,
  Package,
  User,
  Clock,
  CheckCircle,
  Truck,
  Layers,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

export const MutasiDetailModal = ({ isOpen, onClose, mutasi }) => {
  if (!isOpen || !mutasi) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-primary px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Truck className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white">Detail Mutasi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-4">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Nomor Surat Jalan</p>
              <p className="font-mono font-bold text-darkblue text-lg">
                {mutasi.nomor_surat || mutasi.id}
              </p>
            </div>
            <StatusBadge status={mutasi.status} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-3 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Tanggal</span>
              </div>
              <p className="font-medium text-darkblue">
                {formatTanggal(mutasi.created_at)}
              </p>
            </div>

            {/* Asal */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Gudang Asal</span>
              </div>
              <p className="font-medium text-darkblue">
                {mutasi.asal || mutasi.gudang_asal_nama || "-"}
              </p>
            </div>

            {/* Tujuan */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Gudang Tujuan</span>
              </div>
              <p className="font-medium text-darkblue">
                {mutasi.tujuan || mutasi.gudang_tujuan_nama || "-"}
              </p>
            </div>

            {/* Total Roll */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Total Roll</span>
              </div>
              <p className="font-bold text-darkblue text-lg">
                {mutasi.total_roll || 0}
              </p>
            </div>

            {/* Total Berat */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Layers size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Total Berat</span>
              </div>
              <p className="font-bold text-darkblue text-lg">
                {mutasi.total_berat ? format2(mutasi.total_berat) : "0"} kg
              </p>
            </div>
          </div>

          {/* Info User */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Pengirim</span>
              </div>
              <p className="font-medium text-darkblue">
                {mutasi.pengirim_nama ||
                  mutasi.pengirim ||
                  mutasi.created_by_name ||
                  "-"}
              </p>
              {mutasi.created_at && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatTanggal(mutasi.created_at)}
                </p>
              )}
            </div>

            {mutasi.received_by && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-primary" />
                  <span className="text-xs text-gray-500">Penerima</span>
                </div>
                <p className="font-medium text-darkblue">
                  {mutasi.penerima_nama ||
                    mutasi.penerima ||
                    mutasi.received_by_name ||
                    "-"}
                </p>
                {mutasi.received_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTanggal(mutasi.received_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-xs font-medium text-darkblue mb-2 flex items-center gap-1">
              <Clock size={12} className="text-primary" />
              Timeline
            </h4>
            <div className="space-y-2">
              {mutasi.approved_at && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle size={12} className="text-blue-600" />
                  <span className="text-gray-600">Disetujui:</span>
                  <span className="text-darkblue">
                    {formatTanggal(mutasi.approved_at)}
                  </span>
                </div>
              )}
              {mutasi.received_at && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span className="text-gray-600">Diterima:</span>
                  <span className="text-darkblue">
                    {formatTanggal(mutasi.received_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Catatan */}
          {mutasi.catatan && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 font-medium mb-1">
                Catatan:
              </p>
              <p className="text-sm text-amber-700">{mutasi.catatan}</p>
            </div>
          )}

          {/* Daftar Roll */}
          {mutasi.items && mutasi.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-darkblue mb-3 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Daftar Roll ({mutasi.items.length})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Roll ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Produk
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                        Berat
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Kategori
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mutasi.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">
                          {item.rollId || item.id || "-"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-darkblue">
                            {item.produkNama || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {item.berat ? format2(item.berat) : "0"} kg
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {item.kategori || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
