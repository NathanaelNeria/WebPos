// src/Components/Owner/RingkasanUmum/PeriodeSelector.jsx
import { useState, useEffect } from "react";
import { Filter } from "lucide-react";

export const PeriodeSelector = ({
  periode,
  setPeriode,
  customRange,
  setCustomRange,
  onApply,
  options,
}) => {
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    setShowCustom(periode === "custom");
  }, [periode]);

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Periode</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {showCustom && (
          <>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange({ ...customRange, start: e.target.value })
                }
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange({ ...customRange, end: e.target.value })
                }
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </>
        )}

        <button
          onClick={onApply}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition flex items-center gap-2 whitespace-nowrap"
        >
          <Filter size={16} />
          Terapkan
        </button>
      </div>
    </div>
  );
};
