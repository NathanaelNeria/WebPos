import { useState, useEffect } from "react";
import { Filter, Calendar, Search, X, Tag } from "lucide-react";

export default function FilterTransaksi({
  periode,
  setPeriode,
  customRange,
  setCustomRange,
  periodeOptions,
  statusOptions,
  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,
  onApply,
  onReset,
  approvedStatus,
  setApprovedStatus,
  showApproved,
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    setShowCustom(periode === "custom");
  }, [periode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  return (
    <div className="bg-white rounded-xl border p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Cari nomor nota, customer, atau sales..."
          className="w-full border pl-10 pr-10 py-2 rounded-lg text-sm"
        />
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch("");
              setSearchTerm("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Periode */}
        <div>
          <label className="text-xs text-gray-500 flex gap-1 mb-1">
            <Calendar size={12} /> Periode
          </label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          >
            {periodeOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date */}
        {showCustom && (
          <>
            <input
              type="date"
              value={customRange.start}
              onChange={(e) =>
                setCustomRange({ ...customRange, start: e.target.value })
              }
              className="border px-3 py-2 rounded-lg text-sm"
            />
            <input
              type="date"
              value={customRange.end}
              onChange={(e) =>
                setCustomRange({ ...customRange, end: e.target.value })
              }
              className="border px-3 py-2 rounded-lg text-sm"
            />
          </>
        )}

        {/* Status */}
        <div>
          <label className="text-xs text-gray-500 flex gap-1 mb-1">
            <Tag size={12} /> Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {/* STATUS APPROVED (HANYA JIKA showApproved = true) */}
        {showApproved && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Status Approved
            </label>

            <select
              value={approvedStatus}
              onChange={(e) => setApprovedStatus(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg text-sm"
            >
              <option value="ALL">Semua</option>
              <option value="APPROVED">Sudah di-checklist</option>
              <option value="UNAPPROVED">Belum di-checklist</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onReset}
          className="border px-4 py-2 rounded-lg text-sm"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex gap-2"
        >
          <Filter size={16} /> Terapkan
        </button>
      </div>
    </div>
  );
}
