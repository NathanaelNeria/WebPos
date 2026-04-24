// src/Components/Owner/BarangMasukKeluar/SuratJalanTable.jsx
import { useState, useEffect } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Package,
  Truck,
  ArrowDown,
  Clock,
  MapPin,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

// HAPUS formatTanggal yang tidak digunakan
// HAPUS format2 yang tidak digunakan

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

const getTipeIcon = (tipe) => {
  switch (tipe) {
    case "BARANG_MASUK":
      return <ArrowDown size={14} className="text-green-600" />;
    case "MUTASI":
      return <Truck size={14} className="text-purple-600" />;
    default:
      return <Package size={14} className="text-gray-600" />;
  }
};

const getTipeColor = (tipe) => {
  switch (tipe) {
    case "BARANG_MASUK":
      return "bg-green-100 text-green-700 border-green-300";
    case "MUTASI":
      return "bg-purple-100 text-purple-700 border-purple-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "approved":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300";
    case "draft":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getGudangNamaFromId = (gudangId) => {
  if (!gudangId) return "-";
  const match = gudangId.match(/gudang_(.+)/);
  return match ? match[1].toUpperCase() : gudangId;
};

const getAsalText = (item) => {
  if (item.tipe === "BARANG_MASUK") {
    return item.supplier_nama || item.metadata?.supplier || "Supplier";
  } else {
    return (
      item.gudang_asal_nama ||
      (item.gudang_asal ? getGudangNamaFromId(item.gudang_asal) : "-")
    );
  }
};

/* ======================================================
   PAGINATION COMPONENT
====================================================== */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
    <div className="px-4 py-3 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Menampilkan halaman {currentPage} dari {totalPages}
      </div>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium ${
                page === currentPage
                  ? "bg-primary text-white"
                  : page === "..."
                    ? "cursor-default text-gray-400"
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
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight size={16} />
        </button>
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
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  </div>
);

/* ======================================================
   EMPTY STATE
====================================================== */
const EmptyState = () => (
  <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-12 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <FileText className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-700 mb-2">
      Belum Ada Surat Jalan
    </h3>
    <p className="text-sm text-gray-500">
      Tidak ada surat jalan pada periode yang dipilih
    </p>
  </div>
);

/* ======================================================
   TABLE ROW COMPONENT
====================================================== */
const TableRow = ({ item, onViewDetail }) => (
  <tr
    className="hover:bg-gray-50 transition-colors group cursor-pointer"
    onClick={() => onViewDetail(item)}
  >
    <td className="px-4 py-3">
      <span className="font-mono text-sm font-medium text-primary">
        {item.supplier_ref || item.id}
      </span>
    </td>
    <td className="px-4 py-3">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getTipeColor(item.tipe)}`}
      >
        {getTipeIcon(item.tipe)}
        <span className="hidden sm:inline">
          {item.tipe === "BARANG_MASUK" ? "Masuk" : "Mutasi"}
        </span>
      </span>
    </td>
    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
      <div className="flex items-center gap-1">
        <Clock size={12} className="text-gray-400" />
        {formatTanggalShort(item.created_at)}
      </div>
    </td>
    <td className="px-4 py-3">
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}
      >
        {item.status === "completed"
          ? "Selesai"
          : item.status === "approved"
            ? "Disetujui"
            : item.status === "pending"
              ? "Pending"
              : item.status === "cancelled"
                ? "Dibatalkan"
                : item.status}
      </span>
    </td>
    <td className="px-4 py-3 text-sm text-gray-700">
      <div className="flex items-center gap-1">
        <MapPin size={12} className="text-gray-400" />
        {getAsalText(item)}
      </div>
    </td>
    <td className="px-4 py-3 text-sm text-gray-700">
      <div className="flex items-center gap-1">
        <MapPin size={12} className="text-gray-400" />
        {item.gudang_tujuan_nama ||
          (item.gudang_tujuan ? getGudangNamaFromId(item.gudang_tujuan) : "-")}
      </div>
    </td>
    <td className="px-4 py-3 text-sm text-gray-700 text-right">
      {item.total_roll || 0}
    </td>
    <td className="px-4 py-3 text-sm text-gray-700 text-right">
      {item.total_berat ? item.total_berat.toFixed(2) : "0"} kg
    </td>
    <td className="px-4 py-3 text-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail(item);
        }}
        className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-primary"
        title="Lihat Detail Surat Jalan"
      >
        <Eye size={16} />
      </button>
    </td>
  </tr>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */
export const SuratJalanTable = ({
  data = [],
  loading = false,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayData = data.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  if (loading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-midblue p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-secondary" />
            Daftar Surat Jalan
          </h3>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs">
            {data.length} Surat Jalan
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                No. Surat Jalan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Tipe
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Tujuan
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Roll
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Berat
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayData.map((item) => (
              <TableRow key={item.id} item={item} onViewDetail={onViewDetail} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
