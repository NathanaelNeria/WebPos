// src/Components/Kasir/AvailableRolls/RollCard.jsx
import { Ruler, Tag, Layers } from "lucide-react";
import fabricIcon from "../../../Assets/fabric.png";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

export default function RollCard({ roll, onClick }) {
  const isOpened = roll.is_rol_dibuka;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border-2 p-2.5
        transition-all duration-200 cursor-pointer group
        hover:shadow-soft hover:scale-[1.01]
        animate-fade-in-up
        ${
          isOpened
            ? "border-amber-200 hover:border-secondary"
            : "border-gray-100 hover:border-primary"
        }
      `}
    >
      <div className="flex items-start gap-2">
        {/* Image Container - lebih kecil */}
        <div
          className={`
          w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 
          border transition-all duration-200
          group-hover:shadow-inner
          ${
            isOpened
              ? "bg-amber-50 border-amber-200 group-hover:border-secondary"
              : "bg-primary/5 border-primary/10 group-hover:border-primary"
          }
        `}
        >
          <img
            src={fabricIcon}
            alt={roll.produk_nama}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
          />
        </div>

        {/* Content - lebih compact */}
        <div className="flex-1 min-w-0">
          {/* Header dengan produk name */}
          <div className="flex items-start justify-between gap-1">
            <h4
              className={`
              font-medium text-xs truncate transition-colors duration-200
              ${isOpened ? "text-amber-800" : "text-darkblue"}
              group-hover:text-primary
            `}
            >
              {roll.produk_nama || "Unknown"}
            </h4>
            <Tag
              className={`
              w-3 h-3 flex-shrink-0 transition-all duration-200
              ${isOpened ? "text-amber-400" : "text-primary"}
              opacity-0 group-hover:opacity-100
            `}
            />
          </div>

          {/* Barcode - lebih kecil */}
          <p className="text-[10px] text-gray-500 font-mono mb-1 truncate">
            {roll.kode_barcode || roll.id}
          </p>

          {/* Info grid dengan ukuran lebih kecil */}
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-0.5">
              <Ruler
                className={`
                w-2.5 h-2.5 transition-colors
                ${isOpened ? "text-amber-500" : "text-primary"}
              `}
              />
              <span className="text-gray-600">
                {format2(roll.berat_sisa)} kg
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Layers
                className={`
                w-2.5 h-2.5 transition-colors
                ${isOpened ? "text-amber-500" : "text-primary"}
              `}
              />
              <span className="text-gray-600">{roll.kategori || "Umum"}</span>
            </div>
          </div>

          {/* Harga dan badge - lebih compact */}
          <div className="mt-1 flex items-center justify-between">
            <span
              className={`
              text-xs font-bold transition-colors
              ${isOpened ? "text-amber-600" : "text-primary"}
            `}
            >
              {formatRupiah(roll.harga_jual)}/kg
            </span>

            {/* Badge kecil */}
            <span
              className={`
              text-[8px] px-1.5 py-0.5 rounded-full 
              transition-all duration-200
              opacity-0 group-hover:opacity-100
              ${
                isOpened
                  ? "bg-gradient-secondary text-darkblue"
                  : "bg-gradient-primary text-white"
              }
            `}
            >
              {isOpened ? "Buka" : "Pilih"}
            </span>
          </div>

          {/* Status badge untuk roll yang sudah dibuka - lebih kecil */}
          {isOpened && (
            <div className="mt-0.5 flex justify-end">
              <span className="text-[8px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                dibuka
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
