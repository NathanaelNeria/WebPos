// src/Pages/LoginPage.jsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../Services/firebase";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import logo from "../../Assets/logoLogin.png";
import illustration from "../../Assets/login-illustration.svg";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const navigate = useNavigate();

  /* ======================================================
     LOG ACTIVITY
  ====================================================== */
  const logActivity = async (
    userId,
    userEmail,
    userRole,
    status,
    details = "",
  ) => {
    try {
      const activityData = {
        action_type: "LOGIN",
        action_details: `Login ${status} - ${details}`,
        entity_id: userId,
        entity_type: "USER",
        timestamp: serverTimestamp(),
        user_id: userId,
        user_email: userEmail,
        user_role: userRole,
        ip_address: "web-app",
        metadata: {
          status,
          timestamp: new Date().toISOString(),
        },
      };

      await addDoc(collection(db, "userActivities"), activityData);
      console.log(`✅ Login activity logged: ${status}`);
    } catch (error) {
      console.error("❌ Error logging activity:", error);
    }
  };

  /* ======================================================
     HANDLE LOGIN
  ====================================================== */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Validasi input
      if (!email.trim() || !password.trim()) {
        throw new Error("Email dan password wajib diisi");
      }

      if (!email.includes("@") || !email.includes(".")) {
        throw new Error("Format email tidak valid");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      // 2. Login ke Firebase Auth
      console.log("🔐 Attempting login with:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      console.log("✅ Firebase Auth success:", userCredential.user.uid);

      // 3. Ambil user data dari Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        await logActivity(
          userCredential.user.uid,
          userCredential.user.email,
          ["unknown"],
          "FAILED",
          "User data not found",
        );
        throw new Error("Data pengguna tidak ditemukan di database");
      }

      const userData = userDoc.data();
      console.log("📋 User data:", {
        email: userCredential.user.email,
        role: userData.role,
        gudangId: userData.gudangId,
      });

      // 4. Log aktivitas login sukses
      await logActivity(
        userCredential.user.uid,
        userCredential.user.email,
        userData.role,
        "SUCCESS",
        `Role: ${Array.isArray(userData.role) ? userData.role[0] : userData.role}`,
      );

      // 5. Tentukan role dan redirect
      setIsRedirecting(true);

      // Tunggu 1 detik untuk feedback visual
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Determine role
      const role = Array.isArray(userData.role)
        ? userData.role[0]
        : userData.role || "unknown";

      console.log("📍 Redirecting with role:", role);

      // Redirect berdasarkan role
      switch (role.toLowerCase()) {
        case "owner":
          navigate("/Owner", { replace: true });
          break;
        case "admin":
          navigate("/Warehouse/Dashboard", { replace: true });
          break;
        case "kasir":
          navigate("/Kasir", { replace: true });
          break;
        default:
          console.error("Role tidak dikenal:", role);
          navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("❌ Login error:", err.code || err.message);

      // Log aktivitas login gagal (jika ada userId)
      if (auth.currentUser) {
        await logActivity(
          auth.currentUser.uid,
          email,
          ["unknown"],
          "FAILED",
          err.message,
        );
      }

      // Clear password
      setPassword("");
      setShowPassword(false);

      // Handle specific Firebase errors
      const errorCode = err.code;
      if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/wrong-password"
      ) {
        setError("Email atau password salah");
      } else if (errorCode === "auth/user-not-found") {
        setError("Email tidak terdaftar");
      } else if (errorCode === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan gagal. Coba lagi nanti");
      } else if (errorCode === "auth/network-request-failed") {
        setError("Koneksi internet bermasalah");
      } else {
        setError(err.message || "Login gagal. Silakan coba lagi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin(e);
    }
  };

  // Tampilkan redirect screen
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-900">
        <div className="text-center space-y-6 max-w-md p-8 bg-white/10 backdrop-blur-sm rounded-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4">
            <CheckCircle className="w-10 h-10 text-white animate-bounce" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Login Berhasil!
            </h3>
            <p className="text-green-200 mb-4">Mengarahkan ke dashboard...</p>
            <p className="text-white/80 text-sm mb-2">Email: {email}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <p className="text-white/40 text-xs mt-6">
              Jika tidak redirect otomatis,{" "}
              <button
                onClick={() => navigate("/")}
                className="text-blue-300 hover:text-blue-200 underline"
              >
                klik di sini
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render form login
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans overflow-hidden">
      {/* LEFT SIDE - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-white relative justify-center items-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500 animate-ping"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-secondary animate-pulse"></div>
        </div>

        <div className="absolute top-6 left-8 z-10">
          <img src={logo} className="w-48" alt="logo" />
        </div>

        <div className="relative z-10">
          <img
            src={illustration}
            className="w-4/5 max-w-lg mt-12"
            alt="illustration"
          />
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 text-white relative bg-gradient-to-br from-primary via-midblue to-blue-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-secondary animate-pulse-slow"></div>
          <div
            className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-300 animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-5xl font-bold mb-3 bg-gradient-to-r from-secondary to-yellow-300 bg-clip-text text-transparent">
              Selamat Datang
            </h2>
            <p className="text-blue-200 text-sm opacity-90">
              Silakan login menggunakan akun yang sudah terdaftar
            </p>
            <div className="mt-2">
              <p className="text-blue-300 text-xs italic">
                owner@kaineware.com
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 bg-white/95 border-2 border-transparent focus:border-secondary focus:outline-none transition-all duration-300"
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 rounded-xl text-gray-900 bg-white/95 border-2 border-transparent focus:border-secondary focus:outline-none transition-all duration-300"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-500/30">
                <AlertCircle
                  size={20}
                  className="text-red-300 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm text-red-300 font-medium">
                  {error}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-secondary to-yellow-500 text-primary font-bold py-4 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Login ke Sistem</span>
                  </>
                )}
              </div>
            </button>

            {/* Login Info */}
            <div className="text-center pt-4">
              <p className="text-sm opacity-80">
                Pastikan Anda menggunakan akun resmi yang diberikan
              </p>
              <p className="text-xs opacity-60 mt-2">
                Sistem hanya mendukung login dengan email & password
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs opacity-70">Sistem online • v5.1</span>
            </div>
            <p className="text-xs opacity-60 mt-4">
              © {new Date().getFullYear()} StockKain Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
