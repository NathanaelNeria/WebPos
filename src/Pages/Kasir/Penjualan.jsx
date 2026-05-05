// src/Pages/Kasir/Penjualan.jsx
import { useState, useEffect, useCallback, useRef, use } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ShoppingCart, Trash2, AlertCircle, FileText } from "lucide-react";

import { useAuth } from "../../Hooks/useAuth";
import { useGudang } from "../../Hooks/useGudang";
import {
  validateRollForCart,
  processPenjualan,
  getAvailableRolls,
  TIPE_ITEM,
} from "../../Services/kasirService";

// Components
import Cart from "../../Components/Kasir/Cart";
import AvailableRolls from "../../Components/Kasir/AvailableRolls";
import CustomerForm from "../../Components/Kasir/CustomerForm";
import CheckoutButton from "../../Components/Kasir/CheckoutButton";
import PaymentModal from "../../Components/Kasir/PaymentModal";
import ScanBarcodeModal from "../../Components/Kasir/ScanBarcodeModal";
import NotaPreview from "../../Components/Kasir/NotaPreview";
import WasteInput from "../../Components/Kasir/Cart/WasteInput";
import PrinterModal from "../../Components/Kasir/PrinterModal";
import printNotaPenjualanRangkap from "../../Components/Kasir/PrintNotaPenjualanRangkap";
import printNotaPenjualanThermal from "../../Components/Kasir/PrintNotaPenjualanThermal";
import { fromUnit, toUnit } from "../../Utils/weight";
import AddManualItemModal from "../../Components/Kasir/AddManualItemModal";

