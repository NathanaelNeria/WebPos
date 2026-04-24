// src/Components/Kasir/CustomerForm.jsx
import { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  MapPin,
  X,
  ChevronRight,
  UserPlus,
  History,
  Star,
} from "lucide-react";
import Swal from "sweetalert2";

// Service
import { searchCustomers, saveCustomer } from "../../Services/customerService";

/* ======================================================
   CONSTANTS
====================================================== */
const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

/* ======================================================
   CUSTOMER SEARCH COMPONENT
====================================================== */
const CustomerSearch = ({ onSelect, initialCustomer }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(initialCustomer || null);
  const searchRef = useRef(null);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setLoading(true);
        const customers = await searchCustomers(searchTerm);
        setResults(customers);
        setShowDropdown(true);
        setLoading(false);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelect = (customer) => {
    setSelected(customer);
    setSearchTerm(customer.nama);
    setShowDropdown(false);
    onSelect(customer);
  };

  const handleClear = () => {
    setSelected(null);
    setSearchTerm("");
    setResults([]);
    onSelect(null);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama atau telepon..."
          className="w-full border border-gray-200 pl-9 pr-20 py-2 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={12} className="text-gray-400" />
            </button>
          )}
          {loading && (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-medium max-h-48 overflow-y-auto text-xs">
          {results.map((cust) => (
            <div
              key={cust.id}
              onClick={() => handleSelect(cust)}
              className="p-2 hover:bg-primary/5 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-darkblue">{cust.nama}</span>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {cust.kode}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                <span className="flex items-center gap-0.5">
                  <Phone size={8} /> {cust.telepon || "-"}
                </span>
                {cust.totalTransaksi > 0 && (
                  <>
                    <span className="flex items-center gap-0.5">
                      <History size={8} /> {cust.totalTransaksi}x
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Star size={8} className="text-amber-400" />
                      {formatRupiah(cust.totalBelanja)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown &&
        searchTerm.length >= 2 &&
        results.length === 0 &&
        !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-medium p-3 text-center text-xs">
            <p className="text-gray-500">Tidak ditemukan</p>
          </div>
        )}
    </div>
  );
};

/* ======================================================
   NEW CUSTOMER FORM
====================================================== */
const NewCustomerForm = ({ onSave, onCancel }) => {
  const [form, setForm] = useState({ nama: "", telepon: "", alamat: "" });
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
        title: "Customer tersimpan",
        timer: 1500,
        showConfirmButton: false,
      });
      onSave(newCustomer);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
      <h3 className="text-xs font-medium text-primary">Customer Baru</h3>
      <div className="space-y-2">
        <div className="relative">
          <User size={12} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Nama *"
            className="w-full border border-gray-200 pl-7 pr-2 py-1.5 rounded text-xs focus:ring-1 focus:ring-primary"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
        </div>
        <div className="relative">
          <Phone size={12} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Telepon"
            className="w-full border border-gray-200 pl-7 pr-2 py-1.5 rounded text-xs"
            value={form.telepon}
            onChange={(e) => setForm({ ...form, telepon: e.target.value })}
          />
        </div>
        <div className="relative">
          <MapPin size={12} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Alamat"
            className="w-full border border-gray-200 pl-7 pr-2 py-1.5 rounded text-xs"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-primary text-white py-1.5 rounded text-xs hover:bg-midblue transition disabled:opacity-50"
        >
          {loading ? "..." : "Simpan"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-200 rounded text-xs hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

/* ======================================================
   SELECTED CUSTOMER CARD
====================================================== */
const SelectedCustomerCard = ({ customer, onClear }) => (
  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-2 rounded-lg border border-primary/20 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
        <User size={12} className="text-primary" />
      </div>
      <div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-darkblue">
            {customer.nama}
          </span>
          <span className="text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded-full">
            {customer.kode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-gray-500">
          <span>{customer.noTelp || "-"}</span>
          {customer.totalTransaksi > 0 && (
            <span>{customer.totalTransaksi} transaksi</span>
          )}
        </div>
      </div>
    </div>
    <button onClick={onClear} className="p-1 hover:bg-gray-100 rounded">
      <X size={12} className="text-gray-400" />
    </button>
  </div>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function CustomerForm({
  customer,
  setCustomer,
  showCustomerForm,
  setShowCustomerForm,
}) {
  const [showNewForm, setShowNewForm] = useState(false);

  const handleSelect = (selected) => {
    if (selected) {
      setCustomer({
        id: selected.id,
        nama: selected.nama,
        noTelp: selected.telepon,
        alamat: selected.alamat || "",
        kode: selected.kode,
        totalTransaksi: selected.totalTransaksi,
        totalBelanja: selected.totalBelanja,
      });
    } else {
      setCustomer({ nama: "", noTelp: "", alamat: "" });
    }
  };

  const handleNewCustomer = (newCust) => {
    setCustomer({
      id: newCust.id,
      nama: newCust.nama,
      noTelp: newCust.telepon,
      alamat: newCust.alamat || "",
      kode: newCust.kode,
    });
    setShowNewForm(false);
  };

  const handleClear = () => {
    setCustomer({ nama: "", noTelp: "", alamat: "" });
    setShowNewForm(false);
  };

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setShowCustomerForm(!showCustomerForm)}
        className="w-full p-3 flex items-center justify-between text-left group hover:bg-gray-50/50 transition"
      >
        <span className="text-xs font-medium text-darkblue flex items-center gap-1.5">
          <User size={14} className="text-primary" />
          Data Customer
        </span>
        <ChevronRight
          size={14}
          className={`text-primary transition-transform duration-200 ${
            showCustomerForm ? "rotate-90" : ""
          }`}
        />
      </button>

      {showCustomerForm && (
        <div className="p-3 pt-0 space-y-2">
          {/* Customer dengan ID (sudah dipilih) */}
          {customer.id ? (
            <SelectedCustomerCard customer={customer} onClear={handleClear} />
          ) : (
            <>
              {/* Search Customer */}
              <CustomerSearch onSelect={handleSelect} initialCustomer={null} />

              {/* Tombol Customer Baru */}
              {!showNewForm && (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full py-1.5 border border-dashed border-primary/30 rounded text-[10px] text-primary hover:bg-primary/5 transition flex items-center justify-center gap-1"
                >
                  <UserPlus size={12} />
                  Customer Baru
                </button>
              )}

              {/* Form Customer Baru */}
              {showNewForm && (
                <NewCustomerForm
                  onSave={handleNewCustomer}
                  onCancel={() => setShowNewForm(false)}
                />
              )}

              {/* Input Manual */}
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Nama (manual)"
                  className="w-full border border-gray-200 px-2 py-1.5 rounded text-xs"
                  value={customer.nama}
                  onChange={(e) =>
                    setCustomer({ ...customer, nama: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="No. Telepon"
                  className="w-full border border-gray-200 px-2 py-1.5 rounded text-xs"
                  value={customer.noTelp}
                  onChange={(e) =>
                    setCustomer({ ...customer, noTelp: e.target.value })
                  }
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
