// Components/BarangMasuk/VerificationSection.jsx
import { CheckCircle } from "lucide-react";
import { format2 } from "../../../Utils/barangMasukUtils";

export default function VerificationSection({
  itemsLength,
  totalRolls,
  totalBerat,
  nomorSuratJalanSupplier,
  printedRolls,
  supplier,
  verifying,
  saving,
  onVerifikasi,
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Produk</div>
            <div className="text-xl font-bold text-amber-700">
              {itemsLength}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Roll</div>
            <div className="text-xl font-bold text-amber-700">{totalRolls}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Berat</div>
            <div className="text-xl font-bold text-amber-700">
              {format2(totalBerat)} kg
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">No SJ Supplier</div>
            <div className="text-xl font-bold text-amber-700 text-sm truncate max-w-[100px]">
              {nomorSuratJalanSupplier || "—"}
            </div>
          </div>
        </div>

        {!nomorSuratJalanSupplier && (
          <div className="text-center text-rose-600 text-sm p-2 bg-rose-50 rounded-lg border border-rose-200 mb-3">
            ⚠️ Nomor surat jalan supplier wajib diisi
          </div>
        )}

        {printedRolls !== totalRolls && (
          <div className="text-center text-amber-600 text-sm p-2 bg-amber-50 rounded-lg border border-amber-200 mb-3">
            ⚠️ Semua roll harus dicetak barcode terlebih dahulu ({printedRolls}/
            {totalRolls})
          </div>
        )}

        <button
          onClick={onVerifikasi}
          disabled={
            verifying ||
            saving ||
            totalRolls === 0 ||
            printedRolls !== totalRolls ||
            !nomorSuratJalanSupplier?.trim() ||
            !supplier?.trim()
          }
          className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white p-4 md:p-5 rounded-xl w-full text-lg md:text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3"
        >
          {verifying || saving ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <CheckCircle size={24} />
              <span>Verifikasi Fisik & Approve Barang Masuk</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
