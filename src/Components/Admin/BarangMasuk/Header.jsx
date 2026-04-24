// Components/BarangMasuk/Header.jsx
import {
  Factory,
  Package,
  Clock,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

export default function Header({
  gudangNama,
  refreshing,
  onRefresh,
  onReset,
  onImportClick,
  itemsLength,
}) {
  return (
    <div className="bg-gradient-card p-6 rounded-xl shadow-soft border border-white/10 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <Factory className="w-6 h-6 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-white">Barang Masuk</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Package size={14} className="text-secondary" />
              <span>Gudang: </span>
              <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-full">
                {gudangNama}
              </span>
            </span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-secondary" />
              {new Date().toLocaleDateString("id-ID")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white disabled:opacity-50"
            title="Refresh Produk"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={onImportClick}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition text-white flex items-center gap-2"
            title="Import dari Excel"
          >
            <Upload size={16} />
            <span className="hidden md:inline">Import Excel</span>
          </button>

          {itemsLength > 0 && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white flex items-center gap-2"
            >
              <Trash2 size={16} />
              Reset Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
