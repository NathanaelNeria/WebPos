// Components/BarangMasuk/PrintAllBanner.jsx
import { Printer } from "lucide-react";

export default function PrintAllBanner({
  totalRolls,
  itemsLength,
  printingAll,
  onPrintAll,
}) {
  return (
    <div className="bg-gradient-card rounded-xl shadow-soft p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

      <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-white">
          <strong className="text-lg md:text-xl block">
            Print Semua Barcode Sekaligus
          </strong>
          <p className="text-white/80 text-sm md:text-base mt-1">
            Cetak semua roll dalam satu halaman yang optimal
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              📄 {Math.ceil(totalRolls / 24)} halaman
            </span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              🏷️ {totalRolls} label
            </span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              📦 {itemsLength} produk
            </span>
          </div>
        </div>
        <button
          onClick={onPrintAll}
          disabled={printingAll || totalRolls === 0}
          className="bg-white hover:bg-gray-50 text-primary font-bold py-3 px-6 rounded-xl flex gap-3 items-center transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[220px] justify-center"
        >
          {printingAll ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Printer size={20} />
              <div className="text-left">
                <div className="font-bold">Print Semua</div>
                <div className="text-xs font-normal text-gray-600">
                  {totalRolls} roll • {itemsLength} produk
                </div>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
