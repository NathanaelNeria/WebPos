// src/Router/ProtectedRoute.jsx
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useGudang } from "../Hooks/useGudang";
import LoadingSpinner from "../Components/LoadingSpinner";
import { useState, useEffect } from "react";
import { AlertCircle, Building, Lock } from "lucide-react";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  kasirOnly = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading, userPrimaryRole } = useAuth();
  const { activeGudangId, gudangList } = useGudang();
  const [isCreating, setIsCreating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Cek apakah sedang dalam proses create user
  useEffect(() => {
    const checkCreatingUser = () => {
      const creating = sessionStorage.getItem("isCreatingUser") === "true";
      setIsCreating(creating);
    };

    checkCreatingUser();

    const interval = setInterval(checkCreatingUser, 500);
    return () => clearInterval(interval);
  }, []);

  // Debug logging - hanya di development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔐 ProtectedRoute Check:", {
        path: location.pathname,
        user: currentUser?.email,
        primaryRole: userPrimaryRole,
        allowedRoles,
        loading,
        isCreating,
        kasirOnly,
        activeGudangId,
      });
    }
  }, [
    location.pathname,
    currentUser,
    userPrimaryRole,
    allowedRoles,
    loading,
    isCreating,
    kasirOnly,
    activeGudangId,
  ]);

  // Jangan redirect jika sedang dalam proses
  if (isCreating || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isCreating ? "Memproses user baru..." : "Mengalihkan halaman..."}
          </p>
        </div>
      </div>
    );
  }

  /* ===============================
     LOADING STATE
  ================================ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" />
          <p className="text-gray-600 mt-4">Memverifikasi otentikasi...</p>
        </div>
      </div>
    );
  }

  /* ===============================
     AUTH GUARD
  ================================ */
  if (!currentUser) {
    console.log("❌ No authenticated user, redirecting to login");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  /* ===============================
     ROLE GUARD
  ================================ */
  if (allowedRoles.length > 0) {
    let hasRole = false;

    // Cek primaryRole
    if (userPrimaryRole && allowedRoles.includes(userPrimaryRole)) {
      hasRole = true;
    }

    // Fallback: cek role array
    if (!hasRole && currentUser.role) {
      const roles = Array.isArray(currentUser.role)
        ? currentUser.role
        : [currentUser.role];
      hasRole = roles.some((role) => allowedRoles.includes(role));
    }

    if (!hasRole) {
      console.warn("❌ Role access denied:", {
        userRole: userPrimaryRole,
        allowedRoles,
        path: location.pathname,
      });

      setIsRedirecting(true);

      // Redirect ke halaman yang sesuai berdasarkan role
      if (userPrimaryRole === "owner") {
        return <Navigate to="/Owner" replace />;
      } else if (userPrimaryRole === "admin") {
        return <Navigate to="/Warehouse/Dashboard" replace />;
      } else if (userPrimaryRole === "kasir") {
        return <Navigate to="/Kasir" replace />;
      } else {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  /* ===============================
     KASIR MODE GUARD - YANG SUDAH DIPERBAIKI
  ================================ */
  if (kasirOnly) {
    // Cek apakah user adalah kasir
    const roles = Array.isArray(currentUser.role)
      ? currentUser.role
      : [currentUser.role];

    const isKasir = roles.includes("kasir");
    const isOwner = roles.includes("owner");
    const isAdmin = roles.includes("admin");

    // Owner dan admin boleh akses halaman kasir
    const canAccessKasir = isKasir || isOwner || isAdmin;

    if (!canAccessKasir) {
      console.warn("❌ User bukan kasir/owner/admin, akses ditolak");
      return <Navigate to="/unauthorized" replace />;
    }

    // Jika user adalah owner/admin, langsung izinkan
    if (isOwner || isAdmin) {
      console.log("✅ Owner/Admin access to kasir page granted");
      return children;
    }

    // Untuk kasir murni, perlu validasi gudang
    if (isKasir) {
      const kasirGudangIds = currentUser.kasirGudangIds || [];

      if (kasirGudangIds.length === 0) {
        console.warn("❌ Kasir tidak memiliki akses ke gudang manapun");
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center space-y-4 max-w-md p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Akses Ditolak
                </h3>
                <p className="text-gray-600">
                  Anda tidak memiliki akses ke gudang manapun.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Hubungi administrator untuk mendapatkan akses.
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        );
      }

      // Jika tidak ada gudang aktif, tampilkan pesan
      if (!activeGudangId) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center space-y-4 max-w-md p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100">
                <Building size={40} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Pilih Gudang Terlebih Dahulu
                </h3>
                <p className="text-gray-600">
                  Silakan pilih gudang dari dropdown di pojok kanan atas untuk
                  mengakses halaman kasir.
                </p>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Gudang yang tersedia:</span>
                  <br />
                  {gudangList.map((g) => g.nama).join(", ")}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Validasi apakah gudang aktif termasuk dalam akses kasir
      const activeGudang = gudangList?.find((g) => g.id === activeGudangId);
      const isGudangAllowed =
        kasirGudangIds.includes(activeGudangId) ||
        (activeGudang && kasirGudangIds.includes(activeGudang.nama));

      if (!isGudangAllowed) {
        console.warn("❌ Kasir tidak memiliki akses ke gudang ini");
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center space-y-4 max-w-md p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
                <Lock size={40} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Akses Ditolak
                </h3>
                <p className="text-gray-600">
                  Anda tidak memiliki akses ke gudang{" "}
                  <span className="font-semibold">{activeGudang?.nama}</span>.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Silakan pilih gudang lain yang tersedia.
                </p>
              </div>
            </div>
          </div>
        );
      }

      // 🟢 VALIDASI isTokoPenjualan DIHAPUS - Semua gudang bisa diakses
      console.log("✅ Kasir access granted for gudang:", activeGudang?.nama);
    }
  }

  console.log("✅ Access granted to:", location.pathname);
  return children;
}
