// src/Components/Owner/RingkasanUmum/StockActivity.jsx
import {
  Package,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const formatTanggal = (date) => {
  if (!date) return "-";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const formatWaktu = (date) => {
  if (!date) return "-";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatBerat = (n) => {
  return parseFloat(n || 0).toFixed(2);
};

/* ======================================================
   ACTIVITY ITEM COMPONENT
====================================================== */
const ActivityItem = ({ activity }) => {
  const getIcon = () => {
    switch (activity.tipe) {
      case "PENJUALAN":
        return <ArrowUp size={14} className="text-rose-600" />;
      case "PEMBELIAN":
        return <ArrowDown size={14} className="text-emerald-600" />;
      case "MUTASI":
        return <ArrowRight size={14} className="text-amber-600" />;
      case "UJUNG_KAIN":
        return <Package size={14} className="text-purple-600" />;
      default:
        return <Package size={14} className="text-primary" />;
    }
  };

  const getTypeText = () => {
    switch (activity.tipe) {
      case "PENJUALAN":
        return "terjual ke";
      case "PEMBELIAN":
        return "dibeli dari";
      case "MUTASI":
        return "dipindah ke";
      case "UJUNG_KAIN":
        return "waste dari";
      default:
        return "ke";
    }
  };

  const getBgColor = () => {
    switch (activity.tipe) {
      case "PENJUALAN":
        return "bg-rose-100";
      case "PEMBELIAN":
        return "bg-emerald-100";
      case "MUTASI":
        return "bg-amber-100";
      case "UJUNG_KAIN":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const getUnit = () => {
    if (activity.berat) return "kg";
    if (activity.qty) return "item";
    return "unit";
  };

  const getQty = () => {
    if (activity.berat) return formatBerat(activity.berat);
    if (activity.qty) return activity.qty;
    return 0;
  };

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors group">
      <div
        className={`p-1.5 rounded-lg ${getBgColor()} group-hover:scale-110 transition-transform`}
      >
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-darkblue">{getQty()}</span>{" "}
            <span className="text-gray-600">{getUnit()}</span>{" "}
            <span className="text-gray-500">{getTypeText()}</span>{" "}
            <span className="font-medium text-primary">
              {activity.tujuan || activity.gudang_tujuan || "-"}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {formatWaktu(activity.timestamp)}
          </span>
        </div>

        {/* Detail Baris Kedua */}
        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
          <span className="font-mono">{activity.ref_nota || "-"}</span>
          {activity.roll_id && (
            <>
              <span>•</span>
              <span className="truncate max-w-[150px]">{activity.roll_id}</span>
            </>
          )}
        </div>

        {activity.catatan && (
          <div className="mt-1 text-[10px] text-gray-400 italic">
            {activity.catatan}
          </div>
        )}
      </div>
    </div>
  );
};

/* ======================================================
   DAY GROUP COMPONENT - DENGAN EXPAND/COLLAPSE
====================================================== */
const DayGroup = ({ date, activities, isExpanded, onToggle }) => {
  const totalBerat = activities.reduce((sum, act) => sum + (act.berat || 0), 0);
  const totalItem = activities.length;

  // Hitung statistik per hari
  const penjualan = activities.filter((a) => a.tipe === "PENJUALAN").length;
  const pembelian = activities.filter((a) => a.tipe === "PEMBELIAN").length;
  const mutasi = activities.filter((a) => a.tipe === "MUTASI").length;
  const waste = activities.filter((a) => a.tipe === "UJUNG_KAIN").length;

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      {/* Date Header - Always Visible */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package size={16} className="text-primary" />
          </div>
          <div>
            <span className="font-semibold text-darkblue">
              {formatTanggal(date)}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{totalItem} aktivitas</span>
              <span>•</span>
              <span>{formatBerat(totalBerat)} kg</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Statistik Ringkas */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {penjualan > 0 && (
              <span className="flex items-center gap-1 text-rose-600">
                <ArrowUp size={12} />
                {penjualan}
              </span>
            )}
            {pembelian > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <ArrowDown size={12} />
                {pembelian}
              </span>
            )}
            {mutasi > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <ArrowRight size={12} />
                {mutasi}
              </span>
            )}
            {waste > 0 && (
              <span className="flex items-center gap-1 text-purple-600">
                <Package size={12} />
                {waste}
              </span>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            {isExpanded ? (
              <ChevronUp size={18} className="text-gray-600" />
            ) : (
              <ChevronDown size={18} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Activities - Only visible when expanded */}
      {isExpanded && (
        <div className="p-3 bg-white border-t border-gray-200 space-y-1">
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <ActivityItem key={activity.id || idx} activity={activity} />
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              Tidak ada aktivitas
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export const StockActivity = ({ data = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDays, setExpandedDays] = useState({});
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (data.length > 0) {
      // Group activities by date
      const grouped = data.reduce((acc, activity) => {
        const date =
          activity.timestamp?.toDate?.() || new Date(activity.timestamp);
        const dateKey = date.toDateString();

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date,
            activities: [],
          };
        }
        acc[dateKey].activities.push(activity);
        return acc;
      }, {});

      // Convert to array and sort by date descending
      const groupedArray = Object.values(grouped)
        .map((day) => ({
          ...day,
          activities: day.activities.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
          ),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setActivities(groupedArray);

      // Initialize semua tanggal dalam keadaan TERTUTUP (false)
      const initialExpandedState = {};
      groupedArray.forEach((day) => {
        initialExpandedState[day.date.toISOString()] = false;
      });
      setExpandedDays(initialExpandedState);
    }
  }, [data]);

  // Filter berdasarkan search
  const filteredData = activities.filter((day) =>
    day.activities.some(
      (activity) =>
        activity.roll_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.ref_nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.tujuan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.gudang_tujuan
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        activity.catatan?.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  const toggleDay = (dateKey) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  // Hitung total keseluruhan
  const totalAktivitas = activities.reduce(
    (sum, day) => sum + day.activities.length,
    0,
  );
  const totalHari = activities.length;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-darkblue from-primary to-midblue p-4">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-secondary" />
          <h3 className="font-semibold text-white">Aktivitas Stok</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari berdasarkan roll ID, nota, atau tujuan..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Activities List */}
      <div className="p-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((day) => (
            <DayGroup
              key={day.date.toISOString()}
              date={day.date}
              activities={day.activities}
              isExpanded={expandedDays[day.date.toISOString()]}
              onToggle={() => toggleDay(day.date.toISOString())}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              Tidak ada aktivitas stok
            </p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Tidak ditemukan dengan kata kunci "{searchTerm}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {activities.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Aktivitas:</span>
            <span className="font-bold text-primary">
              {totalAktivitas} aktivitas dalam {totalHari} hari
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
