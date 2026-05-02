// src/Components/Kasir/Cart/CartItem.jsx
import { useState } from "react";
import {
  Package,
  Scissors,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Barcode,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trash,
} from "lucide-react";

const TIPE_ITEM = {
  ECER: "ECER",
  ROL: "ROL",
};

const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("id-ID").format(value || 0);
};

const CartItem = ({ item, onRemove, onUpdateHarga, onEdit, format2 }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditingHarga, setIsEditingHarga] = useState(false);
  const [hargaInput, setHargaInput] = useState(
    item.harga_per_kg?.toString() || "0",
  );

  const hargaReferensi = item.harga_referensi || 0;
  const hargaJual = item.harga_per_kg || 0;
  const selisihHarga = hargaJual - hargaReferensi;
  const persenSelisih =
    hargaReferensi > 0 ? ((selisihHarga / hargaReferensi) * 100).toFixed(1) : 0;

  console.log(item);

  const handleSaveHarga = () => {
    const newHarga = parseFloat(hargaInput.replace(/[^0-9]/g, "")) || 0;
    if (newHarga > 0 && newHarga !== item.harga_per_kg) {
      onUpdateHarga(item.id, newHarga);
    }
    setIsEditingHarga(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSaveHarga();
  };

  // Badge selisih harga - lebih kecil
  const HargaDiffBadge = () => {
    if (selisihHarga === 0) return null;

    const isMoreExpensive = selisihHarga > 0;
    return (
      <div
        className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
          isMoreExpensive
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {isMoreExpensive ? (
          <TrendingUp size={10} />
        ) : (
          <TrendingDown size={10} />
        )}
        <span>
          {isMoreExpensive ? "+" : ""}
          {formatNumber(selisihHarga)} ({persenSelisih}%)
        </span>
      </div>
    );
  };

  // Rol Utuh Item - Compact Version
  if (item.tipe === TIPE_ITEM.ROL) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-soft transition-all duration-200 hover:border-primary/30 group">
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Package size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex justify-between items-start gap-1">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-darkblue text-sm truncate group-hover:text-primary transition-colors">
                  {item.produkNama}
                </h4>
                <p className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-0.5">
                  <Barcode size={8} className="text-gray-400" />
                  {item.barcode || item.rollId}
                </p>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 hover:bg-red-50 text-red-500 rounded transition shrink-0"
                title="Hapus"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Info Baris 1 */}
            <div className="flex items-center justify-between gap-2 mt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Berat:</span>
                <span className="font-medium text-darkblue">
                  {format2(item.berat)} kg
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">Ref:</span>
                <span className="text-gray-600 text-[10px]">
                  {formatRupiah(item.harga_referensi)}/kg
                </span>
              </div>
            </div>

            {/* Harga Jual */}
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-gray-600 flex items-center gap-0.5">
                  <DollarSign size={10} className="text-primary" />
                  Harga Jual
                </span>
                <HargaDiffBadge />
              </div>

              {isEditingHarga ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={hargaInput}
                    onChange={(e) =>
                      setHargaInput(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-2 py-1 border border-primary/30 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Harga"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveHarga}
                    className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-midblue transition"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setIsEditingHarga(false)}
                    className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    {formatRupiah(item.harga_per_kg)}/kg
                  </span>
                  <button
                    onClick={() => {
                      setHargaInput(item.harga_per_kg?.toString() || "0");
                      setIsEditingHarga(true);
                    }}
                    className="text-[10px] text-primary hover:text-midblue flex items-center gap-0.5"
                  >
                    <Edit size={10} />
                    Ubah
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-100">
              <span className="text-[10px] text-gray-500">Rol Utuh</span>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 mr-1">
                  Subtotal:
                </span>
                <span className="font-bold text-primary text-sm">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ecer Item - Compact Version
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-soft transition-all duration-200 hover:border-secondary/30 group">
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-secondary/10 rounded-lg">
          <Scissors size={16} className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start gap-1">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-darkblue text-sm truncate group-hover:text-secondary transition-colors">
                {item.produkNama}
              </h4>
              <p className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-0.5">
                <Barcode size={8} className="text-gray-400" />
                {item.barcode || item.rollId}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => onEdit(item)}
                className="p-1 hover:bg-secondary/10 text-secondary rounded transition"
                title="Edit Berat"
              >
                <Edit size={12} />
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 hover:bg-red-50 text-red-500 rounded transition"
                title="Hapus"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Info Baris 1 */}
          <div className="flex items-center justify-between gap-2 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Jual:</span>
              <span className="font-medium text-green-600">
                {format2(item.berat_jual)} kg
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">Ref:</span>
              <span className="text-gray-600 text-[10px]">
                {formatRupiah(item.harga_referensi)}/kg
              </span>
            </div>
          </div>

          {/* Ujung Kain - lebih compact */}
          {item.berat_ujung > 0 && (
            <div className="mt-1 p-1.5 bg-gray-50 rounded-lg flex justify-between items-center text-[10px]">
              <span className="text-gray-600 flex items-center gap-0.5">
                <Trash size={10} className="text-gray-500" />
                <span>Ujung (Waste):</span>
              </span>
              <span className="font-medium text-gray-700">
                {format2(item.berat_ujung)} kg
              </span>
            </div>
          )}

          {/* Harga Jual */}
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-600 flex items-center gap-0.5">
                <DollarSign size={10} className="text-secondary" />
                Harga Jual
              </span>
              <HargaDiffBadge />
            </div>

            {isEditingHarga ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={hargaInput}
                  onChange={(e) =>
                    setHargaInput(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-2 py-1 border border-secondary/30 rounded text-xs focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
                  placeholder="Harga"
                  autoFocus
                />
                <button
                  onClick={handleSaveHarga}
                  className="px-2 py-1 bg-secondary text-darkblue text-xs rounded hover:bg-amber-500 transition"
                >
                  ✓
                </button>
                <button
                  onClick={() => setIsEditingHarga(false)}
                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition"
                >
                  ✗
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-secondary">
                  {formatRupiah(item.harga_per_kg)}/kg
                </span>
                <button
                  onClick={() => {
                    setHargaInput(item.harga_per_kg?.toString() || "0");
                    setIsEditingHarga(true);
                  }}
                  className="text-[10px] text-secondary hover:text-amber-700 flex items-center gap-0.5"
                >
                  <Edit size={10} />
                  Ubah
                </button>
              </div>
            )}
          </div>

          {/* Calculation Info - lebih compact */}
          <div className="mt-2 text-[10px] text-gray-500 bg-blue-50/50 p-1.5 rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">
                {format2(item.berat_jual)} kg ×{" "}
                {formatRupiah(item.harga_per_kg)}
              </span>
            </div>
            <div className="flex justify-between font-medium text-secondary mt-0.5">
              <span>=</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>

          {/* Footer dengan toggle detail */}
          <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-100">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-gray-500 flex items-center gap-0.5 hover:text-secondary transition"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Sembunyikan" : "Detail roll"}
            </button>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 mr-1">Total:</span>
              <span className="font-bold text-secondary text-sm">
                {formatRupiah(item.subtotal)}
              </span>
            </div>
          </div>

          {/* Expanded Details - lebih compact */}
          {expanded && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg text-[10px] animate-fade-in">
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-gray-500">Asal:</span>
                  <span className="ml-1 font-medium">
                    {format2(item.berat_sisa_asal)} kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sisa:</span>
                  <span className="ml-1 font-medium">
                    {format2(
                      item.berat_sisa_asal -
                        item.berat_jual -
                        (item.berat_ujung || 0),
                    )}{" "}
                    kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Kategori:</span>
                  <span className="ml-1">{item.kategori || "-"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
