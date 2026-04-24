// src/Components/Admin/BarangMasuk/EcerItem.jsx
import React, { useState, useEffect } from "react";
import { XCircle, ShoppingBag, AlertCircle, Printer } from "lucide-react";
import Swal from "sweetalert2";

export default function EcerItem({ 
  item, 
  onRemoveProduk, 
  onUpdateEcer,
  onPrintEcer // Tambahkan prop untuk print
}) {
  // State lokal dengan default values
  const [localItem, setLocalItem] = useState({
    productId: '',
    produkNama: 'Produk Tanpa Nama',
    produkKode: '',
    kategori: 'UMUM',
    qty: 1,
    beratPerItem: '',
    totalBerat: 0,
    catatan: ''
  });

  // Update local state ketika prop item berubah
  useEffect(() => {
    if (item && typeof item === 'object') {
      setLocalItem({
        productId: item.productId || '',
        produkNama: item.produkNama || 'Produk Tanpa Nama',
        produkKode: item.produkKode || '',
        kategori: item.kategori || 'UMUM',
        qty: item.qty || 1,
        beratPerItem: item.beratPerItem || '',
        totalBerat: item.totalBerat || 0,
        catatan: item.catatan || ''
      });
    }
  }, [item]);

  // Jika item tidak ada, tampilkan nothing
  if (!item || typeof item !== 'object') {
    return null;
  }

  const handleRemove = () => {
    Swal.fire({
      title: "Hapus Produk Ecer?",
      text: `${localItem.produkNama} akan dihapus dari daftar`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed && localItem.productId) {
        onRemoveProduk(localItem.productId);
      }
    });
  };

  const handleQtyChange = (e) => {
    const value = e.target.value;
    setLocalItem(prev => ({ ...prev, qty: value }));
    if (localItem.productId) {
      onUpdateEcer(localItem.productId, "qty", value);
    }
  };

  const handleBeratChange = (e) => {
    const value = e.target.value;
    setLocalItem(prev => ({ ...prev, beratPerItem: value }));
    if (localItem.productId) {
      onUpdateEcer(localItem.productId, "beratPerItem", value);
    }
  };

  const handleCatatanChange = (e) => {
    const value = e.target.value;
    setLocalItem(prev => ({ ...prev, catatan: value }));
    if (localItem.productId) {
      onUpdateEcer(localItem.productId, "catatan", value);
    }
  };

  const handlePrint = () => {
    if (!localItem.beratPerItem || parseFloat(localItem.beratPerItem) <= 0) {
      Swal.fire({
        title: "Info",
        text: "Isi berat per item terlebih dahulu",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (onPrintEcer) {
      onPrintEcer(localItem);
    }
  };

  // Hitung total berat dengan aman
  const qty = parseInt(localItem.qty) || 0;
  const beratPerItem = parseFloat(localItem.beratPerItem) || 0;
  const totalBerat = qty * beratPerItem;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-emerald-200 overflow-hidden hover:shadow-medium transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-white p-4 border-b border-emerald-100">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-darkblue flex items-center gap-2">
                {localItem.produkNama}
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  ECER
                </span>
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                <span>Kategori: {localItem.kategori}</span>
                {localItem.produkKode && <span>Kode: {localItem.produkKode}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tombol Print */}
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
              title="Cetak Label Ecer"
            >
              <Printer size={18} />
            </button>
            {/* Tombol Hapus */}
            <button
              onClick={handleRemove}
              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
              title="Hapus Produk"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={localItem.qty}
              onChange={handleQtyChange}
              className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              placeholder="Jumlah item"
            />
          </div>

          {/* Berat per Item */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Berat per Item (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={localItem.beratPerItem}
              onChange={handleBeratChange}
              className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Total Berat (Read Only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Total Berat (kg)
            </label>
            <div className="w-full border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-700 font-mono">
              {totalBerat > 0 ? totalBerat.toFixed(2) : "0.00"}
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Catatan (opsional)
          </label>
          <input
            type="text"
            value={localItem.catatan || ""}
            onChange={handleCatatanChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            placeholder="Contoh: Eceran, Pack, dll"
          />
        </div>

        {/* Info / Warning */}
        {(!localItem.qty || localItem.qty <= 0) && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle size={14} />
            <span>Quantity harus diisi minimal 1</span>
          </div>
        )}

        {localItem.qty > 0 && (!localItem.beratPerItem || parseFloat(localItem.beratPerItem) <= 0) && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle size={14} />
            <span>Berat per item harus diisi</span>
          </div>
        )}

        {localItem.qty > 0 && beratPerItem > 0 && (
          <div className="mt-3 p-2 bg-emerald-50 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
            <ShoppingBag size={14} />
            <span>
              Total: <strong>{qty} item</strong> × <strong>{beratPerItem.toFixed(2)} kg</strong> ={" "}
              <strong className="text-sm">{totalBerat.toFixed(2)} kg</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}