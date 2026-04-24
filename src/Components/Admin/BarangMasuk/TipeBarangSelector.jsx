// src/Components/Admin/BarangMasuk/TipeBarangSelector.jsx
import React from "react";
import { Package, ShoppingBag } from "lucide-react";

const TIPE_BARANG = {
  ROLL: "ROLL",
  ECER: "ECER",
};

export default function TipeBarangSelector({ tipeBarang, setTipeBarang }) {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <h3 className="font-semibold text-darkblue mb-4 flex items-center gap-2">
        <span className="p-2 bg-primary/10 rounded-lg">
          <Package className="text-primary" size={18} />
        </span>
        Pilih Tipe Barang
      </h3>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => setTipeBarang(TIPE_BARANG.ROLL)}
          className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
            tipeBarang === TIPE_BARANG.ROLL
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-primary/30 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div className={`p-2 rounded-lg ${
            tipeBarang === TIPE_BARANG.ROLL ? "bg-primary/10" : "bg-gray-100"
          }`}>
            <Package size={24} className={tipeBarang === TIPE_BARANG.ROLL ? "text-primary" : "text-gray-500"} />
          </div>
          <div className="text-left">
            <div className="font-semibold">Barang Roll</div>
            <div className="text-sm opacity-75">Input per roll dengan berat masing-masing</div>
          </div>
        </button>

        <button
          onClick={() => setTipeBarang(TIPE_BARANG.ECER)}
          className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
            tipeBarang === TIPE_BARANG.ECER
              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
              : "border-gray-200 hover:border-emerald-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div className={`p-2 rounded-lg ${
            tipeBarang === TIPE_BARANG.ECER ? "bg-emerald-100" : "bg-gray-100"
          }`}>
            <ShoppingBag size={24} className={tipeBarang === TIPE_BARANG.ECER ? "text-emerald-600" : "text-gray-500"} />
          </div>
          <div className="text-left">
            <div className="font-semibold">Barang Ecer</div>
            <div className="text-sm opacity-75">Input quantity dan berat per item</div>
          </div>
        </button>
      </div>

      {tipeBarang === TIPE_BARANG.ECER && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm text-emerald-800">
          <strong>ℹ️ Info Barang Ecer:</strong> Anda dapat menambahkan quantity dan berat per item.
          Total berat akan dihitung otomatis.
        </div>
      )}

      {tipeBarang === TIPE_BARANG.ROLL && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
          <strong>ℹ️ Info Barang Roll:</strong> Setiap roll akan mendapatkan barcode unik.
          Print label untuk setiap roll setelah mengisi berat.
        </div>
      )}
    </div>
  );
}