/* ======================================================
   CONSTANTS & UTILS
====================================================== */
const format2 = (n) => parseFloat(n || 0).toFixed(2);
const formatRupiah = (n) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function Penjualan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGudangId, gudangNama, ensureGudang, activeGudang } =
    useGudang();

  const isTokoPenjualan = activeGudang?.isTokoPenjualan === true;

  // State
  const [cart, setCart] = useState([]);
  const [availableRolls, setAvailableRolls] = useState([]);
  const [loadingRolls, setLoadingRolls] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showNotaPreview, setShowNotaPreview] = useState(false);
  const [showWasteInput, setShowWasteInput] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState(null);
  const [customer, setCustomer] = useState({
    nama: "",
    noTelp: "",
    alamat: "",
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [printMode, setPrintMode] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ======================================================
     LOAD AVAILABLE ROLLS
  ===================================================== */
  const loadAvailableRolls = useCallback(async () => {
    if (!activeGudangId) return;

    setLoadingRolls(true);
    setSearchTerm("");
    setSearchResults([]);

    try {
      const rolls = await getAvailableRolls(activeGudangId);
      setAvailableRolls(rolls);
    } catch (error) {
      console.error("Error loading available rolls:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memuat daftar roll",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoadingRolls(false);
    }
  }, [activeGudangId]);

  /* ======================================================
     VALIDASI GUDANG
  ===================================================== */
  useEffect(() => {
    if (!ensureGudang()) {
      Swal.fire({
        icon: "warning",
        title: "Gudang Tidak Terdeteksi",
        text: "Silakan pilih gudang terlebih dahulu",
        confirmButtonColor: "#243A8C",
      }).then(() => navigate("/Kasir"));
      return;
    }

    if (!isTokoPenjualan) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: `Gudang ${gudangNama} bukan toko penjualan`,
        confirmButtonColor: "#d33",
      }).then(() => navigate("/Kasir"));
    } else {
      loadAvailableRolls();
    }
  }, [ensureGudang, isTokoPenjualan, gudangNama, navigate, loadAvailableRolls]);

  /* ======================================================
     HANDLE SEARCH
  ===================================================== */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      const q = value.toLowerCase();
      const filtered = availableRolls.filter((roll) => {
        const nama = roll.produk_nama?.toLowerCase() || "";
        const barcode = roll.kode_barcode?.toLowerCase() || "";
        const id = roll.id?.toLowerCase() || "";
        const kategori = roll.kategori?.toLowerCase() || "";

        return (
          nama.includes(q) ||
          barcode.includes(q) ||
          id.includes(q) ||
          kategori.includes(q)
        );
      });

      setSearchResults(filtered);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSelect = (roll) => {
    setSearchTerm("");
    setShowSearchDropdown(false);
    handleRollSelection(roll);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleScanBarcode(searchTerm);
    }
  };

  /* ======================================================
     HANDLE SCAN BARCODE
  ===================================================== */
  const handleScanBarcode = async (barcode) => {
    if (!barcode?.trim()) return;

    setLoading(true);
    setSearchTerm(barcode);

    try {
      const result = await validateRollForCart(barcode, activeGudangId);

      if (!result.valid) {
        const found = availableRolls.find(
          (roll) =>
            roll.kode_barcode?.toLowerCase() === barcode.toLowerCase() ||
            roll.id?.toLowerCase() === barcode.toLowerCase(),
        );

        if (found) {
          handleRollSelection(found);
        } else {
          Swal.fire({
            icon: "error",
            title: "Validasi Gagal",
            text: result.message || "Roll tidak ditemukan",
            confirmButtonColor: "#243A8C",
          });
          setSearchTerm("");
        }
        return;
      }

      handleRollSelection(result.roll);
    } catch (error) {
      console.error("Error scanning:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat scan barcode",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     HANDLE ROLL SELECTION
  ===================================================== */
  const handleRollSelection = async (roll) => {
    const existingItem = cart.find((item) => item.rollId === roll.id);

    if (existingItem) {
      const { value: action } = await Swal.fire({
        title: "Roll Sudah Ada di Keranjang",
        html: `
          <div class="text-left">
            <p class="mb-2">Roll <strong>${roll.id}</strong> sudah ada di keranjang.</p>
            <p class="text-sm text-gray-600">Apa yang ingin dilakukan?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Tambah Lagi (Ecer)",
        cancelButtonText: "Batal",
        showDenyButton: true,
        denyButtonText: "Jadi Rol Utuh",
        confirmButtonColor: "#243A8C",
        cancelButtonColor: "#d33",
      });

      if (action === true) {
        if (existingItem.tipe === TIPE_ITEM.ROL) {
          Swal.fire({
            icon: "error",
            title: "Tidak Bisa",
            text: "Roll ini sudah dijual sebagai Rol Utuh. Tidak bisa ditambah ecer.",
            confirmButtonColor: "#243A8C",
          });
          return;
        }

        const totalEcerSebelumnya = existingItem.berat_jual || 0;
        const totalUjungSebelumnya = existingItem.berat_ujung || 0;

        const sisaUnit =
          toUnit(roll.berat_sisa) -
          toUnit(totalEcerSebelumnya) -
          toUnit(totalUjungSebelumnya);

        const sisaBerat = Math.max(0, fromUnit(sisaUnit));

        if (sisaUnit <= 0) {
          Swal.fire({
            icon: "error",
            title: "Stok Habis",
            text: "Roll ini sudah habis",
            confirmButtonColor: "#243A8C",
          });
          return;
        }

        console.log("isi roll:", roll);

        setShowWasteInput(true);
        setSelectedRoll({
          ...roll,
          berat_sisa: sisaBerat,
          existingItem,
        });
      } else if (action === false) {
        if (existingItem.tipe === TIPE_ITEM.ECER) {
          Swal.fire({
            icon: "error",
            title: "Tidak Bisa",
            text: "Roll ini sudah dijual sebagai Ecer. Tidak bisa dijual Rol Utuh.",
            confirmButtonColor: "#243A8C",
          });
          return;
        }

        if (roll.is_rol_dibuka) {
          Swal.fire({
            icon: "error",
            title: "Tidak Bisa",
            text: "Roll ini sudah pernah dibuka. Tidak bisa dijual sebagai Rol Utuh.",
            confirmButtonColor: "#243A8C",
          });
          return;
        }

        addToCart(roll, TIPE_ITEM.ROL);
      }
      return;
    }

    const { value: tipe } = await Swal.fire({
      title: "Pilih Jenis Penjualan",
      html: `
        <div class="text-left space-y-3">
          <div class="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p class="font-mono text-sm bg-white p-2 rounded border text-center mb-3">${roll.id}</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><span class="text-gray-500">Produk:</span><span class="font-medium ml-1">${roll.produk_nama || "-"}</span></div>
              <div><span class="text-gray-500">Berat:</span><span class="font-medium ml-1">${format2(roll.berat_sisa)} kg</span></div>
              <div><span class="text-gray-500">Harga/kg:</span><span class="font-medium ml-1">${formatRupiah(roll.harga_jual)}</span></div>
            </div>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Jual Ecer (Buka Rol)",
      cancelButtonText: "Batal",
      showDenyButton: true,
      denyButtonText: "Jual Rol Utuh",
      confirmButtonColor: "#243A8C",
      cancelButtonColor: "#d33",
    });

    if (tipe === true) {
      setShowWasteInput(true);
      setSelectedRoll(roll);
    } else if (tipe === false) {
      if (roll.is_rol_dibuka) {
        Swal.fire({
          icon: "error",
          title: "Tidak Bisa",
          text: "Roll ini sudah pernah dibuka. Tidak bisa dijual sebagai Rol Utuh.",
          confirmButtonColor: "#243A8C",
        });
        return;
      }
      addToCart(roll, TIPE_ITEM.ROL);
    }
  };

  /* ======================================================
     ADD TO CART
  ===================================================== */
  const addToCart = (
    roll,
    tipe,
    beratJual = null,
    beratUjung = null,
    beratNeto = null,
    beratSisaDB = null,
  ) => {
    if (cart.find((item) => item.rollId === roll.id)) {
      Swal.fire({
        icon: "error",
        title: "Duplikat",
        text: "Roll ini sudah ada di keranjang!",
        confirmButtonColor: "#243A8C",
      });
      return;
    }

    const newItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      rollId: roll.id,
      barcode: roll.kode_barcode || roll.id,
      produkId: roll.produk_id,
      produkNama: roll.produk_nama || "Unknown",
      kategori: roll.kategori,
      harga_referensi: roll.harga_referensi || 0,
      group: roll.group || "-",
      harga_per_kg: roll.harga_jual || roll.harga_referensi || 0,
    };

    const hargaReferensi = roll.harga_referensi || 0;
    const tambahanEcer = roll.tambahanHargaEcer || 0;

    const hargaEcer = hargaReferensi + tambahanEcer;

    if (tipe === TIPE_ITEM.ROL) {
      setCart((prev) => [
        ...prev,
        {
          ...newItem,
          tipe: TIPE_ITEM.ROL,
          berat: roll.berat_sisa,
          subtotal:
            roll.berat_sisa * (roll.harga_jual || roll.harga_referensi || 0),
        },
      ]);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Roll utuh ditambahkan ke keranjang",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      console.log("bera neto di addToCart:", beratNeto);
      setCart((prev) => [
        ...prev,
        {
          ...newItem,
          tipe: TIPE_ITEM.ECER,
          berat_jual: beratJual,
          berat_ujung: beratUjung || 0,
          berat_neto: beratNeto ?? null,
          berat_sisa_db: beratSisaDB ?? null,
          berat_sisa_asal: roll.berat_sisa,
          tambahanHargaEcer: tambahanEcer,
          harga_per_kg: hargaEcer,
          subtotal: beratJual * hargaEcer,
        },
      ]);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Ecer ${format2(beratJual)} kg ditambahkan`,
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setShowWasteInput(false);
    setSelectedRoll(null);
    setSearchTerm("");
    setShowSearchDropdown(false);
  };

  /* ======================================================
     CART OPERATIONS
  ===================================================== */
  const removeFromCart = (itemId) => {
    Swal.fire({
      title: "Hapus Item?",
      text: "Item akan dihapus dari keranjang",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#243A8C",
      confirmButtonText: "Ya, Hapus",
    }).then((result) => {
      if (result.isConfirmed) {
        setCart((prev) => prev.filter((item) => item.id !== itemId));
      }
    });
  };

  const updateCartItem = (itemId, updates) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = {
          ...item,
          ...updates,
        };

        if (updated.tipe === TIPE_ITEM.ECER) {
          updated.subtotal =
            (updated.berat_jual || 0) * (updated.harga_per_kg || 0);
        }
        return updated;
      }),
    );
  };

  const handleUpdateHarga = (itemId, newHargaPerKg) => {
    const hargaBaru = Number(newHargaPerKg) || 0;

    setCart((prev) => {
      const triggerItem = prev.find((item) => item.id === itemId);
      if (!triggerItem) return prev;

      const { kategori, group, tipe } = triggerItem;

      // =========================
      // ✅ JIKA ECER DIUBAH
      // → hanya ECER dalam grup
      // =========================
      if (tipe === "ECER") {
        return prev.map((item) => {
          if (
            item.tipe !== "ECER" ||
            item.kategori !== kategori ||
            item.group !== group
          ) {
            return item;
          }

          return {
            ...item,
            harga_per_kg: hargaBaru,
            subtotal: hargaBaru * (item.berat_jual || 0),
          };
        });
      }

      // =========================
      // ✅ JIKA ROLL DIUBAH
      // → RESET TOTAL ECER
      // =========================
      const hargaRollBaru = hargaBaru;

      return prev.map((item) => {
        if (item.kategori !== kategori || item.group !== group) {
          return item;
        }

        const hargaPerKgBaru =
          item.tipe === "ECER"
            ? hargaRollBaru + (item.tambahanHargaEcer || 0)
            : hargaRollBaru;

        const berat =
          item.tipe === "ECER" ? item.berat_jual || 0 : item.berat || 0;

        return {
          ...item,
          harga_per_kg: hargaPerKgBaru,
          subtotal: hargaPerKgBaru * berat,
        };
      });
    });
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    Swal.fire({
      title: "Kosongkan Keranjang?",
      text: "Semua item akan dihapus",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#243A8C",
      confirmButtonText: "Ya, Kosongkan",
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        setCustomer({ nama: "", noTelp: "", alamat: "" });
        setCatatan("");
      }
    });
  };

  /* ======================================================
     HANDLE PAYMENT
  ===================================================== */
  const handlePayment = async (paymentData) => {
    if (cart.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Info",
        text: "Keranjang masih kosong",
        confirmButtonColor: "#243A8C",
      });
      return;
    }

    console.log("Payment data dari page penjualan:", paymentData);

    setProcessing(true);

    try {
      // Hitung summary cart
      const summary = cart.reduce(
        (acc, item) => {
          if (item.tipe === TIPE_ITEM.ROL) {
            acc.totalBerat += item.berat || 0;
            acc.totalHarga += item.subtotal || 0;
          } else {
            acc.totalBerat += item.berat_jual || 0;
            acc.totalUjung += item.berat_ujung || 0;
            acc.totalHarga += item.subtotal || 0;
          }
          return acc;
        },
        { totalBerat: 0, totalUjung: 0, totalHarga: 0 },
      );

      // Siapkan data customer dengan format yang benar
      const customerData = customer.nama
        ? {
            id: customer.id,
            nama: customer.nama,
            noTelp: customer.noTelp,
            alamat: customer.alamat,
            kode: customer.kode,
          }
        : null;

      const result = await processPenjualan({
        gudangId: activeGudangId,
        gudangNama,
        kasir: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        items: cart,
        pembayaran: paymentData,
        customer: customerData,
        catatan,
      });

      // ✅ PAKAI DATA DARI BACKEND
      setLastTransaction({
        ...result,
        items: cart,
        customer: customerData,
        tanggal: new Date().toISOString(),
        kasir: user.nama,
        gudang: gudangNama,
        metodePembayaran: paymentData.metode,
        statusPembayaran: paymentData.status || "PAID",
        catatan,
        totalBerat: summary.totalBerat,
        totalUjung: summary.totalUjung,
        subtotal: paymentData.subtotal || 0,
        potongan: paymentData.potongan || 0,
        ongkir: paymentData.ongkir || 0,
      });

      // Kosongkan keranjang dan reset form
      setCart([]);
      setCustomer({ nama: "", noTelp: "", alamat: "" });
      setCatatan("");

      // Tutup payment modal
      setShowPaymentModal(false);

      // Buka printer modal untuk pilih jenis printer
      setShowPrinterModal(true);

      // Reload available rolls
      loadAvailableRolls();
    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire({
        icon: "error",
        title: "Transaksi Gagal",
        text: error.message || "Terjadi kesalahan",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setProcessing(false);
    }
  };

  /* ======================================================
     HANDLE PRINTER SELECT
  ===================================================== */
  // const handlePrinterSelect = (printerType) => {
  //   setShowPrinterModal(false);

  //   if (printerType === "thermal") {
  //     setShowNotaPreview(true);
  //   } else if (printerType === "a4") {
  //     setShowNotaBesar(true);
  //   }
  // };

  const handlePrinterSelect = (printerType) => {
    setShowPrinterModal(false);

    // ✅ SET PRINT MODE KE BODY
    document.body.classList.remove("thermal", "a4");
    document.body.classList.add(printerType);

    setPrintMode(printerType);

    if (printerType === "thermal") {
      printNotaPenjualanThermal(lastTransaction);
    } else if (printerType === "a4") {
      printNotaPenjualanRangkap(lastTransaction);
    }
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("thermal", "a4");
      setPrintMode(null);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  /* ======================================================
     HANDLE MANUAL ITEM
  ===================================================== */
  const addManualItemToCart = ({ nama, tipe, berat, harga }) => {
    const rollId = `MANUAL${Date.now()}`.slice(0, 16);

    if (tipe === TIPE_ITEM.ROL) {
      setCart((prev) => [
        ...prev,
        {
          id: rollId,
          rollId,
          barcode: null,
          produkId: null,
          produkNama: nama,
          kategori: "MANUAL",
          tipe: TIPE_ITEM.ROL,
          berat,
          harga_per_kg: harga,
          subtotal: berat * harga,
          isManual: true,
        },
      ]);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: rollId,
          rollId,
          barcode: null,
          produkId: null,
          produkNama: nama,
          kategori: "MANUAL",
          tipe: TIPE_ITEM.ECER,
          berat_jual: berat,
          berat_ujung: 0,
          harga_per_kg: harga,
          subtotal: berat * harga,
          isManual: true,
        },
      ]);
    }

    setShowManualModal(false);
  };

  /* ======================================================
     COMPUTED VALUES
  ===================================================== */
  const cartSummary = cart.reduce(
    (acc, item) => {
      if (item.tipe === TIPE_ITEM.ROL) {
        acc.totalItem += 1;
        acc.totalBerat += item.berat || 0;
        acc.totalHarga += item.subtotal || 0;
        acc.totalRol += 1;
      } else {
        acc.totalItem += 1;
        acc.totalBerat += item.berat_jual || 0;
        acc.totalUjung += item.berat_ujung || 0;
        acc.totalHarga += item.subtotal || 0;
        acc.totalEcer += 1;
      }
      return acc;
    },
    {
      totalItem: 0,
      totalBerat: 0,
      totalUjung: 0,
      totalHarga: 0,
      totalRol: 0,
      totalEcer: 0,
    },
  );

  /* ======================================================
     RENDER
  ===================================================== */
  if (!isTokoPenjualan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="bg-white p-8 rounded-xl shadow-hard max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-darkblue mb-3">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-6">
            Gudang {gudangNama} bukan toko penjualan.
          </p>
          <button
            onClick={() => navigate("/Kasir")}
            className="px-6 py-3 bg-primary text-white rounded-lg"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-card p-6 rounded-xl shadow-soft text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <ShoppingCart className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-2xl font-bold">Penjualan Kasir</h1>
              <p className="text-sm text-gray-300">
                {gudangNama} • {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <AvailableRolls
              rolls={searchTerm ? searchResults : availableRolls}
              loading={loadingRolls}
              searchTerm={searchTerm}
              searchResults={searchResults}
              showDropdown={showSearchDropdown}
              onSearchChange={handleSearchChange}
              onSearchKeyPress={handleSearchKeyPress}
              onClearSearch={() => {
                setSearchTerm("");
                setSearchResults([]);
                setShowSearchDropdown(false);
              }}
              onSelectResult={handleSearchSelect}
              onRefresh={loadAvailableRolls}
              onRollClick={handleRollSelection}
              onAddManualItem={() => setShowManualModal(true)}
              searchRef={searchRef}
              setShowDropdown={setShowSearchDropdown}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <Cart
              cart={cart}
              onRemove={removeFromCart}
              onUpdateItem={updateCartItem}
              onUpdateHarga={handleUpdateHarga}
              summary={cartSummary}
              format2={format2}
            />

            {cart.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-soft border">
                <CustomerForm
                  customer={customer}
                  setCustomer={setCustomer}
                  showCustomerForm={showCustomerForm}
                  setShowCustomerForm={setShowCustomerForm}
                />

                <div className="p-6 border-b">
                  <label className="text-xs text-gray-500 mb-1 block">
                    <FileText size={14} className="inline mr-1 text-primary" />
                    Catatan Transaksi
                  </label>
                  <textarea
                    className="border border-gray-200 p-3 rounded-lg w-full text-sm"
                    placeholder="Catatan (opsional)..."
                    rows="2"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </div>

                <CheckoutButton
                  onClick={() => setShowPaymentModal(true)}
                  processing={processing}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScanBarcodeModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScan={handleScanBarcode}
        loading={loading}
      />

      <WasteInput
        isOpen={showWasteInput}
        onClose={() => {
          setShowWasteInput(false);
          setSelectedRoll(null);
        }}
        roll={selectedRoll}
        onConfirm={({ beratJual, beratUjung, beratNeto, beratSisaDB }) => {
          const existingEcer = cart.find(
            (item) =>
              item.rollId === selectedRoll.id && item.tipe === TIPE_ITEM.ECER,
          );

          console.log("berat neto dari waste input:", beratNeto);

          addToCart(
            selectedRoll,
            TIPE_ITEM.ECER,
            beratJual,
            beratUjung,
            existingEcer ? null : beratNeto,
            existingEcer ? null : beratSisaDB,
          );
        }}
        format2={format2}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
        totalHarga={cartSummary.totalHarga}
        processing={processing}
        formatRupiah={formatRupiah}
      />

      <PrinterModal
        isOpen={showPrinterModal}
        onClose={() => {
          setShowPrinterModal(false);
          // Kalau batal print, langsung reset ke halaman awal tanpa buka nota
        }}
        onSelectPrinter={handlePrinterSelect}
        totalHarga={cartSummary.totalHarga}
        formatRupiah={formatRupiah}
      />

      <NotaPreview
        isOpen={showNotaPreview}
        onClose={() => setShowNotaPreview(false)}
        transaction={lastTransaction}
        format2={format2}
      />

      <AddManualItemModal
        isOpen={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          console.log("closed manual modal");
        }}
        onSubmit={addManualItemToCart}
      />
    </div>
  );
}
