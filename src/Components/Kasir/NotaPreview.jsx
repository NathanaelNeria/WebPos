// src/Components/Kasir/NotaPreview.jsx
import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { useReactToPrint } from "react-to-print";

/* ======================================================
   CONSTANTS & HELPERS
====================================================== */
const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value || 0)
    .replace("Rp", "Rp")
    .replace(/\s/g, "");
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\./g, ":");
};

const formatAngka = (n) => {
  const num = parseFloat(n || 0);
  return num.toFixed(2);
};

/* ======================================================
   NOTA CONTENT COMPONENT - OPTIMIZED FOR POS80
====================================================== */
const NotaContent = ({ transaction }) => {
  if (!transaction) return null;

  const {
    nomorNota,
    tanggal,
    kasir,
    gudang,
    items,
    totalBerat,
    totalHarga,
    metodePembayaran,
  } = transaction;

  return (
    <div
      className="p-2 bg-white text-black"
      style={{
        fontFamily: "'Courier New', 'Courier', monospace",
        fontSize: "10px",
        lineHeight: "1.3",
        width: "69mm", // Sedikit lebih kecil dari 72mm untuk safety
        margin: "0 auto",
        fontWeight: "700",
        letterSpacing: "0.2px",
      }}
    >
      {/* HEADER - COMPACT */}
      <div className="text-center mb-1">
        <div className="text-sm tracking-widest">TOKO FAJAR TERANG</div>
        <div className="text-[9px]">Jl. KH. Fachrudin No.36, Blok AA No.17</div>
        <div className="text-[9px]">Komplek Ruko Auri Tanah Abang</div>
        <div className="text-[9px]">Jakarta Pusat 10250</div>
        <div className="text-[9px]">HP: 0811 239 191</div>
      </div>

      {/* TITLE */}
      <div className="text-center my-1">
        <div className="text-[11px]">BUKTI PENJUALAN</div>
        <div className="border-t border-dashed border-black my-1"></div>
      </div>

      {/* INFO - COMPACT 2 COLUMN */}
      <div className="text-[9px] mb-2">
        <div className="flex justify-between">
          <span>No. Nota:</span>
          <span className="ml-2">{nomorNota}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal:</span>
          <span>{formatDate(tanggal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{kasir?.split("@")[0]}</span>
        </div>
        <div className="flex justify-between">
          <span>Gudang:</span>
          <span>{gudang}</span>
        </div>
      </div>

      {/* ITEMS HEADER - WITH BACKGROUND FOR CLARITY */}
      <div
        className="border-t-2 border-b-2 border-black py-0.5 text-[9px] bg-black text-white print:bg-black print:text-white"
        style={{
          backgroundColor: "black",
          color: "white",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        <div className="flex">
          <div className="w-[32%] pl-1">Item</div>
          <div className="w-[15%] text-right">Qty</div>
          <div className="w-[26%] text-right">Harga</div>
          <div className="w-[27%] text-right pr-1">Subtotal</div>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="text-[9px]">
        {items?.map((item, index) => (
          <div key={index} className="py-1 border-b border-black border-dotted">
            {/* Item Row */}
            <div className="flex">
              <div className="w-[32%] break-words font-bold">
                {item.produkNama}
              </div>
              <div className="w-[15%] text-right">
                {formatAngka(item.berat || item.berat_jual)}
              </div>
              <div className="w-[26%] text-right">
                {formatRupiah(item.harga_per_kg)}
              </div>
              <div className="w-[27%] text-right font-bold">
                {formatRupiah(item.subtotal)}
              </div>
            </div>

            {/* Roll ID - Minimalis */}
            <div className="text-[7px] mt-0.5 text-gray-800">
              {item.barcode || item.rollId}
            </div>
          </div>
        ))}
      </div>

      {/* TOTALS - COMPACT */}
      <div className="mt-2 pt-1 border-t-2 border-black text-[9px]">
        <div className="flex justify-between">
          <span>Total Berat:</span>
          <span>{formatAngka(totalBerat)} kg</span>
        </div>

        <div className="flex justify-between text-[11px] mt-1 pt-1 border-t border-black">
          <span className="font-bold">TOTAL:</span>
          <span className="font-bold">{formatRupiah(totalHarga)}</span>
        </div>
      </div>

      {/* PAYMENT */}
      <div className="mt-2 text-[9px]">
        <div className="flex justify-between">
          <span>Metode:</span>
          <span>{metodePembayaran}</span>
        </div>
      </div>

      {/* FOOTER - MINIMALIS */}
      <div className="text-center mt-3">
        <div className="border-t border-dashed border-black my-1"></div>
        <div className="text-[10px]">Terima Kasih</div>
        <div className="text-[7px]">
          Barang yang sudah dibeli tidak dapat ditukar/kembali
        </div>
        <div className="text-[7px] mt-1">
          * Terima kasih atas kunjungan Anda *
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function NotaPreview({ isOpen, onClose, transaction }) {
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `nota-${transaction?.nomorNota || "transaksi"}`,
    pageStyle: `
      @page {
        size: 76mm auto; /* Sedikit lebih besar dari konten */
        margin: 1mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white;
          width: 76mm;
        }
        body {
          font-family: 'Courier New', 'Courier', monospace !important;
          font-weight: 700 !important;
          font-size: 9px;
        }
        .no-print {
          display: none !important;
        }
        .print-content {
          width: 69mm;
          margin: 0 auto;
        }
        /* Ensure header background prints */
        .bg-black {
          background-color: black !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center no-print">
          <h2 className="font-bold">Preview Nota (POS80 Optimized)</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 no-print">
          <div className="max-w-md mx-auto bg-white shadow rounded">
            <div className="p-2 bg-yellow-50 border-b border-yellow-200">
              <p className="text-xs text-yellow-800 text-center">
                ⚡ Optimized untuk POS80 Printer - Ukuran 69mm
              </p>
            </div>
            <div ref={componentRef} className="print-content">
              <NotaContent transaction={transaction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
