// src/Components/Kasir/AvailableRolls/AvailableRolls.jsx
import { Grid, RefreshCw, Package, Plus } from "lucide-react";
import RollCard from "./RollCard";
import SearchBar from "./SearchBar";

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const EmptyState = ({ searchTerm }) => (
  <div className="text-center py-12">
    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-700 mb-2">
      {searchTerm ? "Tidak Ditemukan" : "Tidak Ada Stok Tersedia"}
    </h3>
    <p className="text-sm text-gray-500">
      {searchTerm
        ? `Tidak ada roll dengan kata kunci "${searchTerm}"`
        : "Tidak ada roll yang tersedia untuk dijual di gudang ini"}
    </p>
  </div>
);

export default function AvailableRolls({
  rolls,
  loading,
  searchTerm,
  searchResults,
  showDropdown,
  onSearchChange,
  onSearchKeyPress,
  onClearSearch,
  onSelectResult,
  onRefresh,
  onRollClick,
  searchRef,
  onAddManualItem,
  setShowDropdown,
}) {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-darkblue flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Grid size={16} className="text-primary" />
          </div>
          Daftar Roll Tersedia
        </h2>

        <button
          onClick={onAddManualItem}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-sm"
          title="Tambah barang tanpa barcode"
        >
          <Plus size={16} />
          Tanpa Barcode
        </button>

        <button
          onClick={onRefresh}
          className="p-2 hover:bg-primary/10 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw size={16} className="text-primary" />
        </button>
      </div>

      <SearchBar
        ref={searchRef}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onSearchKeyPress={onSearchKeyPress}
        onClearSearch={onClearSearch}
        showDropdown={showDropdown}
        searchResults={searchResults}
        onSelectResult={onSelectResult}
        setShowDropdown={setShowDropdown}
      />

      {loading ? (
        <LoadingState />
      ) : rolls.length === 0 ? (
        <EmptyState searchTerm={searchTerm} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
          {rolls.map((roll) => (
            <RollCard
              key={roll.id}
              roll={roll}
              onClick={() => onRollClick(roll)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
