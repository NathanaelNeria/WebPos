// src/Components/Owner/LaporanPenjualan/StockValueTable.jsx
import { Archive } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

export const StockValueTable = ({
  data = [],
  totalRol = 0,
  totalBerat = 0,
  totalValue = 0,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Pastikan data ada
  const hasData = data && data.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-white" />
          <h3 className="font-semibold text-white">Nilai Stok per Gudang</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Gudang
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Total Rol
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Total Berat
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Nilai Stok
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                Kontribusi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {hasData ? (
              data.map((gudang) => {
                const kontribusi =
                  totalValue > 0 ? (gudang.nilai / totalValue) * 100 : 0;
                return (
                  <tr key={gudang.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-darkblue">
                      {gudang.nama}
                    </td>
                    <td className="px-4 py-3 text-right">{gudang.rol}</td>
                    <td className="px-4 py-3 text-right">
                      {format2(gudang.berat)} kg
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {formatRupiah(gudang.nilai)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-gray-600">
                          {kontribusi.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${kontribusi}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data stok
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 border-t font-medium">
            <tr>
              <td className="px-4 py-3 text-darkblue">TOTAL</td>
              <td className="px-4 py-3 text-right">{totalRol}</td>
              <td className="px-4 py-3 text-right">{format2(totalBerat)} kg</td>
              <td className="px-4 py-3 text-right text-primary">
                {formatRupiah(totalValue)}
              </td>
              <td className="px-4 py-3 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
