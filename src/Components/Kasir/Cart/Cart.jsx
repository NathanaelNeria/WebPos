// src/Components/Kasir/Cart.jsx
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  Scissors,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Barcode,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import WasteInput from "./WasteInput";
import { toUnit, fromUnit } from "../../../Utils/weight";

/* ======================================================
   CONSTANTS
====================================================== */
const TIPE_ITEM = {
  ECER: "ECER",
  ROL: "ROL",
};

const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("id-ID").format(value || 0);
};

const EcerBadge = ({ value }) => {
  if (!value || value <= 0) return null;

  return (
    <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded bg-amber-100 text-amber-700 border border-amber-200">
      +Ecer {value.toLocaleString("id-ID")}
    </span>
  );
};

/* ======================================================
   CART ITEM COMPONENT
====================================================== */
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

  const tambahanEcer =
    item.tipe === TIPE_ITEM.ECER ? item.tambahanHargaEcer || 0 : 0;

  const handleSaveHarga = () => {
    const newHarga = parseFloat(hargaInput.replace(/[^0-9]/g, "")) || 0;
    if (newHarga > 0 && newHarga !== item.harga_per_kg) {
      onUpdateHarga(item.id, newHarga);
    }
    setIsEditingHarga(false);
  };

  const HargaDiffBadge = () => {
    if (selisihHarga === 0) return null;
    const isMore = selisihHarga > 0;
    return (
      <div
        className={`flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full ${
          isMore ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {isMore ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        <span>
          {isMore ? "+" : ""}
          {formatNumber(selisihHarga)} ({persenSelisih}%)
        </span>
      </div>
    );
  };

  // Rol Utuh
  if (item.tipe === TIPE_ITEM.ROL) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-soft hover:border-primary/30 transition group">
        <div className="flex gap-2">
          <div className="p-1.5 bg-primary/10 rounded shrink-0">
            <Package size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-1">
              <div className="min-w-0">
                <h3 className="font-medium text-black text-s truncate">
                  {item.kategori}
                </h3>
                <h4 className="font-medium text-darkblue text-xs truncate">
                  {item.produkNama}
                </h4>
                <p className="text-[9px] text-gray-500 font-mono truncate flex items-center gap-0.5">
                  <Barcode size={7} className="text-gray-400" />
                  {item.barcode || item.rollId}
                </p>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-0.5 hover:bg-red-50 text-red-500 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] mt-1">
              <span>{format2(item.berat)} kg</span>
              <span className="text-gray-500">
                Ref: {formatRupiah(item.harga_referensi)}
              </span>
            </div>

            <div className="mt-1.5 bg-gray-50 p-1.5 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-medium text-gray-600">
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
                    onKeyPress={(e) => e.key === "Enter" && handleSaveHarga()}
                    className="flex-1 px-1.5 py-1 text-[10px] border border-primary/30 rounded"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveHarga}
                    className="px-1.5 py-1 bg-primary text-white text-[9px] rounded"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setIsEditingHarga(false)}
                    className="px-1.5 py-1 bg-gray-200 text-[9px] rounded"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">
                    {formatRupiah(item.harga_per_kg)}
                  </span>
                  <button
                    onClick={() => setIsEditingHarga(true)}
                    className="text-[9px] text-primary flex items-center gap-0.5"
                  >
                    <Edit size={9} /> Ubah
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-gray-100">
              <span className="text-[9px] text-gray-500">Rol Utuh</span>
              <span className="text-xs font-bold text-primary">
                {formatRupiah(item.subtotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ecer
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-soft hover:border-secondary/30 transition group">
      <div className="flex gap-2">
        <div className="p-1.5 bg-secondary/10 rounded shrink-0">
          <Scissors size={14} className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <div className="min-w-0">
              <h3 className="font-medium text-black text-s truncate">
                {item.kategori}
              </h3>
              <h4 className="font-medium text-darkblue text-xs truncate">
                {item.produkNama}
              </h4>
              <p className="text-[9px] text-gray-500 font-mono truncate">
                {item.barcode || item.rollId}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onEdit(item)}
                className="p-0.5 hover:bg-secondary/10 text-secondary rounded"
              >
                <Edit size={10} />
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="p-0.5 hover:bg-red-50 text-red-500 rounded"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-green-600">
              {format2(item.berat_jual)} kg
            </span>
            <span className="text-gray-500">
              Ref: {formatRupiah(item.harga_referensi)}
            </span>
          </div>

          {item.berat_ujung > 0 && (
            <div className="mt-1 p-1 bg-gray-100 rounded flex justify-between text-[9px]">
              <span className="text-gray-600">Ujung:</span>
              <span>{format2(item.berat_ujung)} kg</span>
            </div>
          )}

          <div className="mt-1.5 bg-gray-50 p-1.5 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-medium text-black-600">
                Harga Jual
              </span>
              <HargaDiffBadge />
            </div>
            {isEditingHarga ? (
              //input harga jual eceran berbeda
              <div className="flex gap-1">
                <input
                  type="text"
                  value={hargaInput}
                  onChange={(e) =>
                    setHargaInput(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleSaveHarga()}
                  className="flex-1 px-1.5 py-1 text-[10px] border border-secondary/30 rounded"
                  autoFocus
                />
                <button
                  onClick={handleSaveHarga}
                  className="px-1.5 py-1 bg-secondary text-darkblue text-[9px] rounded"
                >
                  ✓
                </button>
                <button
                  onClick={() => setIsEditingHarga(false)}
                  className="px-1.5 py-1 bg-gray-200 text-[9px] rounded"
                >
                  ✗
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black-700">
                  <div className="flex items-center gap-1">
                    <span>{formatRupiah(item.harga_per_kg)}/kg</span>
                    <EcerBadge value={tambahanEcer} />
                  </div>
                </span>
                <button
                  onClick={() => setIsEditingHarga(true)}
                  className="text-[9px] text-black-700 flex items-center gap-0.5"
                >
                  <Edit size={9} /> Ubah
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-gray-100">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[8px] text-gray-500 flex items-center gap-0.5"
            >
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {expanded ? "Sembunyi" : "Detail"}
            </button>
            <span className="text-xs font-bold text-black-700">
              {formatRupiah(item.subtotal)}
            </span>
          </div>

          {expanded && (
            <div className="mt-1.5 p-1.5 bg-gray-50 rounded text-[8px] grid grid-cols-2 gap-1">
              <div>
                <span className="text-gray-500">Asal:</span>{" "}
                {format2(item.berat_sisa_asal)} kg
              </div>
              <div>
                <span className="text-gray-500">Sisa:</span>{" "}
                {format2(
                  item.berat_sisa_asal -
                    item.berat_jual -
                    (item.berat_ujung || 0),
                )}{" "}
                kg
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   EMPTY CART
====================================================== */
const EmptyCart = () => (
  <div className="bg-white rounded-xl border-2 border-gray-100 p-4 text-center">
    <div className="inline-block p-2 bg-gray-100 rounded-full mb-2">
      <ShoppingCart size={24} className="text-gray-400" />
    </div>
    <h3 className="text-xs font-medium text-darkblue mb-1">Keranjang Kosong</h3>
    <p className="text-[10px] text-gray-500 mb-2">Klik roll untuk memulai</p>
    <div className="bg-primary/5 p-2 rounded-lg text-left text-[9px]">
      <p className="font-medium text-primary mb-1">Cara:</p>
      <ul className="text-gray-600 space-y-0.5">
        <li>1. Klik roll</li>
        <li>2. Pilih Rol/Ecer</li>
        <li>3. Input berat</li>
        <li>4. Proses bayar</li>
      </ul>
    </div>
  </div>
);

/* ======================================================
   CART SUMMARY
====================================================== */
const CartSummary = ({ summary, format2 }) => {
  if (summary.totalItem === 0) return null;
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white p-2 border-t text-[10px]">
      <div className="flex justify-between">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium text-darkblue">
          {formatRupiah(summary.totalHarga)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Berat Jual:</span>
        <span>{format2(summary.totalBerat)} kg</span>
      </div>
      {summary.totalUjung > 0 && (
        <div className="flex justify-between text-gray-500">
          <span>Ujung:</span>
          <span>{format2(summary.totalUjung)} kg</span>
        </div>
      )}
      {summary.totalBerat > 0 && (
        <div className="mt-1.5 pt-1 border-t border-gray-200 flex justify-between font-medium">
          <span className="text-gray-700">Rata²/kg:</span>
          <span className="text-primary">
            {formatRupiah(summary.totalHarga / summary.totalBerat)}
          </span>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   MAIN CART COMPONENT
====================================================== */
export default function Cart({
  cart,
  onRemove,
  onUpdateItem,
  onUpdateHarga,
  summary,
  format2,
}) {
  const [editingItem, setEditingItem] = useState(null);
  const [showWasteInput, setShowWasteInput] = useState(false);

  useEffect(() => {
    // console.log("Cart updated:", cart);
  }, [cart]);

  const handleEditItem = (item) => {
    if (item.tipe === TIPE_ITEM.ECER) {
      setEditingItem(item);
      setShowWasteInput(true);
    }
  };

  const handleUpdateEcer = ({ beratJual, beratUjung }) => {
    onUpdateItem(editingItem.id, {
      berat_jual: beratJual,
      berat_ujung: beratUjung || 0,
    });
    setShowWasteInput(false);
    setEditingItem(null);
  };

  if (cart.length === 0) return <EmptyCart />;

  return (
    <>
      <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white p-2 border-b flex justify-between items-center">
          <h2 className="text-xs font-semibold text-darkblue flex items-center gap-1">
            <ShoppingCart size={14} className="text-primary" />
            Keranjang ({cart.length})
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] bg-primary/5 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Package size={9} className="text-primary" /> {summary.totalRol}
            </span>
            <span className="text-[9px] bg-secondary/5 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Scissors size={9} className="text-secondary" />{" "}
              {summary.totalEcer}
            </span>
          </div>
        </div>

        <div className="p-2 space-y-2 max-h-[350px] overflow-y-auto">
          {cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              onEdit={handleEditItem}
              onUpdateHarga={onUpdateHarga}
              format2={format2}
            />
          ))}
        </div>

        <CartSummary summary={summary} format2={format2} />
      </div>

      {showWasteInput && editingItem && (
        <WasteInput
          isOpen={showWasteInput}
          onClose={() => {
            setShowWasteInput(false);
            setEditingItem(null);
          }}
          roll={{ ...editingItem, berat_sisa: editingItem.berat_sisa_asal }}
          onConfirm={handleUpdateEcer}
          format2={format2}
          isEditing
        />
      )}
    </>
  );
}
