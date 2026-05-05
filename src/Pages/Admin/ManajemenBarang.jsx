// ManajemenBarang.jsx (dengan tambahan fitur lokasi)
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import Swal from "sweetalert2";
import {
  Package,
  Search,
  Filter,
  Barcode,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Printer,
  Download,
  PrinterIcon,
  MapPin,
  Trash2, // Tambahkan icon untuk lokasi
  Pencil, // Tambahkan icon edit
} from "lucide-react";

import { db } from "../../Services/firebase";
import { useGudang } from "../../Hooks/useGudang";
import { printRollLabelThermal } from "../Admin/Print/printRollLabelThermal";
import {
  ensure16Char,
  formatBarcodeForDisplay,
} from "../Admin/Print/Utils/barcodeFormatter";
import { useAuth } from "../../Hooks/useAuth";
import {
  ownerSoftDeleteRoll,
  ownerUpdateRollBerat,
  ownerUpdateRollBeratDanStatus,
} from "../../Services/ownerService";

/* ======================================================
   UTIL & CONSTANTS
====================================================== */
const format2 = (n) => parseFloat(n || 0).toFixed(2);

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Options lokasi
const LOKASI_OPTIONS = [
  { value: "Lantai 1", label: "Lantai 1" },
  { value: "Lantai 2", label: "Lantai 2" },
  { value: "Lantai 3", label: "Lantai 3" },
  { value: "Lantai 4", label: "Lantai 4" },
];

const STATUS_BADGE = {
  AVAILABLE: {
    label: "Tersedia",
    class: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  },
  USED: {
    label: "Terpakai",
    class: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle,
  },
  DAMAGED: {
    label: "Rusak",
    class: "bg-rose-100 text-rose-800 border-rose-200",
    icon: AlertCircle,
  },
  OPENED: {
    label: "Dibuka",
    class: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
  },
};

