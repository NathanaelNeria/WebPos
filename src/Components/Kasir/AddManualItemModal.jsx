import { useState } from "react";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import { TIPE_ITEM } from "../../Services/kasirService";

export default function AddManualItemModal({ isOpen, onClose, onSubmit }) {
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState(TIPE_ITEM.ECER);
  const [berat, setBerat] = useState("");
  const [harga, setHarga] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!nama.trim()) {
      Swal.fire("Nama barang wajib diisi", "", "warning");
      return;
    }
    if (!berat || !harga) {
      Swal.fire("Berat & harga wajib diisi", "", "warning");
      return;
    }

    onSubmit({
      nama: nama.trim(),
      tipe,
      berat: Number(berat),
      harga: Number(harga),
    });
    setBerat("");
    setHarga("");
    setNama("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Tambah Barang Tanpa Barcode</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nama Barang
            </label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Tipe */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Jenis Penjualan
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipe(TIPE_ITEM.ECER)}
                className={`px-4 py-2 rounded-lg border ${
                  tipe === TIPE_ITEM.ECER ? "bg-primary text-white" : ""
                }`}
              >
                Ecer
              </button>
              <button
                type="button"
                onClick={() => setTipe(TIPE_ITEM.ROL)}
                className={`px-4 py-2 rounded-lg border ${
                  tipe === TIPE_ITEM.ROL ? "bg-primary text-white" : ""
                }`}
              >
                Rol
              </button>
            </div>
          </div>

          {/* Berat */}
          <div>
            <label className="block text-sm font-medium mb-1">Berat (Kg)</label>
            <input
              type="number"
              step="0.01"
              value={berat}
              onChange={(e) => setBerat(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Harga per Kg
            </label>
            <input
              type="number"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Tambahkan
          </button>
        </div>
      </div>
    </div>
  );
}
