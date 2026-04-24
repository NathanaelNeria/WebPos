// MutasiGudang.jsx
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import Swal from "sweetalert2";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  Search,
  Barcode,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Printer,
  Eye,
  AlertCircle,
  RefreshCw,
  Scan,
  FileText,
  Clock,
  Database,
  HardDrive,
  Shield,
  FileCheck,
  Lock,
} from "lucide-react";

import { db } from "../../Services/firebase";
import { useGudang } from "../../Hooks/useGudang";
import { useAuth } from "../../Hooks/useAuth";
import printSuratJalanMutasi from "./printSuratJalanMutasi";
import printSuratJalanThermal from "./Print/printSuratJalanThermal";
/* ======================================================
   CONSTANTS & UTILS
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

const formatTanggalShort = (timestamp) => {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// Tipe Surat Jalan
const SJ_TIPE = {
  BARANG_MASUK: "BARANG_MASUK",
  MUTASI: "MUTASI",
};

// Status Surat Jalan
const SJ_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

// STATUS_BADGE
const STATUS_BADGE = {
  [SJ_STATUS.DRAFT]: {
    label: "Draft",
    class: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Package,
  },
  [SJ_STATUS.PENDING]: {
    label: "Pending",
    class: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
  },
  [SJ_STATUS.APPROVED]: {
    label: "Approved",
    class: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  [SJ_STATUS.COMPLETED]: {
    label: "Completed",
    class: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  },
  [SJ_STATUS.REJECTED]: {
    label: "Rejected",
    class: "bg-rose-100 text-rose-800 border-rose-200",
    icon: XCircle,
  },
};

// STATUS_ROLL
const STATUS_ROLL = {
  AVAILABLE: {
    label: "Tersedia",
    class: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
  },
  IN_TRANSIT: {
    label: "Dalam Perjalanan",
    class: "bg-blue-100 text-blue-800",
    icon: Truck,
  },
  OPENED: {
    label: "Dibuka",
    class: "bg-amber-100 text-amber-800",
    icon: AlertCircle,
  },
  USED: {
    label: "Terpakai",
    class: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
  DAMAGED: {
    label: "Rusak",
    class: "bg-rose-100 text-rose-800",
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
   MUTASI KELUAR TAB
====================================================== */
function MutasiKeluarTab({ gudangId, gudangNama, user, onSuccess }) {
  const [gudangTujuanList, setGudangTujuanList] = useState([]);
  const [selectedGudangTujuan, setSelectedGudangTujuan] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedRolls, setScannedRolls] = useState([]);
  const [availableRolls, setAvailableRolls] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastMutasiData, setLastMutasiData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mutasiHistory, setMutasiHistory] = useState([]);

  // Load gudang tujuan
  useEffect(() => {
    const loadGudangTujuan = async () => {
      try {
        const q = query(
          collection(db, "gudang"),
          where("status", "==", "active"),
          limit(50),
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((g) => g.id !== gudangId);
        setGudangTujuanList(data);
      } catch (error) {
        console.error("Error loading gudang:", error);
      }
    };
    loadGudangTujuan();
  }, [gudangId]);

  // Load available rolls
  const loadAvailableRolls = useCallback(async () => {
    if (!gudangId) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "stockRolls"),
        where("gudang_id", "==", gudangId),
        where("status", "in", ["AVAILABLE", "OPENED"]),
        orderBy("created_at", "desc"),
        // limit(100),
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAvailableRolls(data);
    } catch (error) {
      console.error("Error loading rolls:", error);
      Swal.fire("Error", "Gagal memuat data roll", "error");
    } finally {
      setLoading(false);
    }
  }, [gudangId]);

  // Load riwayat mutasi keluar
  const loadMutasiHistory = useCallback(async () => {
    if (!gudangId) return;

    try {
      const q = query(
        collection(db, "suratJalan"),
        where("tipe", "==", SJ_TIPE.MUTASI),
        where("gudang_asal", "==", gudangId),
        orderBy("created_at", "desc"),
        limit(10),
      );
      const snap = await getDocs(q);
      setMutasiHistory(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }, [gudangId]);

  useEffect(() => {
    loadAvailableRolls();
    loadMutasiHistory();
  }, [loadAvailableRolls, loadMutasiHistory]);

  // Handle scan barcode
  const handleScanBarcode = () => {
    if (!barcodeInput.trim()) {
      Swal.fire("Info", "Masukkan barcode roll", "info");
      return;
    }

    const roll = availableRolls.find((r) => r.id === barcodeInput.trim());

    if (!roll) {
      Swal.fire({
        title: "Roll Tidak Ditemukan",
        html: `
          <div class="text-left">
            <p>Barcode <strong>${barcodeInput}</strong> tidak ditemukan.</p>
            <p class="text-sm text-gray-600 mt-2">Pastikan roll tersedia di gudang ${gudangNama}</p>
          </div>
        `,
        icon: "error",
      });
      setBarcodeInput("");
      return;
    }

    if (scannedRolls.find((r) => r.id === roll.id)) {
      Swal.fire("Info", "Roll sudah ditambahkan", "info");
      setBarcodeInput("");
      return;
    }

    setScannedRolls((prev) => [...prev, roll]);
    setBarcodeInput("");
  };

  // Handle pilih roll
  const handleSelectRoll = (roll) => {
    if (scannedRolls.find((r) => r.id === roll.id)) {
      Swal.fire("Info", "Roll sudah ditambahkan", "info");
      return;
    }
    setScannedRolls((prev) => [...prev, roll]);
  };

  // Hapus roll
  const handleRemoveRoll = (rollId) => {
    setScannedRolls((prev) => prev.filter((r) => r.id !== rollId));
  };

  // Lihat detail roll
  const handleViewRollDetail = (roll) => {
    const statusInfo = STATUS_ROLL[roll.status] || { label: roll.status };

    Swal.fire({
      title: "Detail Roll",
      width: 600,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-gray-900 p-4 rounded-lg">
            <div class="font-mono text-sm bg-white p-3 rounded border text-center tracking-wider">
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
                <span class="w-2 h-2 rounded-full bg-${statusInfo.color || "gray"}-500"></span>
                ${statusInfo.label}
              </div>
            </div>
            <div class="p-3 bg-gray-50 rounded col-span-2">
              <div class="text-xs text-gray-500">Supplier</div>
              <div class="font-medium">${roll.supplier_name || "-"}</div>
            </div>
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-xs text-gray-500">Tanggal Masuk</div>
              <div class="font-medium text-sm">${formatTanggal(roll.tanggal_masuk)}</div>
            </div>
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-xs text-gray-500">Surat Jalan</div>
              <div class="font-medium text-sm">${roll.surat_jalan_id || "-"}</div>
            </div>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Tutup",
      confirmButtonColor: "#243A8C",
    });
  };

  // Generate ID Surat Jalan Mutasi
  const generateSuratJalanId = async () => {
    try {
      const dateStr = getTodayString();
      const seqRef = doc(db, "rollSequences", "suratJalanMUTASI");

      const seq = await runTransaction(db, async (trx) => {
        const snap = await trx.get(seqRef);
        let lastNumber = 1;

        if (snap.exists()) {
          lastNumber = snap.data().lastNumber + 1;
          trx.update(seqRef, { lastNumber, updatedAt: serverTimestamp() });
        } else {
          trx.set(seqRef, {
            lastNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        return lastNumber;
      });

      return `SJ-MUT-${dateStr}-${String(seq).padStart(4, "0")}`;
    } catch {
      const timestamp = Date.now();
      return `SJ-MUT-${getTodayString()}-F${timestamp.toString().slice(-6)}`;
    }
  };

  // Submit mutasi keluar
  // ======================================================
  // HANDLE SUBMIT MUTASI KELUAR - LENGKAP DENGAN PRINT THERMAL
  // ======================================================
  // Submit mutasi keluar
  const handleSubmit = async () => {
    // Validasi: Gudang tujuan harus dipilih
    if (!selectedGudangTujuan) {
      Swal.fire({
        title: "Error",
        text: "Pilih gudang tujuan terlebih dahulu",
        icon: "error",
        confirmButtonColor: "#243A8C",
      });
      return;
    }

    // Validasi: Minimal 1 roll
    if (scannedRolls.length === 0) {
      Swal.fire({
        title: "Error",
        text: "Minimal 1 roll untuk dimutasi",
        icon: "error",
        confirmButtonColor: "#243A8C",
      });
      return;
    }

    // Hitung total berat
    const totalBerat = scannedRolls.reduce(
      (sum, r) => sum + (r.berat_sisa || 0),
      0,
    );

    // Dapatkan info gudang tujuan
    const gudangTujuan = gudangTujuanList.find(
      (g) => g.id === selectedGudangTujuan,
    );

    // Tampilkan konfirmasi dengan detail lengkap
    const result = await Swal.fire({
      title: "Konfirmasi Mutasi Keluar",
      width: 600,
      html: `
        <div class="text-left space-y-4">
          <!-- Peringatan -->
          <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div class="flex items-center gap-2 text-amber-800 font-medium">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <span>Pastikan data sudah sesuai</span>
            </div>
          </div>
          
          <!-- Info Gudang -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-xs text-gray-500">Gudang Asal</div>
              <div class="font-semibold text-darkblue">${gudangNama}</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-xs text-gray-500">Gudang Tujuan</div>
              <div class="font-semibold text-darkblue">${gudangTujuan?.nama || "-"}</div>
            </div>
          </div>

          <!-- Ringkasan Mutasi -->
          <div class="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">${scannedRolls.length}</div>
                <div class="text-xs text-gray-600">Total Roll</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">${format2(totalBerat)}</div>
                <div class="text-xs text-gray-600">Total Berat (kg)</div>
              </div>
            </div>
          </div>

          <!-- Daftar Roll (dengan scroll) -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-semibold text-darkblue">Daftar Roll:</span>
              <span class="text-xs text-gray-500">${scannedRolls.length} item</span>
            </div>
            <div class="max-h-40 overflow-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              ${scannedRolls
                .map(
                  (r, index) => `
                <div class="p-2 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-mono text-xs font-medium text-darkblue">${r.id}</div>
                      <div class="text-xs text-gray-600">${r.produk_nama || "-"}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs font-semibold">${format2(r.berat_sisa)} kg</div>
                      <div class="text-xs text-gray-500">${r.kategori || "-"}</div>
                    </div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <!-- Catatan -->
          ${
            catatan
              ? `
            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="text-xs text-blue-800 font-medium mb-1">📝 Catatan:</div>
              <div class="text-sm text-blue-900">${catatan}</div>
            </div>
          `
              : ""
          }

          <!-- Informasi Tambahan -->
          <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>Status roll akan berubah menjadi <strong>IN_TRANSIT</strong></span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Surat jalan akan dibuat dengan nomor: <strong>SJ-MUT-${getTodayString()}-XXXX</strong></span>
            </div>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Ya, Proses Mutasi",
      cancelButtonText: "❌ Batal",
      confirmButtonColor: "#243A8C",
      cancelButtonColor: "#d33",
      reverseButtons: true,
      input: "text",
      inputLabel: "Dikirim melalui",
      inputPlaceholder: "Masukan nama pengirim",
      inputAttributes: {
        maxlength: 50,
        autocapitalize: "words",
      },

      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Nama via wajib diisi";
        }
        return null;
      },
    });

    if (!result.isConfirmed) return;

    const via = result.value.trim();

    // Set loading state
    setSubmitting(true);

    try {
      // Generate ID Surat Jalan
      const sjId = await generateSuratJalanId();
      const now = serverTimestamp();
      const userUid = user?.uid || "system";

      // Log untuk debugging
      console.log("🚀 Memproses mutasi:", {
        sjId,
        gudangAsal: gudangId,
        gudangTujuan: selectedGudangTujuan,
        totalRolls: scannedRolls.length,
        totalBerat,
      });

      // Gunakan transaction untuk atomic operation
      await runTransaction(db, async (trx) => {
        // 1. Buat Surat Jalan Mutasi
        const sjRef = doc(collection(db, "suratJalan"), sjId);
        trx.set(sjRef, {
          id: sjId,
          tipe: SJ_TIPE.MUTASI,
          gudang_asal: gudangId,
          gudang_asal_nama: gudangNama,
          gudang_tujuan: selectedGudangTujuan,
          gudang_tujuan_nama: gudangTujuan?.nama,
          status: SJ_STATUS.APPROVED, // Langsung approved karena owner/admin
          catatan: catatan || "",
          items: scannedRolls.map((r) => ({
            rollId: r.id,
            produkId: r.produk_id,
            produkNama: r.produk_nama,
            berat: r.berat_sisa,
            kategori: r.kategori,
            supplier: r.supplier_name,
          })),
          total_roll: scannedRolls.length,
          total_berat: totalBerat,
          created_by: userUid,
          via: via,
          created_by_email: user?.email || "system",
          created_at: now,
          approved_by: userUid,
          approved_at: now,
          metadata: {
            userRole: user?.role || "UNKNOWN",
            userEmail: user?.email || "unknown",
            timestamp: Date.now(),
          },
        });

        // 2. Buat entries di stockLedger (OUT)
        for (const roll of scannedRolls) {
          const ledgerId = `LEDG-OUT-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}-${roll.id.slice(-4)}`;
          const ledgerRef = doc(collection(db, "stockLedger"), ledgerId);

          trx.set(ledgerRef, {
            id: ledgerId,
            roll_id: roll.id,
            tipe: "OUT",
            berat: roll.berat_sisa,
            gudang_asal: gudangId,
            gudang_asal_nama: gudangNama,
            gudang_tujuan: selectedGudangTujuan,
            gudang_tujuan_nama: gudangTujuan?.nama,
            ref_surat_jalan: sjId,
            ref_surat_jalan_id: sjId,
            user_id: userUid,
            via: via,
            user_email: user?.email || "system",
            user_role: user?.role || "UNKNOWN",
            timestamp: now,
            created_at: now,
            metadata: {
              catatan: catatan || "",
              produk_nama: roll.produk_nama,
              kategori: roll.kategori,
            },
          });
        }

        // 3. Update stockRolls status menjadi IN_TRANSIT
        for (const roll of scannedRolls) {
          const stockRollRef = doc(db, "stockRolls", roll.id);

          trx.update(stockRollRef, {
            status: "IN_TRANSIT",
            last_updated: now,
            mutasi_keluar_sj_id: sjId,
            mutasi_keluar_tujuan: selectedGudangTujuan,
            mutasi_keluar_tujuan_nama: gudangTujuan?.nama,
            mutasi_keluar_at: now,
            mutasi_keluar_by: userUid,
          });
        }

        // 4. Catat aktivitas user
        const activityId = `ACT-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        const activityRef = doc(collection(db, "userActivities"), activityId);

        trx.set(activityRef, {
          id: activityId,
          user_id: userUid,
          user_email: user?.email || "unknown",
          user_role: user?.role || "UNKNOWN",
          action_type: "MUTASI_KELUAR",
          entity_type: "SURAT_JALAN",
          entity_id: sjId,
          action_details: `Mutasi keluar dari ${gudangNama} ke ${gudangTujuan?.nama} | ${scannedRolls.length} roll | ${format2(totalBerat)} kg`,
          gudang_id: gudangId,
          gudang_nama: gudangNama,
          timestamp: now,
          created_at: now,
          ip_address: "web-app",
          metadata: {
            surat_jalan_id: sjId,
            gudang_asal: gudangNama,
            gudang_asal_id: gudangId,
            gudang_tujuan: gudangTujuan?.nama,
            gudang_tujuan_id: selectedGudangTujuan,
            total_roll: scannedRolls.length,
            total_berat: totalBerat,
            rolls: scannedRolls.map((roll) => ({
              rollId: roll.id,
              produkNama: roll.produk_nama,
              berat: roll.berat_sisa,
              kategori: roll.kategori,
            })),
            catatan: catatan || "",
          },
        });
      });

      console.log("✅ Mutasi berhasil diproses:", sjId);

      // Data untuk print surat jalan
      const mutasiPrintData = {
        sjId,
        gudangAsal: gudangNama,
        gudangTujuan: gudangTujuan?.nama || "Unknown",
        tanggal: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        totalRolls: scannedRolls.length,
        totalBerat: format2(totalBerat),
        items: scannedRolls.map((roll) => ({
          rollId: roll.id,
          produkNama: roll.produk_nama,
          berat: format2(roll.berat_sisa),
          kategori: roll.kategori,
          supplier: roll.supplier_name,
        })),
        via: via,
        catatan: catatan || "-",
        adminPengirim: user?.nama || "System",
        userRole: user?.role || "UNKNOWN",
      };

      // Simpan data untuk print ulang
      setLastMutasiData(mutasiPrintData);

      // Tampilkan success message dengan DUA OPSI PRINT
      await Swal.fire({
        title: "✅ MUTASI BERHASIL!",
        width: 600,
        html: `
          <div class="text-center space-y-4">
            <!-- Icon Success -->
            <div class="text-emerald-500 text-6xl mb-2">✓</div>
            
            <!-- Surat Jalan Number -->
            <div class="bg-gray-900 p-4 rounded-xl">
              <div class="text-xs text-gray-400 mb-1">Nomor Surat Jalan</div>
              <div class="font-mono text-lg font-bold text-white tracking-wider">${sjId}</div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-primary/5 p-3 rounded-lg">
                <div class="text-2xl font-bold text-primary">${scannedRolls.length}</div>
                <div class="text-xs text-gray-600">Total Roll</div>
              </div>
              <div class="bg-primary/5 p-3 rounded-lg">
                <div class="text-2xl font-bold text-primary">${format2(totalBerat)} kg</div>
                <div class="text-xs text-gray-600">Total Berat</div>
              </div>
            </div>
            
            <!-- Info Mutasi -->
            <div class="bg-gray-50 p-3 rounded-lg text-left">
              <div class="flex items-center gap-2 text-sm mb-2">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="font-medium">Dari: ${gudangNama}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span class="font-medium">Ke: ${gudangTujuan?.nama}</span>
              </div>
            </div>
            
            <!-- Status Info -->
            <div class="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div class="flex items-center gap-2 text-amber-800">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <div class="text-left">
                  <div class="font-semibold">Menunggu Konfirmasi</div>
                  <div class="text-xs">Gudang tujuan harus konfirmasi penerimaan</div>
                </div>
              </div>
            </div>
          </div>
        `,
        icon: "success",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "🖨️ Print Thermal (72mm)",
        denyButtonText: "📄 Print Rangkap",
        cancelButtonText: "✖️ Tutup",
        confirmButtonColor: "#243A8C",
        denyButtonColor: "#10b981",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          // Print thermal 72mm
          printSuratJalanThermal(mutasiPrintData);
        } else if (result.isDenied) {
          // Print biasa A4
          printSuratJalanMutasi(mutasiPrintData);
        }
      });

      // Reset form setelah sukses
      setScannedRolls([]);
      setSelectedGudangTujuan("");
      setCatatan("");
      setBarcodeInput("");

      // Refresh data
      await loadAvailableRolls();
      await loadMutasiHistory();

      // Panggil callback onSuccess jika ada
      if (onSuccess) {
        onSuccess(sjId);
      }
    } catch (error) {
      console.error("❌ Error submitting mutasi:", error);

      // Error handling yang lebih detail
      let errorMessage = "Gagal memproses mutasi";
      if (error.code === "permission-denied") {
        errorMessage = "Anda tidak memiliki izin untuk melakukan mutasi";
      } else if (error.code === "not-found") {
        errorMessage = "Data tidak ditemukan";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        title: "Error!",
        html: `
          <div class="text-center">
            <div class="text-rose-500 text-5xl mb-3">✗</div>
            <p class="text-lg font-semibold mb-2">${errorMessage}</p>
            <p class="text-xs text-gray-500">${error.code || "unknown_error"}</p>
            <p class="text-xs text-gray-400 mt-2">Silakan coba lagi atau hubungi IT Support</p>
          </div>
        `,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setSubmitting(false);
    }
  };
  // Filter rolls
  const filteredAvailableRolls = availableRolls.filter((roll) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      roll.id?.toLowerCase().includes(term) ||
      roll.produk_nama?.toLowerCase().includes(term) ||
      roll.kategori?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Roll Tersedia"
          value={availableRolls.length}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Roll Dipilih"
          value={scannedRolls.length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Total Berat"
          value={`${format2(scannedRolls.reduce((sum, r) => sum + r.berat_sisa, 0))} kg`}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Mutasi Hari Ini"
          value={mutasiHistory.length}
          icon={Truck}
          color="yellow"
        />
      </div>

      {/* Pilih Gudang Tujuan */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h3 className="font-semibold text-darkblue mb-4 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowRight className="text-primary" size={18} />
          </div>
          Pilih Gudang Tujuan
        </h3>
        <select
          className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
          value={selectedGudangTujuan}
          onChange={(e) => setSelectedGudangTujuan(e.target.value)}
        >
          <option value="">-- Pilih Gudang Tujuan --</option>
          {gudangTujuanList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
      </div>

      {/* Scan Barcode */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h3 className="font-semibold text-darkblue mb-4 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Scan className="text-primary" size={18} />
          </div>
          Scan Barcode Roll
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Barcode
              className="absolute left-3 top-3 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="border border-gray-200 pl-10 pr-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
              placeholder="Scan atau ketik barcode roll..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScanBarcode()}
            />
          </div>
          <button
            onClick={handleScanBarcode}
            className="px-6 bg-primary text-white rounded-lg hover:bg-midblue transition flex items-center gap-2"
          >
            <CheckCircle size={18} />
            <span>Tambah</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Tekan Enter setelah scan</p>
      </div>

      {/* Daftar Roll yang Dipilih */}
      {scannedRolls.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-darkblue flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="text-primary" size={18} />
              </div>
              Daftar Roll Dipilih ({scannedRolls.length})
            </h3>
            <button
              onClick={() => {
                Swal.fire({
                  title: "Kosongkan?",
                  text: "Semua roll akan dihapus",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#243A8C",
                  confirmButtonText: "Ya",
                }).then((result) => {
                  if (result.isConfirmed) setScannedRolls([]);
                });
              }}
              className="text-rose-600 hover:text-rose-800 text-sm font-medium"
            >
              Kosongkan
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-auto">
            {scannedRolls.map((roll) => (
              <div
                key={roll.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100/50 transition"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm text-darkblue">
                    {roll.id}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {roll.produk_nama} • {format2(roll.berat_sisa)} kg •{" "}
                    {roll.kategori}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewRollDetail(roll)}
                    className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleRemoveRoll(roll.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                    title="Hapus"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-darkblue">Total Berat:</span>
              <span className="text-lg font-bold text-primary">
                {format2(
                  scannedRolls.reduce((sum, r) => sum + r.berat_sisa, 0),
                )}{" "}
                kg
              </span>
            </div>

            <textarea
              className="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30 mb-4"
              placeholder="Catatan mutasi (opsional)..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows="2"
            />

            <button
              onClick={handleSubmit}
              disabled={
                submitting || !selectedGudangTujuan || scannedRolls.length === 0
              }
              className="w-full bg-gradient-card text-white p-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Truck size={20} />
                  <span>Approve Mutasi Keluar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Daftar Roll Tersedia */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-darkblue flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="text-primary" size={18} />
            </div>
            Daftar Roll Tersedia di {gudangNama}
          </h3>
          <button
            onClick={loadAvailableRolls}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw
              size={18}
              className={
                loading ? "animate-spin text-primary" : "text-gray-600"
              }
            />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="border border-gray-200 pl-10 pr-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
              placeholder="Cari roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
          </div>
        ) : filteredAvailableRolls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p>Tidak ada roll tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-auto">
            {filteredAvailableRolls.map((roll) => {
              const isSelected = scannedRolls.some((r) => r.id === roll.id);
              return (
                <button
                  key={roll.id}
                  onClick={() => handleSelectRoll(roll)}
                  disabled={isSelected}
                  className={`text-left p-3 border rounded-lg transition ${
                    isSelected
                      ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200"
                      : "hover:bg-primary/5 hover:border-primary/30 border-gray-200"
                  }`}
                >
                  <div className="font-mono text-xs text-darkblue mb-1">
                    {roll.id}
                  </div>
                  <div className="font-medium text-sm text-gray-700">
                    {roll.produk_nama}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{format2(roll.berat_sisa)} kg</span>
                    <span>{roll.kategori}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Mutasi */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-darkblue flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="text-primary" size={18} />
            </div>
            Riwayat Mutasi Keluar
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-primary hover:text-midblue font-medium"
          >
            {showHistory ? "Sembunyikan" : "Lihat Semua"}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-3 max-h-60 overflow-auto">
            {mutasiHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Belum ada riwayat mutasi
              </p>
            ) : (
              mutasiHistory.map((mutasi, idx) => {
                const statusInfo =
                  STATUS_BADGE[mutasi.status] ||
                  STATUS_BADGE[SJ_STATUS.PENDING];
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="font-mono text-sm text-darkblue">
                        {mutasi.id}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {mutasi.items?.length || 0} roll •{" "}
                        {format2(mutasi.total_berat || 0)} kg
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.class}`}
                      >
                        <StatusIcon size={10} />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTanggalShort(mutasi.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Print Button */}
      {lastMutasiData && (
        <div className="border-t border-gray-100 pt-6">
          <button
            onClick={() => printSuratJalanMutasi(lastMutasiData)}
            className="w-full bg-primary hover:bg-midblue text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] shadow-lg"
          >
            <Printer size={20} />
            Print Surat Jalan Terakhir
          </button>
        </div>
      )}
    </div>
  );
}

/* ======================================================
   MUTASI MASUK TAB
====================================================== */
function MutasiMasukTab({ gudangId, gudangNama, user, onSuccess }) {
  const [pendingMutasi, setPendingMutasi] = useState([]);
  const [completedMutasi, setCompletedMutasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMutasi, setSelectedMutasi] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load pending mutasi
  const loadPendingMutasi = useCallback(async () => {
    if (!gudangId) return;

    try {
      setLoading(true);

      // Pending mutasi
      const pendingQ = query(
        collection(db, "suratJalan"),
        where("tipe", "==", SJ_TIPE.MUTASI),
        where("gudang_tujuan", "==", gudangId),
        where("status", "==", SJ_STATUS.APPROVED),
        orderBy("created_at", "desc"),
        limit(20),
      );
      const pendingSnap = await getDocs(pendingQ);
      setPendingMutasi(
        pendingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );

      // Completed mutasi
      const completedQ = query(
        collection(db, "suratJalan"),
        where("tipe", "==", SJ_TIPE.MUTASI),
        where("gudang_tujuan", "==", gudangId),
        where("status", "==", SJ_STATUS.COMPLETED),
        orderBy("completed_at", "desc"),
        limit(10),
      );
      const completedSnap = await getDocs(completedQ);
      setCompletedMutasi(
        completedSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (error) {
      console.error("Error loading:", error);
    } finally {
      setLoading(false);
    }
  }, [gudangId]);

  useEffect(() => {
    loadPendingMutasi();
  }, [loadPendingMutasi]);

  // Load detail mutasi
  const loadMutasiDetail = async (mutasi) => {
    try {
      const gudangAsalSnap = await getDocs(
        query(
          collection(db, "gudang"),
          where("__name__", "==", mutasi.gudang_asal),
          limit(1),
        ),
      );
      const gudangAsal = gudangAsalSnap.docs[0]?.data();

      setSelectedMutasi({
        ...mutasi,
        gudangAsalNama: gudangAsal?.nama || "Unknown",
      });
    } catch (error) {
      console.error("Error loading detail:", error);
    }
  };

  // Konfirmasi penerimaan
  const handleConfirmReceive = async () => {
    if (!selectedMutasi) return;

    const result = await Swal.fire({
      title: "Konfirmasi Penerimaan",
      html: `
        <div class="text-left space-y-3">
          <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p class="text-amber-800">Pastikan semua roll diterima dalam kondisi baik</p>
          </div>
          <p><strong>No. Surat Jalan:</strong> ${selectedMutasi.id}</p>
          <p><strong>Dari Gudang:</strong> ${selectedMutasi.gudangAsalNama}</p>
          <p><strong>Jumlah Roll:</strong> ${selectedMutasi.items?.length || 0}</p>
          <p><strong>Total Berat:</strong> ${format2(selectedMutasi.total_berat || 0)} kg</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Terima Barang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#243A8C",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    setConfirming(true);

    try {
      const now = serverTimestamp();
      const userUid = user?.uid || "system";

      await runTransaction(db, async (trx) => {
        // 1. Update surat jalan
        const sjRef = doc(db, "suratJalan", selectedMutasi.id);
        trx.update(sjRef, {
          status: SJ_STATUS.COMPLETED,
          completed_at: now,
          received_by: userUid,
          received_at: now,
        });

        // 2. Write stockLedger IN
        for (const item of selectedMutasi.items || []) {
          const ledgerId = `LEDG-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}-${item.rollId.slice(-4)}`;
          const ledgerRef = doc(collection(db, "stockLedger"), ledgerId);
          trx.set(ledgerRef, {
            id: ledgerId,
            roll_id: item.rollId,
            tipe: "IN",
            berat: item.berat,
            gudang_tujuan: gudangId,
            ref_surat_jalan: selectedMutasi.id,
            user_id: userUid,
            user_role: user?.role || "UNKNOWN",
            timestamp: now,
          });
        }

        // 3. Update stockRolls
        for (const item of selectedMutasi.items || []) {
          const stockRollRef = doc(db, "stockRolls", item.rollId);
          trx.update(stockRollRef, {
            gudang_id: gudangId,
            status: "AVAILABLE",
            last_updated: now,
            mutasi_sj_id: null,
            received_at: now,
          });
        }

        // 4. Catat aktivitas
        const activityId = `ACT-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 6)}`;
        const activityRef = doc(collection(db, "userActivities"), activityId);
        trx.set(activityRef, {
          id: activityId,
          user_id: userUid,
          user_role: user?.role || "UNKNOWN",
          user_email: user?.email || "unknown",
          action_type: "MUTASI_MASUK",
          entity_type: "SURAT_JALAN",
          entity_id: selectedMutasi.id,
          action_details: `Menerima mutasi masuk dari ${selectedMutasi.gudangAsalNama} ke ${gudangNama}, ${
            selectedMutasi.items?.length || 0
          } roll, ${format2(selectedMutasi.total_berat || 0)} kg`,
          gudang_id: gudangId,
          timestamp: now,
          ip_address: "web-app",
          metadata: {
            surat_jalan: selectedMutasi.id,
            gudang_asal: selectedMutasi.gudangAsalNama,
            gudang_asal_id: selectedMutasi.gudang_asal,
            gudang_tujuan: gudangNama,
            gudang_tujuan_id: gudangId,
            total_roll: selectedMutasi.items?.length || 0,
            total_berat: selectedMutasi.total_berat || 0,
            rolls:
              selectedMutasi.items?.map((item) => ({
                rollId: item.rollId,
                produkNama: item.produkNama,
                berat: item.berat,
                kategori: item.kategori,
              })) || [],
          },
        });
      });

      Swal.fire({
        title: "Sukses!",
        html: `
          <div class="text-center">
            <div class="text-emerald-500 text-5xl mb-4">✓</div>
            <p>Barang berhasil diterima</p>
            <p class="text-sm text-gray-600 mt-2">${selectedMutasi.items?.length || 0} roll ditambahkan ke stok ${gudangNama}</p>
          </div>
        `,
        icon: "success",
        timer: 2000,
      });

      setSelectedMutasi(null);
      loadPendingMutasi();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error confirming receive:", error);
      Swal.fire("Error", "Gagal konfirmasi penerimaan", "error");
    } finally {
      setConfirming(false);
    }
  };

  // Filter mutasi
  const filteredPendingMutasi = pendingMutasi.filter((mutasi) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      mutasi.id?.toLowerCase().includes(term) ||
      mutasi.items?.some((item) => item.rollId?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Menunggu"
          value={pendingMutasi.length}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="Total Roll"
          value={pendingMutasi.reduce(
            (sum, m) => sum + (m.items?.length || 0),
            0,
          )}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Berat"
          value={`${format2(
            pendingMutasi.reduce((sum, m) => sum + (m.total_berat || 0), 0),
          )} kg`}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Selesai"
          value={completedMutasi.length}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            className="border border-gray-200 pl-10 pr-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
            placeholder="Cari berdasarkan No. SJ atau Roll ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List Pending Mutasi */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h3 className="font-semibold text-darkblue mb-4 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowLeft className="text-primary" size={18} />
          </div>
          Mutasi Masuk Pending
          {pendingMutasi.length > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              {pendingMutasi.length}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="p-8 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
          </div>
        ) : filteredPendingMutasi.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p>Tidak ada mutasi pending</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPendingMutasi.map((mutasi) => {
              const statusInfo = STATUS_BADGE[SJ_STATUS.APPROVED];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={mutasi.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-primary/5 transition cursor-pointer"
                  onClick={() => loadMutasiDetail(mutasi)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-darkblue">
                          {mutasi.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo.class}`}
                        >
                          <StatusIcon size={10} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <Truck size={14} className="text-primary" />
                          <span className="text-sm text-gray-600">
                            {mutasi.items?.length || 0} roll
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-primary" />
                          <span className="text-sm text-gray-600">
                            {format2(mutasi.total_berat || 0)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition">
                      Detail
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    {formatTanggal(mutasi.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail & Konfirmasi */}
      {selectedMutasi && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <h3 className="font-semibold text-darkblue mb-4">
            Detail Mutasi Masuk
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">No. Surat Jalan</div>
                <div className="font-mono text-sm text-darkblue">
                  {selectedMutasi.id}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Dari Gudang</div>
                <div className="font-medium text-darkblue">
                  {selectedMutasi.gudangAsalNama}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Tanggal Kirim</div>
                <div className="text-sm text-gray-700">
                  {formatTanggal(selectedMutasi.created_at)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Total Roll</div>
                <div className="font-medium text-darkblue">
                  {selectedMutasi.items?.length || 0}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Roll ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Produk
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Berat
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Kategori
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selectedMutasi.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-primary/5">
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">
                        {item.rollId}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.produkNama}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {format2(item.berat)} kg
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.kategori}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedMutasi.catatan && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Catatan:</div>
                <div className="text-sm text-gray-700">
                  {selectedMutasi.catatan}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmReceive}
              disabled={confirming}
              className="w-full bg-gradient-card text-white p-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              {confirming ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Konfirmasi Penerimaan Barang</span>
                </>
              )}
            </button>

            <button
              onClick={() => setSelectedMutasi(null)}
              className="w-full text-gray-600 hover:text-gray-800 p-2 text-sm font-medium"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Mutasi Selesai */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-darkblue flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle className="text-primary" size={18} />
            </div>
            Riwayat Mutasi Selesai
          </h3>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm text-primary hover:text-midblue font-medium"
          >
            {showCompleted ? "Lihat Semua" : "Sembunyikan"}
          </button>
        </div>

        {showCompleted && (
          <div className="space-y-3 max-h-60 overflow-auto">
            {completedMutasi.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Belum ada riwayat
              </p>
            ) : (
              completedMutasi.map((mutasi, idx) => {
                const statusInfo = STATUS_BADGE[SJ_STATUS.COMPLETED];
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="font-mono text-sm text-darkblue">
                        {mutasi.id}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {mutasi.items?.length || 0} roll •{" "}
                        {format2(mutasi.total_berat || 0)} kg
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.class}`}
                      >
                        <StatusIcon size={10} />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTanggalShort(mutasi.completed_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   RIWAYAT MUTASI TAB
====================================================== */
function RiwayatMutasiTab({ gudangId, gudangNama }) {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [printingSjId, setPrintingSjId] = useState(null);

  const handlePrintMutasiHistory = async (mutasi) => {
    const printKey = mutasi.id;
    console.log("data mutasi untuk print:", mutasi);

    // ✅ Cegah double print
    if (printingSjId === printKey) {
      Swal.fire({
        title: "Info",
        text: "Proses print sedang berlangsung...",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // ✅ Konfirmasi print ulang
    const confirm = await Swal.fire({
      title: "Print Ulang Surat Jalan?",
      html: `
      <div class="text-left">
        <p>Surat jalan <b>${mutasi.id}</b> sudah pernah dibuat.</p>
        <p class="text-sm text-gray-600 mt-2">
          Apakah Anda ingin mencetak ulang?
        </p>
      </div>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "🖨️ Ya, Print",
      cancelButtonText: "Batal",
      confirmButtonColor: "#243A8C",
    });

    if (!confirm.isConfirmed) return;

    setPrintingSjId(printKey);

    Swal.fire({
      title: "Mencetak...",
      text: "Sedang memproses surat jalan",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // ✅ Build data DARI DATA RIWAYAT (immutable)
      const printData = {
        sjId: mutasi.id,
        gudangAsal: mutasi.gudang_asal_nama || mutasi.gudangAsalNama || "-",
        gudangTujuan: mutasi.gudang_tujuan_nama || mutasi.gudang_tujuan || "-",
        tanggal: formatTanggal(mutasi.created_at),
        totalRolls: mutasi.items?.length || 0,
        totalBerat: format2(mutasi.total_berat || 0),
        items:
          mutasi.items?.map((item) => ({
            rollId: item.rollId,
            produkNama: item.produkNama,
            berat: format2(item.berat),
            kategori: item.kategori,
            supplier: item.supplier || "-",
          })) || [],
        catatan: mutasi.catatan || "-",
        adminPengirim: mutasi.created_by_email || "-",
        userRole: mutasi.metadata?.userRole || "-",
        via: mutasi.via || "-",
      };

      console.log("printData yang dikirim ke thermal:", printData);
      // ✅ THERMAL ONLY
      printSuratJalanThermal(printData);

      Swal.fire({
        title: "Berhasil!",
        text: "Surat jalan berhasil dicetak ulang (Thermal)",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Gagal print surat jalan",
        icon: "error",
      });
    } finally {
      setPrintingSjId(null);
    }
  };

  const loadRiwayat = useCallback(async () => {
    if (!gudangId) return;

    try {
      setLoading(true);

      const keluarQ = query(
        collection(db, "suratJalan"),
        where("tipe", "==", SJ_TIPE.MUTASI),
        where("gudang_asal", "==", gudangId),
        orderBy("created_at", "desc"),
        limit(50),
      );

      const masukQ = query(
        collection(db, "suratJalan"),
        where("tipe", "==", SJ_TIPE.MUTASI),
        where("gudang_tujuan", "==", gudangId),
        orderBy("created_at", "desc"),
        limit(50),
      );

      const [keluarSnap, masukSnap] = await Promise.all([
        getDocs(keluarQ),
        getDocs(masukQ),
      ]);

      const keluarData = keluarSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        arah: "KELUAR",
      }));

      const masukData = masukSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        arah: "MASUK",
      }));

      const semua = [...keluarData, ...masukData].sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0);
        const dateB = b.created_at?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setRiwayat(semua);
    } catch (error) {
      console.error("Error loading riwayat:", error);
    } finally {
      setLoading(false);
    }
  }, [gudangId]);

  useEffect(() => {
    loadRiwayat();
  }, [loadRiwayat]);

  const filteredRiwayat = riwayat.filter((item) => {
    if (filter === "keluar" && item.arah !== "KELUAR") return false;
    if (filter === "masuk" && item.arah !== "MASUK") return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      const itemsArray = Array.isArray(item.items) ? item.items : [];

      return (
        item.id?.toLowerCase().includes(term) ||
        itemsArray.some((i) => i.rollId?.toLowerCase().includes(term))
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Mutasi Keluar"
          value={riwayat.filter((r) => r.arah === "KELUAR").length}
          icon={ArrowRight}
          color="blue"
        />
        <StatCard
          title="Mutasi Masuk"
          value={riwayat.filter((r) => r.arah === "MASUK").length}
          icon={ArrowLeft}
          color="green"
        />
        <StatCard
          title="Total Mutasi"
          value={riwayat.length}
          icon={ArrowLeftRight}
          color="primary"
        />
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="border border-gray-200 pl-10 pr-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
              placeholder="Cari No. SJ atau Roll ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("semua")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "semua"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter("keluar")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "keluar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Keluar
            </button>
            <button
              onClick={() => setFilter("masuk")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "masuk"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Masuk
            </button>
          </div>
        </div>
      </div>

      {/* List Riwayat */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        {loading ? (
          <div className="p-8 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
          </div>
        ) : filteredRiwayat.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p>Tidak ada riwayat mutasi</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-auto">
            {filteredRiwayat.map((mutasi) => {
              const statusInfo =
                STATUS_BADGE[mutasi.status] || STATUS_BADGE[SJ_STATUS.PENDING];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={mutasi.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-primary/5 transition"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-darkblue">
                          {mutasi.id}
                        </span>
                        {mutasi.arah === "KELUAR" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            <ArrowRight size={10} />
                            Keluar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
                            <ArrowLeft size={10} />
                            Masuk
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo.class}`}
                        >
                          <StatusIcon size={10} />
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div>
                          <div className="text-xs text-gray-500">
                            {mutasi.arah === "KELUAR"
                              ? "Tujuan"
                              : "Dari Gudang"}
                          </div>
                          <div className="text-sm font-medium text-darkblue">
                            {mutasi.arah === "KELUAR"
                              ? mutasi.gudang_tujuan_nama ||
                                mutasi.gudang_tujuan
                              : mutasi.gudangAsalNama || mutasi.gudang_asal}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Jumlah Roll
                          </div>
                          <div className="text-sm font-medium text-darkblue">
                            {mutasi.total_roll || mutasi.items?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Total Berat
                          </div>
                          <div className="text-sm font-medium text-darkblue">
                            {format2(mutasi.total_berat || 0)} kg
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Tanggal</div>
                          <div className="text-sm font-medium text-darkblue">
                            {formatTanggalShort(mutasi.created_at)}
                          </div>
                          <button
                            onClick={() => handlePrintMutasiHistory(mutasi)}
                            disabled={printingSjId === mutasi.id}
                            className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg
                            hover:bg-midblue flex items-center gap-1
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Printer size={14} />
                            Print Ulang
                          </button>
                        </div>
                      </div>

                      {mutasi.items && mutasi.items.length > 0 && (
                        <div className="mt-3">
                          <details className="text-sm">
                            <summary className="text-primary cursor-pointer hover:text-midblue">
                              Lihat Detail Roll ({mutasi.items.length})
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                              {mutasi.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs font-mono bg-gray-50 p-2 rounded"
                                >
                                  {item.rollId} - {item.produkNama} -{" "}
                                  {format2(item.berat)} kg
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {mutasi.catatan && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-w-xs">
                        <span className="font-semibold">Catatan:</span>{" "}
                        {mutasi.catatan}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadRiwayat}
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-midblue flex items-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] shadow-lg"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Riwayat
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function MutasiGudang() {
  const { activeGudangId, gudangNama, ensureGudang } = useGudang();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("keluar");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "masuk" || tab === "keluar" || tab === "riwayat")
      setActiveTab(tab);
  }, []);

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
            Silakan pilih gudang terlebih dahulu
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-card text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ArrowLeftRight className="w-6 h-6 text-secondary" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  Mutasi Antar Gudang
                </h1>
              </div>
              <div className="flex items-center gap-4 mt-2 text-white/80">
                <p className="flex items-center gap-2">
                  <Package size={16} className="text-secondary" />
                  <span>{gudangNama}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-secondary" />
                  <span>{new Date().toLocaleDateString("id-ID")}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition border border-white/20"
            >
              <FileText size={16} />
              <span>{showInfo ? "Sembunyikan Info" : "Tampilkan Info"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      {showInfo && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-blue-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">
                  Alur Mutasi Antar Gudang
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-700 mb-1">
                      Mutasi Keluar:
                    </div>
                    <ol className="list-decimal list-inside text-gray-700 space-y-1">
                      <li>Pilih gudang tujuan</li>
                      <li>Scan atau pilih roll</li>
                      <li>Approve mutasi</li>
                      <li>Status roll "IN_TRANSIT"</li>
                      <li className="font-semibold">✅ Print Surat Jalan</li>
                      <li>Tunggu konfirmasi dari gudang tujuan</li>
                    </ol>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700 mb-1">
                      Mutasi Masuk:
                    </div>
                    <ol className="list-decimal list-inside text-gray-700 space-y-1">
                      <li>Lihat daftar mutasi pending</li>
                      <li>Cek kesesuaian fisik</li>
                      <li>Konfirmasi penerimaan</li>
                      <li>Roll otomatis masuk stok</li>
                      <li className="font-semibold">
                        ✅ Status mutasi "COMPLETED"
                      </li>
                    </ol>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  * Semua transaksi tercatat di stockLedger (immutable)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("keluar")}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "keluar"
                  ? "bg-primary/5 text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ArrowRight size={18} />
              Mutasi Keluar
            </button>
            <button
              onClick={() => setActiveTab("masuk")}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "masuk"
                  ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ArrowLeft size={18} />
              Mutasi Masuk
            </button>
            <button
              onClick={() => setActiveTab("riwayat")}
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "riwayat"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Clock size={18} />
              Riwayat Mutasi
            </button>
          </div>

          <div className="p-6">
            {activeTab === "keluar" ? (
              <MutasiKeluarTab
                key={`keluar-${refreshKey}`}
                gudangId={activeGudangId}
                gudangNama={gudangNama}
                user={user}
                onSuccess={() => setRefreshKey((prev) => prev + 1)}
              />
            ) : activeTab === "masuk" ? (
              <MutasiMasukTab
                key={`masuk-${refreshKey}`}
                gudangId={activeGudangId}
                gudangNama={gudangNama}
                user={user}
                onSuccess={() => setRefreshKey((prev) => prev + 1)}
              />
            ) : (
              <RiwayatMutasiTab
                gudangId={activeGudangId}
                gudangNama={gudangNama}
              />
            )}
          </div>
        </div>

        {/* Footer Info Card */}
        <div className="mt-6 bg-gradient-card rounded-xl shadow-soft p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-semibold text-white">Arsitektur Mutasi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={14} className="text-secondary" />
                  <span className="font-medium text-sm">Immutable</span>
                </div>
                <p className="text-xs text-white/80">
                  Mutasi tidak bisa diedit setelah APPROVED
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={14} className="text-secondary" />
                  <span className="font-medium text-sm">Ledger-Based</span>
                </div>
                <p className="text-xs text-white/80">
                  Setiap mutasi tercatat di stockLedger
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck size={14} className="text-secondary" />
                  <span className="font-medium text-sm">Surat Jalan</span>
                </div>
                <p className="text-xs text-white/80">Parent transaksi mutasi</p>
              </div>

              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive size={14} className="text-secondary" />
                  <span className="font-medium text-sm">Barcode Tracking</span>
                </div>
                <p className="text-xs text-white/80">
                  Lacak per roll selama mutasi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
