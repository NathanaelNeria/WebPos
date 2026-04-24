// src/Hooks/useAuth.js
import { useContext, useMemo } from "react";
import { AuthContext } from "../Context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Memoize user data untuk performance
  const user = useMemo(() => {
    if (!context.currentUser) return null;

    return {
      uid: context.currentUser.uid,
      email: context.currentUser.email,
      nama: context.currentUser.nama || context.currentUser.displayName,
      displayName: context.currentUser.displayName || context.currentUser.nama,
      role: context.currentUser.role,
      primaryRole: context.currentUser.primaryRole,
      isOwner: context.currentUser.isOwner,
      isAdmin: context.currentUser.isAdmin,
      isKasir: context.currentUser.isKasir,
      gudangId: context.currentUser.gudangId,
      gudangNama: context.currentUser.gudangNama,
      kasirGudangIds: context.currentUser.kasirGudangIds || [],
      phone: context.currentUser.phone,
      photoURL: context.currentUser.photoURL,
      activeGudangId: context.activeGudangId,
      activeGudang: context.activeGudang,
    };
  }, [context.currentUser, context.activeGudangId, context.activeGudang]);

  // Return context dengan user yang sudah dinormalisasi
  return {
    // User data
    user,
    currentUser: user, // Alias untuk kompatibilitas

    // Gudang data
    gudangList: context.gudangList || [],
    activeGudang: context.activeGudang,
    activeGudangId: context.activeGudangId,

    // Status
    loading: context.loading,
    initialized: context.initialized,

    // Role checks
    isOwner: context.isOwner,
    isAdmin: context.isAdmin,
    isKasir: context.isKasir,
    userRole: context.userRole,
    userPrimaryRole: context.userPrimaryRole,

    // User info
    userName: context.userName,
    userEmail: context.userEmail,

    // Gudang info
    gudangNama: context.gudangNama,
    gudangKode: context.gudangKode,

    // Methods
    setActiveGudangId: context.setActiveGudangId,
    refreshGudangList: context.refreshGudangList,
    logout: context.logout,
    ensureGudang: context.ensureGudang,

    // Helper untuk mendapatkan nama lengkap user
    getUserDisplayName: () => {
      if (!context.currentUser) return "System";
      return (
        context.currentUser.nama ||
        context.currentUser.displayName ||
        context.currentUser.email?.split("@")[0] ||
        "Unknown"
      );
    },

    // Helper untuk mendapatkan role sebagai string
    getRoleString: () => {
      if (!context.currentUser) return "UNKNOWN";
      const roles = context.currentUser.role || [];
      return roles.join(", ") || "UNKNOWN";
    },
  };
};

// Export juga sebagai default untuk fleksibilitas
export default useAuth;
