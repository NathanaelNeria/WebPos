// src/Components/Kasir/AvailableRolls/SearchBar.jsx
import { forwardRef } from "react";
import { Search, X, Barcode } from "lucide-react";
import fabricIcon from "../../../Assets/fabric.png";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

const SearchBar = forwardRef(
  (
    {
      searchTerm,
      onSearchChange,
      onSearchKeyPress,
      onClearSearch,
      showDropdown,
      setshowDropdown,
      searchResults,
      onSelectResult,
    },
    ref,
  ) => {
    return (
      <div className="mb-4 relative" ref={ref}>
        <div className="relative">
          <input
            type="text"
            placeholder="Cari atau scan barcode..."
            className="w-full border-2 border-gray-200 pl-10 pr-12 py-3 rounded-xl text-sm 
                     focus:ring-2 focus:ring-primary/20 focus:border-primary 
                     outline-none transition-all duration-300
                     hover:border-primary/30"
            value={searchTerm}
            onChange={onSearchChange}
            onKeyPress={onSearchKeyPress}
            onFocus={() => searchTerm.trim() && setshowDropdown(true)}
            autoComplete="off"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} className="text-gray-400 hover:text-darkblue" />
              </button>
            )}
            <Barcode size={18} className="text-primary animate-pulse-slow" />
          </div>
        </div>

        {/* Search Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-medium max-h-80 overflow-y-auto animate-slide-down">
            {searchResults.map((roll) => (
              <div
                key={roll.id}
                onClick={() => onSelectResult(roll)}
                className="p-3 hover:bg-primary/5 cursor-pointer border-b last:border-b-0 
                        flex items-start gap-3 transition-colors duration-200
                        group"
              >
                <div className="w-10 h-10 bg-primary/5 rounded overflow-hidden flex-shrink-0 border border-primary/10 group-hover:border-primary">
                  <img
                    src={fabricIcon}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-darkblue group-hover:text-primary transition-colors">
                    {roll.produk_nama}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {roll.kode_barcode || roll.id}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-primary font-semibold">
                      {formatRupiah(roll.harga_jual)}/kg
                    </span>
                    <span className="text-gray-500">
                      {format2(roll.berat_sisa)} kg
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDropdown && searchTerm && searchResults.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-medium p-4 text-center animate-slide-down">
            <p className="text-gray-500">Tidak ditemukan</p>
            <p className="text-xs text-primary mt-1 animate-pulse-slow">
              Tekan Enter untuk scan barcode
            </p>
          </div>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
export default SearchBar;
