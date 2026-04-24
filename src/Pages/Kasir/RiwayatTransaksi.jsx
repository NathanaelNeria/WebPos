// src/Pages/Kasir/RiwayatTransaksi.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wallet,
  Banknote,
  CreditCard,
  FileText,
  ShoppingCart,
  Printer,
} from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import { useGudang } from "../../Hooks/useGudang";
import { getTransactionsByDateRange } from "../../Services/kasirService"; // Hanya import yang dipakai
import printNotaPenjualanThermal from "../../Components/Kasir/PrintNotaPenjualanThermal";
import printSuratJalanThermal from "../Admin/Print/printSuratJalanThermal";
import { printNotaPenjualanRangkap } from "../../Components/Kasir/PrintNotaPenjualanRangkap";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const ITEMS_PER_PAGE = 10;

const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
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

const formatWaktu = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

/* ======================================================
   FILTER BAR COMPONENT
====================================================== */
const FilterBar = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterMetode,
  setFilterMetode,
  onSearch,
  onReset,
  totalData,
}) => {
  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "PAID", label: "Lunas", icon: CheckCircle, color: "green" },
    { value: "UNPAID", label: "Belum Lunas", icon: XCircle, color: "red" },
    { value: "PARTIAL", label: "DP", icon: AlertCircle, color: "amber" },
  ];

  const metodeOptions = [
    { value: "ALL", label: "Semua Metode" },
    { value: "CASH", label: "Tunai", icon: Wallet, color: "emerald" },
    { value: "TRANSFER", label: "Transfer", icon: Banknote, color: "blue" },
    { value: "QRIS", label: "QRIS", icon: CreditCard, color: "purple" },
    { value: "CARD", label: "Kartu", icon: CreditCard, color: "indigo" },
    { value: "TEMPO", label: "Tempo", icon: Clock, color: "amber" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Cari nomor nota atau nama customer..."
          className="w-full border border-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch()}
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Dari Tanggal
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
            />
            <input
              type="date"
              className="w-full border border-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Sampai Tanggal
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
            />
            <input
              type="date"
              className="w-full border border-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Status Pembayaran
          </label>
          <select
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Metode Pembayaran
          </label>
          <select
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            value={filterMetode}
            onChange={(e) => setFilterMetode(e.target.value)}
          >
            {metodeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Total: <span className="font-bold text-primary">{totalData}</span>{" "}
          transaksi
        </p>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={onSearch}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-midblue transition flex items-center gap-2"
          >
            <Filter size={16} />
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   TRANSACTION CARD COMPONENT
====================================================== */
const TransactionCard = ({ transaction, onViewDetail }) => {
  const status = transaction.status_owner || "LUNAS";
  const metode = transaction.metode_pembayaran || "CASH";
  const isPaid = status === "LUNAS";
  const isUnpaid = status === "PENDING";
  // const isPartial = status === "PARTIAL";
  const { user } = useAuth();

  const handlePrintNota = (transaction) => {
    console.log("data untuk nota thermal:", transaction);
    printNotaPenjualanThermal({
      // ✅ Identitas Nota
      nomorNota: transaction.nomor_nota,

      // ✅ Tanggal (BIARKAN timestamp, printer yang handle .toDate())
      tanggal: transaction.tanggal_transaksi,

      // ✅ Customer
      customer: transaction.customer || null,

      // ✅ Items
      items: transaction.items || [],

      // ✅ Total & Pembayaran
      subtotal: transaction.subtotal ?? transaction.total_harga,
      ongkir: transaction.ongkir || 0,
      potongan: transaction.potongan || 0,
      totalHarga: transaction.total_harga,
      total_berat: transaction.total_berat || 0,

      jumlah_dibayar: transaction.jumlah_dibayar || 0,
      kembalian: transaction.kembalian || 0,

      // ✅ INFO TAMBAHAN (INI YANG HILANG SEBELUMNYA)
      metodePembayaran: transaction.metode_pembayaran || "CASH",

      // ✅ Kasir
      kasir: transaction.kasir_nama || user.nama,
    });
  };

  const handlePrintRangkap = (transaction) => {
    printNotaPenjualanRangkap({
      // ✅ Identitas Nota
      nomorNota: transaction.nomor_nota,

      // ✅ Tanggal (BIARKAN timestamp, printer yang handle .toDate())
      tanggal: transaction.tanggal_transaksi,

      // ✅ Customer
      customer: transaction.customer || null,

      // ✅ Items
      items: transaction.items || [],

      // ✅ Total & Pembayaran
      subtotal: transaction.subtotal ?? transaction.total_harga,
      ongkir: transaction.ongkir || 0,
      potongan: transaction.potongan || 0,
      totalHarga: transaction.total_harga,

      jumlah_dibayar: transaction.jumlah_dibayar || 0,
      kembalian: transaction.kembalian || 0,

      // ✅ INFO TAMBAHAN (INI YANG HILANG SEBELUMNYA)
      metodePembayaran: transaction.metode_pembayaran || "CASH",

      // ✅ Kasir
      kasir: transaction.kasir_nama || user.nama,
    });
  };

  const handlePrintSuratJalan = (transaction) => {
    console.log("data untuk surat jalan:", transaction);
    printSuratJalanThermal({
      sjId: transaction.nomor_nota,
      mode: "CUSTOMER",
      customerNama: transaction.customer?.nama || "-",
      adminPengirim: transaction.kasir_nama || user.nama,
      totalRolls: transaction.items?.length || 0,
      items: transaction.items.map((i) => ({
        rollId: i.rollId || i.barcode,
        berat: i.berat || i.berat_jual || 0,
        produkNama: i.produkNama,
        kategori: i.kategori,
      })),
    });
  };

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
          <CheckCircle size={12} />
          LUNAS
        </span>
      );
    }
    if (isUnpaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle size={12} />
          BELUM LUNAS
        </span>
      );
    }
    // if (isPartial) {
    //   return (
    //     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
    //       <AlertCircle size={12} />
    //       DP
    //     </span>
    //   );
    // }
    return null;
  };

  const getMetodeIcon = () => {
    switch (metode) {
      case "CASH":
        return <Wallet size={12} className="text-emerald-600" />;
      case "TRANSFER":
        return <Banknote size={12} className="text-blue-600" />;
      case "QRIS":
        return <CreditCard size={12} className="text-purple-600" />;
      case "CARD":
        return <CreditCard size={12} className="text-indigo-600" />;
      case "TEMPO":
        return <Clock size={12} className="text-amber-600" />;
      default:
        return null;
    }
  };

  const getMetodeBadge = () => {
    const metodeClasses = {
      CASH: "bg-emerald-100 text-emerald-800 border-emerald-200",
      TRANSFER: "bg-blue-100 text-blue-800 border-blue-200",
      QRIS: "bg-purple-100 text-purple-800 border-purple-200",
      CARD: "bg-indigo-100 text-indigo-800 border-indigo-200",
      TEMPO: "bg-amber-100 text-amber-800 border-amber-200",
    };

    const className =
      metodeClasses[metode] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${className}`}
      >
        {getMetodeIcon()}
        {metode}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-medium transition-all hover:border-primary/30 group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono font-bold text-darkblue">
              {transaction.nomor_nota}
            </span>
            {getStatusBadge()}
            {getMetodeBadge()}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock size={12} className="text-primary" />
              {formatWaktu(transaction.tanggal_transaksi)}
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Package size={12} className="text-primary" />
              {transaction.items?.length || 0} item
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Package size={12} className="text-primary" />
              {format2(transaction.total_berat)} kg
            </div>
            {transaction.total_ujung > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <Package size={12} className="text-primary" />
                ujung {format2(transaction.total_ujung)} kg
              </div>
            )}
          </div>

          {transaction.customer && (
            <div className="mt-2 text-xs text-primary flex items-center gap-1">
              <User size={10} />
              {transaction.customer.nama}
              {transaction.customer.no_telp &&
                ` • ${transaction.customer.no_telp}`}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-bold text-primary">
              {formatRupiah(transaction.total_harga)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTanggalShort(transaction.tanggal_transaksi)}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Detail */}
            <button
              onClick={() => onViewDetail(transaction)}
              className="p-2 hover:bg-primary/10 rounded-lg transition text-primary"
              title="Lihat Detail"
            >
              <Eye size={18} />
            </button>

            {/* Print Nota */}
            <button
              onClick={() => handlePrintNota(transaction)}
              className="p-2 hover:bg-emerald-100 rounded-lg transition text-emerald-600"
              title="Print Nota"
            >
              <FileText size={18} />
            </button>

            <button
              onClick={() => handlePrintRangkap(transaction)}
              className="p-2 hover:bg-emerald-100 rounded-lg transition text-emerald-600"
              title="Print Rangkap"
            >
              <Printer size={18} />
            </button>

            {/* Print Surat Jalan */}
            <button
              onClick={() => handlePrintSuratJalan(transaction)}
              className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
              title="Print Surat Jalan"
            >
              <Package size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   PAGINATION COMPONENT
====================================================== */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={18} />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition ${
            page === currentPage
              ? "bg-primary text-white"
              : page === "..."
                ? "cursor-default"
                : "border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

/* ======================================================
   TRANSACTION DETAIL MODAL
====================================================== */
const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-primary p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-secondary" />
            Detail Transaksi
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white"
          >
            <XCircle size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Info Nota */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Nomor Nota</p>
              <p className="font-mono font-bold text-darkblue">
                {transaction.nomor_nota}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tanggal</p>
              <p className="font-medium">
                {formatTanggal(transaction.tanggal_transaksi)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Kasir</p>
              <p className="font-medium">{transaction.kasir_nama || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gudang</p>
              <p className="font-medium">{transaction.gudang_nama || "-"}</p>
            </div>
          </div>

          {/* Customer Info */}
          {transaction.customer && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <p className="text-xs text-primary font-medium mb-2">
                Data Customer
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Nama</p>
                  <p className="font-medium">{transaction.customer.nama}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Telepon</p>
                  <p className="font-medium">
                    {transaction.customer.no_telp || "-"}
                  </p>
                </div>
                {transaction.customer.alamat && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Alamat</p>
                    <p className="font-medium">{transaction.customer.alamat}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-sm font-medium text-darkblue mb-2">Items</p>
            <div className="space-y-2">
              {transaction.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 p-3 rounded-lg"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-darkblue">
                        {item.produkNama}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.barcode || item.rollId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatRupiah(item.subtotal)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.tipe === "ROL"
                          ? `${format2(item.berat)} kg × ${formatRupiah(item.harga_per_kg)}`
                          : `${format2(item.berat_jual)} kg × ${formatRupiah(item.harga_per_kg)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total Berat:</span>
              <span className="font-medium">
                {format2(transaction.total_berat)} kg
              </span>
            </div>
            {transaction.total_ujung > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Ujung Kain:</span>
                <span className="font-medium">
                  {format2(transaction.total_ujung)} kg
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span className="text-darkblue">Total:</span>
              <span className="text-primary">
                {formatRupiah(transaction.total_harga)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
              <div>
                <p className="text-xs text-gray-500">Metode Bayar</p>
                <p className="font-medium">{transaction.metode_pembayaran}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p
                  className={`font-medium ${
                    transaction.status_pembayaran === "PAID"
                      ? "text-green-600"
                      : transaction.status_pembayaran === "UNPAID"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  {transaction.status_pembayaran}
                </p>
              </div>
            </div>
          </div>

          {/* Catatan */}
          {transaction.catatan && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 font-medium mb-1">
                Catatan:
              </p>
              <p className="text-sm text-amber-700">{transaction.catatan}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function RiwayatTransaksi() {
  const { user } = useAuth();
  const { activeGudangId, gudangNama, ensureGudang } = useGudang();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMetode, setFilterMetode] = useState("ALL");

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  console.log("filteredtransactions:", filteredTransactions);

  /* ======================================================
     LOAD TRANSACTIONS
  ===================================================== */
  const loadTransactions = useCallback(async () => {
    if (!activeGudangId) return;
    console.log("user.nama:", user.nama);

    try {
      setRefreshing(true);
      const data = await getTransactionsByDateRange(
        activeGudangId,
        new Date(startDate),
        new Date(endDate),
        user.nama,
      );
      setTransactions(data);
      setFilteredTransactions(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading transactions:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat riwayat transaksi",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeGudangId, startDate, endDate, user.nama]);

  // Initial load
  useEffect(() => {
    if (ensureGudang() && activeGudangId) {
      loadTransactions();
    }
  }, [activeGudangId, ensureGudang, loadTransactions]);

  /* ======================================================
     APPLY FILTERS
  ===================================================== */
  const applyFilters = useCallback(() => {
    let filtered = [...transactions];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nomor_nota?.toLowerCase().includes(term) ||
          t.customer?.nama?.toLowerCase().includes(term) ||
          t.customer?.no_telp?.includes(term),
      );
    }

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((t) => t.status_pembayaran === filterStatus);
    }

    // Filter by metode
    if (filterMetode !== "ALL") {
      filtered = filtered.filter((t) => t.metode_pembayaran === filterMetode);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, searchTerm, filterStatus, filterMetode]);

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, filterMetode, applyFilters]);

  /* ======================================================
     HANDLERS
  ===================================================== */

  const handleRefresh = () => {
    loadTransactions();
  };

  const handleReset = () => {
    setStartDate(() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date.toISOString().split("T")[0];
    });
    setEndDate(new Date().toISOString().split("T")[0]);
    setSearchTerm("");
    setFilterStatus("ALL");
    setFilterMetode("ALL");
  };

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = [
      "No. Nota",
      "Tanggal",
      "Customer",
      "Total Item",
      "Total Berat",
      "Total Harga",
      "Status",
      "Metode",
    ];
    const rows = filteredTransactions.map((t) => [
      t.nomor_nota,
      formatTanggal(t.tanggal_transaksi),
      t.customer?.nama || "-",
      t.items?.length || 0,
      format2(t.total_berat),
      t.total_harga,
      t.status_pembayaran,
      t.metode_pembayaran,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `riwayat-transaksi-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Gudang not selected
  if (!ensureGudang()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="bg-white p-8 rounded-xl shadow-hard max-w-md text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-darkblue mb-3">
            Gudang Tidak Terdeteksi
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan pilih gudang terlebih dahulu untuk melihat riwayat transaksi
          </p>
          <button
            onClick={() => (window.location.href = "/admin/gudang")}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-midblue transition-colors shadow-soft hover:shadow-medium"
          >
            Pilih Gudang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-card p-6 rounded-xl shadow-soft border border-white/10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <History className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Riwayat Transaksi
              </h1>
              <p className="text-sm text-gray-300">
                Gudang: {gudangNama} • {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white flex items-center gap-2"
              disabled={filteredTransactions.length === 0}
            >
              <Download size={16} />
              <span className="hidden md:inline">Export CSV</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg transition border border-white/20 text-white ${
                refreshing
                  ? "bg-white/5 cursor-not-allowed"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMetode={filterMetode}
        setFilterMetode={setFilterMetode}
        onSearch={applyFilters}
        onReset={handleReset}
        totalData={filteredTransactions.length}
      />

      {/* Transactions List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-soft">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={24} className="text-primary opacity-50" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Memuat riwayat transaksi...
          </p>
          <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-12 text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Tidak Ada Transaksi
          </h3>
          <p className="text-gray-500 mb-6">
            Belum ada transaksi dalam periode yang dipilih
          </p>
          <Link
            to="/Kasir/penjualan"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition"
          >
            <ShoppingCart size={16} />
            Mulai Transaksi Baru
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedTransactions.map((trx) => (
              <TransactionCard
                key={trx.id}
                transaction={trx}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

          {/* Summary Footer */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Menampilkan {paginatedTransactions.length} dari{" "}
                  {filteredTransactions.length} transaksi
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">
                  Total Nilai:{" "}
                  <span className="font-bold text-primary">
                    {formatRupiah(
                      filteredTransactions.reduce(
                        (sum, t) => sum + t.total_harga,
                        0,
                      ),
                    )}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="text-sm text-gray-500 hover:text-primary disabled:opacity-50"
                >
                  Awal
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="text-sm text-gray-500 hover:text-primary disabled:opacity-50"
                >
                  Akhir
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
