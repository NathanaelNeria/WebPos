// src/Components/Owner/AktivitasUser/ActivityTable.jsx
import { useState, useEffect } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LogIn,
  LogOut,
  XCircle,
  Edit3,
  UserPlus,
  UserMinus,
  Clock,
  MapPin,
  Tag,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle,
  ShoppingCart,
  Truck,
} from "lucide-react";

/* ======================================================
   CONSTANTS
====================================================== */
const ITEMS_PER_PAGE = 10;

/* ======================================================
   UTILS
====================================================== */
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
      second: "2-digit",
    });
  } catch {
    return "-";
  }
};

/* ======================================================
   ICON & STYLE MAPPINGS - BERDASARKAN DATA REAL
====================================================== */
const ACTIVITY_CONFIG = {
  // 🔐 Autentikasi
  LOGIN: {
    icon: LogIn,
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-300",
    label: "Login",
  },
  LOGOUT: {
    icon: LogOut,
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-300",
    label: "Logout",
  },

  // 💰 Transaksi Penjualan
  PENJUALAN: {
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-100",
    border: "border-green-300",
    label: "Penjualan",
  },

  // ❌ Void & Koreksi
  VOID_NOTA: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-300",
    label: "Void Nota",
  },
  OVERRIDE_HARGA: {
    icon: Edit3,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    label: "Override Harga",
  },

  // 📦 Mutasi Stok
  MUTASI_KELUAR: {
    icon: ArrowUpFromLine,
    color: "text-orange-600",
    bg: "bg-orange-100",
    border: "border-orange-300",
    label: "Mutasi Keluar",
  },
  MUTASI_MASUK: {
    icon: ArrowDownToLine,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    label: "Mutasi Masuk",
  },

  // 📦 Barang Masuk (Pembelian) - Sesuai data real
  BARANG_MASUK: {
    icon: Truck,
    color: "text-purple-600",
    bg: "bg-purple-100",
    border: "border-purple-300",
    label: "Barang Masuk",
  },

  // 👥 Manajemen User
  CREATE_USER: {
    icon: UserPlus,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    border: "border-indigo-300",
    label: "Tambah User",
  },
  UPDATE_USER: {
    icon: Edit3,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    border: "border-indigo-300",
    label: "Update User",
  },
  DELETE_USER: {
    icon: UserMinus,
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-300",
    label: "Hapus User",
  },

  // ❓ Default
  DEFAULT: {
    icon: AlertCircle,
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-300",
    label: "Aktivitas",
  },
};

// Mapping action_type dari database ke konfigurasi - HAPUS APPROVE
const ACTION_TYPE_MAP = {
  // Autentikasi
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",

  // Penjualan
  PENJUALAN: "PENJUALAN",

  // Void & Koreksi
  VOID_NOTA: "VOID_NOTA",
  OVERRIDE_HARGA: "OVERRIDE_HARGA",

  // Mutasi
  MUTASI_KELUAR: "MUTASI_KELUAR",
  MUTASI_MASUK: "MUTASI_MASUK",

  // Barang Masuk - HANYA BARANG_MASUK
  BARANG_MASUK: "BARANG_MASUK",

  // Manajemen User
  CREATE_USER: "CREATE_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
};

const getActivityConfig = (actionType) => {
  const mappedType = ACTION_TYPE_MAP[actionType] || actionType;
  return ACTIVITY_CONFIG[mappedType] || ACTIVITY_CONFIG.DEFAULT;
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
    <div className="px-4 py-3 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Menampilkan halaman {currentPage} dari {totalPages} • Total{" "}
        {totalPages * ITEMS_PER_PAGE} data
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman pertama"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
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
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman selanjutnya"
        >
          <ChevronRight size={16} />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman terakhir"
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
      Belum Ada Aktivitas
    </h3>
    <p className="text-sm text-gray-500">
      Tidak ada aktivitas user pada periode yang dipilih
    </p>
  </div>
);

/* ======================================================
   TABLE ROW COMPONENT
====================================================== */
const TableRow = ({ item, onViewDetail }) => {
  const config = getActivityConfig(item.action_type);
  const IconComponent = config.icon;

  // Tentukan gudang berdasarkan tipe aktivitas
  const getGudang = () => {
    // Prioritaskan gudang_nama dari metadata jika ada
    if (item.metadata?.gudang_nama) return item.metadata.gudang_nama;

    // Untuk mutasi, tampilkan gudang asal/tujuan sesuai konteks
    if (item.action_type === "MUTASI_KELUAR" && item.metadata?.gudang_asal) {
      return item.metadata.gudang_asal;
    }
    if (item.action_type === "MUTASI_MASUK" && item.metadata?.gudang_tujuan) {
      return item.metadata.gudang_tujuan;
    }

    // Fallback ke gudang_id
    if (item.gudang_id) {
      const match = item.gudang_id.match(/gudang_(.+)/);
      return match ? match[1].toUpperCase() : item.gudang_id;
    }

    return "-";
  };

  // Dapatkan informasi tambahan untuk tooltip/detail
  const getAdditionalInfo = () => {
    if (item.action_type === "BARANG_MASUK" && item.metadata?.supplier) {
      return `Supplier: ${item.metadata.supplier}`;
    }
    if (item.action_type === "MUTASI_KELUAR" && item.metadata?.gudang_tujuan) {
      return `Tujuan: ${item.metadata.gudang_tujuan}`;
    }
    if (item.action_type === "MUTASI_MASUK" && item.metadata?.gudang_asal) {
      return `Asal: ${item.metadata.gudang_asal}`;
    }
    return null;
  };

  const additionalInfo = getAdditionalInfo();

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {formatTanggal(item.timestamp)}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-darkblue">
          {item.user_name || item.user_email?.split("@")[0] || "-"}
        </div>
        <div className="text-xs text-gray-500">{item.user_email}</div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}
          title={additionalInfo || ""}
        >
          <IconComponent size={14} />
          <span className="hidden sm:inline">{config.label}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
        {item.action_details || "-"}
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-gray-600">
          {item.entity_id || "-"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{getGudang()}</td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onViewDetail(item)}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
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
export const ActivityTable = ({ data = [], loading = false, onViewDetail }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayData = data.slice(startIndex, endIndex);

  // Reset ke halaman 1 ketika data berubah
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
            Daftar Aktivitas User
          </h3>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs">
            {data.length} Aktivitas
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Table Header */}
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-gray-400" />
                  Waktu
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText size={12} className="text-gray-400" />
                  User
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <Tag size={12} className="text-gray-400" />
                  Tipe
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText size={12} className="text-gray-400" />
                  Detail
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <Tag size={12} className="text-gray-400" />
                  Entity ID
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-gray-400" />
                  Gudang
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Table Body */}
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

      {/* Info Footer */}
      {data.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-2 border-t text-xs text-gray-500">
          Menampilkan {startIndex + 1} - {Math.min(endIndex, data.length)} dari{" "}
          {data.length} aktivitas
        </div>
      )}
    </div>
  );
};
