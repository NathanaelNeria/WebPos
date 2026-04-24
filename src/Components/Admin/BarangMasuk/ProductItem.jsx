// Components/BarangMasuk/ProductItem.jsx
import {
  Trash2,
  Barcode,
  Printer as PrinterIcon,
  Plus,
  RefreshCw,
} from "lucide-react";

export default function ProductItem({
  item,
  onRemoveProduk,
  onUpdateRoll,
  onPrintRoll,
  onRemoveRoll,
  onAddRoll,
  printingRollId, // Prop baru untuk loading state
}) {
  /**
   * Helper function untuk menentukan apakah roll tertentu sedang diproses print
   */
  const isPrinting = (productId, rollIndex) => {
    return printingRollId === `${productId}-${rollIndex}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 hover:shadow-medium transition-all duration-300">
      {/* Header Produk */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-lg md:text-xl text-darkblue">
              {item.produkNama}
            </strong>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {item.produkKode}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              {item.kategori}
            </span>
            <span
              className={`text-sm px-2 py-1 rounded-full ${
                item.rolls.filter((r) => r.isPrinted).length ===
                item.rolls.length
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {item.rolls.filter((r) => r.isPrinted).length}/{item.rolls.length}{" "}
              tercetak
            </span>
            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {item.rolls.length} roll
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemoveProduk(item.productId)}
          className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-2 rounded-lg transition mt-2 md:mt-0"
          title="Hapus produk dari list"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Daftar Roll */}
      {item.rolls.map((roll, idx) => {
        const printing = isPrinting(item.productId, idx);

        return (
          <div
            key={idx}
            className={`flex flex-col md:flex-row gap-3 mb-3 items-center bg-gray-50 p-3 md:p-4 rounded-lg transition-all duration-200 ${
              printing
                ? "ring-2 ring-primary ring-opacity-50 bg-primary/5"
                : "hover:bg-gray-100/50"
            }`}
          >
            {/* Nomor Urut */}
            <span className="text-sm text-gray-500 w-6 text-center font-medium">
              {idx + 1}.
            </span>

            {/* Input Berat */}
            <div className="flex-1 md:w-48 w-full">
              <label className="text-xs text-gray-500 mb-1 block font-medium">
                Berat (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`w-full border ${
                  parseFloat(roll.berat) > 0
                    ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                    : "border-gray-200 focus:ring-primary focus:border-primary"
                } p-2 md:p-3 rounded-lg focus:ring-2 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="0.00"
                value={roll.berat}
                onChange={(e) =>
                  onUpdateRoll(item.productId, idx, "berat", e.target.value)
                }
                disabled={printing} // Disable input saat printing
              />
            </div>

            {/* Dropdown Tipe Item */}
            <div className="flex-1 md:w-40 w-full">
              <label className="text-xs text-gray-500 mb-1 block font-medium">
                Tipe Item
              </label>

              <select
                className="w-full border border-gray-200 p-2 md:p-3 rounded-lg 
               focus:ring-primary focus:border-primary transition"
                value={roll.type || "ROLL"} // DEFAULT VALUE ROLL
                onChange={(e) =>
                  onUpdateRoll(item.productId, idx, "type", e.target.value)
                }
                disabled={printing}
              >
                <option value="ROLL">ROLL</option>
                <option value="ECER">ECER</option>
              </select>
            </div>

            {/* Roll ID Display */}
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 mb-1 block font-medium">
                Roll ID
              </label>
              <div
                className={`font-mono text-sm px-3 py-2 bg-white border rounded-lg overflow-x-auto transition-colors ${
                  roll.rollId
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-200"
                }`}
              >
                {roll.rollId ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode size={16} className="text-primary" />
                      <span className="text-gray-800 font-medium">
                        {roll.rollId}
                      </span>
                    </div>
                    {roll.isPrinted && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        ✓ Printed
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 italic flex items-center gap-2">
                    <Barcode size={16} className="text-gray-400" />— Belum
                    generate ID —
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              {/* Print Button dengan Loading State */}
              <button
                onClick={() => onPrintRoll(item, idx)}
                disabled={
                  !roll.berat || parseFloat(roll.berat) <= 0 || printing // Disable jika sedang printing
                }
                className={`
                  p-2 md:p-3 rounded-lg flex items-center gap-2 transition-all duration-200
                  w-full md:w-auto justify-center flex-1
                  ${
                    printing
                      ? "bg-primary text-white cursor-wait animate-pulse"
                      : roll.isPrinted
                        ? "bg-green-100 text-green-800 border border-green-200 cursor-default hover:bg-green-200"
                        : "bg-primary hover:bg-midblue text-white hover:shadow-md"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={
                  printing
                    ? "Sedang mencetak..."
                    : roll.isPrinted
                      ? "Sudah dicetak, klik untuk cetak ulang"
                      : "Cetak barcode"
                }
              >
                {printing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm hidden md:inline">
                      Mencetak...
                    </span>
                    <span className="text-xs md:hidden">...</span>
                  </>
                ) : (
                  <>
                    <PrinterIcon size={16} />
                    <span className="text-sm hidden md:inline">
                      {roll.isPrinted ? "Print Ulang" : "Print"}
                    </span>
                  </>
                )}
              </button>

              {/* Delete Roll Button */}
              <button
                onClick={() => onRemoveRoll(item.productId, idx)}
                disabled={printing} // Disable jika sedang printing
                className={`
                  p-2 md:p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg 
                  flex items-center justify-center transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-50
                  ${printing ? "cursor-not-allowed" : "hover:scale-105"}
                `}
                title="Hapus roll"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add New Roll Button */}
      <button
        onClick={() => onAddRoll(item.productId)}
        disabled={printingRollId?.startsWith(item.productId)} // Disable jika ada roll dari produk ini yang sedang printing
        className={`
          text-primary hover:text-midblue flex gap-2 items-center mt-4 p-3 
          hover:bg-primary/5 rounded-lg transition-all duration-200 
          w-full justify-center border border-dashed border-primary/30
          hover:border-primary hover:bg-primary/10
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
        `}
      >
        <Plus
          size={18}
          className={
            printingRollId?.startsWith(item.productId) ? "animate-pulse" : ""
          }
        />
        <span className="font-medium">
          {printingRollId?.startsWith(item.productId)
            ? "Tunggu proses print selesai..."
            : `Tambah Roll Baru untuk ${item.produkNama}`}
        </span>
      </button>
    </div>
  );
}
