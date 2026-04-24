// src/Components/RingkasanUmum/PaymentMethodsChart.jsx
import { PieChart } from "lucide-react";

const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

const formatPersen = (n) => {
  return `${parseFloat(n || 0).toFixed(1)}%`;
};

export const PaymentMethodsChart = ({ methods }) => {
  const colors = {
    CASH: "bg-emerald-500",
    TRANSFER: "bg-blue-500",
    QRIS: "bg-purple-500",
    CARD: "bg-indigo-500",
    TEMPO: "bg-amber-500",
  };

  const labels = {
    CASH: "Tunai",
    TRANSFER: "Transfer",
    QRIS: "QRIS",
    CARD: "Kartu",
    TEMPO: "Tempo",
  };

  if (!methods || methods.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 text-center">
        <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Belum ada data pembayaran</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <PieChart size={18} className="text-white" />
          Metode Pembayaran
        </h3>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.metode}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {labels[method.metode] || method.metode}
                </span>
                <span className="font-medium text-darkblue">
                  {formatRupiah(method.total)} (
                  {formatPersen(method.percentage)})
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className={`${colors[method.metode] || "bg-gray-500"} h-2 rounded-full`}
                  style={{ width: `${method.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{method.count} transaksi</span>
                <span>{formatRupiah(method.average)}/transaksi</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
