// src/Hooks/useMutasiGudang.js
import { useState, useCallback, useMemo, useRef } from "react";
import {
  fetchMutasiData,
  createMutasiDraft,
  startMutasiTransit,
  confirmMutasiMasuk,
  cancelMutasi,
  getMutasiDetail,
  generateSuratJalanMutasi,
  getMutasiStats,
} from "../Services/mutasi.service";
import { STATUS_FOR_MUTATION } from "../Constants/rollStatus";
import Swal from "sweetalert2";

export default function useMutasiGudang(gudangId, user) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    stokRolls: [],
    gudangList: [],
    mutasiKeluar: [],
    mutasiMasuk: [],
    mutasiSelesai: [],
  });
  const [stats, setStats] = useState({
    totalDalamPerjalanan: 0,
    totalPendingMasuk: 0,
    countDalamPerjalanan: 0,
    countPendingMasuk: 0,
  });
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  /* ======================================================
     LOAD DATA
  ===================================================== */
  const loadData = useCallback(
    async (force = false) => {
      if (loadingRef.current && !force) return;
      if (!gudangId || !user?.uid) return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        console.log("🔄 [MUTASI] Loading data for gudang:", gudangId);

        // Load main data
        const result = await fetchMutasiData({
          gudangId,
          userId: user.uid,
        });

        console.log("📊 [MUTASI] Data loaded:", {
          stokRolls: result.stokRolls.length,
          gudangList: result.gudangList.length,
          mutasiKeluar: result.mutasiKeluar.length,
          mutasiMasuk: result.mutasiMasuk.length,
          mutasiSelesai: result.mutasiSelesai.length,
        });

        setData({
          stokRolls: result.stokRolls || [],
          gudangList: result.gudangList || [],
          mutasiKeluar: result.mutasiKeluar || [],
          mutasiMasuk: result.mutasiMasuk || [],
          mutasiSelesai: result.mutasiSelesai || [],
        });

        // Load stats
        try {
          const statsData = await getMutasiStats(gudangId);
          setStats(statsData);
        } catch (statsError) {
          console.error("⚠️ Error loading stats:", statsError);
        }
      } catch (error) {
        console.error("❌ Error loading data:", error);
        setError(error.message);

        // Show error to user
        Swal.fire({
          title: "Gagal Memuat Data",
          text: error.message || "Terjadi kesalahan saat memuat data",
          icon: "error",
          confirmButtonText: "OK",
        });

        setData({
          stokRolls: [],
          gudangList: [],
          mutasiKeluar: [],
          mutasiMasuk: [],
          mutasiSelesai: [],
        });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [gudangId, user],
  );

  /* ======================================================
     BUAT MUTASI DRAFT
  ===================================================== */
  const buatMutasiDraft = useCallback(
    async ({ toGudangId, rollIds }) => {
      try {
        setLoading(true);

        console.log("📤 [MUTASI] Creating draft with:", {
          toGudangId,
          rollIdsCount: rollIds.length,
        });

        const result = await createMutasiDraft({
          fromGudangId: gudangId,
          toGudangId,
          rollIds,
          userId: user.uid,
          userName: user.nama || user.displayName || "User",
          userEmail: user.email || "",
        });

        // Show success with print option
        const { value: action } = await Swal.fire({
          title: "✅ Draft Mutasi Berhasil!",
          html: `
            <div class="text-left space-y-3">
              <div class="font-bold text-lg">${result.totalRoll} roll siap dikirim</div>
              <div class="text-sm">
                <div>Dari: <strong>${result.fromGudangNama}</strong></div>
                <div>Ke: <strong>${result.toGudangNama}</strong></div>
                <div>No. SJ: <code class="bg-gray-100 px-2 py-1 rounded">${result.sjId}</code></div>
                <div class="mt-2">⚖️ Total berat: ${result.totalBerat?.toFixed(2) || "0.00"} kg</div>
              </div>
              <div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="font-semibold text-yellow-800 text-sm mb-1">⚠️ Perhatian:</div>
                <div class="text-xs text-yellow-700">
                  Roll akan berstatus "Dalam Perjalanan" setelah Anda print surat jalan.
                  Pastikan untuk print sebelum barang dikirim.
                </div>
              </div>
            </div>
          `,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Print Surat Jalan",
          cancelButtonText: "Nanti Saja",
          confirmButtonColor: "#0C1E6E",
          cancelButtonColor: "#6B7280",
        });

        if (action === "confirm") {
          // Automatically generate and show print data
          try {
            const printData = await generateSuratJalanMutasi(result.sjId);

            // Simulate print (you can replace this with actual print function)
            console.log("🖨️ Print data:", printData);

            // Start transit setelah print
            await startMutasiTransit(
              result.sjId,
              user.uid,
              user.nama || user.displayName || "User",
            );

            Swal.fire({
              title: "🚚 Mutasi Dimulai!",
              text: "Surat jalan telah dicetak dan mutasi dalam perjalanan",
              icon: "success",
              timer: 2000,
            });
          } catch (printError) {
            console.error("Print error:", printError);
            Swal.fire({
              title: "Perhatian",
              html: `
                <div class="text-left">
                  <p>Draft berhasil dibuat tapi gagal print.</p>
                  <p class="text-sm text-gray-600 mt-2">
                    Silakan print dari menu "Dalam Perjalanan" nanti.
                  </p>
                </div>
              `,
              icon: "warning",
            });
          }
        }

        // Refresh data
        setTimeout(() => {
          loadData(true);
        }, 1000);

        return result;
      } catch (error) {
        console.error("❌ Error creating draft:", error);

        Swal.fire({
          title: "Gagal Membuat Mutasi",
          html: `
            <div class="text-left">
              <p class="font-medium">${error.message || "Terjadi kesalahan"}</p>
              <div class="mt-2 p-2 bg-red-50 rounded text-sm">
                <p>Pastikan:</p>
                <ul class="list-disc pl-4 mt-1">
                  <li>Roll masih tersedia (status: AVAILABLE)</li>
                  <li>Gudang tujuan valid</li>
                  <li>Koneksi internet stabil</li>
                </ul>
              </div>
            </div>
          `,
          icon: "error",
          confirmButtonText: "OK",
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [gudangId, user, loadData],
  );

  /* ======================================================
     PRINT SURAT JALAN DAN START TRANSIT
  ===================================================== */
  const printSuratJalan = useCallback(
    async (sjId) => {
      try {
        // Show loading
        const loadingSwal = Swal.fire({
          title: "Mempersiapkan...",
          text: "Sedang mengambil data surat jalan",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Generate print data
        const printData = await generateSuratJalanMutasi(sjId);

        // Close loading
        await loadingSwal.close();

        // Show print confirmation
        const { isConfirmed } = await Swal.fire({
          title: "Print Surat Jalan?",
          html: `
          <div class="text-left space-y-3">
            <div class="font-bold">No. SJ: ${printData.sjId}</div>
            <div class="text-sm">
              <div>Dari: <strong>${printData.fromGudangNama}</strong></div>
              <div>Ke: <strong>${printData.toGudangNama}</strong></div>
              <div class="mt-2">📦 ${printData.totalRoll} roll • ⚖️ ${printData.totalBerat?.toFixed(2) || "0.00"} kg</div>
              <div class="text-xs text-gray-600">Status: ${printData.statusDisplay}</div>
            </div>
            ${
              printData.status === "DRAFT"
                ? `<div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="font-semibold text-blue-800 text-sm mb-1">⚠️ Penting:</div>
                    <div class="text-xs text-blue-700">
                      Status akan berubah menjadi "Dalam Perjalanan" setelah print.
                      Roll akan dikunci dan tidak tersedia di gudang asal.
                    </div>
                   </div>`
                : ""
            }
          </div>
        `,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Ya, Print Sekarang",
          cancelButtonText: "Batal",
          confirmButtonColor: "#0C1E6E",
        });

        if (!isConfirmed) return;

        // Start transit jika masih DRAFT
        if (printData.status === "DRAFT") {
          Swal.fire({
            title: "🚚 Memulai Perjalanan...",
            text: "Mengupdate status mutasi",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          await startMutasiTransit(
            sjId,
            user.uid,
            user.nama || user.displayName || "User",
          );

          // Update print data status
          printData.status = "IN_TRANSIT";
          printData.statusDisplay = "Dalam Perjalanan";
        }

        // Call actual print function (ganti dengan fungsi print Anda)
        if (window.printSuratJalanMutasi) {
          window.printSuratJalanMutasi(printData);
        } else {
          // Fallback: show print dialog
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
          <html>
            <head>
              <title>Surat Jalan ${printData.sjId}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .info { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>SURAT JALAN MUTASI</h1>
                <p>No: ${printData.sjId}</p>
              </div>
              
              <div class="info">
                <p><strong>Dari Gudang:</strong> ${printData.fromGudangNama}</p>
                <p><strong>Ke Gudang:</strong> ${printData.toGudangNama}</p>
                <p><strong>Tanggal:</strong> ${new Date(printData.tanggal).toLocaleDateString("id-ID")}</p>
                <p><strong>Dibuat oleh:</strong> ${printData.createdByName}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kode Roll</th>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Berat (kg)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${printData.rollDetails
                    .map(
                      (roll, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${roll.rollId}</td>
                      <td>${roll.namaProduk}</td>
                      <td>${roll.kategori}</td>
                      <td>${roll.berat.toFixed(2)}</td>
                      <td>${roll.status || "AVAILABLE"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              
              <div class="info">
                <p><strong>Total Roll:</strong> ${printData.totalRoll}</p>
                <p><strong>Total Berat:</strong> ${printData.totalBerat.toFixed(2)} kg</p>
                <p><strong>Status Mutasi:</strong> ${printData.statusDisplay}</p>
              </div>
              
              <div class="footer">
                <p>Cetakan otomatis dari sistem - ${new Date().toLocaleString("id-ID")}</p>
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 1000);
                }
              </script>
            </body>
          </html>
        `);
          printWindow.document.close();
        }

        // Success message
        Swal.fire({
          title: "✅ Berhasil!",
          html: `
          <div class="text-left">
            <p>Surat jalan berhasil dicetak</p>
            <p class="text-sm text-gray-600 mt-2">
              ${
                printData.status === "IN_TRANSIT"
                  ? "Status mutasi sekarang: <strong class='text-blue-600'>Dalam Perjalanan</strong>"
                  : "Mutasi masih dalam status draft"
              }
            </p>
          </div>
        `,
          icon: "success",
          confirmButtonText: "OK",
        });

        // Refresh data
        setTimeout(() => {
          loadData(true);
        }, 1000);
      } catch (error) {
        console.error("❌ Error printing surat jalan:", error);

        Swal.fire({
          title: "Gagal",
          text: error.message || "Gagal memproses print surat jalan",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    },
    [user, loadData],
  );

  /* ======================================================
     TERIMA MUTASI MASUK
  ===================================================== */
  const terimaMutasiMasuk = useCallback(
    async (sjId) => {
      try {
        setLoading(true);

        const result = await confirmMutasiMasuk(
          sjId,
          user.uid,
          user.nama || user.displayName || "User",
        );

        Swal.fire({
          title: "✅ Berhasil Diterima!",
          html: `
            <div class="text-left">
              <p class="font-bold">${result.totalRoll} roll telah ditambahkan ke stok</p>
              <p class="text-sm mt-1">Dari: ${result.fromGudangNama || result.fromGudangId}</p>
              <p class="text-sm">No. SJ: <code class="bg-gray-100 px-1 py-0.5 rounded text-xs">${result.sjId}</code></p>
              <div class="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
                Roll sekarang tersedia (AVAILABLE) di gudang Anda
              </div>
            </div>
          `,
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
        });

        // Refresh data
        setTimeout(() => {
          loadData(true);
        }, 500);

        return result;
      } catch (error) {
        console.error("❌ Error confirming masuk:", error);

        Swal.fire({
          title: "Gagal Menerima",
          html: `
            <div class="text-left">
              <p>${error.message || "Terjadi kesalahan"}</p>
              <div class="mt-2 p-2 bg-red-50 rounded text-sm">
                <p>Pastikan:</p>
                <ul class="list-disc pl-4 mt-1">
                  <li>Mutasi masih dalam perjalanan</li>
                  <li>Barang sudah sampai di gudang</li>
                  <li>Anda memiliki akses untuk menerima</li>
                </ul>
              </div>
            </div>
          `,
          icon: "error",
          confirmButtonText: "OK",
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, loadData],
  );

  /* ======================================================
     BATALKAN MUTASI
  ===================================================== */
  const batalkanMutasi = useCallback(
    async (sjId) => {
      const { isConfirmed } = await Swal.fire({
        title: "Batalkan Mutasi?",
        html: `
          <div class="text-left">
            <p>Roll akan dikembalikan ke stok gudang asal dengan status AVAILABLE</p>
            <p class="text-sm text-gray-600 mt-2">
              Aksi ini tidak bisa dibatalkan
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, Batalkan",
        cancelButtonText: "Batal",
      });

      if (!isConfirmed) return;

      try {
        setLoading(true);

        await cancelMutasi(
          sjId,
          user.uid,
          user.nama || user.displayName || "User",
        );

        Swal.fire({
          title: "✅ Dibatalkan",
          text: "Mutasi telah dibatalkan, roll dikembalikan ke stok (AVAILABLE)",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh data
        setTimeout(() => {
          loadData(true);
        }, 500);
      } catch (error) {
        console.error("❌ Error cancelling:", error);

        Swal.fire({
          title: "Gagal Membatalkan",
          html: `
            <div class="text-left">
              <p>${error.message || "Terjadi kesalahan"}</p>
              <p class="text-sm text-gray-600 mt-2">
                Mungkin mutasi sudah diterima atau dibatalkan sebelumnya
              </p>
            </div>
          `,
          icon: "error",
          confirmButtonText: "OK",
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, loadData],
  );

  /* ======================================================
     GETTERS
  ===================================================== */
  const stokAvailable = useMemo(() => {
    // Filter hanya roll yang bisa dimutasi (AVAILABLE)
    const available = data.stokRolls.filter((roll) => {
      const status = roll.status ? roll.status.toUpperCase() : "";
      return STATUS_FOR_MUTATION.includes(status);
    });

    console.log("🔍 stokAvailable debug:", {
      totalStokRolls: data.stokRolls.length,
      available: available.length,
      statusBreakdown: {
        AVAILABLE: data.stokRolls.filter((r) => r.status === "AVAILABLE")
          .length,
        OPEN: data.stokRolls.filter((r) => r.status === "OPEN").length,
        SOLD: data.stokRolls.filter((r) => r.status === "SOLD").length,
        DRAFT: data.stokRolls.filter((r) => r.status === "DRAFT").length,
        IN_TRANSIT: data.stokRolls.filter((r) => r.status === "IN_TRANSIT")
          .length,
      },
    });

    return available;
  }, [data.stokRolls]);

  const mutasiDalamPerjalanan = useMemo(() => {
    return data.mutasiKeluar.filter((m) => m.status === "IN_TRANSIT");
  }, [data.mutasiKeluar]);

  const mutasiDraft = useMemo(() => {
    return data.mutasiKeluar.filter((m) => m.status === "DRAFT");
  }, [data.mutasiKeluar]);

  const mutasiPendingMasuk = useMemo(() => {
    return data.mutasiMasuk.filter((m) => m.status === "IN_TRANSIT");
  }, [data.mutasiMasuk]);

  const mutasiSelesaiList = useMemo(() => {
    return data.mutasiSelesai || [];
  }, [data.mutasiSelesai]);

  const statistik = useMemo(() => {
    return {
      totalStok: stokAvailable.length,
      totalDalamPerjalanan: mutasiDalamPerjalanan.length,
      totalPendingMasuk: mutasiPendingMasuk.length,
      totalSelesai: mutasiSelesaiList.length,
      totalDraft: mutasiDraft.length,
    };
  }, [
    stokAvailable,
    mutasiDalamPerjalanan,
    mutasiPendingMasuk,
    mutasiSelesaiList,
    mutasiDraft,
  ]);

  return {
    // State
    loading,
    data,
    statistik,
    stats,
    error,

    // Actions
    loadData,
    buatMutasiDraft,
    terimaMutasiMasuk,
    batalkanMutasi,
    printSuratJalan,

    // Computed
    stokAvailable,
    mutasiDalamPerjalanan,
    mutasiPendingMasuk,
    mutasiSelesaiList,
    mutasiDraft,

    // Helpers
    refreshData: () => loadData(true),
    hasData:
      data.stokRolls.length > 0 ||
      data.mutasiKeluar.length > 0 ||
      data.mutasiMasuk.length > 0,
    canCreateMutasi: stokAvailable.length > 0 && data.gudangList.length > 0,
  };
}
