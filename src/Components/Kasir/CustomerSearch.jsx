// src/Components/Kasir/NewCustomerForm.jsx
import { useState } from "react";
import { User, Phone, MapPin, Save, X } from "lucide-react";
import { saveCustomer } from "../../Services/customerService";
import Swal from "sweetalert2";

export default function NewCustomerForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    nama: "",
    telepon: "",
    alamat: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.nama.trim()) {
      Swal.fire({
        icon: "error",
        title: "Nama harus diisi",
        confirmButtonColor: "#243A8C",
      });
      return;
    }

    setLoading(true);
    try {
      const newCustomer = await saveCustomer(form);
      Swal.fire({
        icon: "success",
        title: "Customer berhasil ditambahkan",
        timer: 1500,
        showConfirmButton: false,
      });
      onSave(newCustomer);
    } catch (error) {
      console.error("Error saving customer:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan customer",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-3">
      <h3 className="text-xs font-medium text-primary flex items-center gap-1">
        <UserPlus size={14} />
        Customer Baru
      </h3>

      <div className="space-y-2">
        <div className="relative">
          <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Nama Customer *"
            className="border border-gray-200 pl-9 pr-3 py-2 rounded-lg w-full text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
        </div>

        <div className="relative">
          <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="No. Telepon"
            className="border border-gray-200 pl-9 pr-3 py-2 rounded-lg w-full text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={form.telepon}
            onChange={(e) => setForm({ ...form, telepon: e.target.value })}
          />
        </div>

        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Alamat (opsional)"
            className="border border-gray-200 pl-9 pr-3 py-2 rounded-lg w-full text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-xs hover:bg-midblue transition disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Simpan
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
