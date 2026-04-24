// src/Components/RingkasanUmum/TopProductsTable.jsx
import { Package } from "lucide-react";

const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

export const TopProductsTable = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Belum ada data produk</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-midblue p-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Package size={18} className="text-secondary" />
          Produk Terlaris
        </h3>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.id || index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-darkblue">
                    {product.nama}
                  </span>
                  <span className="font-bold text-primary">
                    {formatRupiah(product.total)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{product.kategori || "Umum"}</span>
                  <span>
                    {format2(product.berat)} kg • {product.qty} transaksi
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${product.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
