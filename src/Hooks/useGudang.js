// src/Hooks/useGudang.js
import { useContext, useRef, useCallback, useMemo } from "react";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2";

const STORAGE_KEY = "ACTIVE_GUDANG_OWNER";

export const useGudang = () => {
  const {
    currentUser,
    gudangList = [],
    activeGudang,
    activeGudangId,
    setActiveGudangId,
    loading,
    userPrimaryRole,
    isOwner,
    isAdmin,
    isKasir,
    refreshGudangList, // Jika ada di context
  } = useContext(AuthContext);

  const lastToastGudangRef = useRef(null);

  /* =====================================================
     CHANGE GUDANG WITHOUT PAGE RELOAD
  ===================================================== */
  const changeGudang = useCallback(
    async (gudangId) => {
      // console.log("🎯 changeGudang (NO RELOAD):", {
      //   from: activeGudangId,
      //   to: gudangId,
      //   user: currentUser?.email,
      //   isOwner,
      // });

      // Validation: No gudangId provided
      if (!gudangId) {
        console.warn("❌ No gudangId provided");
        return;
      }

      // Validation: Same gudang
      if (gudangId === activeGudangId) {
        console.log("⚠️ Same gudang selected");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: "Gudang sudah aktif",
          text: "Gudang yang dipilih sudah aktif",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
        return;
      }

      // Find target gudang
      const targetGudang = gudangList.find((g) => g.id === gudangId);
      if (!targetGudang) {
        console.error("❌ Gudang not found in list:", gudangId);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Gudang Tidak Ditemukan",
          text: "Gudang yang dipilih tidak tersedia",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        return;
      }

      // console.log("✅ Target gudang found:", targetGudang.nama);

      // ✅ Permission check untuk NON-OWNER (ADMIN / KASIR)
      if (!isOwner) {
        const allowedGudangIds = currentUser?.kasirGudangIds || [];

        // Jika user punya daftar gudang, validasi dari situ
        if (allowedGudangIds.length > 0) {
          if (!allowedGudangIds.includes(gudangId)) {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              title: "Akses Ditolak",
              text: "Anda tidak memiliki akses ke gudang ini",
              showConfirmButton: false,
              timer: 2000,
            });
            return;
          }
        }
        // Jika tidak punya kasirGudangIds, fallback ke gudangId tunggal
        else if (currentUser?.gudangId && currentUser.gudangId !== gudangId) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Akses Ditolak",
            text: `Anda hanya dapat mengakses gudang ${currentUser?.gudangNama}`,
            showConfirmButton: false,
            timer: 2000,
          });
          return;
        }
      }

      try {
        // Save to localStorage (for owner persistence)
        if (isOwner) {
          localStorage.setItem(STORAGE_KEY, gudangId);
          // console.log("💾 Saved to localStorage:", gudangId);
        }

        // Update context state - INI YANG BIKIN SEMUA KOMPONEN UPDATE
        // console.log("🔄 Setting active gudang in context...");
        setActiveGudangId(gudangId);

        // Refresh gudang list jika perlu (untuk owner)
        if (isOwner && typeof refreshGudangList === "function") {
          // console.log("🔄 Refreshing gudang list...");
          await refreshGudangList();
        }

        // Show success toast notification
        const shouldShowToast = lastToastGudangRef.current !== gudangId;

        if (shouldShowToast) {
          lastToastGudangRef.current = gudangId;

          // console.log("📢 Showing success toast (NO RELOAD)...");

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: `Gudang: ${targetGudang.nama}`,
            text: "Berhasil dipilih",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            customClass: {
              popup: "border border-gray-200 shadow-lg",
              title: "text-gray-800 font-semibold",
              htmlContainer: "text-gray-600",
              timerProgressBar: "bg-blue-500",
            },
          }).then(() => {
            // console.log("✅ Toast completed (NO PAGE RELOAD)");

            // Dispatch custom event untuk komponen lain yang perlu refresh data
            window.dispatchEvent(
              new CustomEvent("gudang-changed", {
                detail: { gudangId, gudang: targetGudang },
              }),
            );
          });
        }

        // Notify semua komponen bahwa gudang sudah berubah
        // console.log("📢 Broadcasting gudang change to all components...");

        // Update title jika perlu
        document.title = `Sistem Stok Kain - ${targetGudang.nama}`;
      } catch (error) {
        console.error("❌ Error changing gudang:", error);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Gagal mengubah gudang",
          text: error.message || "Terjadi kesalahan",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }
    },
    [
      activeGudangId,
      currentUser,
      gudangList,
      isOwner,
      setActiveGudangId,
      refreshGudangList,
    ],
  );

  /* =====================================================
     HELPER FUNCTIONS
  ===================================================== */
  const ensureGudang = useCallback(() => {
    if (!activeGudangId) {
      Swal.fire({
        toast: true,
        position: "top-end",
        title: "Gudang belum dipilih",
        text: "Silakan pilih gudang terlebih dahulu",
        icon: "warning",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return false;
    }
    return true;
  }, [activeGudangId]);

  const canKasir = useMemo(() => {
    return activeGudang?.isTokoPenjualan === true;
  }, [activeGudang]);

  /* =====================================================
     RETURN API
  ===================================================== */
  return {
    // State
    activeGudang,
    activeGudangId,
    gudangList,
    loading,

    // Role flags
    isOwner: !!isOwner,
    isAdmin: !!isAdmin,
    isKasir: !!isKasir,
    userPrimaryRole,

    // Actions
    changeGudang,

    // Helpers
    gudangNama: activeGudang?.nama || currentUser?.gudangNama || "Pilih Gudang",
    gudangValid: Boolean(activeGudangId),
    canKasir,
    ensureGudang,

    // Additional helpers
    selectableGudangCount: gudangList.length,
    hasMultipleGudang: gudangList.length > 1,
  };
};