/* ======================================================
   STAT CARD COMPONENT
====================================================== */
const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
}) => {
  const colorClasses = {
    primary: {
      bgLight: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      gradient: "from-primary/5 to-transparent",
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
    red: {
      bgLight: "bg-rose-500/10",
      text: "text-rose-600",
      border: "border-rose-200",
      gradient: "from-rose-500/5 to-transparent",
    },
    purple: {
      bgLight: "bg-purple-500/10",
      text: "text-purple-600",
      border: "border-purple-200",
      gradient: "from-purple-500/5 to-transparent",
    },
    gray: {
      bgLight: "bg-gray-500/10",
      text: "text-gray-600",
      border: "border-gray-200",
      gradient: "from-gray-500/5 to-transparent",
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
};

/* ======================================================
   COMPONENT
====================================================== */
export default function ManajemenBarang() {
  const { activeGudangId, gudangNama, ensureGudang } = useGudang();
  const gudangId = activeGudangId;

  const { user } = useAuth();
  const isOwner = user?.role?.[0] === "owner";

  /* =======================
     STATE
  ======================= */
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");
  const [selectedLokasi, setSelectedLokasi] = useState("SEMUA"); // State untuk filter lokasi
  const [showFilters, setShowFilters] = useState(false);
  const [expandedKategori, setExpandedKategori] = useState({});
  const [updatingLokasi, setUpdatingLokasi] = useState(null); // Untuk loading state update

  const [stats, setStats] = useState({
    totalRoll: 0,
    totalBerat: 0,
    availableRoll: 0,
    availableBerat: 0,
    usedRoll: 0,
    usedBerat: 0,
    openedRoll: 0,
    openedBerat: 0,
    damagedRoll: 0,
    damagedBerat: 0,
  });

  const [kategoriList, setKategoriList] = useState([]);
  const [lokasiList, setLokasiList] = useState(["SEMUA"]); // State untuk filter lokasi
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!gudangId) return;

    setLoading(true);
    setRefreshing(false);

    const q = query(
      collection(db, "stockRolls"),
      where("gudang_id", "==", gudangId),
      orderBy("created_at", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRolls(data);

        const totalRoll = data.length;
        const totalBerat = data.reduce(
          (sum, r) => sum + (r.berat_sisa || 0),
          0,
        );

        const status = (s) => data.filter((r) => r.status === s);

        setStats({
          totalRoll,
          totalBerat,
          availableRoll: status("AVAILABLE").length,
          availableBerat: status("AVAILABLE").reduce(
            (s, r) => s + (r.berat_sisa || 0),
            0,
          ),
          openedRoll: status("OPENED").length,
          openedBerat: status("OPENED").reduce(
            (s, r) => s + (r.berat_sisa || 0),
            0,
          ),
          usedRoll: status("USED").length,
          usedBerat: status("USED").reduce(
            (s, r) => s + (r.berat_sisa || 0),
            0,
          ),
          damagedRoll: status("DAMAGED").length,
          damagedBerat: status("DAMAGED").reduce(
            (s, r) => s + (r.berat_sisa || 0),
            0,
          ),
        });

        setKategoriList([
          "SEMUA",
          ...Array.from(
            new Set(data.map((r) => r.kategori).filter(Boolean)),
          ).sort(),
        ]);

        setLokasiList([
          "SEMUA",
          ...Array.from(
            new Set(data.map((r) => r.lokasi).filter(Boolean)),
          ).sort(),
        ]);

        setLastUpdate(new Date());
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("SNAPSHOT ERROR:", error);
        setLoading(false);
        setRefreshing(false);
        Swal.fire("Error", error.message, "error");
      },
    );

    return () => unsubscribe();
  }, [gudangId]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date());
    }, 300);
  };

  /* ======================================================
     FILTER DATA
  ===================================================== */
  const filteredRolls = rolls.filter((roll) => {
    const matchesSearch =
      roll.id?.toLowerCase().includes(search.toLowerCase()) ||
      roll.produk_nama?.toLowerCase().includes(search.toLowerCase()) ||
      roll.kategori?.toLowerCase().includes(search.toLowerCase()) ||
      roll.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      roll.lokasi?.toLowerCase().includes(search.toLowerCase());

    const matchesKategori =
      selectedKategori === "SEMUA" || roll.kategori === selectedKategori;

    const matchesStatus =
      selectedStatus === "SEMUA" || roll.status === selectedStatus;

    const matchesLokasi =
      selectedLokasi === "SEMUA" || roll.lokasi === selectedLokasi;

    return matchesSearch && matchesKategori && matchesStatus && matchesLokasi;
  });

  /* ======================================================
     GROUPING DATA PER KATEGORI
  ===================================================== */
  const groupedByKategori = filteredRolls.reduce((groups, roll) => {
    const kategori = roll.kategori || "Tanpa Kategori";
    if (!groups[kategori]) {
      groups[kategori] = [];
    }
    groups[kategori].push(roll);
    return groups;
  }, {});

  // Urutkan kategori
  const sortedKategori = Object.keys(groupedByKategori).sort();

  /* ======================================================
     TOGGLE EXPAND KATEGORI
  ===================================================== */
  const toggleKategori = (kategori) => {
    setExpandedKategori((prev) => ({
      ...prev,
      [kategori]: !prev[kategori],
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    sortedKategori.forEach((k) => {
      allExpanded[k] = true;
    });
    setExpandedKategori(allExpanded);
  };

  const collapseAll = () => {
    setExpandedKategori({});
  };

  /* ======================================================
     UPDATE LOKASI FUNCTION
  ===================================================== */
  const handleUpdateLokasi = async (roll, newLokasi) => {
    try {
      setUpdatingLokasi(roll.id);

      // Update di Firestore
      const rollRef = doc(db, "stockRolls", roll.id);
      await updateDoc(rollRef, {
        lokasi: newLokasi,
        last_updated: new Date(),
      });

      // Update local state
      setRolls((prevRolls) =>
        prevRolls.map((r) =>
          r.id === roll.id ? { ...r, lokasi: newLokasi } : r,
        ),
      );

      // Update lokasi list untuk filter
      const updatedLokasiSet = new Set(
        rolls
          .map((r) => (r.id === roll.id ? newLokasi : r.lokasi))
          .filter(Boolean),
      );
      setLokasiList(["SEMUA", ...Array.from(updatedLokasiSet).sort()]);

      Swal.fire({
        title: "Berhasil!",
        text: `Lokasi roll berhasil diupdate ke ${newLokasi}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error updating lokasi:", error);
      Swal.fire({
        title: "Error",
        text: "Gagal mengupdate lokasi",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setUpdatingLokasi(null);
    }
  };

  /* ======================================================
     PRINT LABEL FUNCTION
  ===================================================== */
  const handlePrintLabel = async (roll) => {
    try {
      if (!roll.id) {
        throw new Error("Roll ID tidak ditemukan");
      }

      if (roll.isPrinted) {
        const confirmPrint = await Swal.fire({
          title: "Print Ulang?",
          text: `Roll ini sudah pernah dicetak dengan ID: ${roll.id}. Cetak ulang?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, Print Ulang",
          cancelButtonText: "Batal",
        });

        if (!confirmPrint.isConfirmed) return;
      }

      printRollLabelThermal({
        rollId: roll.id,
        produkNama: roll.produk_nama || "PRODUK",
        berat: roll.berat_sisa || 0,
        gudangNama: gudangNama,
        kategori: roll.kategori || "KATEGORI",
        tanggal: formatTanggal(roll.tanggal_masuk),
      });

      const displayBarcode = formatBarcodeForDisplay(roll.id);

      Swal.fire({
        title: "Berhasil!",
        html: `
          <div class="text-center">
            <div class="text-green-500 text-4xl mb-3">✓</div>
            <p class="font-mono bg-gray-100 p-2 rounded text-sm">${roll.id}</p>
            <p class="text-xs text-gray-500 mt-1">Preview: ${displayBarcode}</p>
            <p class="text-sm text-gray-600 mt-2">Label thermal 72mm berhasil dicetak</p>
          </div>
        `,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error printing label:", err);
      Swal.fire({
        title: "Error",
        text: err.message || "Gagal print label",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  /* ======================================================
     DETAIL ROLL (DENGAN LOKASI)
  ===================================================== */
  const handleViewDetail = (roll) => {
    const statusInfo = STATUS_BADGE[roll.status] || {
      label: roll.status,
      class: "bg-gray-100 text-gray-800",
    };

    const lokasiOptions = LOKASI_OPTIONS.map(
      (opt) =>
        `<option value="${opt.value}" ${
          roll.lokasi === opt.value ? "selected" : ""
        }>${opt.label}</option>`,
    ).join("");

    Swal.fire({
      title: "Detail Roll",
      width: 600,
      icon: "info",
      confirmButtonText: "Tutup",
      confirmButtonColor: "#243A8C",

      html: `
      <div class="text-left space-y-4">

        <div class="bg-gray-900 p-4 rounded-lg">
          <div class="font-mono text-sm bg-white p-3 rounded border text-center">
            ${roll.id}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Produk</div>
            <div class="font-medium">${roll.produk_nama || "-"}</div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Kategori</div>
            <div class="font-medium">${roll.kategori || "-"}</div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Berat Sisa</div>
            <div class="font-medium">${format2(roll.berat_sisa)} kg</div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Status</div>
            <div class="font-medium flex items-center gap-1">
              <span class="w-2 h-2 rounded-full ${statusInfo.class.split(" ")[0]}"></span>
              ${statusInfo.label}
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Lokasi</div>
            <div class="font-medium">${roll.lokasi || "Belum diatur"}</div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Supplier</div>
            <div class="font-medium">${roll.supplier_name || "-"}</div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Tanggal Masuk</div>
            <div class="font-medium text-sm">
              ${formatTanggal(roll.tanggal_masuk)}
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded">
            <div class="text-xs text-gray-500">Surat Jalan</div>
            <div class="font-medium text-sm">
              ${roll.surat_jalan_id || "-"}
            </div>
          </div>

          ${
            roll.is_rol_dibuka
              ? `
            <div class="p-3 bg-amber-50 rounded col-span-2">
              <div class="text-xs text-amber-600">Dibuka pada</div>
              <div class="font-medium">
                ${formatTanggal(roll.tanggal_buka)}
              </div>
            </div>
          `
              : ""
          }
        </div>

        <div class="border-t border-gray-200 pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Update Lokasi Roll
          </label>
          <div class="flex gap-2">
            <select id="lokasiSelect"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Pilih Lokasi</option>
              ${lokasiOptions}
            </select>
            <button id="btnUpdateLokasi"
              class="px-4 py-2 bg-primary text-white rounded-lg">
              Update
            </button>
          </div>
        </div>

        <div class="mt-4 flex justify-center">
          <button id="btnPrintLabel"
            class="px-4 py-2 bg-primary text-white rounded-lg">
            Cetak Label
          </button>
        </div>
      </div>
    `,

      didOpen: () => {
        // aksi umum
        document.getElementById("btnPrintLabel").onclick = () => {
          handlePrintLabel(roll);
        };

        document.getElementById("btnUpdateLokasi").onclick = () => {
          const select = document.getElementById("lokasiSelect");
          if (!select.value) {
            Swal.fire("Info", "Pilih lokasi terlebih dahulu", "info");
            return;
          }
          handleUpdateLokasi(roll, select.value);
          Swal.close();
        };
      },
    });
  };

  /* ======================================================
     HANDLE DELETE & EDIT ROLL PADA TABEL (OWNER)
  ===================================================== */

  const handleQuickDeleteRoll = async (roll) => {
    const confirm = await Swal.fire({
      title: "Hapus Roll?",
      html: `
      <p>Roll <b>${roll.id}</b> akan dinyatakan <b>INVALID</b>.</p>
      <p class="text-sm text-gray-500 mt-2">
        Roll tidak akan bisa dipakai di kasir, namun histori tetap tersimpan.
      </p>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    const { value: reason } = await Swal.fire({
      title: "Alasan Penghapusan",
      input: "text",
      inputPlaceholder: "Wajib diisi",
      showCancelButton: true,
      inputValidator: (value) => (!value ? "Alasan wajib diisi" : null),
    });

    if (!reason) return;

    await ownerSoftDeleteRoll({
      rollId: roll.id,
      reason,
      owner: user,
    });

    setRolls((prev) =>
      prev.map((r) => (r.id === roll.id ? { ...r, status: "INVALID" } : r)),
    );

    Swal.fire("Berhasil", "Roll berhasil dihapus (INVALID)", "success");
  };

  const handleEditRoll = async (roll) => {
    const { value: form } = await Swal.fire({
      title: "Edit Roll",
      width: 500,
      html: `
      <p class="text-sm text-gray-600 mb-3">
        Roll ID:<br><b>${roll.id}</b>
      </p>

      <label class="block text-left text-sm mb-1">Berat Sisa (kg)</label>
      <input id="beratBaru" type="number" step="0.01"
        class="swal2-input" value="${roll.berat_sisa}" />

      <label class="block text-left text-sm mt-3 mb-1">Status Roll</label>
      <select
        id="statusBaru"
        class="swal2-input border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      >
        <option value="AVAILABLE">Tersedia</option>
        <option value="OPENED">Dibuka</option>
        <option value="SOLD">Terjual</option>
        <option value="DAMAGED">Rusak</option>
      </select>

      <label class="block text-left text-sm mt-3 mb-1">Alasan</label>
      <input id="alasan" class="swal2-input" placeholder="Wajib diisi" />
    `,
      didOpen: () => {
        document.getElementById("statusBaru").value = roll.status;
      },
      preConfirm: () => {
        const berat = parseFloat(document.getElementById("beratBaru").value);
        const status = document.getElementById("statusBaru").value;
        const reason = document.getElementById("alasan").value;

        if (berat === null || berat === undefined || berat < 0)
          return Swal.showValidationMessage("Berat tidak valid");
        if (!reason) return Swal.showValidationMessage("Alasan wajib diisi");

        return { berat, status, reason };
      },
      showCancelButton: true,
    });

    if (!form) return;

    try {
      await ownerUpdateRollBeratDanStatus({
        rollId: roll.id,
        newBerat: form.berat,
        newStatus: form.status,
        reason: form.reason,
        owner: user,
      });

      Swal.fire("Berhasil", "Roll berhasil diperbarui", "success");
    } catch (err) {
      Swal.fire("Error", err.message || "Gagal update roll", "error");
    }
  };

  /* ======================================================
     RESET FILTERS
  ===================================================== */
  const resetFilters = () => {
    setSearch("");
    setSelectedKategori("SEMUA");
    setSelectedStatus("SEMUA");
    setSelectedLokasi("SEMUA");
  };

  /* ======================================================
     RENDER
  ===================================================== */
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
            Silakan pilih gudang terlebih dahulu untuk melihat data stok
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

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-card p-6 rounded-xl shadow-soft border border-white/10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                <Package className="w-6 h-6 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Manajemen Stok Gudang
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Package size={14} className="text-secondary" />
                <span>Gudang: </span>
                <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-full">
                  {gudangNama}
                </span>
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-secondary" />
                Update: {formatTanggal(lastUpdate)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white"
              title="Download Report"
            >
              <Download size={18} />
            </button>
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 text-white"
              title="Print"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Roll"
          value={stats.totalRoll}
          subValue={`${format2(stats.totalBerat)} kg`}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Tersedia"
          value={stats.availableRoll}
          subValue={`${format2(stats.availableBerat)} kg`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Dibuka"
          value={stats.openedRoll}
          subValue={`${format2(stats.openedBerat)} kg`}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="Terpakai"
          value={stats.usedRoll}
          subValue={`${format2(stats.usedBerat)} kg`}
          icon={XCircle}
          color="purple"
        />
        <StatCard
          title="Rusak"
          value={stats.damagedRoll}
          subValue={`${format2(stats.damagedBerat)} kg`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="border border-gray-200 pl-10 pr-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
              placeholder="Cari berdasarkan ID, produk, kategori, supplier, lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition"
          >
            <Filter size={16} />
            <span>Filter</span>
          </button>
          {(search ||
            selectedKategori !== "SEMUA" ||
            selectedStatus !== "SEMUA" ||
            selectedLokasi !== "SEMUA") && (
            <button
              onClick={resetFilters}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center gap-2 transition"
            >
              <span>Reset</span>
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
              >
                {kategoriList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="SEMUA">Semua Status</option>
                <option value="AVAILABLE">Tersedia</option>
                <option value="OPENED">Dibuka</option>
                <option value="SOLD">Terjual</option>
                <option value="DAMAGED">Rusak</option>
                <option value="INVALID">Invalid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi
              </label>
              <select
                className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={selectedLokasi}
                onChange={(e) => setSelectedLokasi(e.target.value)}
              >
                {lokasiList.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Group Expand/Collapse Buttons */}
      {sortedKategori.length > 0 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2 transition border border-gray-200 shadow-soft"
          >
            <ChevronDown size={14} />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2 transition border border-gray-200 shadow-soft"
          >
            <ChevronUp size={14} />
            <span>Collapse All</span>
          </button>
        </div>
      )}

      {/* Table / List Stok - Grouped By Kategori */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={24} className="text-primary opacity-50" />
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">
              Memuat data stok...
            </p>
          </div>
        ) : filteredRolls.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Tidak ada roll ditemukan</p>
            {(search ||
              selectedKategori !== "SEMUA" ||
              selectedStatus !== "SEMUA" ||
              selectedLokasi !== "SEMUA") && (
              <button
                onClick={resetFilters}
                className="mt-3 text-primary hover:text-midblue text-sm font-medium"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedKategori.map((kategori) => {
              const kategoriRolls = groupedByKategori[kategori];
              const isExpanded = expandedKategori[kategori];

              const totalBeratKategori = kategoriRolls.reduce(
                (sum, roll) => sum + (roll.berat_sisa || 0),
                0,
              );

              return (
                <div key={kategori} className="bg-white">
                  <div
                    onClick={() => toggleKategori(kategori)}
                    className="sticky top-0 bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100/70 transition flex items-center justify-between border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-primary" />
                      ) : (
                        <ChevronUp size={18} className="text-primary" />
                      )}
                      <span className="font-semibold text-darkblue">
                        {kategori}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({kategoriRolls.length} roll •{" "}
                        {format2(totalBeratKategori)} kg)
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Klik untuk {isExpanded ? "tutup" : "buka"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Roll ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Produk
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Berat (kg)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Lokasi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Tanggal Masuk
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {kategoriRolls.map((roll) => {
                            const statusInfo = STATUS_BADGE[roll.status] || {
                              label: roll.status,
                              class: "bg-gray-100 text-gray-800",
                              icon: Package,
                            };
                            const StatusIcon = statusInfo.icon;

                            return (
                              <tr
                                key={roll.id}
                                className="hover:bg-primary/5 transition"
                              >
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <Barcode
                                      size={12}
                                      className="text-primary"
                                    />
                                    <span className="font-mono text-xs text-gray-700">
                                      {roll.id}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700">
                                  {roll.produk_nama}
                                </td>
                                <td className="px-6 py-3 font-mono text-sm text-gray-700">
                                  {format2(roll.berat_sisa)}
                                </td>
                                <td className="px-6 py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.class}`}
                                  >
                                    <StatusIcon size={10} />
                                    {statusInfo.label}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-1">
                                    <MapPin
                                      size={12}
                                      className="text-primary"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {roll.lokasi || "-"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700">
                                  {roll.supplier_name || "-"}
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500">
                                  {formatTanggal(roll.tanggal_masuk)}
                                </td>
                                <td className="px-6 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Dropdown Lokasi Cepat */}
                                    <select
                                      value={roll.lokasi || ""}
                                      onChange={(e) =>
                                        handleUpdateLokasi(roll, e.target.value)
                                      }
                                      disabled={updatingLokasi === roll.id}
                                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-primary focus:border-primary"
                                      title="Update Lokasi"
                                    >
                                      <option value="">Pilih</option>
                                      {LOKASI_OPTIONS.map((opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>

                                    {/* Tombol Print Label */}
                                    <button
                                      onClick={() => handlePrintLabel(roll)}
                                      className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition"
                                      title="Cetak Label"
                                    >
                                      <PrinterIcon size={16} />
                                    </button>

                                    {/* Tombol Detail */}
                                    <button
                                      onClick={() => handleViewDetail(roll)}
                                      className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition"
                                      title="Lihat Detail"
                                    >
                                      <Eye size={16} />
                                    </button>
                                    {/* Tombol delete (Owner Only) */}
                                    {isOwner && (
                                      <button
                                        onClick={() =>
                                          handleQuickDeleteRoll(roll)
                                        }
                                        className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                        title="Delete Roll"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}

                                    {/* TOMBOL EDIT (OWNER ONLY) */}

                                    {isOwner && (
                                      <button
                                        onClick={() => handleEditRoll(roll)}
                                        className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                                        title="Edit Roll"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && filteredRolls.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-sm text-gray-600">
            Menampilkan {filteredRolls.length} roll dalam{" "}
            {sortedKategori.length} kategori
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-card rounded-xl shadow-soft p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Info size={18} className="text-secondary" />
            </div>
            <h3 className="font-semibold text-white">Informasi Status Roll</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="text-sm text-white/90">
                Tersedia - Roll siap digunakan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-sm text-white/90">
                Dibuka - Roll sedang dalam proses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span className="text-sm text-white/90">
                Terpakai - Roll sudah habis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="text-sm text-white/90">
                Rusak - Roll tidak layak pakai
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-white/20 pt-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-secondary" />
              <span className="text-sm text-white/90">
                Lokasi: Lantai 1, 2, 3, 4 - Klik dropdown untuk mengupdate
                lokasi roll
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
