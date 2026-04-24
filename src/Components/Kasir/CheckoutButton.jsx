// src/Components/Kasir/CheckoutButton.jsx
import { CreditCard, RefreshCw, Lock } from "lucide-react";

export default function CheckoutButton({ onClick, processing }) {
  return (
    <div className="p-6">
      <button
        onClick={onClick}
        disabled={processing}
        className="w-full bg-gradient-card text-white p-4 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-[1.02]"
      >
        {processing ? (
          <>
            <RefreshCw size={20} className="animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <CreditCard size={20} />
            Proses Pembayaran
          </>
        )}
      </button>
      <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
        <Lock size={12} />
        Semua transaksi bersifat immutable
      </p>
    </div>
  );
}
