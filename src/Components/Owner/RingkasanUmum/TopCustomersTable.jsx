// src/Components/RingkasanUmum/TopCustomersTable.jsx
import { Users } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

export const TopCustomersTable = ({ customers }) => {
  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Belum ada data customer</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-secondary to-amber-500 p-4">
        <h3 className="font-semibold text-darkblue flex items-center gap-2">
          <Users size={18} className="text-darkblue" />
          Top Customers
        </h3>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <div key={customer.id || index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center text-secondary font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-darkblue">
                    {customer.nama}
                  </span>
                  <span className="font-bold text-secondary">
                    {formatRupiah(customer.totalBelanja)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{customer.kode || "-"}</span>
                  <span>{customer.totalTransaksi} transaksi</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                  <div
                    className="bg-secondary h-1.5 rounded-full"
                    style={{ width: `${customer.percentage}%` }}
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
