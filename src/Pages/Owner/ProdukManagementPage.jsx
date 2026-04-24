import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { db } from "../../Services/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  // eslint-disable-next-line no-unused-vars
  setDoc,
  // eslint-disable-next-line no-unused-vars
  updateDoc,
  // eslint-disable-next-line no-unused-vars
  deleteDoc,
  serverTimestamp,
  getDocs,
  where,
  runTransaction,
} from "firebase/firestore";
import { useAuth } from "../../Hooks/useAuth";
import Swal from "sweetalert2";

// Icons
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  X,
  Hash,
  Lock,
  Pencil,
} from "lucide-react";

// Helper function untuk format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ProdukManagementPage() {
  const { currentUser } = useAuth();
  const [produk, setProduk] = useState([]);
  const [filteredProduk, setFilteredProduk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("semua");
  const [activeCategory, setActiveCategory] = useState("semua");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    kategori: "",
    hargaReferensi: 0,
    status: "active",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [kategoriDraft, setKategoriDraft] = useState("");

  // Ref untuk mencegah double submit
  const isSubmitting = useRef(false);

  // Stats
  const [stats, setStats] = useState({
    totalProduk: 0,
    totalAktif: 0,
    totalNonaktif: 0,
    avgHarga: 0,
  });

  // Fungsi untuk format ID tampilan (6 digit terakhir)
  const formatDisplayId = (fullId) => {
    if (!fullId) return "-";
    // Ambil angka timestamp dari ID (format: produk_TIMESTAMP)
    const timestamp = fullId.replace("produk_", "");
    // Ambil 6 digit terakhir
    const last6Digits = timestamp.slice(-6);
    return `produk_${last6Digits}`;
  };

  // Generate product ID dengan timestamp (LANGSUNG RETURN STRING, BUKAN ASYNC)
  const generateProductId = () => {
    // Format: produk_TIMESTAMP (contoh: produk_1743045678901)
    return `produk_${Date.now()}`;
  };

  // NORMALISASI DATA: Hapus field id yang tidak perlu
  const normalizeProductData = (docId, data) => {
    // Buat object baru tanpa field "id" jika ada
    const { id, ...cleanData } = data || {};

    return {
      id: docId, // Gunakan document ID sebagai id
      ...cleanData, // Data bersih tanpa field id
    };
  };

  // Process produk data
  const processProdukData = useCallback((snapshot) => {
    const produkList = snapshot.docs.map((docSnap) => {
      return normalizeProductData(docSnap.id, docSnap.data());
    });

    // console.log("✅ Produk loaded:", produkList.length);
    setProduk(produkList);
    setFilteredProduk(produkList);
    setLastUpdated(new Date());

    // Calculate stats
    const totalProduk = produkList.length;
    const totalAktif = produkList.filter((p) => p?.status === "active").length;
    const totalNonaktif = totalProduk - totalAktif;
    const avgHarga =
      totalProduk > 0
        ? produkList.reduce((sum, p) => sum + (p?.hargaReferensi || 0), 0) /
          totalProduk
        : 0;

    setStats({
      totalProduk,
      totalAktif,
      totalNonaktif,
      avgHarga: Math.round(avgHarga),
    });

    setLoading(false);
    setRefreshing(false);
  }, []);

  // Fetch produk with onSnapshot (real-time)
  useEffect(() => {
    setLoading(true);
    console.log("📦 Setting up real-time listener for produk...");

    const q = query(collection(db, "produk"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        processProdukData(snapshot);
      },
      (error) => {
        console.error("❌ Error fetching produk:", error);
        setLoading(false);
        setRefreshing(false);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: "Tidak dapat terhubung ke server",
          confirmButtonColor: "#0C1E6E",
        });
      },
    );

    return () => unsubscribe();
  }, [processProdukData]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("🔄 Manual refresh triggered...");
      const q = query(collection(db, "produk"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      processProdukData(snapshot);

      Swal.fire({
        icon: "success",
        title: "Data Diperbarui",
        text: `Berhasil memuat ${snapshot.size} produk`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Refresh",
        text: error.message || "Terjadi kesalahan saat refresh data",
        confirmButtonColor: "#0C1E6E",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter produk
  useEffect(() => {
    let filtered = [...produk];

    // Filter by search term
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item?.nama?.toLowerCase().includes(searchTerm) ||
          item?.kategori?.toLowerCase().includes(searchTerm) ||
          item?.kode?.toLowerCase().includes(searchTerm),
      );
    }

    // Filter by status
    if (activeFilter !== "semua") {
      filtered = filtered.filter((item) => item?.status === activeFilter);
    }

    // Filter by category
    if (activeCategory !== "semua") {
      filtered = filtered.filter((item) => item?.kategori === activeCategory);
    }

    setFilteredProduk(filtered);
  }, [search, produk, activeFilter, activeCategory]);

  // Get unique categories
  const categories = [
    "semua",
    ...new Set(produk.map((p) => p?.kategori).filter(Boolean)),
  ];

  // Reset form
  const resetForm = () => {
    setFormData({
      kode: "",
      nama: "",
      kategori: "",
      hargaReferensi: 0,
      status: "active",
    });
    setEditingProduct(null);
    setValidationErrors({});
  };

  // Open modal for add/edit - AMAN
  const handleOpenModal = (product = null) => {
    // Prevent open modal if already saving
    if (isSaving) return;

    if (product) {
      setEditingProduct(product);
      setFormData({
        kode: product.kode || "",
        nama: product.nama || "",
        kategori: product.kategori || "",
        hargaReferensi: product.hargaReferensi || 0,
        status: product.status || "active",
      });
      setKategoriDraft(product.kategori || "");
    } else {
      resetForm();
      setKategoriDraft("");
    }
    setShowModal(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.kode.trim()) {
      errors.kode = "Kode produk wajib diisi";
    } else if (formData.kode.length < 3) {
      errors.kode = "Kode minimal 3 karakter";
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.kode.toUpperCase())) {
      errors.kode = "Kode hanya boleh huruf besar dan angka (3-10 karakter)";
    }

    if (!formData.nama.trim()) {
      errors.nama = "Nama produk wajib diisi";
    }

    if (!kategoriDraft.trim()) {
      errors.kategori = "Kategori wajib diisi";
    }

    if (
      formData.hargaReferensi === undefined ||
      formData.hargaReferensi === null ||
      formData.hargaReferensi < 0
    ) {
      errors.hargaReferensi = "Harga referensi tidak valid";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if kode exists
  const checkKodeExists = async (kode, excludeId = null) => {
    const q = query(
      collection(db, "produk"),
      where("kode", "==", kode.toUpperCase()),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;

    if (excludeId) {
      // Jika editing, exclude current product
      const existingDoc = snapshot.docs.find((doc) => doc.id === excludeId);
      return !existingDoc; // Return true jika ada dokumen lain dengan kode yang sama
    }

    return true;
  };

  // Save product dengan SUPER AMAN (race condition proof)
  const handleSave = async () => {
    // Cegah double submit dengan ref
    if (isSubmitting.current || isSaving) {
      console.log("⏳ Submit sedang berlangsung, dicegah");
      return;
    }

    const dataToSave = {
      ...formData,
      kategori: kategoriDraft.trim(),
    };

    if (!dataToSave.kategori) {
      setValidationErrors({ kategori: "Kategori wajib diisi" });
      return;
    }

    // Validasi form
    if (!validateForm()) return;

    let retryCount = 0;

    try {
      // Set submitting flags
      isSubmitting.current = true;
      setIsSaving(true);

      // Tampilkan loading
      const loadingSwal = Swal.fire({
        title: "Menyimpan Produk...",
        text: "Sedang menyimpan data ke server",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Cek duplikasi kode sebelum mulai
      const kodeExists = await checkKodeExists(
        formData.kode,
        editingProduct?.id,
      );

      if (kodeExists) {
        await loadingSwal.close();
        Swal.fire({
          icon: "warning",
          title: "Kode Sudah Digunakan",
          text: `Kode ${formData.kode} sudah digunakan oleh produk lain`,
          confirmButtonColor: "#0C1E6E",
        });
        isSubmitting.current = false;
        setIsSaving(false);
        return;
      }

      const timestamp = serverTimestamp();
      const productData = {
        kode: formData.kode.toUpperCase().trim(),
        nama: formData.nama.trim(),
        kategori: kategoriDraft.trim(),
        hargaReferensi: Number(formData.hargaReferensi) || 0,
        status: formData.status,
        updatedAt: timestamp,
      };

      let productId;
      let success = false;
      const MAX_RETRY = 5;

      if (editingProduct) {
        // UPDATE - menggunakan transaction untuk keamanan ekstra
        productId = editingProduct.id;

        try {
          await runTransaction(db, async (transaction) => {
            // Cek apakah dokumen masih ada
            const docRef = doc(db, "produk", productId);
            const docSnap = await transaction.get(docRef);

            if (!docSnap.exists()) {
              throw new Error("Produk tidak ditemukan");
            }

            // Cek duplikasi kode sekali lagi dalam transaction
            const kodeCheckQuery = query(
              collection(db, "produk"),
              where("kode", "==", formData.kode.toUpperCase()),
            );
            const kodeCheckSnap = await getDocs(kodeCheckQuery);

            if (!kodeCheckSnap.empty) {
              const otherDoc = kodeCheckSnap.docs.find(
                (d) => d.id !== productId,
              );
              if (otherDoc) {
                throw new Error("KODE_DUPLIKAT");
              }
            }

            // Update dokumen
            transaction.update(docRef, productData);
          });

          success = true;
          console.log("✅ UPDATE berhasil dengan transaction:", productId);
        } catch (error) {
          if (error.message === "KODE_DUPLIKAT") {
            throw new Error(
              `Kode ${formData.kode} sudah digunakan oleh produk lain`,
            );
          }
          throw error;
        }
      } else {
        // CREATE - dengan retry mechanism dan transaction

        // Create a function outside the loop to avoid no-loop-func warning
        const attemptCreate = async (currentRetryCount) => {
          const newId = generateProductId();

          await runTransaction(db, async (transaction) => {
            const newDocRef = doc(db, "produk", newId);
            const newDocSnap = await transaction.get(newDocRef);

            if (newDocSnap.exists()) {
              throw new Error("ID_EXISTS");
            }

            const kodeCheckQuery = query(
              collection(db, "produk"),
              where("kode", "==", formData.kode.toUpperCase()),
            );
            const kodeCheckSnap = await getDocs(kodeCheckQuery);

            if (!kodeCheckSnap.empty) {
              const otherDoc = kodeCheckSnap.docs.find(
                (d) => d.id !== productId,
              );
              if (otherDoc) {
                throw new Error("KODE_DUPLIKAT");
              }
            }

            transaction.set(newDocRef, {
              ...productData,
              createdAt: timestamp,
            });

            productId = newId;
          });

          success = true;
          console.log(
            `✅ CREATE berhasil di percobaan ke-${currentRetryCount + 1}:`,
            productId,
          );
        };

        while (!success && retryCount < MAX_RETRY) {
          try {
            await attemptCreate(retryCount);
          } catch (error) {
            retryCount++;

            if (error.message === "KODE_DUPLIKAT") {
              // Kode duplikat, tidak perlu retry
              throw new Error(
                `Kode ${formData.kode} sudah digunakan oleh produk lain`,
              );
            } else if (error.message === "ID_EXISTS") {
              // ID collision, retry dengan ID baru
              console.log(`⚠️ ID collision, retry ${retryCount}/${MAX_RETRY}`);
              if (retryCount >= MAX_RETRY) {
                throw new Error(
                  "Gagal membuat produk setelah 5 kali percobaan (ID collision)",
                );
              }
              // Lanjut retry dengan ID baru
            } else {
              // Error lain, throw
              throw error;
            }
          }
        }
      }

      if (!success) {
        throw new Error("Gagal menyimpan produk setelah beberapa percobaan");
      }

      await loadingSwal.close();

      // Verifikasi dengan hitung manual
      const verifySnapshot = await getDocs(collection(db, "produk"));
      console.log("📊 Verifikasi total produk:", verifySnapshot.size);

      // Sweet alert sukses
      await Swal.fire({
        icon: "success",
        title: editingProduct ? "Produk Diperbarui" : "Produk Ditambahkan",
        text: `${formData.nama} (${formData.kode}) berhasil ${
          editingProduct ? "diperbarui" : "ditambahkan"
        }`,
        confirmButtonColor: "#0C1E6E",
        timer: 2000,
        showConfirmButton: true,
      });

      // Close modal dan reset form
      setShowModal(false);
      resetForm();

      // Trigger manual refresh untuk memastikan data terbaru
      // await handleManualRefresh();
    } catch (error) {
      console.error("❌ Error saving product:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      // Tampilkan error yang user-friendly
      let errorMessage =
        error.message || "Terjadi kesalahan saat menyimpan data";
      let errorTitle = "Gagal Menyimpan";

      if (
        error.message?.includes("KODE_DUPLIKAT") ||
        error.message?.includes("already used")
      ) {
        errorTitle = "Kode Sudah Digunakan";
        errorMessage = `Kode ${formData.kode} sudah digunakan oleh produk lain`;
      } else if (error.code === "permission-denied") {
        errorMessage = "Anda tidak memiliki izin untuk menyimpan data";
      } else if (error.code === "unavailable") {
        errorMessage = "Koneksi internet bermasalah. Silakan coba lagi";
      }

      await Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        footer: retryCount > 0 ? `Percobaan: ${retryCount}x` : undefined,
        confirmButtonColor: "#0C1E6E",
      });
    } finally {
      // Reset submitting flags
      isSubmitting.current = false;
      setIsSaving(false);
    }
  };

  // Delete product dengan transaction
  const handleDelete = async (product) => {
    // Cegah double click
    if (isSubmitting.current) return;

    const result = await Swal.fire({
      title: "Hapus Produk?",
      html: `<div class="text-left">
        <p class="font-semibold">${product.nama} (${product.kode})</p>
        <p class="text-sm text-gray-600 mt-1">Produk akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
      </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      isSubmitting.current = true;

      const loadingSwal = Swal.fire({
        title: "Menghapus Produk...",
        text: "Sedang menghapus data dari server",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Gunakan transaction untuk delete
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, "produk", product.id);
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          throw new Error("Produk tidak ditemukan");
        }

        transaction.delete(docRef);
      });

      console.log("✅ DELETE berhasil:", product.id);

      await loadingSwal.close();

      await Swal.fire({
        icon: "success",
        title: "Produk Dihapus",
        text: `${product.nama} (${product.kode}) telah dihapus`,
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh data
      // handleManualRefresh();
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: error.message || "Terjadi kesalahan saat menghapus data",
        confirmButtonColor: "#0C1E6E",
      });
    } finally {
      isSubmitting.current = false;
    }
  };

  // Toggle status dengan transaction
  const handleToggleStatus = async (product) => {
    // Cegah double click
    if (isSubmitting.current) return;

    const newStatus = product.status === "active" ? "inactive" : "active";
    const statusText = newStatus === "active" ? "diaktifkan" : "dinonaktifkan";

    const result = await Swal.fire({
      title: `${newStatus === "active" ? "Aktifkan" : "Nonaktifkan"} Produk?`,
      html: `<div class="text-left">
        <p class="font-semibold">${product.nama} (${product.kode})</p>
        <p class="text-sm text-gray-600 mt-1">Produk akan ${statusText}.</p>
      </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newStatus === "active" ? "#28a745" : "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Ya, ${
        newStatus === "active" ? "Aktifkan" : "Nonaktifkan"
      }`,
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      isSubmitting.current = true;

      // Gunakan transaction untuk update status
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, "produk", product.id);
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          throw new Error("Produk tidak ditemukan");
        }

        transaction.update(docRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      });

      Swal.fire({
        icon: "success",
        title: `Produk ${statusText}`,
        text: `${product.nama} (${product.kode}) berhasil ${statusText}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("❌ Error toggling status:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengubah Status",
        text: error.message || "Terjadi kesalahan saat mengubah status",
        confirmButtonColor: "#0C1E6E",
      });
    } finally {
      isSubmitting.current = false;
    }
  };

  const KATEGORI_PREFIX_MAP = {
    abutay: "ABU",
    "dobel katun": "DKT",
    handuk: "HAN",
    "ribe pe": "RIPE",
    "hg 45": "HG45",
    lotto: "LOT",
    "serena 36": "SER",
    "pe dk": "PEDK",
    "lacoste pe": "LAC",
    diadora: "DIA",
    "hg 60": "HG60",
    adidas: "ADI",
    "rib ct": "RCT",
    krah: "KRAH",
    ailet: "AIL",
    plastik: "PLA",
    bilabong: "BIL",
    fleece: "FLE",
    "tc 24": "TC24",
    "tc 30": "TC30",
    "cd 24": "CD24",
    "cd 30": "CD30",
    "cm 24": "CM24",
    "cm 30": "CM30",
    "pique tc": "PIQ",
    manset: "MAN",
    "pe sk": "PESK",
    "hg 36": "HG36",
  };

  const groupedData = filteredProduk.reduce((acc, p) => {
    const kategori = p.kategori || "Tanpa Kategori";
    const group = p.group || "Lainnya";

    if (!acc[kategori]) acc[kategori] = {};
    if (!acc[kategori][group]) acc[kategori][group] = [];

    acc[kategori][group].push(p);
    return acc;
  }, {});

  // Calculate suggested next kode
  const calculateNextKode = () => {
    const kategoriKey = kategoriDraft.trim().toLowerCase().replace(/\s+/g, " ");

    const prefix = KATEGORI_PREFIX_MAP[kategoriKey];

    if (!prefix) {
      Swal.fire({
        icon: "warning",
        title: "Prefix belum ada",
        text: `Kategori "${kategoriDraft}" belum punya prefix kode`,
      });
      return "";
    }

    const lastProduct = produk
      .filter(
        (p) =>
          p?.kode &&
          p.kode.startsWith(prefix) &&
          new RegExp(`^${prefix}\\d{3}$`).test(p.kode),
      )
      .sort((a, b) => {
        const numA = parseInt(a.kode.slice(prefix.length), 10);
        const numB = parseInt(b.kode.slice(prefix.length), 10);
        return numB - numA;
      })[0];

    const nextNum = lastProduct
      ? String(
          parseInt(lastProduct.kode.slice(prefix.length), 10) + 1,
        ).padStart(3, "0")
      : "001";

    return `${prefix}${nextNum}`;
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setActiveFilter("semua");
    setActiveCategory("semua");
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      {/* Header dengan Refresh Button */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#000B42] flex items-center gap-3">
              <Package size={28} className="text-[#000B42]" />
              Manajemen Produk
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola data master produk dan harga referensi
            </p>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Lock size={14} className="text-green-600" />
              Owner |{" "}
              {currentUser?.nama || currentUser?.email || "Administrator"}
              {isSaving && (
                <span className="ml-2 text-blue-600 flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" />
                  Menyimpan...
                </span>
              )}
            </p>
          </div>

          {/* Date and Refresh Button */}
          <div className="text-right flex items-center gap-3">
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading || isSaving}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                refreshing || loading || isSaving
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              title="Refresh data"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Menyegarkan..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Last Updated Info */}
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <span>
            Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
          </span>
          {refreshing && (
            <span className="text-blue-600 flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" />
              Menyegarkan data...
            </span>
          )}
          {isSaving && (
            <span className="text-green-600 flex items-center gap-1">
              <Save size={12} className="animate-pulse" />
              Menyimpan...
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Produk</p>
              <p className="text-2xl font-bold text-[#000B42]">
                {stats.totalProduk}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Data master produk</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produk Aktif</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalAktif}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye size={20} className="text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            Siap untuk transaksi
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produk Nonaktif</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.totalNonaktif}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <EyeOff size={20} className="text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-red-600">Tidak tersedia</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rata-rata Harga</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.avgHarga)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600">
            Harga referensi rata-rata
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk (nama, kategori, kode)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#EEF1FA] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#243A8C] focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter("semua")}
                disabled={isSaving}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  activeFilter === "semua"
                    ? "bg-[#000B42] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Filter size={14} />
                Semua Status
              </button>
              <button
                onClick={() => setActiveFilter("active")}
                disabled={isSaving}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  activeFilter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Eye size={14} />
                Aktif
              </button>
              <button
                onClick={() => setActiveFilter("inactive")}
                disabled={isSaving}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  activeFilter === "inactive"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <EyeOff size={14} />
                Nonaktif
              </button>
            </div>

            <button
              onClick={handleResetFilters}
              disabled={isSaving}
              className={`px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2 transition-all ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Reset filter"
            >
              <RefreshCw size={14} />
              Reset
            </button>

            <button
              onClick={() => handleOpenModal()}
              disabled={isSaving}
              className={`px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 transition-all ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Plus size={18} />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            <Tag size={16} className="text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  disabled={isSaving}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    activeCategory === category
                      ? "bg-[#000B42] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {category === "semua" ? "Semua Kategori" : category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Info */}
        {(activeFilter !== "semua" || activeCategory !== "semua" || search) && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              Filter aktif:{" "}
              {activeFilter !== "semua" && (
                <span className="font-semibold ml-1">
                  Status: {activeFilter === "active" ? "Aktif" : "Nonaktif"}
                </span>
              )}
              {activeCategory !== "semua" && (
                <span className="font-semibold ml-1">
                  Kategori: {activeCategory}
                </span>
              )}
              {search && (
                <span className="font-semibold ml-1">
                  Pencarian: "{search}"
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-y-auto border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Referensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Diubah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(groupedData).map(([kategori, groups]) => (
                <Fragment key={kategori}>
                  {/* ================= HEADER KATEGORI ================= */}
                  <tr className="bg-blue-100">
                    <td
                      colSpan={7}
                      className="px-6 py-3 font-bold text-blue-900"
                    >
                      📦 Kategori: {kategori}
                    </td>
                  </tr>

                  {Object.entries(groups).map(([groupName, items]) => (
                    <Fragment key={groupName}>
                      {/* ================= HEADER GROUP ================= */}
                      <tr className="bg-gray-100">
                        <td
                          colSpan={7}
                          className="px-10 py-2 font-semibold text-gray-800"
                        >
                          ▶ Group: {groupName} ({items.length})
                        </td>
                      </tr>

                      {/* ================= ROW PRODUK (ACTION ADA DI SINI) ================= */}
                      {items.map((product) => (
                        <tr
                          key={product.id}
                          className={`hover:bg-gray-50 ${
                            isSaving ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {/* KODE */}
                          <td className="px-6 py-4">{product.kode}</td>

                          {/* NAMA */}
                          <td className="px-6 py-4">{product.nama}</td>

                          {/* KATEGORI */}
                          <td className="px-6 py-4">{product.kategori}</td>

                          {/* HARGA */}
                          <td className="px-6 py-4 text-green-600 font-semibold">
                            {formatCurrency(product.hargaReferensi || 0)}
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                product.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.status === "active"
                                ? "AKTIF"
                                : "NONAKTIF"}
                            </span>
                          </td>

                          {/* TERAKHIR DIUBAH */}
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {product.updatedAt
                              ?.toDate?.()
                              .toLocaleDateString("id-ID") || "-"}
                          </td>

                          {/* ✅ ACTION BUTTON TETAP ADA */}
                          <td className="px-6 py-4 sticky right-0 bg-white">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(product)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={() => handleToggleStatus(product)}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Aktif / Nonaktif"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(product)}
                                className="text-red-600 hover:text-red-800"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {filteredProduk.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                Menampilkan{" "}
                <span className="font-semibold">{filteredProduk.length}</span>{" "}
                dari <span className="font-semibold">{produk.length}</span>{" "}
                produk
                {(activeFilter !== "semua" || activeCategory !== "semua") && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {activeFilter !== "semua" && `Status: ${activeFilter}`}
                    {activeCategory !== "semua" &&
                      ` Kategori: ${activeCategory}`}
                  </span>
                )}
              </div>
              <div className="text-right">
                Harga referensi tertinggi:{" "}
                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    Math.max(
                      ...filteredProduk.map((p) => p.hargaReferensi || 0),
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#000B42] to-[#243A8C] p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Package size={24} />
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {editingProduct
                        ? `Mengedit ${editingProduct.nama}`
                        : "Tambahkan produk master baru"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isSaving) {
                      setShowModal(false);
                      resetForm();
                    }
                  }}
                  disabled={isSaving}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition disabled:opacity-50"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Kode Produk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Produk <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.kode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kode: e.target.value.toUpperCase(),
                          })
                        }
                        disabled={isSaving}
                        className={`w-full border ${
                          validationErrors.kode
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:border-[#000B42] focus:ring-[#000B42]"
                        } rounded-lg p-3 text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        placeholder="Contoh: RPE011"
                        maxLength={10}
                      />
                      {!editingProduct && !isSaving && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              kode: calculateNextKode(),
                            })
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                    {validationErrors.kode && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.kode}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Gunakan format singkat dan unik
                    </p>
                  </div>

                  {/* Nama Produk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      disabled={isSaving}
                      className={`w-full border ${
                        validationErrors.nama
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-[#000B42] focus:ring-[#000B42]"
                      } rounded-lg p-3 text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      placeholder="Contoh: Krem Rib PE"
                    />
                    {validationErrors.nama && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.nama}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Kategori */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        list="kategori-list"
                        value={kategoriDraft}
                        onChange={(e) => setKategoriDraft(e.target.value)}
                        placeholder="Pilih atau ketik kategori baru"
                        disabled={isSaving}
                        className={`w-full border ${
                          validationErrors.kategori
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-lg p-3 text-sm`}
                      />

                      <datalist id="kategori-list">
                        {categories
                          .filter((cat) => cat !== "semua")
                          .map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                      </datalist>
                      {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div> */}
                    </div>
                    {validationErrors.kategori && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.kategori}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Pilih kategori yang sudah ada atau buat baru
                    </p>
                  </div>

                  {/* Harga Referensi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga Referensi (Rp/kg){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.hargaReferensi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hargaReferensi: parseInt(e.target.value) || 0,
                        })
                      }
                      disabled={isSaving}
                      className={`w-full border ${
                        validationErrors.hargaReferensi
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-[#000B42] focus:ring-[#000B42]"
                      } rounded-lg p-3 text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      placeholder="Contoh: 27440"
                      min="0"
                      step="1000"
                    />
                    {validationErrors.hargaReferensi && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.hargaReferensi}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Digunakan sebagai referensi harga beli/jual
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        disabled={isSaving}
                        className="text-green-600 focus:ring-green-500 disabled:opacity-50"
                      />
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm">Aktif</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        disabled={isSaving}
                        className="text-red-600 focus:ring-red-500 disabled:opacity-50"
                      />
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm">Nonaktif</span>
                      </span>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Produk aktif akan muncul di daftar untuk transaksi
                  </p>
                </div>

                {/* Preview */}
                {formData.nama && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-800 font-semibold mb-2">
                      Preview Produk
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">Kode</div>
                        <div className="font-bold">{formData.kode || "-"}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Nama</div>
                        <div className="font-bold">{formData.nama || "-"}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Harga</div>
                        <div className="font-bold text-green-700">
                          {formatCurrency(formData.hargaReferensi || 0)}/kg
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">
                    {editingProduct
                      ? "Mengedit produk"
                      : "Menambahkan produk baru"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {editingProduct
                      ? "Perubahan akan diterapkan di semua gudang"
                      : "Produk akan tersedia untuk semua gudang"}
                    {isSaving && (
                      <span className="ml-2 text-blue-600 flex items-center gap-1">
                        <RefreshCw size={12} className="animate-spin" />
                        Menyimpan...
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!isSaving) {
                        setShowModal(false);
                        resetForm();
                      }
                    }}
                    disabled={isSaving}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingProduct ? "Simpan Perubahan" : "Simpan Produk"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
