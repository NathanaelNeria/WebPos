// src/Components/Kasir/ModalCustomer.jsx - VERSI DATABASE
import { useState } from "react";
import { db } from "../../Services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { X, User, Plus, Search, Phone, MapPin, Mail, Users } from "lucide-react";
import Swal from "sweetalert2";

export default function ModalCustomer({ onClose, onSelect, customers = [] }) {
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    nama: "",
    telepon: "",
    email: "",
    alamat: "",
    catatan: ""
  });
  const [loading, setLoading] = useState(false);

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.nama.toLowerCase().includes(search.toLowerCase()) ||
    customer.telepon.includes(search) ||
    (customer.email && customer.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle select customer
  const handleSelectCustomer = (customer) => {
    onSelect(customer);
  };

  // Handle create new customer
  const handleCreateCustomer = async () => {
    // Validasi
    if (!newCustomer.nama.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nama Harus Diisi",
        text: "Nama customer tidak boleh kosong",
        confirmButtonColor: "#0C1E6E"
      });
      return;
    }

    if (!newCustomer.telepon.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Telepon Harus Diisi",
        text: "Nomor telepon customer tidak boleh kosong",
        confirmButtonColor: "#0C1E6E"
      });
      return;
    }

    setLoading(true);

    try {
      // Generate kode customer
      const lastNumber = customers.length;
      const kodeCustomer = `CUST-${String(lastNumber + 1).padStart(3, '0')}`;

      // Save to Firebase
      const customerRef = await addDoc(collection(db, "customers"), {
        kode: kodeCustomer,
        nama: newCustomer.nama.trim(),
        telepon: newCustomer.telepon.trim(),
        email: newCustomer.email.trim() || null,
        alamat: newCustomer.alamat.trim() || null,
        catatan: newCustomer.catatan.trim() || null,
        totalTransaksi: 0,
        totalBelanja: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const customerData = {
        id: customerRef.id,
        kode: kodeCustomer,
        nama: newCustomer.nama.trim(),
        telepon: newCustomer.telepon.trim(),
        email: newCustomer.email.trim() || null,
        alamat: newCustomer.alamat.trim() || null,
        catatan: newCustomer.catatan.trim() || null,
        totalTransaksi: 0,
        totalBelanja: 0
      };

      // Panggil callback dengan data baru
      onSelect(customerData);

      Swal.fire({
        icon: "success",
        title: "Customer Berhasil Ditambahkan",
        text: `${newCustomer.nama} telah ditambahkan ke database`,
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("❌ Error creating customer:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan Customer",
        text: error.message || "Terjadi kesalahan saat menyimpan data",
        confirmButtonColor: "#0C1E6E"
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Users size={24} />
                {showNewForm ? "Tambah Customer Baru" : "Pilih Customer"}
              </h2>
              <p className="text-blue-100 mt-1">
                {showNewForm 
                  ? "Isi data customer baru" 
                  : `${customers.length} customer terdaftar`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showNewForm ? (
            /* FORM TAMBAH CUSTOMER BARU */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Customer *
                </label>
                <div className="flex items-center gap-2">
                  <User className="text-gray-400" size={20} />
                  <input
                    type="text"
                    value={newCustomer.nama}
                    onChange={(e) => setNewCustomer({...newCustomer, nama: e.target.value})}
                    className="flex-1 border border-gray-300 rounded-lg p-3"
                    placeholder="Nama lengkap customer"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={newCustomer.telepon}
                    onChange={(e) => setNewCustomer({...newCustomer, telepon: e.target.value})}
                    className="flex-1 border border-gray-300 rounded-lg p-3"
                    placeholder="0812-3456-7890"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Opsional)
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="text-gray-400" size={20} />
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="flex-1 border border-gray-300 rounded-lg p-3"
                    placeholder="customer@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat (Opsional)
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="text-gray-400" size={20} />
                  <textarea
                    value={newCustomer.alamat}
                    onChange={(e) => setNewCustomer({...newCustomer, alamat: e.target.value})}
                    className="flex-1 border border-gray-300 rounded-lg p-3"
                    rows="3"
                    placeholder="Alamat lengkap customer"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={newCustomer.catatan}
                  onChange={(e) => setNewCustomer({...newCustomer, catatan: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3"
                  rows="2"
                  placeholder="Catatan tambahan tentang customer"
                  disabled={loading}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Info:</p>
                  <p className="text-xs mt-1">
                    • Data customer akan disimpan di database<br/>
                    • Customer dapat digunakan untuk transaksi berikutnya<br/>
                    • Total belanja akan tercatat otomatis
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* LIST CUSTOMER */
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari customer (nama, telepon, email)..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* New Customer Button */}
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 flex flex-col items-center gap-2"
              >
                <Plus size={24} />
                <span className="font-semibold">Tambah Customer Baru</span>
                <span className="text-sm text-blue-500">Klik untuk menambah customer baru</span>
              </button>

              {/* Customer List */}
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <User size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {search ? "Tidak ada customer ditemukan" : "Belum ada customer terdaftar"}
                  </p>
                  {search && (
                    <p className="text-sm text-gray-400 mt-1">
                      Coba kata kunci lain
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User size={18} className="text-blue-600" />
                            <h3 className="font-bold text-lg">{customer.nama}</h3>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {customer.kode || "CUST"}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              <span>{customer.telepon}</span>
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.alamat && (
                              <div className="flex items-start gap-2">
                                <MapPin size={14} className="mt-0.5" />
                                <span className="line-clamp-2">{customer.alamat}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Total Transaksi</div>
                          <div className="font-bold">{customer.totalTransaksi || 0}</div>
                          <div className="text-xs text-gray-500 mt-1">Total Belanja</div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(customer.totalBelanja)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs">
                        <div>
                          <span className="text-gray-500">Klik untuk memilih</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(customer);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Pilih
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex gap-3">
            {showNewForm ? (
              <>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Kembali ke List
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={loading}
                  className={`flex-1 py-3 text-white rounded-lg font-bold flex items-center justify-center gap-2 ${
                    loading 
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Simpan & Pilih
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Customer Baru
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}