// src/Components/Owner/RingkasanUmum/TransactionDetailModal.jsx
import {
  X,
  Package,
  User,
  Calendar,
  Tag,
  MapPin,
  FileText,
} from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status?.toUpperCase()) {
      case "PAID":
      case "LUNAS":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "UNPAID":
      case "BELUM LUNAS":
        return "bg-rose-100 text-rose-700 border border-rose-300";
      case "PARTIAL":
      case "DP":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getStatusText = () => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "Lunas";
      case "UNPAID":
        return "Belum Lunas";
      case "PARTIAL":
        return "DP";
      default:
        return status || "-";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle()}`}
    >
      {getStatusText()}
    </span>
  );
};

const MetodeBadge = ({ metode }) => {
  const getMetodeStyle = () => {
    switch (metode?.toUpperCase()) {
      case "CASH":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "TRANSFER":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "TEMPO":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case "QRIS":
        return "bg-purple-100 text-purple-700 border border-purple-300";
      case "CARD":
        return "bg-indigo-100 text-indigo-700 border border-indigo-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getMetodeStyle()}`}
    >
      {metode || "-"}
    </span>
  );
};

export const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-primary px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white">Detail Transaksi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Info Baris 1: No Invoice & Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-primary" />
                <span className="text-xs text-gray-500">No. Invoice</span>
              </div>
              <p className="font-mono font-bold text-darkblue text-lg">
                {transaction.nomor_nota || "-"}
              </p>
            </div>
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary" />
                <span className="text-xs text-gray-500">Tanggal Transaksi</span>
              </div>
              <p className="font-bold text-darkblue">
                {formatTanggal(transaction.tanggal_transaksi)}
              </p>
            </div>
          </div>

          {/* Info Baris 2: Customer & Gudang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-primary" />
                <span className="text-sm font-medium text-darkblue">
                  Data Customer
                </span>
              </div>
              {transaction.customer ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nama:</span>
                    <span className="font-medium text-darkblue">
                      {transaction.customer.nama}
                    </span>
                  </div>
                  {transaction.customer.no_telp && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Telepon:</span>
                      <span className="font-medium text-darkblue">
                        {transaction.customer.no_telp}
                      </span>
                    </div>
                  )}
                  {transaction.customer.kode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Kode:</span>
                      <span className="font-mono text-primary">
                        {transaction.customer.kode}
                      </span>
                    </div>
                  )}
                  {transaction.customer.alamat && (
                    <div className="flex items-start gap-2 text-sm mt-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <span className="text-gray-600">
                        {transaction.customer.alamat}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Tidak ada data customer
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-primary" />
                <span className="text-sm font-medium text-darkblue">
                  Info Transaksi
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gudang:</span>
                  <span className="font-medium text-darkblue">
                    {transaction.gudang_nama || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kasir:</span>
                  <span className="font-medium text-darkblue">
                    {transaction.kasir_nama ||
                      transaction.kasir_email?.split("@")[0] ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Metode:</span>
                  <MetodeBadge metode={transaction.metode_pembayaran} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <StatusBadge status={transaction.status_pembayaran} />
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-darkblue mb-3 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Detail Item
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Item
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      Harga/kg
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transaction.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-darkblue">
                          {item.produkNama}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {item.barcode || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.tipe === "ROL"
                          ? `${format2(item.berat)} kg`
                          : `${format2(item.berat_jual)} kg`}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatRupiah(item.harga_per_kg)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-primary">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-3 text-right font-medium text-darkblue"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary text-lg">
                      {formatRupiah(transaction.total_harga)}
                    </td>
                  </tr>
                  {transaction.total_ujung > 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-4 py-2 text-right text-xs text-gray-500"
                      >
                        Ujung Kain (Waste)
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-600">
                        {format2(transaction.total_ujung)} kg
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Catatan */}
          {transaction.catatan && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-800 font-medium mb-1">
                    Catatan Transaksi:
                  </p>
                  <p className="text-sm text-amber-700">
                    {transaction.catatan}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="mt-6 bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-xl border border-primary/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Item</p>
                <p className="font-bold text-darkblue">
                  {transaction.items?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Berat</p>
                <p className="font-bold text-darkblue">
                  {format2(transaction.total_berat)} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Jumlah Bayar</p>
                <p className="font-bold text-primary">
                  {formatRupiah(
                    transaction.jumlah_dibayar || transaction.total_harga,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Kembalian</p>
                <p className="font-bold text-green-600">
                  {formatRupiah(transaction.kembalian || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
