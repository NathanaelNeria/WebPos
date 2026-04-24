// Components/BarangMasuk/SupplierForm.jsx
import { Truck } from "lucide-react";

export default function SupplierForm({
  nomorSuratJalanSupplier,
  setNomorSuratJalanSupplier,
  supplier,
  setSupplier,
  tanggalTerima,
  setTanggalTerima,
  noPO,
  setNoPO,
  catatan,
  setCatatan,
}) {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-darkblue mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Truck size={18} className="text-primary" />
        </div>
        Informasi Supplier & Surat Jalan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-sm text-gray-700 mb-1 block">
            Nomor Surat Jalan Supplier <span className="text-red-500">*</span>
          </label>
          <input
            className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
            value={nomorSuratJalanSupplier}
            onChange={(e) => setNomorSuratJalanSupplier(e.target.value)}
            placeholder="Contoh: SJ-2024-001"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Wajib unik, tidak boleh sama dengan transaksi lain
          </p>
        </div>
        <div>
          <label className="font-medium text-sm text-gray-700 mb-1 block">
            Supplier <span className="text-red-500">*</span>
          </label>
          <input
            className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Nama supplier"
            required
          />
        </div>
        <div>
          <label className="font-medium text-sm text-gray-700 mb-1 block">
            Tanggal Terima <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
            value={tanggalTerima}
            onChange={(e) => setTanggalTerima(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="font-medium text-sm text-gray-700 mb-1 block">
            No PO (Optional)
          </label>
          <input
            className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
            value={noPO}
            onChange={(e) => setNoPO(e.target.value)}
            placeholder="Nomor Purchase Order"
          />
        </div>
        <div className="md:col-span-2">
          <label className="font-medium text-sm text-gray-700 mb-1 block">
            Catatan (Optional)
          </label>
          <textarea
            className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30 h-20"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan..."
            rows="2"
          />
        </div>
      </div>
    </div>
  );
}
