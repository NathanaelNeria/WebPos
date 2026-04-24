// Components/BarangMasuk/FooterInfo.jsx
import { AlertCircle } from "lucide-react";
import { format2 } from "../../../Utils/barangMasukUtils";

export default function FooterInfo({
  printedRolls,
  totalRolls,
  itemsLength,
  totalBerat,
}) {
  return (
    <div className="bg-gradient-card rounded-xl shadow-soft p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="font-semibold text-white">
            Informasi Alur Barang Masuk
          </h3>
        </div>
        <p className="text-sm text-white/80 mb-3">
          Pastikan semua roll telah dicetak barcode sebelum verifikasi fisik.
          Setelah di-approve, data tidak dapat diubah (immutable).
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
            {printedRolls}/{totalRolls} roll tercetak
          </span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
            {itemsLength} jenis produk
          </span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
            {format2(totalBerat)} kg total berat
          </span>
        </div>
      </div>
    </div>
  );
}
