// src/Components/Owner/RiwayatMutasi/MutasiTable.jsx
import { useState, useEffect } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

const ITEMS_PER_PAGE = 10;

const formatTanggalShort = (timestamp) => {
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
      Belum Ada Data Mutasi
    </h3>
    <p className="text-sm text-gray-500">
      Tidak ada mutasi pada periode yang dipilih
    </p>
  </div>
);

/* ======================================================
   TABLE ROW COMPONENT
====================================================== */
const TableRow = ({ item, onViewDetail }) => {
  // Gabungkan nama barang dari items
  const namaBarang =
    item.items
      ?.map((i) => i.produkNama)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ") || "-";

  return (
    <tr
      className="hover:bg-gray-50 transition-colors group cursor-pointer"
      onClick={() => onViewDetail(item)}
    >
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-gray-400" />
          {formatTanggalShort(item.created_at)}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-medium text-primary">
          {item.nomor_surat || item.id}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
        {namaBarang}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <MapPin size={12} className="text-gray-400" />
          {item.asal || item.gudang_asal_nama || "-"}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <MapPin size={12} className="text-gray-400" />
          {item.tujuan || item.gudang_tujuan_nama || "-"}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <User size={12} className="text-gray-400" />
          {item.pengirim_nama || item.pengirim || item.created_by_name || "-"}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <User size={12} className="text-gray-400" />
          {item.penerima_nama || item.penerima || item.received_by_name || "-"}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-right">
        {item.total_roll || 0}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-right">
        {item.total_berat ? item.total_berat.toFixed(2) : "0"} kg
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(item);
          }}
          className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-primary"
          title="Lihat Detail"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export const MutasiTable = ({ data = [], loading = false, onViewDetail }) => {
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
            Daftar Mutasi
          </h3>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs">
            {data.length} Mutasi
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Nomor Surat Jalan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Nama Barang
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Asal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Tujuan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Pengirim
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Penerima
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Jumlah Rol
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Total Berat (kg)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Status
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
