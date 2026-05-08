// src/Pages/Owner/ManajemenCustomer.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getAllCustomers,
  saveCustomer,
  deleteCustomer,
} from "../../Services/customerService";

export default function ManajemenCustomer() {
  // ==================== STATE ====================
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const emptyForm = {
    nama: "",
    email: "",
    telepon: "",
    alamat: "",
  };

  const [form, setForm] = useState({ ...emptyForm });

  // ==================== LOAD DATA ====================
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: err.message || "Terjadi kesalahan saat mengambil data pelanggan",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORM HANDLERS ====================
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      nama: c.nama || "",
      email: c.email || "",
      telepon: c.telepon || "",
      alamat: c.alamat || "",
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const validateForm = () => {
  if (!form.nama.trim()) {
    Swal.fire({ icon: "warning", title: "Validasi Gagal", text: "Nama harus diisi" });
    return false;
  }
  return true;
};

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editId) {
        await saveCustomer({ id: editId, ...form });
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Data pelanggan berhasil diupdate", timer: 1500, showConfirmButton: false });
      } else {
        await saveCustomer(form);
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Pelanggan baru berhasil ditambah", timer: 1500, showConfirmButton: false });
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal!", text: err.message || "Terjadi kesalahan saat menyimpan" });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (c) => {
    Swal.fire({
      title: "Hapus Pelanggan?",
      text: `Anda yakin ingin menghapus pelanggan "${c.nama}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSubmitting(true);
        try {
          await deleteCustomer(c.id);
          Swal.fire({ icon: "success", title: "Berhasil!", text: "Pelanggan telah dihapus", timer: 1500, showConfirmButton: false });
          loadData();
        } catch (err) {
          Swal.fire({ icon: "error", title: "Gagal!", text: err.message || "Tidak dapat menghapus pelanggan" });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // ==================== FILTER ====================
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nama?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telepon?.toLowerCase().includes(term)
    );
  });

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-darkblue">Manajemen Customer</h1>
            <p className="text-gray-600 mt-2">Kelola data pelanggan</p>
          </div>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-medium transition-all"
          >
            Tambah Customer
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari pelanggan (nama, email, telepon)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Alamat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Total Belanja</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Total Transaksi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{c.nama}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.alamat}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.totalBelanja?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.totalTransaksi?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 min-w-[100px]">
                          <button
                            onClick={() => openEdit(c)}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(c)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      Tidak ada data pelanggan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">{editId ? "Edit Customer" : "Tambah Customer"}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={form.telepon}
                    onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-primary text-white rounded hover:shadow-md flex items-center gap-2"
                >
                  {submitting ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : null}
                  {editId ? "Simpan" : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
