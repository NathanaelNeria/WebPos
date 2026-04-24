// BarangMasuk.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  AlertCircle,
  Layers,
  Package,
  Printer,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

// Hooks
import { useGudang } from "../../Hooks/useGudang";
import { useAuth } from "../../Hooks/useAuth";

// Components
import Header from "../../Components/Admin/BarangMasuk/Header";
import SupplierForm from "../../Components/Admin/BarangMasuk/SupplierForm";
import ProductSearch from "../../Components/Admin/BarangMasuk/ProductSearch";
import PrintAllBanner from "../../Components/Admin/BarangMasuk/PrintAllBanner";
import ProductItem from "../../Components/Admin/BarangMasuk/ProductItem";
import VerificationSection from "../../Components/Admin/BarangMasuk/VerificationSection";
import EmptyState from "../../Components/Admin/BarangMasuk/EmptyState";
import FooterInfo from "../../Components/Admin/BarangMasuk/FooterInfo";
import ImportExcelModal from "../../Components/Admin/BarangMasuk/ImportExcelModal";

// Services
import { barangMasukService } from "../../Services/barangMasukService";

// Utils
import {
  normalize,
  format2,
  validateBerat,
  groupByProduct,
  calculateTotals,
} from "../../Utils/barangMasukUtils";

// Print functions
import { printRollLabelThermal, printAllRollsLabelA4 } from "./Print";
import { printSuratJalan } from "./printSuratJalan";
import { formatBarcodeForDisplay } from "./Print/Utils/barcodeFormatter";

/**
 * BarangMasuk Component
 * Main component for managing incoming goods with barcode printing
 */
