// src/Components/Owner/RingkasanUmum/DailySummaryTable.jsx
import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { TransactionDetailModal } from "./TransactionDetailModal";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

/* ======================================================
   BADGE COMPONENTS
====================================================== */
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
      className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block w-24 text-center shadow-sm ${getStatusStyle()}`}
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
      className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block w-20 text-center shadow-sm ${getMetodeStyle()}`}
    >
      {metode || "-"}
    </span>
  );
};

/* ======================================================
   TABLE HEADER COMPONENT
====================================================== */
const TableHeader = () => (
  <thead className="bg-gray-50 border-b">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        No. Invoice
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Pembeli
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Gudang
      </th>
      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
        Total Rupiah
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Kasir
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
        Metode Pembayaran
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
   TABLE ROW COMPONENT
====================================================== */
const TableRow = ({ item, onViewDetail }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3 font-mono text-sm font-medium text-primary">
      {item.nomor_nota || "-"}
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
        className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-primary"
        title="Lihat Detail"
        onClick={() => onViewDetail(item)}
      >
        <Eye size={16} />
      </button>
    </td>
  </tr>
);

/* ======================================================
   LOADING STATE COMPONENT
====================================================== */
const LoadingState = () => (
  <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-7 gap-4">
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
            <div className="h-6 bg-gray-200 rounded col-span-1"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ======================================================
   EMPTY STATE COMPONENT
====================================================== */
const EmptyState = () => (
  <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-12 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Calendar className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-700 mb-2">
      Belum Ada Transaksi Hari Ini
    </h3>
    <p className="text-sm text-gray-500">Belum ada transaksi pada hari ini</p>
  </div>
);

/* ======================================================
   TABLE FOOTER COMPONENT
====================================================== */
const TableFooter = ({ data, displayData, expanded, onToggleExpand }) => {
  const totalPenjualan = data.reduce(
    (sum, item) => sum + (item.total_harga || 0),
    0,
  );

  return (
    <>
      {data.length > 5 && (
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Menampilkan {displayData.length} dari {data.length} transaksi
          </p>
          <button
            onClick={onToggleExpand}
            className="text-sm text-primary hover:text-midblue flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                Tampilkan Lebih Sedikit
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Tampilkan {data.length - 5} Transaksi Lagi
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="text-secondary-600">Total Penjualan Hari Ini:</span>
          <span className="font-bold text-primary">
            {formatRupiah(totalPenjualan)}
          </span>
        </div>
      </div>
    </>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export const DailySummaryTable = ({ data, loading = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  const displayData = expanded ? data : data.slice(0, 5);

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-darkblue p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Calendar
                size={18}
                className="text-xl font-bold text-secondary"
              />
              Transaksi Hari Ini
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

        {/* Footer */}
        <TableFooter
          data={data}
          displayData={displayData}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
        />
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
