// Components/BarangMasuk/EmptyState.jsx
import { Factory } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-12 text-center">
      <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
        <Factory className="text-primary" size={48} />
      </div>
      <h3 className="text-xl font-medium text-darkblue mb-3">
        Mulai Input Barang Masuk
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Ikuti alur barang masuk sesuai dokumentasi
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
        {[
          "Input SJ Supplier",
          "Cari Produk",
          "Isi Berat Roll",
          "Generate Barcode",
          "Verifikasi & Approve",
        ].map((text, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center hover:border-primary/30 transition group"
          >
            <div className="text-primary font-bold text-2xl group-hover:scale-110 transition">
              {index + 1}
            </div>
            <div className="font-medium mt-2 text-darkblue">{text}</div>
            <div className="text-sm text-gray-600 mt-1">
              {index === 0 && "Nomor surat jalan dari supplier"}
              {index === 1 && "Tambahkan produk yang diterima"}
              {index === 2 && "Input berat per roll (kg)"}
              {index === 3 && "Print label per roll"}
              {index === 4 && "Write ke stockLedger"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
