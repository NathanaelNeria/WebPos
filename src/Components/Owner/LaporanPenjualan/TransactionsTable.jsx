// src/Components/Owner/LaporanPenjualan/TransactionsTable.jsx
import { useState, useEffect } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Package,
  Calendar,
  Tag,
  X,
  MapPin,
  Phone,
} from "lucide-react";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const ITEMS_PER_PAGE = 10;

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

const formatTanggalShort = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

/* ======================================================
   STATUS BADGE COMPONENT
====================================================== */
const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "PAID":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-300",
          label: "Lunas",
        };
      case "UNPAID":
        return {
          bg: "bg-rose-100",
          text: "text-rose-700",
          border: "border-rose-300",
          label: "Belum Lunas",
        };
      case "PARTIAL":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-300",
          label: "DP",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
          label: status || "-",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center justify-center w-28 px-3 py-1.5 rounded-full ${config.bg} ${config.text} border ${config.border} shadow-sm`}
    >
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};

/* ======================================================
   METODE BADGE COMPONENT
====================================================== */
const MetodeBadge = ({ metode }) => {
  const getMetodeConfig = () => {
    switch (metode) {
      case "CASH":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-300",
          icon: "💰",
          label: "Tunai",
        };
      case "TRANSFER":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-300",
          icon: "🏦",
          label: "Transfer",
        };
      case "QRIS":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          border: "border-purple-300",
          icon: "📱",
          label: "QRIS",
        };
      case "CARD":
        return {
          bg: "bg-indigo-100",
          text: "text-indigo-700",
          border: "border-indigo-300",
          icon: "💳",
          label: "Kartu",
        };
      case "TEMPO":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-300",
          icon: "⏰",
          label: "Tempo",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
          icon: "•",
          label: metode || "-",
        };
    }
  };

  const config = getMetodeConfig();

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 w-28 px-3 py-1.5 rounded-full ${config.bg} ${config.text} border ${config.border} shadow-sm`}
    >
      <span className="text-xs">{config.icon}</span>
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};

/* ======================================================
   PAGINATION COMPONENT
====================================================== */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-primary text-white"
                  : page === "..."
                    ? "cursor-default"
                    : "border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Halaman {currentPage} dari {totalPages}
      </div>
    </div>
  );
};

/* ======================================================
   TRANSACTION DETAIL MODAL
====================================================== */
const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
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
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-gray-700">
                        {transaction.customer.no_telp}
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
                      Berat
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
                        {item.berat_ujung > 0 && (
                          <div className="text-[10px] text-gray-400">
                            (ujung: {format2(item.berat_ujung)} kg)
                          </div>
                        )}
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
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Berat</p>
              <p className="text-lg font-bold text-darkblue">
                {format2(transaction.total_berat)} kg
              </p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Item</p>
              <p className="text-lg font-bold text-darkblue">
                {transaction.items?.length || 0}
              </p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Ujung</p>
              <p className="text-lg font-bold text-darkblue">
                {format2(transaction.total_ujung || 0)} kg
              </p>
            </div>
          </div>

          {/* Catatan */}
          {transaction.catatan && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-800 font-medium mb-1">
                Catatan Transaksi:
              </p>
              <p className="text-sm text-amber-700">{transaction.catatan}</p>
            </div>
          )}
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

/* ======================================================
   TABLE SKELETON
====================================================== */
const TableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-primary to-midblue p-4">
      <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
    </div>
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  </div>
);

/* ======================================================
   EMPTY STATE
====================================================== */
const EmptyState = ({ periode }) => {
  const getPeriodeText = () => {
    switch (periode) {
      case "today":
        return "hari ini";
      case "yesterday":
        return "kemarin";
      case "week":
        return "minggu ini";
      case "month":
        return "bulan ini";
      case "year":
        return "tahun ini";
      default:
        return "periode ini";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-12 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        Belum Ada Transaksi
      </h3>
      <p className="text-sm text-gray-500">
        Tidak ada transaksi pada {getPeriodeText()}
      </p>
    </div>
  );
};

/* ======================================================
   TABLE HEADER
====================================================== */
const TableHeader = () => (
  <thead className="bg-gray-50 border-b">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        No. Invoice
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Tanggal
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Pembeli
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Gudang
      </th>
      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
        Total
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Kasir
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Metode
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Status
      </th>
      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
        Aksi
      </th>
    </tr>
  </thead>
);

/* ======================================================
   TABLE ROW
====================================================== */
const TableRow = ({ item, onViewDetail }) => (
  <tr
    className="hover:bg-gray-50 transition-colors group cursor-pointer"
    onClick={() => onViewDetail(item)}
  >
    <td className="px-4 py-3 font-mono text-sm font-medium text-primary">
      {item.nomor_nota || "-"}
    </td>
    <td className="px-4 py-3 text-sm text-gray-700">
      {formatTanggalShort(item.tanggal_transaksi)}
    </td>
    <td className="px-4 py-3 text-sm text-gray-700">
      {item.customer?.nama || item.pembeli || "-"}
    </td>
    <td className="px-4 py-3">
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
        {item.gudang_nama || item.gudang || "-"}
      </span>
    </td>
    <td className="px-4 py-3 text-right font-medium text-primary">
      {formatRupiah(item.total_harga || 0)}
    </td>
    <td className="px-4 py-3 text-sm text-gray-700">
      {item.kasir_nama || item.kasir_email?.split("@")[0] || "-"}
    </td>
    <td className="px-4 py-3">
      <MetodeBadge metode={item.metode_pembayaran} />
    </td>
    <td className="px-4 py-3">
      <StatusBadge status={item.status_pembayaran} />
    </td>
    <td className="px-4 py-3 text-center">
      <button
        className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-primary opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail(item);
        }}
        title="Lihat Detail"
      >
        <Eye size={16} />
      </button>
    </td>
  </tr>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */
export const TransactionsTable = ({
  data = [],
  loading = false,
  periode = "month",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset ke halaman 1 ketika data berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.getElementById("transactions-table")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyState periode={periode} />;
  }

  return (
    <>
      <div
        id="transactions-table"
        className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-midblue p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText size={18} className="text-secondary" />
              Daftar Transaksi
            </h3>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs">
              {data.length} Transaksi
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader />
            <tbody className="divide-y">
              {displayData.map((item) => (
                <TableRow
                  key={item.id}
                  item={item}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - hanya tampil jika data > ITEMS_PER_PAGE */}
        {data.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Total Nilai Footer */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Nilai Transaksi:</span>
            <span className="font-bold text-primary">
              {formatRupiah(
                data.reduce((sum, item) => sum + (item.total_harga || 0), 0),
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        transaction={selectedTransaction}
      />
    </>
  );
};
