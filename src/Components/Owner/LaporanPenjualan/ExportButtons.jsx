// src/Components/Owner/LaporanPenjualan/ExportButtons.jsx
import { FileSpreadsheet, File } from "lucide-react";

export const ExportButtons = ({ onExport }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onExport("excel")}
        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white flex items-center gap-2"
        title="Export Excel"
      >
        <FileSpreadsheet size={16} />
        <span className="hidden md:inline">Excel</span>
      </button>
      <button
        onClick={() => onExport("pdf")}
        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white flex items-center gap-2"
        title="Export PDF"
      >
        <File size={16} />
        <span className="hidden md:inline">PDF</span>
      </button>
    </div>
  );
};
