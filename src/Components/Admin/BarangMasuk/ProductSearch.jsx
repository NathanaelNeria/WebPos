// Components/BarangMasuk/ProductSearch.jsx
import { Search, Package, Plus } from "lucide-react";

export default function ProductSearch({
  search,
  setSearch,
  showSearch,
  setShowSearch,
  loadingProduk,
  filteredProduk,
  onAddProduk,
}) {
  return (
    <div className="relative bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <label className="font-medium text-sm text-gray-700 mb-1 block">
        Cari & Tambah Produk <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          className="border border-gray-200 pl-10 pr-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
          placeholder="Ketik nama, kode, atau kategori produk..."
        />
      </div>

      {showSearch && (
        <div className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-hard w-full mt-2 max-h-96 overflow-auto">
          {loadingProduk ? (
            <div className="p-8 text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
              </div>
              <div className="mt-3 text-gray-500">Memuat produk...</div>
            </div>
          ) : filteredProduk.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <div className="font-medium">Produk tidak ditemukan</div>
              <div className="text-sm text-gray-400 mt-1">
                Coba kata kunci lain
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-gray-50 border-b text-sm text-gray-600">
                {filteredProduk.length} produk ditemukan
              </div>
              <div className="max-h-80 overflow-auto">
                {filteredProduk.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onAddProduk(p)}
                    className="w-full text-left p-4 hover:bg-primary/5 border-b border-gray-100 last:border-b-0 transition duration-200 flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-medium text-gray-800 group-hover:text-primary">
                        {p.nama}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 flex gap-2">
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                          {p.kode || "No Code"}
                        </span>
                        <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded">
                          {p.kategori || "No Category"}
                        </span>
                      </div>
                    </div>
                    <Plus
                      size={18}
                      className="text-primary opacity-0 group-hover:opacity-100 transition"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
