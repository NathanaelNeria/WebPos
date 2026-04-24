// src/Components/Owner/BarangMasukKeluar/RollDetailModal.jsx
import { X, Package, Tag, Scale, Hash } from "lucide-react";

const format2 = (n) => parseFloat(n || 0).toFixed(2);

export const RollDetailModal = ({ isOpen, onClose, roll }) => {
  if (!isOpen || !roll) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-primary px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white">Detail Roll</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Roll ID */}
          <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={16} className="text-primary" />
              <span className="text-xs text-gray-500">Roll ID</span>
            </div>
            <p className="font-mono font-bold text-darkblue break-all">
              {roll.rollId || roll.id || "-"}
            </p>
          </div>

          {/* Produk */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={16} className="text-primary" />
              <span className="text-sm font-medium text-darkblue">
                Informasi Produk
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Nama Produk:</span>
                <span className="font-medium text-darkblue">
                  {roll.produkNama || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Kategori:</span>
                <span className="font-medium text-darkblue">
                  {roll.kategori || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Berat */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Scale size={16} className="text-primary" />
              <span className="text-sm font-medium text-darkblue">
                Informasi Berat
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Berat:</span>
                <span className="font-bold text-primary text-lg">
                  {roll.berat ? format2(roll.berat) : "0"} kg
                </span>
              </div>
              {roll.berat_awal && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Berat Awal:</span>
                  <span className="font-medium text-darkblue">
                    {format2(roll.berat_awal)} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informasi Tambahan */}
          {(roll.supplier || roll.catatan) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                {roll.supplier && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Supplier:</span>
                    <span className="font-medium text-darkblue">
                      {roll.supplier}
                    </span>
                  </div>
                )}
                {roll.catatan && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Catatan:</span>
                    <span className="font-medium text-darkblue">
                      {roll.catatan}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View-only Badge */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800 text-center">
              ⚠️ Data roll ini hanya untuk viewing. Tidak dapat diubah.
            </p>
          </div>
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
