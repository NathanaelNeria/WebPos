// src/Components/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useGudang } from "../Hooks/useGudang";
import LogoSidebar from "../Assets/LogoSidebar.png";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  LayoutDashboard,
  ShoppingCart,
  History,
  FileText,
  Factory,
  Package,
  ArrowLeftRight,
  Users,
  Boxes,
  FileBarChart,
  Activity,
  AlertCircle,
  Building,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Sidebar() {
  const location = useLocation();
  const { currentUser, loading } = useAuth();
  const { activeGudangId, gudangList, activeGudang } = useGudang();

  // SEMUA HOOKS DIPANGGIL DI TOP LEVEL
  const [ownerOpen, setOwnerOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [kasirOpen, setKasirOpen] = useState(true);
  const [kasirAllowed, setKasirAllowed] = useState(false);

  /* ===============================
     ROLE DETECTION
  ================================ */
  const roles = useMemo(() => {
    if (!currentUser) return [];
    return Array.isArray(currentUser.role)
      ? currentUser.role
      : [currentUser.role];
  }, [currentUser]);

  const isOwner = roles.includes("owner");
  const isAdmin = roles.includes("admin");
  const isKasir = roles.includes("kasir");

  /* ===============================
     ACTIVE GUDANG INFO
  ================================ */
  const activeGudangNama = activeGudang?.nama || null;

  /* ===============================
     CEK APAKAH GUDANG CIDENG (YANG HARUS DIBLOKIR)
  ================================ */
  const isCideng = useMemo(() => {
    if (!activeGudangNama) return false;
    const namaLower = activeGudangNama.toLowerCase();
    return namaLower === "a38" || namaLower.includes("a38");
  }, [activeGudangNama]);

  /* ===============================
     KASIR ACCESS VALIDATION
  ================================ */
  const kasirGudangIds = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.kasirGudangIds || [];
  }, [currentUser]);

  const showKasirMenu = useMemo(() => {
    return isKasir || kasirGudangIds.length > 0 || isOwner || isAdmin;
  }, [isKasir, kasirGudangIds, isOwner, isAdmin]);

  // useEffect untuk cek kasir allowed
  useEffect(() => {
    if (!currentUser) return;

    if (activeGudangNama && showKasirMenu) {
      if (isOwner || isAdmin) {
        setKasirAllowed(true);
        return;
      }

      const allowed = kasirGudangIds.some(
        (id) => id === activeGudangId || id === activeGudangNama,
      );
      setKasirAllowed(allowed);
    } else {
      setKasirAllowed(false);
    }
  }, [
    activeGudangId,
    activeGudangNama,
    showKasirMenu,
    isOwner,
    isAdmin,
    kasirGudangIds,
    currentUser,
  ]);

  // useEffect untuk auto-expand berdasarkan path
  useEffect(() => {
    const path = location.pathname.toLowerCase();

    if (path.includes("/owner")) {
      setOwnerOpen(true);
    }
    if (path.includes("/warehouse")) {
      setAdminOpen(true);
    }
    if (path.includes("/kasir")) {
      setKasirOpen(true);
    }
  }, [location.pathname]);

  /* ===============================
     EARLY RETURN
  ================================ */
  if (loading || !currentUser) return null;

  /* ===============================
     MENU LISTS WITH ICONS
  ================================ */
  const ownerMenus = [
    {
      name: "Ringkasan Umum",
      path: "/Owner",
      icon: LayoutDashboard,
      description: "Dashboard utama owner",
    },
    {
      name: "Laporan Penjualan",
      path: "/Owner/LaporanPenjualan",
      icon: FileBarChart,
      description: "Analisis penjualan",
    },
    {
      name: "Barang Masuk Supplier",
      path: "/Owner/BarangMasukKeluar",
      icon: Factory,
      description: "Aktivitas barang",
    },
    {
      name: "Riwayat Mutasi",
      path: "/Owner/RiwayatMutasi",
      icon: History,
      description: "Mutasi antar gudang",
    },
    {
      name: "Aktifitas User",
      path: "/Owner/AktifitasUser",
      icon: Activity,
      description: "Log aktivitas user",
    },
    {
      name: "Monitoring Nota",
      path: "/Owner/MonitoringNota",
      icon: FileText,
      description: "Kontrol dokumen",
    },
    {
      name: "Monitoring Nota Tempo",
      path: "/Owner/MonitoringNotaTempo",
      icon: FileText,
      description: "Kontrol nota tempo",
    },
    {
      name: "Manajemen Produk",
      path: "/Owner/ManajemenProduk",
      icon: Boxes,
      description: "Master produk",
    },
    {
      name: "Manajemen User",
      path: "/Owner/ManajemenUser",
      icon: Users,
      description: "Kelola user",
    },
  ];

  const adminMenus = [
    {
      name: "Dashboard",
      path: "/Warehouse/Dashboard",
      icon: LayoutDashboard,
      description: "Ringkasan gudang",
    },
    {
      name: "Manajemen Barang",
      path: "/Warehouse/ManajemenBarang",
      icon: Package,
      description: "Stok per roll",
    },
    {
      name: "Barang Masuk Supplier",
      path: "/Warehouse/BarangMasuk",
      icon: Factory,
      description: "Penerimaan supplier",
    },
    {
      name: "Mutasi Gudang",
      path: "/Warehouse/MutasiGudang",
      icon: ArrowLeftRight,
      description: "Transfer antar gudang",
    },
  ];

  const kasirMenus = [
    {
      name: "Dashboard Kasir",
      path: "/Kasir",
      icon: LayoutDashboard,
      description: "Ringkasan harian",
    },
    {
      name: "Penjualan",
      path: "/Kasir/penjualan",
      icon: ShoppingCart,
      description: "Transaksi ecer & rol",
    },
    {
      name: "Riwayat Transaksi",
      path: "/Kasir/riwayat",
      icon: History,
      description: "Histori penjualan",
    },
  ];

  /* ===============================
     RENDER MENU SECTION
  ================================ */
  const renderMenuSection = (
    title,
    isOpen,
    toggle,
    menus,
    disabled = false,
    badge = null,
  ) => (
    <div className="mb-4">
      {/* Section Header */}
      <div
        className="flex justify-between items-center px-3 py-2 cursor-pointer text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggle()}
      >
        <span className="uppercase text-xs font-semibold tracking-wider flex items-center gap-2">
          {title}
          {badge && (
            <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>

      {/* Menu Items */}
      <div className={`${isOpen ? "block" : "hidden"} space-y-0.5 mt-1`}>
        {menus.map((menu) => {
          const Icon = menu.icon;

          let isDisabled = disabled;
          let customTitle = menu.description;

          if (title === "KASIR" && isCideng) {
            isDisabled = true;
            customTitle = "Menu kasir tidak tersedia untuk gudang Cideng";
          }

          if (isDisabled) {
            return (
              <div
                key={menu.path}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 cursor-not-allowed rounded-lg relative group"
                title={customTitle}
              >
                <Icon size={18} className="opacity-40" />
                <span className="flex-1">{menu.name}</span>
                <Lock size={12} className="opacity-40" />
              </div>
            );
          }

          return (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={({ isActive }) => {
                const baseClasses =
                  "flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 relative group";
                const activeClasses = isActive
                  ? "bg-gradient-to-r from-white/20 to-white/5 text-white shadow-lg"
                  : "text-white/80 hover:bg-white/10 hover:text-white";

                return `${baseClasses} ${activeClasses}`;
              }}
              title={customTitle}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? "text-white"
                          : "text-white/60 group-hover:text-white"
                      }
                    />
                    {isActive && (
                      <span className="absolute -right-1 -top-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="flex-1">{menu.name}</span>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-[#0C1E6E] to-[#08144A] text-white flex flex-col shadow-2xl">
      {/* Logo Section */}
      <div className="p-4 border-b border-white/10 shrink-0 bg-gradient-to-r from-[#0C1E6E] to-[#0A1A5A]">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <img
              src={LogoSidebar}
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold tracking-tight">
              Kaine<span className="text-yellow-400">Ware</span>
            </h2>
            <p className="text-[10px] text-white/50">Stock Management</p>
          </div>
        </div>
      </div>

      {/* Navigation with Custom Scrollbar */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto sidebar-scroll">
        {/* Owner Menu */}
        {isOwner &&
          renderMenuSection(
            "OWNER",
            ownerOpen,
            () => setOwnerOpen(!ownerOpen),
            ownerMenus,
            false,
            gudangList.length > 0 ? `${gudangList.length} gdg` : null,
          )}

        {/* Admin/Warehouse Menu */}
        {(isOwner || isAdmin) &&
          renderMenuSection(
            "WAREHOUSE",
            adminOpen,
            () => setAdminOpen(!adminOpen),
            adminMenus,
            false,
            activeGudang ? activeGudang.nama.substring(0, 3) + "..." : null,
          )}

        {/* Kasir Menu */}
        {showKasirMenu &&
          renderMenuSection(
            "KASIR",
            kasirOpen,
            () => setKasirOpen(!kasirOpen),
            kasirMenus,
            (!kasirAllowed && !isOwner && !isAdmin) || isCideng,
            isKasir && kasirAllowed && !isCideng
              ? activeGudangNama?.substring(0, 3) + "..."
              : isCideng
                ? "🔒"
                : !kasirAllowed && (isOwner || isAdmin)
                  ? "all"
                  : null,
          )}

        {/* Gudang Info */}
        {activeGudang && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="px-3 py-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                <Building size={12} />
                <span>Gudang Aktif</span>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {activeGudang.nama}
              </p>
              {activeGudang.alamat && (
                <p className="text-[10px] text-white/40 truncate mt-1">
                  {activeGudang.alamat}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isOwner && !isAdmin && !showKasirMenu && (
          <div className="text-center py-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-full mb-3">
              <AlertCircle size={24} className="text-white/30" />
            </div>
            <p className="text-sm text-white/50">Tidak ada menu tersedia</p>
            <p className="text-xs text-white/30 mt-1">Hubungi administrator</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 text-center border-t border-white/10 shrink-0 bg-[#0A1A5A]">
        <div className="text-[10px] text-white/30 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
            <span>v5.1 Production</span>
          </div>
          <div className="text-[8px] text-white/20">© 2026 KaineWare</div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          border: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .sidebar-scroll::-webkit-scrollbar-button {
          display: none;
        }
      `}</style>
    </aside>
  );
}
