// src/Router/AppRouter.jsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import ProtectedRoute from "./ProtectedRoute";
import { AlertTriangle, Home, ArrowLeft, RefreshCw } from "lucide-react";
import LoadingSpinner from "../Components/LoadingSpinner";
import ErrorBoundary from "../Components/ErrorBoundary";

// ================= LAZY LOAD PAGES =================
// Auth
const LoginPage = lazy(() => import("../Pages/Auth/LoginPage"));

// Layout
const SidebarLayout = lazy(() => import("../Layouts/SidebarLayout"));

// Owner Pages
const RingkasanUmum = lazy(() => import("../Pages/Owner/RingkasanUmum"));
const LaporanPenjualan = lazy(() => import("../Pages/Owner/LaporanPenjualan"));
const BarangMasukKeluar = lazy(
  () => import("../Pages/Owner/BarangKeluarMasuk"),
);
const RiwayatMutasi = lazy(() => import("../Pages/Owner/RiwayatMutasi"));
const AktifitasUser = lazy(() => import("../Pages/Owner/AktifitasUser"));
const MonitoringNota = lazy(() => import("../Pages/Owner/MonitoringNota"));
const MonitoringNotaTempo = lazy(
  () => import("../Pages/Owner/MonitoringNotaTempo"),
);
const ManajemenUser = lazy(() => import("../Pages/Owner/ManajemenUser"));
const ManajemenProduk = lazy(
  () => import("../Pages/Owner/ProdukManagementPage"),
);

// Admin Pages
const WarehouseDashboard = lazy(
  () => import("../Pages/Admin/WarehouseDashboard"),
);
const ManajemenBarang = lazy(() => import("../Pages/Admin/ManajemenBarang"));
const BarangMasuk = lazy(() => import("../Pages/Admin/BarangMasuk"));
const MutasiGudang = lazy(() => import("../Pages/Admin/MutasiGudang"));

// Kasir Pages
const DashboardKasir = lazy(() => import("../Pages/Kasir/DashboardKasir"));
const Penjualan = lazy(() => import("../Pages/Kasir/Penjualan"));
const RiwayatTransaksi = lazy(() => import("../Pages/Kasir/RiwayatTransaksi"));

// ================= ERROR PAGES =================
function UnauthorizedPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-50 mb-6 shadow-lg">
            <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Akses Ditolak
          </h1>
          <p className="text-gray-600 mb-2">
            Anda tidak memiliki izin untuk mengakses halaman ini
          </p>
          <p className="text-gray-500 text-sm">
            Periksa role atau level akses Anda
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-medium rounded-xl transition-all duration-300 shadow hover:shadow-md"
          >
            <ArrowLeft size={18} />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Home size={18} />
            <span>Kembali ke Halaman Login</span>
          </button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Redirect otomatis dalam {countdown} detik...
          </p>
          <p className="text-sm text-gray-500">
            Jika Anda merasa ini adalah kesalahan, hubungi administrator sistem
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Error Code: 403 - Forbidden Access
          </p>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
            <div className="relative z-10">
              <div className="text-5xl font-bold text-gray-700">404</div>
              <div className="w-16 h-1 bg-gray-400 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-gray-600 mb-2">
            Halaman yang Anda cari tidak ada atau telah dipindahkan
          </p>
          <p className="text-gray-500 text-sm">
            Periksa kembali URL yang dimasukkan
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-medium rounded-xl transition-all duration-300 shadow hover:shadow-md"
          >
            Kembali ke Halaman Sebelumnya
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Kembali ke Dashboard Utama
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Jika masalah berlanjut, hubungi tim teknis
          </p>
        </div>
      </div>
    </div>
  );
}

