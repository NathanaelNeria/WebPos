// src/Components/Owner/RiwayatMutasi/FilterBar.jsx
import { useState, useEffect } from "react";
import { Filter, Calendar, Search, X, Tag, MapPin } from "lucide-react";

export const FilterBar = ({
  periode,
  setPeriode,
  customRange,
  setCustomRange,
  onApply,
  periodeOptions,
  statusOptions,
  selectedStatus,
  setSelectedStatus,
  gudangOptions,
  selectedAsal,
  setSelectedAsal,
  selectedTujuan,
  setSelectedTujuan,
  searchTerm,
  setSearchTerm,
  onReset,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setShowCustom(periode === "custom");
  }, [periode]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, setSearchTerm]);

  const handleClearSearch = () => {
    setLocalSearchTerm("");
    setSearchTerm("");
  };

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
          placeholder="Cari nomor surat jalan atau nama barang..."
          className="w-full border border-gray-200 pl-10 pr-10 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
        />
        {localSearchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Periode Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Calendar size={12} className="text-primary" />
            Periode
          </label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {periodeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range */}
        {showCustom && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Dari Tanggal
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, start: e.target.value })
                  }
                  className="w-full border border-gray-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, end: e.target.value })
                  }
                  className="w-full border border-gray-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Status Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Tag size={12} className="text-primary" />
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Asal Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            Asal
          </label>
          <select
            value={selectedAsal}
            onChange={(e) => setSelectedAsal(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {gudangOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tujuan Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            Tujuan
          </label>
          <select
            value={selectedTujuan}
            onChange={(e) => setSelectedTujuan(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {gudangOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onReset}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <X size={16} />
          Reset
        </button>
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
