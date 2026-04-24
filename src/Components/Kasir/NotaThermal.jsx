// src/Components/Kasir/NotaThermal.jsx
import { useEffect, useRef, useMemo } from "react";
import { Printer, X } from "lucide-react";

/* ======================================================
   TOKO INFO
====================================================== */
const TOKO = {
  nama: "Toko Fajar Terang",
  alamat: [
    "Jl. KH. Fachrudin No.36, Blok AA No.17",
    "Komplek Ruko Auri Tanah Abang",
    "Jakarta Pusat 10250",
  ],
  telepon: "0811 239 191",
};

/* ======================================================
   HELPERS
====================================================== */
const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
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
    .replace(/\//g, "/");
};

const format2 = (n) => {
  return parseFloat(n || 0).toFixed(2);
};

/* ======================================================
   HELPER: GET LAST ID SEQUENCE
====================================================== */
const getLastIdSequence = (id) => {
  if (!id) return "-";
  const match = id.match(/(\d{3,4})$/);
  if (match) {
    return match[1];
  }
  return id.slice(-4);
};

/* ======================================================
   HELPER: GROUP ITEMS BY PRODUCT NAME
====================================================== */
const groupItemsByProduct = (items) => {
  const groups = {};

  items.forEach((item) => {
    const key = item.produkNama || item.nama || "Unknown";

    if (!groups[key]) {
      groups[key] = {
        produkNama: key,
        tipe: item.tipe,
        items: [],
        totalQty: 0,
        totalBerat: 0,
        totalHarga: 0,
        ids: [],
        beratList: [],
      };
    }

    groups[key].items.push(item);

    const berat = item.tipe === "ROL" ? item.berat || 0 : item.berat_jual || 0;
    groups[key].totalBerat += berat;
    groups[key].totalHarga += item.subtotal || 0;
    groups[key].totalQty += 1;

    const idToShow = getLastIdSequence(
      item.barcode || item.rollId || item.produkId,
    );
    groups[key].ids.push(idToShow);
    groups[key].beratList.push(format2(berat));
  });

  return Object.values(groups);
};

export default function NotaThermal({ isOpen, onClose, onPrint, transaction }) {
  const notaRef = useRef(null);

  useEffect(() => {
    if (isOpen && notaRef.current) {
      notaRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const groupedItems = useMemo(() => {
    if (!transaction?.items) return [];
    return groupItemsByProduct(transaction.items);
  }, [transaction?.items]);

  if (!isOpen || !transaction) return null;

  const {
    nomorNota,
    tanggal,
    kasir,
    customer,
    totalBerat = 0,
    totalHarga = 0,
    metodePembayaran,
    statusPembayaran,
    catatan,
    jumlah_dibayar = 0,
    kembalian = 0,
  } = transaction;

  const metodeLabel = {
    CASH: "TUNAI",
    TRANSFER: "TRANSFER",
    QRIS: "QRIS",
    CARD: "KARTU",
    TEMPO: "TEMPO",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-midblue p-3 rounded-t-xl flex justify-between items-center sticky top-0 no-print">
          <div className="flex items-center gap-2 text-white">
            <Printer size={18} />
            <h2 className="font-semibold text-sm">
              Preview Nota Thermal (72mm)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nota Content - 72mm width */}
        <div ref={notaRef} className="flex-1 overflow-y-auto p-3 bg-gray-50">
          <div
            className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 mx-auto"
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "10px",
              width: "72mm",
              maxWidth: "72mm",
            }}
          >
            {/* Header Toko */}
            <div className="text-center border-b border-dashed border-gray-400 pb-1 mb-2">
              <h3 className="font-bold text-xs">{TOKO.nama}</h3>
              <p className="font-bold text-[8px] leading-tight">
                {TOKO.alamat[0]}
              </p>
              <p className="font-bold text-[8px] leading-tight">
                {TOKO.alamat[1]}
              </p>
              <p className="font-bold text-[8px] leading-tight">
                {TOKO.alamat[2]}
              </p>
              <p className="font-bold text-[8px]">Telp: {TOKO.telepon}</p>
            </div>

            {/* Info Nota */}
            <div className="border-b border-dashed border-gray-400 pb-1 mb-2 text-[8px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-medium font-bold">{nomorNota}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatDate(tanggal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-medium font-bold">
                  {kasir?.split("@")[0] || kasir}
                </span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium font-bold">{customer.nama}</span>
                </div>
              )}
              {/* <div className="flex justify-between">
                <span>Status:</span>
                <span
                  className={
                    statusPembayaran === "PAID"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {statusPembayaran === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                </span>
              </div> */}
            </div>

            {/* Items */}
            <div className="border-b border-dashed border-gray-400 pb-1 mb-2">
              <div className="grid grid-cols-12 gap-1 font-bold mb-1 text-[8px]">
                <div className="col-span-6">Nama Barang</div>
                <div className="col-span-3 text-right">Qty</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              {groupedItems.map((group, idx) => (
                <div key={idx} className="mb-2">
                  {/* Nama Barang dan Total */}
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-6 font-medium truncate">
                      {group.produkNama}
                    </div>
                    <div className="col-span-3 text-right">
                      {group.totalQty} R
                    </div>
                    <div className="col-span-3 text-right">
                      {formatRupiah(group.totalHarga)}
                    </div>
                  </div>

                  {/* ID dan Berat per item */}
                  <div className="text-[7px] text-gray-500 mt-0.5">
                    {group.ids.map((id, i) => (
                      <span key={i}>
                        {id}:{group.beratList[i]}kg
                        {i < group.ids.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-b border-dashed border-gray-400 pb-1 mb-2">
              <div className="flex justify-between font-bold text-[9px]">
                <span>TOTAL BERAT:</span>
                <span>{format2(totalBerat)} kg</span>
              </div>
              <div className="flex justify-between font-bold text-[10px] mt-1">
                <span>TOTAL:</span>
                <span>{formatRupiah(totalHarga)}</span>
              </div>

              {metodePembayaran === "CASH" && jumlah_dibayar > 0 && (
                <>
                  <div className="flex justify-between text-[8px] mt-1">
                    <span>Tunai:</span>
                    <span>{formatRupiah(jumlah_dibayar)}</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(kembalian)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Metode & Catatan */}
            <div className="border-b border-dashed border-gray-400 pb-1 mb-2 text-[8px]">
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-medium">
                  {metodeLabel[metodePembayaran] || metodePembayaran}
                </span>
              </div>
              {catatan && <div className="mt-1 italic">Cat: {catatan}</div>}
            </div>

            {/* Footer */}
            <div className="text-center text-[7px] text-gray-500">
              <p>Terima Kasih</p>
              <p>Barang tidak dapat dikembalikan</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-gray-200 flex gap-2 no-print">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Tutup
          </button>
          <button
            onClick={onPrint}
            className="flex-1 bg-gradient-to-r from-primary to-midblue text-white px-3 py-2 rounded-lg hover:shadow-medium transition text-sm font-medium flex items-center justify-center gap-2"
          >
            <Printer size={14} />
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
}