function ServiceUnavailablePage() {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {retrying && (
        <div className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" color="blue" />
            <p className="mt-3 text-gray-600 font-medium">
              Memuat ulang aplikasi...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 mb-6 shadow-lg">
            <RefreshCw className="w-12 h-12 text-orange-600 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Layanan Tidak Tersedia
          </h1>
          <p className="text-gray-600 mb-2">
            Sistem sedang dalam pemeliharaan atau mengalami gangguan
          </p>
          <p className="text-gray-500 text-sm">
            Silakan coba beberapa saat lagi
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <RefreshCw size={18} className={retrying ? "animate-spin" : ""} />
            <span>{retrying ? "Memuat ulang..." : "Coba Lagi"}</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-medium rounded-xl transition-all duration-300 shadow hover:shadow-md"
          >
            Kembali ke Login
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Jika masalah berlanjut, hubungi tim support
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Status: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ================= LOADING COMPONENTS =================
function RouteLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 mx-auto">
            <LoadingSpinner size="lg" color="blue" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">
            Memuat Halaman
          </h3>
          <p className="text-gray-500">Mohon tunggu sebentar...</p>
        </div>

        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
}

// ================= ROUTER CONFIGURATION =================
export const routeConfig = [
  // Public Routes
  {
    path: "/",
    element: <LoginPage />,
    public: true,
  },
  {
    path: "/login",
    element: <LoginPage />,
    public: true,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
    public: true,
  },
  {
    path: "/403",
    element: <UnauthorizedPage />,
    public: true,
  },
  {
    path: "/503",
    element: <ServiceUnavailablePage />,
    public: true,
  },

  // Owner Routes
  {
    path: "/Owner",
    element: <RingkasanUmum />,
    allowedRoles: ["owner"],
    title: "Ringkasan Umum",
    icon: "LayoutDashboard",
  },
  {
    path: "/Owner/LaporanPenjualan",
    element: <LaporanPenjualan />,
    allowedRoles: ["owner"],
    title: "Laporan Penjualan",
    icon: "FileBarChart",
  },
  {
    path: "/Owner/BarangMasukKeluar",
    element: <BarangMasukKeluar />,
    allowedRoles: ["owner"],
    title: "Barang Masuk/Keluar",
    icon: "Factory",
  },
  {
    path: "/Owner/RiwayatMutasi",
    element: <RiwayatMutasi />,
    allowedRoles: ["owner"],
    title: "Riwayat Mutasi",
    icon: "History",
  },
  {
    path: "/Owner/AktifitasUser",
    element: <AktifitasUser />,
    allowedRoles: ["owner"],
    title: "Aktivitas User",
    icon: "Activity",
  },
  {
    path: "/Owner/MonitoringNota",
    element: <MonitoringNota />,
    allowedRoles: ["owner"],
    title: "Monitoring Nota",
    icon: "FileText",
  },
  {
    path: "/Owner/MonitoringNotaTempo",
    element: <MonitoringNotaTempo />,
    allowedRoles: ["owner"],
    title: "Monitoring Nota Tempo",
    icon: "FileText",
  },
  {
    path: "/Owner/ManajemenUser",
    element: <ManajemenUser />,
    allowedRoles: ["owner"],
    title: "Manajemen User",
    icon: "Users",
  },
  {
    path: "/Owner/ManajemenProduk",
    element: <ManajemenProduk />,
    allowedRoles: ["owner"],
    title: "Manajemen Produk",
    icon: "Boxes",
  },

  // Admin Routes
  {
    path: "/Warehouse/Dashboard",
    element: <WarehouseDashboard />,
    allowedRoles: ["admin", "owner"],
    title: "Dashboard Gudang",
    icon: "LayoutDashboard",
  },
  {
    path: "/Warehouse/ManajemenBarang",
    element: <ManajemenBarang />,
    allowedRoles: ["admin", "owner"],
    title: "Manajemen Barang",
    icon: "Package",
  },
  {
    path: "/Warehouse/BarangMasuk",
    element: <BarangMasuk />,
    allowedRoles: ["admin", "owner"],
    title: "Barang Masuk",
    icon: "Factory",
  },
  {
    path: "/Warehouse/MutasiGudang",
    element: <MutasiGudang />,
    allowedRoles: ["admin", "owner"],
    title: "Mutasi Gudang",
    icon: "ArrowLeftRight",
  },

  // Kasir Routes
  {
    path: "/Kasir",
    element: <DashboardKasir />,
    allowedRoles: ["kasir", "admin", "owner"],
    kasirOnly: true,
    title: "Dashboard Kasir",
    icon: "LayoutDashboard",
  },
  {
    path: "/Kasir/penjualan",
    element: <Penjualan />,
    allowedRoles: ["kasir", "admin", "owner"],
    kasirOnly: true,
    title: "Penjualan",
    icon: "ShoppingCart",
  },
  {
    path: "/Kasir/riwayat",
    element: <RiwayatTransaksi />,
    allowedRoles: ["kasir", "admin", "owner"],
    kasirOnly: true,
    title: "Riwayat Transaksi",
    icon: "History",
  },
];

// ================= MAIN ROUTER COMPONENT =================
export default function AppRouter() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center space-y-8">
          {/* Logo/App Name */}
          <div className="space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <span className="text-2xl font-bold text-white">SK</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Stock<span className="text-blue-400">Kain</span>
            </h1>
            <p className="text-gray-300">Sistem Manajemen Stok Kain</p>
          </div>

          {/* Loading Animation */}
          <div className="space-y-4">
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-loading-bar"></div>
            </div>
            <p className="text-gray-400 text-sm animate-pulse">
              Memuat aplikasi...
            </p>
          </div>

          {/* Version Info */}
          <div className="pt-8 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">v4.0 • Production Ready</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Anda Sedang Offline
          </h1>
          <p className="text-gray-600 mb-6">
            Periksa koneksi internet Anda dan coba lagi
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Public Routes */}
        {routeConfig
          .filter((route) => route.public)
          .map((route, index) => (
            <Route
              key={`public-${index}`}
              path={route.path}
              element={<ErrorBoundary>{route.element}</ErrorBoundary>}
            />
          ))}

        {/* Protected Routes */}
        {routeConfig
          .filter((route) => !route.public)
          .map((route, index) => (
            <Route
              key={`protected-${index}`}
              path={route.path}
              element={
                <ProtectedRoute
                  allowedRoles={route.allowedRoles || []}
                  kasirOnly={route.kasirOnly || false}
                >
                  <ErrorBoundary>
                    <SidebarLayout title={route.title}>
                      {route.element}
                    </SidebarLayout>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          ))}

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global CSS Animations */}
      <style>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        /* Smooth transitions */
        * {
          transition:
            background-color 0.2s ease,
            border-color 0.2s ease;
        }
      `}</style>

      {/* Global Error Handler */}
      <GlobalErrorHandler />
    </Suspense>
  );
}

// ================= GLOBAL ERROR HANDLER =================
function GlobalErrorHandler() {
  const [globalError, setGlobalError] = useState(null);

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      setGlobalError({
        type: "promise_rejection",
        error: event.reason,
      });
      event.preventDefault();
    };

    // Handle global errors
    const handleGlobalError = (event) => {
      console.error("Global error:", event.error);
      setGlobalError({
        type: "global_error",
        error: event.error,
      });
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleGlobalError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  if (globalError) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Aplikasi Error</h3>
              <p className="text-sm text-red-600 mt-1">
                Terjadi kesalahan dalam aplikasi. Silakan refresh halaman.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setGlobalError(null)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ================= EXPORT HELPER FUNCTIONS =================
export const useRouteNavigation = () => {
  const navigate = useNavigate();

  const goTo = (path, options = {}) => {
    navigate(path, options);
  };

  const goBack = () => {
    navigate(-1);
  };

  const goHome = (role = "") => {
    if (role === "owner") {
      navigate("/Owner");
    } else if (role === "admin") {
      navigate("/Warehouse/Dashboard");
    } else if (role === "kasir") {
      navigate("/Kasir");
    } else {
      navigate("/");
    }
  };

  return { goTo, goBack, goHome };
};
