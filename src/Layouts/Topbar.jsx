// src/Layouts/Topbar.jsx
import { signOut } from "firebase/auth";
import { auth, db } from "../Services/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useGudang } from "../Hooks/useGudang";
import {
  Menu,
  X,
  LogOut,
  Building,
  ChevronDown,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const {
    isOwner,
    isAdmin,
    isKasir,
    gudangList,
    activeGudang,
    activeGudangId,
    changeGudang,
    loading: gudangLoading,
  } = useGudang();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [changingGudang, setChangingGudang] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userDropdownRef = useRef(null);

  /* ======================================================
     LOG ACTIVITY
  ====================================================== */
  const logActivity = async (actionType, details = "") => {
    if (!currentUser) return;

    try {
      const activityData = {
        action_type: actionType,
        action_details: details,
        entity_id: currentUser.uid,
        entity_type: "USER",
        timestamp: serverTimestamp(),
        user_id: currentUser.uid,
        user_email: currentUser.email,
        user_role: currentUser.role || ["unknown"],
        ip_address: "web-app",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      await addDoc(collection(db, "userActivities"), activityData);
      console.log(`✅ Activity logged: ${actionType}`);
    } catch (error) {
      console.error("❌ Error logging activity:", error);
    }
  };

  /* ===============================
     GUDANG SELECTOR LOGIC
  ================================ */
  // const kasirGudangIds = useMemo(
  //   () => currentUser?.kasirGudangIds || [],
  //   [currentUser],
  // );

  // console.log("📊 Kasir Gudang IDs:", kasirGudangIds);

  const selectableGudang = useMemo(() => {
    if (!currentUser) return [];

    // 1️⃣ Owner: semua gudang
    if (isOwner) {
      return gudangList || [];
    }

    // 2️⃣ Admin / Kasir dengan multi gudang
    const allowedGudangIds = currentUser.kasirGudangIds || [];
    if (allowedGudangIds.length > 0) {
      return (gudangList || []).filter((g) => allowedGudangIds.includes(g.id));
    }

    // 3️⃣ Admin / Kasir single gudang
    if (currentUser.gudangId) {
      const singleGudang = (gudangList || []).find(
        (g) => g.id === currentUser.gudangId,
      );
      return singleGudang ? [singleGudang] : [];
    }

    return [];
  }, [currentUser, isOwner, gudangList]);

  const showGudangSelect = selectableGudang.length > 0;
  const hasMultipleGudang = selectableGudang.length > 1;

  // DEBUG LOGS
  // useEffect(() => {
  //   console.log("🔍 TOPBAR STATE:", {
  //     currentUser: currentUser?.email,
  //     isOwner,
  //     isAdmin,
  //     isKasir,
  //     activeGudang: activeGudang?.nama,
  //     activeGudangId,
  //     gudangListCount: gudangList?.length,
  //     selectableGudangCount: selectableGudang.length,
  //     gudangLoading,
  //   });
  // }, [
  //   currentUser,
  //   isOwner,
  //   isAdmin,
  //   isKasir,
  //   activeGudang,
  //   activeGudangId,
  //   gudangList,
  //   gudangLoading,
  //   selectableGudang,
  // ]);

  // Close dropdown when clicking outside (User)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ===============================
     GUDANG SELECT HANDLER
  ================================ */
  const handleGudangChange = async (gudangId) => {
    if (!gudangId || gudangId === activeGudangId) {
      return;
    }

    console.log("🔄 Changing gudang to:", gudangId);
    setChangingGudang(true);

    try {
      await changeGudang(gudangId);

      // Log aktivitas ganti gudang
      const newGudang = selectableGudang.find((g) => g.id === gudangId);
      await logActivity(
        "GANTI_GUDANG",
        `Mengganti gudang ke ${newGudang?.nama || gudangId}`,
      );
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
      });
    } finally {
      setChangingGudang(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (authLoading || gudangLoading) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 animate-pulse rounded"></div>
                <div className="w-24 h-3 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="w-24 h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  // ==================== NO USER STATE ====================
  if (!currentUser) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-gray-600">Not authenticated</div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </div>
      </header>
    );
  }

  /* ===============================
     ROLE LABEL & COLOR
  ================================ */
  const getRoleInfo = () => {
    if (isOwner)
      return {
        label: "Owner",
        color: "bg-purple-100 text-purple-800",
        icon: "👑",
      };
    if (isAdmin)
      return { label: "Admin", color: "bg-blue-100 text-blue-800", icon: "⚙️" };
    if (isKasir)
      return {
        label: "Kasir",
        color: "bg-green-100 text-green-800",
        icon: "💵",
      };
    return { label: "User", color: "bg-gray-100 text-gray-800", icon: "👤" };
  };

  const roleInfo = getRoleInfo();

  /* ===============================
     NATIVE GUDANG SELECT - DESKTOP
  ================================ */
  const DesktopGudangSelect = () => {
    if (!showGudangSelect) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 min-w-[180px]">
          <AlertCircle size={16} />
          <span>Tidak ada gudang tersedia</span>
        </div>
      );
    }

    if (!hasMultipleGudang && !isOwner) {
      // Hanya satu gudang, tampilkan sebagai display saja
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm min-w-[180px]">
          <Building size={16} className="text-gray-600" />
          <div className="text-left flex-1">
            <div className="font-medium truncate">
              {activeGudang?.nama || "Pilih Gudang"}
            </div>
            {activeGudang?.alamat && (
              <div className="text-xs text-gray-500 truncate">
                {activeGudang.alamat}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative min-w-[180px]">
        {/* Building Icon */}
        <Building
          size={16}
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 z-10 ${
            changingGudang ? "text-blue-500 animate-pulse" : "text-gray-500"
          }`}
        />

        {/* Loading Overlay */}
        {changingGudang && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg z-20">
            <Loader2 size={16} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Native Select */}
        <select
          value={activeGudangId || ""}
          onChange={(e) => handleGudangChange(e.target.value)}
          disabled={changingGudang || !hasMultipleGudang}
          className={`w-full pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
            changingGudang
              ? "opacity-70 cursor-wait"
              : hasMultipleGudang || isOwner
                ? "cursor-pointer hover:border-gray-400"
                : "cursor-default"
          }`}
        >
          <option value="">Pilih Gudang</option>
          {selectableGudang.map((gudang) => (
            <option key={gudang.id} value={gudang.id}>
              {gudang.nama} {gudang.id === activeGudangId ? "(Aktif)" : ""}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <ChevronDown
          size={16}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
            changingGudang ? "text-blue-500" : "text-gray-500"
          }`}
        />
      </div>
    );
  };

  /* ===============================
     MOBILE GUDANG SELECT
  ================================ */
  const MobileGudangSelect = () => {
    if (!showGudangSelect) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 w-full">
          <AlertCircle size={14} />
          <span>Tidak ada gudang</span>
        </div>
      );
    }

    if (!hasMultipleGudang && !isOwner) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm w-full">
          <Building size={14} className="text-gray-500" />
          <span className="font-medium truncate">
            {activeGudang?.nama || "Gudang"}
          </span>
        </div>
      );
    }

    return (
      <div className="relative w-full">
        {/* Building Icon */}
        <Building
          size={14}
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            changingGudang ? "text-blue-500 animate-pulse" : "text-gray-500"
          }`}
        />

        {/* Native Select */}
        <select
          value={activeGudangId || ""}
          onChange={(e) => handleGudangChange(e.target.value)}
          disabled={changingGudang}
          className={`w-full pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
            changingGudang ? "opacity-70 cursor-wait" : "cursor-pointer"
          }`}
        >
          <option value="">Pilih Gudang</option>
          {selectableGudang.map((gudang) => (
            <option key={gudang.id} value={gudang.id}>
              {gudang.nama}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
        />

        {/* Loading Indicator */}
        {changingGudang && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <Loader2 size={12} className="animate-spin text-blue-500" />
          </div>
        )}
      </div>
    );
  };

  /* ===============================
     LOGOUT HANDLER
  ================================ */
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Apakah Anda yakin ingin keluar dari sistem?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      setLoggingOut(true);

      try {
        // Log aktivitas logout sebelum sign out
        await logActivity(
          "LOGOUT",
          `User ${currentUser.email} logout dari sistem`,
        );

        // Hapus localStorage
        localStorage.removeItem("ACTIVE_GUDANG_OWNER");

        // Sign out dari Firebase
        await signOut(auth);

        // Redirect ke halaman login
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Logout error:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal logout",
          text: error.message || "Terjadi kesalahan",
          timer: 2000,
        });
      } finally {
        setLoggingOut(false);
      }
    }
  };

  /* ===============================
     USER PROFILE COMPONENT
  ================================ */
  const UserProfile = () => {
    return (
      <div className="relative" ref={userDropdownRef}>
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menu pengguna"
          disabled={loggingOut}
        >
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            {loggingOut ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <User size={20} className="text-white" />
            )}
          </div>

          {/* User Info - Desktop */}
          <div className="hidden md:block text-left">
            <div className="font-medium text-gray-800 truncate max-w-[200px]">
              {currentUser.nama || currentUser.email}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${roleInfo.color} flex items-center gap-1`}
              >
                <span>{roleInfo.icon}</span>
                <span>{roleInfo.label}</span>
              </span>
              {activeGudang && !isOwner && (
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  • {activeGudang.nama}
                </span>
              )}
            </div>
          </div>

          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform ${
              showUserDropdown ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* User Dropdown Menu */}
        {showUserDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-50 animate-fadeIn">
            {/* User Header */}
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="font-medium text-gray-900 truncate">
                {currentUser.nama || currentUser.email}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {currentUser.email}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${roleInfo.color}`}
                >
                  {roleInfo.icon} {roleInfo.label}
                </span>
                {currentUser.isActive === false && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Nonaktif
                  </span>
                )}
              </div>
            </div>

            {/* Gudang Info */}
            {activeGudang && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Building size={14} />
                  <span>Gudang Aktif</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-800">
                    {activeGudang.nama}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {activeGudang.alamat || "Tanpa alamat"}
                  </div>
                  {activeGudang.isTokoPenjualan && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                      Toko Penjualan
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* User Details */}
            <div className="p-4">
              {currentUser.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <div className="w-6 text-center">📱</div>
                  <span>{currentUser.phone}</span>
                </div>
              )}

              {isKasir && currentUser.kasirGudangIds?.length > 0 && (
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Akses Gudang:</div>
                  <div className="text-xs text-gray-500">
                    {currentUser.kasirGudangIds.length} gudang
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="p-3 border-t">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    Keluar dari Sistem
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      {/* Main Topbar */}
      <div className="px-4 md:px-6 py-3">
        <div className="flex justify-between items-center">
          {/* LEFT SIDE: Menu Button & Branding */}
          <div className="flex items-center gap-4">
            {/* Menu Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
              {sidebarOpen ? (
                <X size={20} className="text-gray-700" />
              ) : (
                <Menu size={20} className="text-gray-700" />
              )}
            </button>

            {/* Logo/Branding */}
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-800">
                Sistem Stok Kain
              </h1>
              <p className="text-xs text-gray-500">
                Manajemen Roll Kain Terintegrasi
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: User Info & Controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Gudang Selector - Desktop */}
            <div className="hidden md:block">
              <DesktopGudangSelect />
            </div>

            {/* User Profile */}
            <UserProfile />

            {/* Mobile Gudang Display */}
            <div className="md:hidden">
              <MobileGudangSelect />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Gudang Selector Bar */}
      {showGudangSelect && (hasMultipleGudang || isOwner) && (
        <div className="md:hidden bg-gradient-to-r from-blue-50 to-gray-50 border-t px-4 py-3">
          <MobileGudangSelect />
        </div>
      )}
    </header>
  );
}
