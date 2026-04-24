// src/Components/Owner/AktivitasUser/FilterBar.jsx
import { useState, useEffect, useRef } from "react";
import {
  Filter,
  Calendar,
  Search,
  X,
  User,
  Tag,
  LogIn,
  LogOut,
  ShoppingCart,
  XCircle,
  Edit3,
  ArrowUpFromLine,
  ArrowDownToLine,
  UserPlus,
  UserMinus,
  FileText,
  Truck,
  Check,
} from "lucide-react";

/* ================= ICON & COLOR MAP ================= */

const ACTIVITY_ICONS = {
  LOGIN: <LogIn size={14} />,
  LOGOUT: <LogOut size={14} />,
  PENJUALAN: <ShoppingCart size={14} />,
  VOID_NOTA: <XCircle size={14} />,
  OVERRIDE_HARGA: <Edit3 size={14} />,
  MUTASI_KELUAR: <ArrowUpFromLine size={14} />,
  MUTASI_MASUK: <ArrowDownToLine size={14} />,
  BARANG_MASUK: <Truck size={14} />,
  CREATE_USER: <UserPlus size={14} />,
  UPDATE_USER: <Edit3 size={14} />,
  DELETE_USER: <UserMinus size={14} />,
};

const ACTIVITY_COLORS = {
  LOGIN: "text-blue-600",
  LOGOUT: "text-blue-600",
  PENJUALAN: "text-green-600",
  VOID_NOTA: "text-red-600",
  OVERRIDE_HARGA: "text-yellow-600",
  MUTASI_KELUAR: "text-orange-600",
  MUTASI_MASUK: "text-emerald-600",
  BARANG_MASUK: "text-purple-600",
  CREATE_USER: "text-indigo-600",
  UPDATE_USER: "text-indigo-600",
  DELETE_USER: "text-red-600",
};

/* ================= ACTIVITY TYPES ================= */

export const ACTIVITY_TYPES = [
  { value: "ALL", label: "Semua Aktivitas" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "PENJUALAN", label: "Penjualan" },
  { value: "VOID_NOTA", label: "Void Nota" },
  { value: "OVERRIDE_HARGA", label: "Override Harga" },
  { value: "MUTASI_KELUAR", label: "Mutasi Keluar" },
  { value: "MUTASI_MASUK", label: "Mutasi Masuk" },
  { value: "BARANG_MASUK", label: "Barang Masuk" },
  { value: "CREATE_USER", label: "Tambah User" },
  { value: "UPDATE_USER", label: "Update User" },
  { value: "DELETE_USER", label: "Hapus User" },
];

/* ================= COMPONENT ================= */

export const FilterBar = ({
  periode,
  setPeriode,
  onApply,
  periodeOptions,
  selectedTypes,
  setSelectedTypes,
  searchTerm,
  setSearchTerm,
  users,
  selectedUserId,
  setSelectedUserId,
}) => {
  // HAPUS state showCustom karena tidak digunakan
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const dropdownRef = useRef(null);

  /* ================= EFFECT ================= */

  // Debounce search - kirim ke parent setelah user berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearchTerm, setSearchTerm]);

  // Update localSearchTerm ketika searchTerm dari parent berubah
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= CORE LOGIC ================= */

  const toggleType = (value) => {
    if (value === "ALL") {
      setSelectedTypes(["ALL"]);
      return;
    }

    let next = [...selectedTypes];

    // kalau ALL aktif → matikan ALL
    if (next.includes("ALL")) {
      next = [];
    }

    if (next.includes(value)) {
      next = next.filter((v) => v !== value);
    } else {
      next.push(value);
    }

    // kalau kosong → balik ke ALL
    setSelectedTypes(next.length ? next : ["ALL"]);
  };

  const getSelectedTypesLabel = () => {
    if (selectedTypes.includes("ALL")) return "Semua Aktivitas";
    if (selectedTypes.length === 1) {
      const found = ACTIVITY_TYPES.find((t) => t.value === selectedTypes[0]);
      return found?.label || selectedTypes[0];
    }
    return `${selectedTypes.length} tipe dipilih`;
  };

  /* ================= RENDER ================= */

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      {/* SEARCH */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          placeholder="Cari user / email / aktivitas..."
          className="w-full border pl-10 pr-10 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
        {localSearchTerm && (
          <button
            onClick={() => setLocalSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* PERIODE */}
        <div>
          <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
            <Calendar size={12} className="text-primary" /> Periode
          </label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {periodeOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* USER */}
        <div>
          <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
            <User size={12} className="text-primary" /> User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="ALL">Semua User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama || u.email}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIVITY TYPE */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
            <Tag size={12} className="text-primary" /> Tipe Aktivitas
          </label>

          <button
            type="button"
            onClick={() => setShowTypeDropdown((v) => !v)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-gray-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <span className="truncate">{getSelectedTypesLabel()}</span>
            <Filter size={16} className="text-gray-400" />
          </button>

          {showTypeDropdown && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {ACTIVITY_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type.value);
                return (
                  <div
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    {isSelected ? (
                      <Check size={14} className="text-primary" />
                    ) : (
                      <div className="w-3.5 h-3.5 border border-gray-300 rounded" />
                    )}
                    <span
                      className={`text-sm flex items-center gap-1.5 ${ACTIVITY_COLORS[type.value] || "text-gray-600"}`}
                    >
                      {ACTIVITY_ICONS[type.value] || <FileText size={14} />}
                      {type.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* APPLY */}
      <div className="flex justify-end">
        <button
          onClick={onApply}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition flex items-center gap-2"
        >
          <Filter size={16} />
          Terapkan Filter
        </button>
      </div>
    </div>
  );
};