export default function BarangMasuk() {
  const { user } = useAuth();
  const { activeGudangId, gudangNama, ensureGudang } = useGudang();
  const gudangId = activeGudangId;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Product list state
  const [produkList, setProdukList] = useState([]);
  const [loadingProduk, setLoadingProduk] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Search state
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Form state
  const [nomorSuratJalanSupplier, setNomorSuratJalanSupplier] = useState("");
  const [supplier, setSupplier] = useState("");
  const [tanggalTerima, setTanggalTerima] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [noPO, setNoPO] = useState("");
  const [catatan, setCatatan] = useState("");

  // Items state
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [printingAll, setPrintingAll] = useState(false);
  const [lastSuratJalan, setLastSuratJalan] = useState(null);

  // PRINT SATUAN - LOADING STATE
  const [printingRollId, setPrintingRollId] = useState(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load produk on mount
  useEffect(() => {
    loadProduk();

    // Cleanup function for SweetAlert
    return () => {
      const swalInstances = document.querySelectorAll(".swal2-container");
      swalInstances.forEach((instance) => {
        if (instance.parentNode) {
          instance.parentNode.removeChild(instance);
        }
      });
    };
  }, []);

  // ============================================================================
  // PRODUCT FUNCTIONS
  // ============================================================================

  const loadProduk = async () => {
    try {
      setLoadingProduk(true);
      const data = await barangMasukService.loadProduk();
      setProdukList(data);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Gagal memuat produk",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoadingProduk(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProduk();
    setRefreshing(false);
  };

  const filteredProduk = produkList.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nama?.toLowerCase().includes(q) ||
      p.kode?.toLowerCase().includes(q) ||
      p.kategori?.toLowerCase().includes(q)
    );
  });

  // ============================================================================
  // ITEMS MANAGEMENT
  // ============================================================================

  const addProduk = (p) => {
    if (items.find((i) => i.productId === p.id)) {
      Swal.fire({
        title: "Info",
        text: "Produk sudah ditambahkan",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        produkNama: p.nama,
        produkKode: p.kode,
        kategori: p.kategori || "UNKNOWN",
        namaNormalized: normalize(p.nama),
        rolls: [],
      },
    ]);

    setSearch("");
    setShowSearch(false);

    Swal.fire({
      title: "Berhasil",
      text: `${p.nama} berhasil ditambahkan`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const addRoll = (productId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              rolls: [
                ...i.rolls,
                {
                  berat: "",
                  rollId: null,
                  isPrinted: false,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : i,
      ),
    );
  };

  const updateRoll = (productId, idx, field, value) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const rolls = [...i.rolls];
        rolls[idx] = { ...rolls[idx], [field]: value };
        return { ...i, rolls };
      }),
    );
  };

  const removeProduk = (productId) => {
    Swal.fire({
      title: "Hapus Produk?",
      text: "Semua roll untuk produk ini akan dihapus",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        Swal.fire({
          title: "Terhapus",
          text: "Produk berhasil dihapus",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const removeRoll = (productId, rollIndex) => {
    Swal.fire({
      title: "Hapus Roll?",
      text: "Roll akan dihapus dari daftar",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.productId !== productId) return i;
            const newRolls = [...i.rolls];
            newRolls.splice(rollIndex, 1);
            return { ...i, rolls: newRolls };
          }),
        );
        Swal.fire({
          title: "Terhapus",
          text: "Roll berhasil dihapus",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // ============================================================================
  // PRINT FUNCTIONS - DENGAN LOADING STATE
  // ============================================================================

  const handlePrintRoll = async (item, rollIndex) => {
    const roll = item.rolls[rollIndex];
    const printKey = `${item.productId}-${rollIndex}`;

    // Cegah double print
    if (printingRollId === printKey) {
      Swal.fire({
        title: "Info",
        text: "Proses print sedang berlangsung, harap tunggu...",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // Validasi berat
    const validation = validateBerat(roll.berat);
    if (!validation.valid) {
      Swal.fire({
        title: "Error",
        text: validation.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    // Konfirmasi jika sudah pernah dicetak
    if (roll.isPrinted && roll.rollId) {
      const confirmPrint = await Swal.fire({
        title: "Print Ulang?",
        text: `Roll ini sudah pernah dicetak dengan ID: ${roll.rollId}. Cetak ulang?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Print Ulang",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
      });
      if (!confirmPrint.isConfirmed) return;
    }

    setPrintingRollId(printKey);

    Swal.fire({
      title: "Mencetak...",
      text: "Sedang memproses print barcode",
      icon: "info",
      timer: 0,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const produkData = produkList.find((p) => p.id === item.productId);
      if (!produkData) throw new Error("Data produk tidak ditemukan");

      let rollId = roll.rollId;
      if (!rollId) {
        rollId = await barangMasukService.generateRollIdForProduct(produkData);
        console.log("✅ Generated roll ID:", rollId);
      }

      updateRoll(item.productId, rollIndex, "rollId", rollId);
      updateRoll(item.productId, rollIndex, "isPrinted", true);

      printRollLabelThermal({
        rollId,
        produkNama: item.produkNama,
        berat: format2(validation.value),
        gudangNama,
        kategori: item.kategori,
      });

      await Swal.close();
      Swal.fire({
        title: "Berhasil!",
        html: `<div class="text-center"><div class="text-green-500 text-4xl mb-3">✓</div><p class="font-mono bg-gray-100 p-2 rounded text-sm break-all">${rollId}</p><p class="text-sm text-gray-600 mt-2">Label thermal 72mm berhasil dicetak</p></div>`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.close();
      Swal.fire({
        title: "Error",
        text: err.message || "Gagal print barcode",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setPrintingRollId(null);
    }
  };

  const handlePrintAllRolls = async () => {
    if (printingAll) return;

    if (items.length === 0) {
      Swal.fire({
        title: "Info",
        text: "Tidak ada produk yang ditambahkan",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    const invalidRolls = [];
    const rollsWithoutId = [];
    const rollsWithId = [];

    items.forEach((item) => {
      item.rolls.forEach((roll, idx) => {
        const validation = validateBerat(roll.berat);
        if (!validation.valid) {
          invalidRolls.push(
            `${item.produkNama} roll #${idx + 1} (${roll.berat})`,
          );
        }

        if (roll.rollId) {
          rollsWithId.push({
            productId: item.productId,
            rollIndex: idx,
            rollId: roll.rollId,
            produkNama: item.produkNama,
            kategori: item.kategori,
            berat: roll.berat,
            isPrinted: roll.isPrinted || false,
          });
        } else {
          rollsWithoutId.push({
            productId: item.productId,
            rollIndex: idx,
            produkNama: item.produkNama,
            kategori: item.kategori,
            berat: roll.berat,
          });
        }
      });
    });

    if (invalidRolls.length > 0) {
      Swal.fire({
        title: "Berat Tidak Valid",
        html: `<div class="text-left"><p class="mb-2 font-semibold">Roll berikut beratnya belum valid:</p><ul class="list-disc pl-5 text-red-600 text-sm">${invalidRolls.map((r) => `<li>${r}</li>`).join("")}</ul><p class="mt-3 text-sm text-gray-600">Harap isi berat dengan benar (angka > 0)</p></div>`,
        icon: "error",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    const totalRolls = rollsWithId.length + rollsWithoutId.length;
    if (totalRolls === 0) {
      Swal.fire({
        title: "Info",
        text: "Tidak ada roll yang perlu dicetak",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    const pagesNeeded = Math.ceil(totalRolls / 24);

    if (rollsWithoutId.length > 0) {
      const confirmResult = await Swal.fire({
        title: "Generate ID untuk Roll Baru?",
        html: `<div class="text-left space-y-3"><div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><div class="font-semibold text-yellow-800 mb-2">⚠️ Perhatian</div><p>Ditemukan <strong>${rollsWithoutId.length} roll</strong> yang belum memiliki ID.</p><p class="mt-2">Roll tersebut akan digenerate ID baru secara otomatis.</p></div><div class="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded"><div>Total Roll:</div><div class="font-bold">${totalRolls} roll</div><div>Sudah Punya ID:</div><div class="font-bold text-green-600">${rollsWithId.length} roll</div><div>Belum Punya ID:</div><div class="font-bold text-yellow-600">${rollsWithoutId.length} roll</div><div>Halaman Print:</div><div class="font-bold">${pagesNeeded} halaman A4</div></div></div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Generate & Print",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      });
      if (!confirmResult.isConfirmed) return;
    } else {
      const confirmResult = await Swal.fire({
        title: "Print Semua Roll?",
        html: `<div class="text-left space-y-3"><div class="bg-blue-50 p-4 rounded-lg border border-blue-200"><div class="font-semibold text-blue-800 mb-2">📊 Ringkasan Print</div><div class="grid grid-cols-2 gap-2 text-sm"><div>Total Roll:</div><div class="font-bold">${totalRolls} roll</div><div>Roll Tercetak:</div><div class="font-bold text-green-600">${rollsWithId.filter((r) => r.isPrinted).length} roll</div><div>Roll Belum Tercetak:</div><div class="font-bold text-yellow-600">${rollsWithId.filter((r) => !r.isPrinted).length} roll</div><div>Halaman:</div><div class="font-bold">${pagesNeeded} halaman A4</div></div></div><div class="p-3 bg-gray-50 rounded text-sm"><div>📄 Layout: 3×8 label per halaman (24 label/halaman)</div><div class="mt-2 text-yellow-600">⚠️ Pastikan printer siap dan kertas label terpasang</div></div></div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Print Semua",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        width: 500,
      });
      if (!confirmResult.isConfirmed) return;
    }

    setPrintingAll(true);

    try {
      let newRolls = [];
      let updatedItems = [...items];

      if (rollsWithoutId.length > 0) {
        console.log("Generating IDs untuk", rollsWithoutId.length, "roll baru");
        if (typeof barangMasukService.generateMultipleRollIds === "function") {
          newRolls = await barangMasukService.generateMultipleRollIds(
            rollsWithoutId,
            produkList,
          );
        } else {
          for (const item of rollsWithoutId) {
            const produkData = produkList.find((p) => p.id === item.productId);
            if (produkData) {
              const rollId =
                await barangMasukService.generateRollIdForProduct(produkData);
              newRolls.push({
                productId: item.productId,
                rollIndex: item.rollIndex,
                rollId,
                produkNama: item.produkNama,
              });
            }
          }
        }

        updatedItems = items.map((item) => {
          const updatedRolls = item.rolls.map((roll, idx) => {
            if (roll.rollId) return roll;
            const found = newRolls.find(
              (r) => r.productId === item.productId && r.rollIndex === idx,
            );
            if (found)
              return { ...roll, rollId: found.rollId, isPrinted: true };
            return roll;
          });
          return { ...item, rolls: updatedRolls };
        });

        setItems(updatedItems);
      }

      const allRolls = [];
      updatedItems.forEach((item) => {
        item.rolls.forEach((roll) => {
          if (roll.rollId) {
            const beratValue = parseFloat(roll.berat) || 0;
            const formattedBerat = beratValue.toFixed(2);
            const produkNama = item.produkNama || item.nama || "PRODUK";
            const rollNumber =
              roll.rollId.split("-").pop() || roll.rollId.slice(-4);
            allRolls.push({
              rollId: roll.rollId,
              produkNama,
              produkKode: item.produkKode || "",
              kategori: item.kategori || "UMUM",
              berat: formattedBerat,
              beratAsli: roll.berat,
              gudangNama: gudangNama || "GUDANG",
              tanggal: new Date().toLocaleDateString("id-ID"),
              rollNumber,
              isPrinted: roll.isPrinted || true,
            });
          }
        });
      });

      if (allRolls.length === 0)
        throw new Error("Tidak ada data roll untuk dicetak");

      printAllRollsLabelA4(allRolls);

      const pagesPrinted = Math.ceil(allRolls.length / 24);
      const newRollsCount = newRolls.length;
      const reprintedCount = rollsWithId.length;

      Swal.fire({
        title: "Berhasil!",
        html: `<div class="text-center"><div class="text-green-500 text-5xl mb-4">✓</div><p class="text-lg font-semibold">${allRolls.length} Roll Berhasil Dicetak</p><div class="mt-4 bg-blue-50 p-4 rounded-lg text-left"><table class="w-full text-sm"><tr><td class="py-1">Total Roll:</td><td class="py-1 font-bold text-right">${allRolls.length}</td></tr><tr><td class="py-1">Halaman:</td><td class="py-1 font-bold text-right">${pagesPrinted} halaman A4</td></tr>${newRollsCount > 0 ? `<tr><td class="py-1 text-green-600">Roll Baru:</td><td class="py-1 font-bold text-green-600 text-right">+${newRollsCount}</td></tr>` : ""}${reprintedCount > 0 ? `<tr><td class="py-1 text-blue-600">Print Ulang:</td><td class="py-1 font-bold text-blue-600 text-right">${reprintedCount}</td></tr>` : ""}</table></div><p class="text-sm text-gray-600 mt-4">📨 Data telah dikirim ke printer</p><p class="text-xs text-gray-500">Silakan ambil print dari printer</p></div>`,
        icon: "success",
        timer: 4000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("❌ Error printing rolls:", error);
      Swal.fire({
        title: "Error",
        html: `<div class="text-left"><p class="font-semibold text-red-600">Gagal mencetak roll</p><p class="text-sm text-gray-600 mt-2">${error.message || "Terjadi kesalahan tidak dikenal"}</p><p class="text-xs text-gray-500 mt-3">Coba lagi atau hubungi administrator</p></div>`,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setPrintingAll(false);
    }
  };

  // ============================================================================
  // IMPORT EXCEL
  // ============================================================================

  const handleImportExcel = (importedData) => {
    if (!importedData || importedData.length === 0) {
      Swal.fire({
        title: "Error",
        text: "Tidak ada data yang diimport",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const grouped = groupByProduct(importedData);
    const newItems = Object.values(grouped);

    const existingProductIds = items.map((i) => i.productId);
    const duplicateProducts = newItems.filter((i) =>
      existingProductIds.includes(i.productId),
    );

    if (duplicateProducts.length > 0) {
      Swal.fire({
        title: "Produk Duplikat",
        html: `<div class="text-left"><p>Produk berikut sudah ada di list:</p><ul class="list-disc pl-5 mt-2">${duplicateProducts.map((p) => `<li>${p.produkNama}</li>`).join("")}</ul><p class="mt-3">Pilih tindakan:</p></div>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Gabungkan",
        cancelButtonText: "Ganti Semua",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          const mergedItems = [...items];
          newItems.forEach((newItem) => {
            const existingIndex = mergedItems.findIndex(
              (i) => i.productId === newItem.productId,
            );
            if (existingIndex >= 0) {
              mergedItems[existingIndex].rolls.push(...newItem.rolls);
            } else {
              mergedItems.push(newItem);
            }
          });
          setItems(mergedItems);
          Swal.fire({
            title: "Sukses",
            text: "Data berhasil digabungkan",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          setItems(newItems);
          Swal.fire({
            title: "Sukses",
            text: "Data berhasil diimport (mengganti)",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    } else {
      setItems([...items, ...newItems]);
      Swal.fire({
        title: "Sukses",
        text: `${importedData.length} roll berhasil diimport`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    }

    setShowImportModal(false);
  };

  // ============================================================================
  // VERIFICATION & APPROVAL
  // ============================================================================

  const handleVerifikasiFisik = async () => {
    if (!gudangId) {
      Swal.fire({
        title: "Error",
        text: "Gudang tidak terdeteksi",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (items.length === 0) {
      Swal.fire({
        title: "Error",
        text: "Belum ada produk yang ditambahkan",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!nomorSuratJalanSupplier.trim()) {
      Swal.fire({
        title: "Error",
        text: "Nomor surat jalan supplier wajib diisi",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!supplier.trim()) {
      Swal.fire({
        title: "Error",
        text: "Supplier wajib diisi",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!tanggalTerima) {
      Swal.fire({
        title: "Error",
        text: "Tanggal terima wajib diisi",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const unprintedRolls = items.reduce(
      (count, item) => count + item.rolls.filter((r) => !r.isPrinted).length,
      0,
    );

    if (unprintedRolls > 0) {
      Swal.fire({
        title: "Roll Belum Dicetak",
        html: `<div class="text-left"><p>Masih ada <strong>${unprintedRolls} roll</strong> yang belum dicetak barcode.</p><p class="text-sm text-gray-600 mt-2">Gunakan tombol "Print Semua" atau print satu per satu.</p></div>`,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    setVerifying(true);

    try {
      const validation = await barangMasukService.validateNomorSuratJalan(
        nomorSuratJalanSupplier,
      );
      if (!validation.valid) {
        Swal.fire({
          title: "Error",
          text: validation.message,
          icon: "error",
          confirmButtonText: "OK",
        });
        setVerifying(false);
        return;
      }

      const { totalRolls, totalBerat } = calculateTotals(items);

      const confirmResult = await Swal.fire({
        title: "Verifikasi Fisik Barang",
        html: `<div class="text-left space-y-3"><div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200"><div class="flex items-center gap-2 text-yellow-800 font-medium"><CheckCircle size={20} /><span>Pastikan data sudah sesuai dengan fisik barang</span></div></div><div class="grid grid-cols-2 gap-3 mt-4"><div class="p-3 bg-gray-50 rounded"><div class="text-sm text-gray-600">Supplier</div><div class="font-medium">${supplier}</div></div><div class="p-3 bg-gray-50 rounded"><div class="text-sm text-gray-600">No. SJ Supplier</div><div class="font-medium">${nomorSuratJalanSupplier}</div></div><div class="p-3 bg-gray-50 rounded"><div class="text-sm text-gray-600">Total Roll</div><div class="font-medium">${totalRolls} roll</div></div><div class="p-3 bg-gray-50 rounded"><div class="text-sm text-gray-600">Total Berat</div><div class="font-medium">${format2(totalBerat)} kg</div></div></div>${noPO ? `<div class="mt-2"><strong>No PO:</strong> ${noPO}</div>` : ""}${catatan ? `<div class="mt-2"><strong>Catatan:</strong> ${catatan}</div>` : ""}</div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Verifikasi & Approve",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        allowOutsideClick: false,
      });

      if (confirmResult.isConfirmed) {
        await handleApprove();
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Gagal verifikasi",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);

    try {
      const sjId = await barangMasukService.generateSuratJalanId();
      const { totalRolls, totalBerat } = calculateTotals(items);

      const itemsForDb = [];
      for (const item of items) {
        for (const roll of item.rolls) {
          const berat = parseFloat(roll.berat);
          itemsForDb.push({
            rollId: roll.rollId,
            barcode: roll.rollId,
            displayBarcode: formatBarcodeForDisplay(roll.rollId),
            berat: parseFloat(berat.toFixed(2)),
            produkId: item.productId,
            produkNama: item.produkNama,
            kategori: item.kategori,
            type: roll.type || "ROLL",
            is_roll_dibuka: roll.type === "ECER",
          });
        }
      }

      await barangMasukService.saveTransaction({
        sjId,
        nomorSuratJalanSupplier,
        supplier,
        tanggalTerima,
        noPO,
        catatan,
        gudangId,
        items,
        itemsForDb,
        totalRolls,
        totalBerat,
        user,
        gudangNama,
      });

      const sjPrintData = {
        sjId,
        supplier,
        gudangNama,
        tanggal: new Date().toLocaleDateString("id-ID"),
        totalRolls,
        totalBerat: format2(totalBerat),
        items: items.map((item) => {
          const totalBeratItem = item.rolls.reduce(
            (sum, r) => sum + parseFloat(r.berat || 0),
            0,
          );
          return {
            produkNama: item.produkNama,
            kategori: item.kategori,
            qty: item.rolls.length,
            beratList: item.rolls.map((r) => format2(r.berat)),
            totalBerat: totalBeratItem,
          };
        }),
        noPO,
        catatan,
        adminPenerima: user?.email || "System",
        userRole: user?.role || "UNKNOWN",
        nomorSuratJalanSupplier,
      };

      Swal.fire({
        title: "Sukses!",
        html: `<div class="text-center"><div class="text-green-500 text-5xl mb-4">✓</div><p class="text-lg font-semibold">Barang masuk berhasil diapprove!</p><p class="text-gray-600 mt-2">Surat jalan internal telah dibuat:</p><p class="font-mono bg-gray-100 p-3 rounded-lg mt-2 text-sm">${sjId}</p><p class="text-sm text-gray-500 mt-1">Referensi Supplier: ${nomorSuratJalanSupplier}</p><div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-left"><div><strong>Supplier:</strong><br>${supplier}</div><div><strong>Gudang:</strong><br>${gudangNama}</div><div><strong>Total Roll:</strong><br>${totalRolls} roll</div><div><strong>Total Berat:</strong><br>${format2(totalBerat)} kg</div><div><strong>User Role:</strong><br>${user?.role || "UNKNOWN"}</div><div><strong>Jenis Produk:</strong><br>${items.length}</div><div><strong>Tanggal:</strong><br>${new Date().toLocaleDateString("id-ID")}</div></div><div class="mt-4 p-3 bg-blue-50 rounded-lg text-sm"><div class="font-medium text-blue-800">⚠️ Immutable Transaction</div><div class="text-blue-600">Data sudah terkunci dan tidak dapat diedit.</div></div></div>`,
        icon: "success",
        confirmButtonText: "Print Surat Jalan",
        showCancelButton: true,
        cancelButtonText: "Tutup",
        confirmButtonColor: "#3085d6",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          printSuratJalan(sjPrintData);
        }
      });

      setLastSuratJalan(sjPrintData);
      resetForm();
    } catch (error) {
      Swal.fire({
        title: "Error",
        html: `<div class="text-left"><p class="font-semibold">Gagal menyimpan data</p><p class="text-sm text-gray-600 mt-3">${error.message || "Coba lagi atau hubungi administrator."}</p></div>`,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // FORM RESET
  // ============================================================================

  const resetForm = () => {
    setItems([]);
    setSupplier("");
    setNomorSuratJalanSupplier("");
    setNoPO("");
    setCatatan("");
    setTanggalTerima(new Date().toISOString().split("T")[0]);
  };

  const handleReset = () => {
    Swal.fire({
      title: "Reset Form?",
      text: "Semua data yang belum disimpan akan hilang",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Reset",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        setLastSuratJalan(null);
        Swal.fire({
          title: "Reset",
          text: "Form berhasil direset",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!ensureGudang()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="bg-white p-8 rounded-xl shadow-hard max-w-md text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-darkblue mb-3">
            Gudang Tidak Terdeteksi
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan pilih gudang terlebih dahulu untuk mengakses halaman ini
          </p>
          <button
            onClick={() => (window.location.href = "/admin/gudang")}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-midblue transition-colors shadow-soft hover:shadow-medium"
          >
            Pilih Gudang
          </button>
        </div>
      </div>
    );
  }

  const { totalRolls, totalBerat, printedRolls } = calculateTotals(items);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <Header
        gudangNama={gudangNama}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onReset={handleReset}
        onImportClick={() => setShowImportModal(true)}
        itemsLength={items.length}
      />

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Jenis Produk"
            value={items.length}
            icon={Layers}
            color="primary"
          />
          <StatCard
            title="Total Roll"
            value={totalRolls}
            subValue={`${printedRolls}/${totalRolls} tercetak`}
            icon={Package}
            color="green"
          />
          <StatCard
            title="Total Berat"
            value={`${format2(totalBerat)} kg`}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Halaman Print"
            value={Math.ceil(totalRolls / 24)}
            icon={Printer}
            color="yellow"
          />
          <StatCard
            title="Roll Tercetak"
            value={printedRolls}
            icon={CheckCircle}
            color="purple"
          />
        </div>
      )}

      <SupplierForm
        nomorSuratJalanSupplier={nomorSuratJalanSupplier}
        setNomorSuratJalanSupplier={setNomorSuratJalanSupplier}
        supplier={supplier}
        setSupplier={setSupplier}
        tanggalTerima={tanggalTerima}
        setTanggalTerima={setTanggalTerima}
        noPO={noPO}
        setNoPO={setNoPO}
        catatan={catatan}
        setCatatan={setCatatan}
      />

      <ProductSearch
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        loadingProduk={loadingProduk}
        filteredProduk={filteredProduk}
        onAddProduk={addProduk}
      />

      {items.length > 0 && (
        <PrintAllBanner
          totalRolls={totalRolls}
          itemsLength={items.length}
          printingAll={printingAll}
          onPrintAll={handlePrintAllRolls}
        />
      )}

      {items.map((item) => (
        <ProductItem
          key={item.productId}
          item={item}
          onRemoveProduk={removeProduk}
          onUpdateRoll={updateRoll}
          onPrintRoll={handlePrintRoll}
          onRemoveRoll={removeRoll}
          onAddRoll={addRoll}
          printingRollId={printingRollId}
        />
      ))}

      {items.length > 0 && (
        <VerificationSection
          itemsLength={items.length}
          totalRolls={totalRolls}
          totalBerat={totalBerat}
          nomorSuratJalanSupplier={nomorSuratJalanSupplier}
          printedRolls={printedRolls}
          supplier={supplier}
          verifying={verifying}
          saving={saving}
          onVerifikasi={handleVerifikasiFisik}
        />
      )}

      {lastSuratJalan && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
              <CheckCircle size={18} />
              <span className="font-bold">Surat Jalan Berhasil Dibuat</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              No Surat Jalan Internal:
            </div>
            <div className="font-mono bg-gray-100 p-3 rounded-lg text-gray-800 text-sm md:text-base border border-gray-200">
              {lastSuratJalan.sjId}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Ref Supplier: {lastSuratJalan.nomorSuratJalanSupplier}
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Supplier:</div>
                <div className="text-gray-600">{lastSuratJalan.supplier}</div>
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Gudang:</div>
                <div className="text-gray-600">{lastSuratJalan.gudangNama}</div>
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Total Roll:</div>
                <div className="text-gray-600">{lastSuratJalan.totalRolls}</div>
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Total Berat:</div>
                <div className="text-gray-600">
                  {lastSuratJalan.totalBerat} kg
                </div>
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Admin:</div>
                <div className="text-gray-600">
                  {lastSuratJalan.adminPenerima}
                </div>
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Role:</div>
                <div className="text-gray-600">{lastSuratJalan.userRole}</div>
              </div>
              <div className="text-left p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-700">Tanggal:</div>
                <div className="text-gray-600">{lastSuratJalan.tanggal}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => printSuratJalan(lastSuratJalan)}
            className="bg-primary hover:bg-midblue text-white p-4 rounded-xl w-full flex gap-3 justify-center items-center transition-all duration-200 hover:scale-[1.02] shadow-lg"
          >
            <Printer size={20} />
            <span className="font-medium">Print Surat Jalan</span>
          </button>
        </div>
      )}

      {items.length === 0 && !lastSuratJalan && <EmptyState />}

      {items.length > 0 && (
        <FooterInfo
          printedRolls={printedRolls}
          totalRolls={totalRolls}
          itemsLength={items.length}
          totalBerat={totalBerat}
        />
      )}

      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportExcel}
        produkList={produkList}
      />
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, color = "primary" }) {
  const colorClasses = {
    primary: {
      bgLight: "bg-blue-500/10",
      text: "text-blue-600",
      border: "border-blue-200",
      gradient: "from-blue-500/5 to-transparent",
    },
    green: {
      bgLight: "bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-200",
      gradient: "from-emerald-500/5 to-transparent",
    },
    blue: {
      bgLight: "bg-sky-500/10",
      text: "text-sky-600",
      border: "border-sky-200",
      gradient: "from-sky-500/5 to-transparent",
    },
    yellow: {
      bgLight: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-200",
      gradient: "from-amber-500/5 to-transparent",
    },
    purple: {
      bgLight: "bg-purple-500/10",
      text: "text-purple-600",
      border: "border-purple-200",
      gradient: "from-purple-500/5 to-transparent",
    },
  };

  const classes = colorClasses[color] || colorClasses.primary;

  return (
    <div
      className={`bg-white rounded-xl shadow-soft border ${classes.border} p-5 hover:shadow-medium transition-all duration-300 group hover:scale-[1.02] relative overflow-hidden`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${classes.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${classes.text}`}>{value}</p>
            {subValue && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Package size={12} className="text-gray-400" />
                {subValue}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${classes.bgLight} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`w-6 h-6 ${classes.text}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
