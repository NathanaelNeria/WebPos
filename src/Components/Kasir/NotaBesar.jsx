// src/Components/Kasir/NotaBesar.jsx
import { useEffect, useRef, useMemo } from "react";
import { FileText, X, Printer } from "lucide-react";

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
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
        ids: [],
        beratList: [],
        kodeBarang: item.barcode || item.rollId || "-",
      };
    }

    groups[key].items.push(item);

    const berat = item.tipe === "ROL" ? item.berat || 0 : item.berat_jual || 0;
    groups[key].totalBerat += berat;
    groups[key].totalQty += 1;

    const idToShow = getLastIdSequence(
      item.barcode || item.rollId || item.produkId,
    );
    groups[key].ids.push(idToShow);
    groups[key].beratList.push(format2(berat));
  });

  return Object.values(groups);
};

export default function NotaBesar({ isOpen, onClose, onPrint, transaction }) {
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

  const { tanggal, kasir, customer } = transaction;

  // Generate nomor surat jalan
  const nomorSuratJalan = `SJ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-primary to-midblue p-4 rounded-t-xl flex justify-between items-center sticky top-0 no-print">
          <div className="flex items-center gap-2 text-white">
            <FileText size={20} />
            <h2 className="text-lg font-semibold">Preview Nota Besar</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition flex items-center gap-1 text-white"
            >
              <Printer size={16} />
              <span className="text-sm">Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nota Content - Versi seperti PT. KURIOS UTAMA */}
        <div
          ref={notaRef}
          className="print-area flex-1 overflow-y-auto p-6 bg-gray-50"
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg border border-gray-300 max-w-3xl mx-auto"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {/* Header Toko */}
            <div className="text-center uppercase mb-4">
              <h1 className="text-lg font-bold">{TOKO.nama}</h1>
              <p className="text-[9px] leading-tight">{TOKO.alamat[0]}</p>
              <p className="text-[9px] leading-tight">{TOKO.alamat[1]}</p>
              <p className="text-[9px] leading-tight">{TOKO.alamat[2]}</p>
              <p className="text-[9px]">Telp. {TOKO.telepon}</p>
            </div>

            {/* Kepada */}
            <div className="mb-3 text-[10px]">
              <span className="font-bold">Kepada :</span>
              <p className="ml-2">
                {customer ? customer.nama : "TEKSTIL ABADI"}
              </p>
              <p className="ml-2">
                {customer ? customer.alamat : "JL. TANAH ABANG 5 NO. 10"}
              </p>
              <p className="ml-2">JAKARTA PUSAT</p>
            </div>

            {/* Surat Jalan Penjualan */}
            <div className="border-t border-b border-black py-1 mb-3 text-center">
              <h2 className="text-sm font-bold uppercase">
                Surat Jalan Penjualan
              </h2>
            </div>

            {/* No Surat Jalan dan Tanggal */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
              <div>
                <span className="font-bold">No. Surat Jalan :</span>{" "}
                {nomorSuratJalan}
              </div>
              <div className="text-right">
                <span className="font-bold">Tanggal :</span>{" "}
                {formatDate(tanggal)}
              </div>
            </div>

            {/* Tabel Item */}
            <table className="w-full border-collapse mb-4 text-[10px]">
              <thead>
                <tr className="border-t border-b border-black">
                  <th className="py-1 text-left w-8">No.</th>
                  <th className="py-1 text-left">Nama Barang</th>
                  <th className="py-1 text-right pr-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {groupedItems.map((group, groupIdx) => {
                  // Format ID dengan bintang di akhir seperti contoh
                  const idFormat =
                    group.ids.length > 0
                      ? `${group.ids[0]}-${group.ids[group.ids.length - 1]}*`
                      : "-";

                  return (
                    <tr key={groupIdx} className="border-b border-gray-300">
                      <td className="py-2 align-top">{groupIdx + 1}</td>
                      <td className="py-2 align-top">
                        <div className="font-medium">{group.produkNama}</div>
                        {/* Baris untuk berat-berat */}
                        <div className="text-[9px] text-gray-600 mt-1">
                          {group.beratList.join(" ")}
                        </div>
                        {/* Baris untuk ID dan Qty */}
                        <div className="text-[9px] text-gray-600 mt-0.5">
                          {idFormat}
                        </div>
                      </td>
                      <td className="py-2 align-top text-right pr-2">
                        <div>{group.totalQty} Roll</div>
                        <div className="text-[9px] text-gray-600 mt-1">
                          {format2(group.totalBerat)} KG
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="mt-6 text-[9px]">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold mb-1">Hormat Kami,</p>
                  <div className="mt-6 border-t border-black pt-1 w-32 text-center">
                    {kasir?.split("@")[0] || kasir}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500">{transaction?.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
