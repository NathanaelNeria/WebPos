import { useEffect, useState } from "react";
import { useAuth } from "../../Hooks/useAuth";
import Swal from "sweetalert2";
import {
  fetchUsers,
  fetchGudang,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
} from "../../Services/user.service";

export default function ManajemenUser() {
  const { currentUser, loading: authLoading } = useAuth();

  /* ===============================
     STATE
  ================================ */
  const [users, setUsers] = useState([]);
  const [gudangList, setGudangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");

  const [form, setForm] = useState({
    nama: "",
    email: "",
    role: [],
    gudangId: null,
    gudangNama: null,
    kasirGudangIds: [],
    isActive: true,
  });

  /* ===============================
     LOAD DATA
  ================================ */
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser || !currentUser.isOwner) {
      setLoading(false);
      return;
    }

    loadData();
  }, [authLoading, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, gudangData] = await Promise.all([
        fetchUsers(),
        fetchGudang(),
      ]);
      setUsers(userData);
      setGudangList(gudangData);
    } catch (err) {
      console.error("❌ Load data error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat data user",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     FORM HANDLER
  ================================ */
  const resetForm = () => {
    setForm({
      nama: "",
      email: "",
      role: [],
      gudangId: null,
      gudangNama: null,
      kasirGudangIds: [],
      isActive: true,
    });
    setPassword("");
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (u) => {
    setForm({
      nama: u.nama || "",
      email: u.email || "",
      role: u.role || [],
      gudangId: u.gudangId || null,
      gudangNama: u.gudangNama || null,
      kasirGudangIds: u.kasirGudangIds || [],
      isActive: u.isActive ?? true,
    });
    setPassword("");
    setEditId(u.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    // ================= VALIDASI FORM =================
    if (!form.nama.trim() || !form.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Nama dan email harus diisi",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    if (form.role.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Pilih minimal satu role",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    if (!editId && !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Password harus diisi untuk user baru",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    if (!editId && password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Password minimal 6 karakter",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    if (!form.role.includes("owner") && !form.gudangId) {
      Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Pilih gudang utama untuk user non-owner",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    // CEK APAKAH USER ADALAH OWNER
    if (!currentUser || !currentUser.isOwner) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya owner yang dapat menambah user",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editId) {
        // ================= UPDATE USER =================
        await updateUser(editId, form);

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data user berhasil diperbarui",
          timer: 1500,
          showConfirmButton: false,
        });

        setShowForm(false);
        resetForm();
        loadData();
      } else {
        // ================= CREATE USER =================

        // 1. KONFIRMASI PASSWORD OWNER
        const result = await Swal.fire({
          title: "Konfirmasi Owner",
          text: "Masukkan password owner untuk melanjutkan:",
          input: "password",
          inputPlaceholder: "Password owner",
          showCancelButton: true,
          confirmButtonColor: "#3B82F6",
          cancelButtonColor: "#6B7280",
          confirmButtonText: "Lanjutkan",
          cancelButtonText: "Batal",
          inputValidator: (value) => {
            if (!value) {
              return "Password owner harus diisi!";
            }
          },
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        if (!result.isConfirmed || !result.value) {
          setSubmitting(false);
          return;
        }

        const ownerPassword = result.value;

        // 2. SET FLAG CREATE USER (PENTING!)
        sessionStorage.setItem("isCreatingUser", "true");
        sessionStorage.setItem("createUserStartTime", Date.now().toString());

        // 3. TAMPILKAN LOADING SEDERHANA (HINDARI HTML COMPLEX)
        Swal.fire({
          title: "Membuat User Baru",
          text: "Mohon tunggu sebentar...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // 4. PANGGIL CREATE USER
        await createUser({
          ...form,
          password: password,
          ownerPassword: ownerPassword,
        });

        // 5. HAPUS FLAG CREATE USER
        sessionStorage.removeItem("isCreatingUser");
        sessionStorage.removeItem("createUserStartTime");

        // 6. TUTUP LOADING
        Swal.close();

        // 7. TAMPILKAN PESAN SUKSES
        await Swal.fire({
          icon: "success",
          title: "User Berhasil Ditambahkan!",
          text: "Halaman akan dimuat ulang...",
          timer: 1500,
          showConfirmButton: false,
        });

        // 8. RESET FORM
        setShowForm(false);
        resetForm();

        // 9. FORCE RELOAD KE HALAMAN YANG SAMA
        setTimeout(() => {
          window.location.href = "/Owner/ManajemenUser?refresh=" + Date.now();
        }, 500);
      }
    } catch (err) {
      // ================= HANDLE ERROR =================

      // HAPUS FLAG CREATE USER
      sessionStorage.removeItem("isCreatingUser");
      sessionStorage.removeItem("createUserStartTime");

      Swal.close();

      let errorMessage = err.message || "Terjadi kesalahan";
      let errorTitle = "Gagal!";

      // Custom error messages
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "Email sudah terdaftar! Gunakan email lain.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password terlalu lemah! Minimal 6 karakter.";
      } else if (errorMessage.includes("owner")) {
        errorMessage = "Password owner yang Anda masukkan salah!";
      } else if (errorMessage.includes("network")) {
        errorMessage = "Koneksi internet bermasalah. Coba lagi.";
      }

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: "#3B82F6",
        confirmButtonText: "Coba Lagi",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const confirmToggleStatus = (user) => {
    Swal.fire({
      title: user.isActive ? "Nonaktifkan User?" : "Aktifkan User?",
      text: user.isActive
        ? `User "${user.nama}" tidak akan bisa login setelah dinonaktifkan.`
        : `User "${user.nama}" akan bisa login kembali setelah diaktifkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: user.isActive ? "#EF4444" : "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: user.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await toggleUserActive(user.id, !user.isActive);
          loadData();
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: `User berhasil ${user.isActive ? "dinonaktifkan" : "diaktifkan"}`,
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: "Gagal mengubah status user",
            confirmButtonColor: "#3B82F6",
          });
        }
      }
    });
  };

  const confirmDelete = (user) => {
    // Cek apakah user yang dihapus adalah dirinya sendiri
    if (user.id === currentUser.uid) {
      Swal.fire({
        icon: "error",
        title: "Tidak Diizinkan",
        text: "Anda tidak dapat menghapus akun Anda sendiri",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    Swal.fire({
      title: "Hapus User Permanen?",
      html: `
        <p class="mb-2">Apakah Anda yakin ingin menghapus user <strong>"${user.nama}"</strong>?</p>
        <p class="text-red-500 text-sm">⚠️ Tindakan ini akan menghapus user dari Authentication dan semua data terkait. Tindakan ini tidak dapat dibatalkan!</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Hapus Permanen",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSubmitting(true);
        try {
          await deleteUser(user.id);
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "User berhasil dihapus dari sistem",
            timer: 1500,
            showConfirmButton: false,
          });
          loadData();
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: err.message || "Gagal menghapus user",
            confirmButtonColor: "#3B82F6",
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  /* ===============================
     FILTER USERS
  ================================ */
  const filteredUsers = users.filter(
    (user) =>
      user.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.some((r) =>
        r.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  /* ===============================
     RENDER STATUS BADGE
  ================================ */
  const renderStatusBadge = (isActive) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isActive ? "Active" : "Disabled"}
    </span>
  );

  const renderRoleBadge = (roles) => (
    <div className="flex flex-wrap gap-1">
      {roles?.map((role, idx) => (
        <span
          key={idx}
          className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
        >
          {role}
        </span>
      ))}
    </div>
  );

  /* ===============================
     GUARD RENDER
  ================================ */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Login</h2>
          <p className="text-gray-600">
            Silakan login untuk mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser.isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-600">
            Hanya owner yang dapat mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data user...</p>
        </div>
      </div>
    );
  }

  /* ===============================
     UI
  ================================ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-darkblue">
                Manajemen User
              </h1>
              <p className="text-gray-600 mt-2">
                Kelola user dan hak akses sistem
              </p>
            </div>
            <button
              onClick={openCreate}
              className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-medium transition-all duration-300 hover:-translate-y-1 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah User
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cari user berdasarkan nama, email, atau role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Gudang
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {u.nama}
                          </div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{renderRoleBadge(u.role)}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Utama:</span>{" "}
                            {u.gudangNama || "-"}
                          </div>
                          {u.kasirGudangIds?.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Jualan:</span>{" "}
                              {u.kasirGudangIds.length} gudang
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(u.isActive)}
                      </td>
                      <td className="px-6 py-4">
                        {/* Tombol aksi ditumpuk vertikal */}
                        <div className="flex flex-col gap-2 min-w-[100px]">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1 text-sm"
                            title="Edit User"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>

                          <button
                            onClick={() => confirmToggleStatus(u)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm ${
                              u.isActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                            title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {u.isActive ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              )}
                            </svg>
                            {u.isActive ? "Disable" : "Enable"}
                          </button>

                          <button
                            onClick={() => confirmDelete(u)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1 text-sm"
                            title="Hapus User Permanen"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-8.804a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium">
                          Tidak ada user ditemukan
                        </p>
                        <p className="mt-1">
                          Coba ubah kata kunci pencarian atau tambah user baru
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-hard w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-darkblue">
                    {editId ? "Edit User" : "Tambah User Baru"}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    type="button"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-darkblue">
                      Informasi Dasar
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan nama user"
                          value={form.nama}
                          onChange={(e) =>
                            setForm({ ...form, nama: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          placeholder="user@example.com"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    {!editId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password * (minimal 6 karakter)
                        </label>
                        <input
                          type="password"
                          placeholder="Masukkan password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-darkblue">
                      Hak Akses
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["owner", "admin", "kasir"].map((r) => (
                        <label
                          key={r}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            form.role.includes(r)
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.role.includes(r)}
                            onChange={() => {
                              const newRoles = form.role.includes(r)
                                ? form.role.filter((x) => x !== r)
                                : [...form.role, r];

                              setForm((f) => ({
                                ...f,
                                role: newRoles,
                                ...(r === "owner" &&
                                !form.role.includes("owner")
                                  ? {
                                      gudangId: null,
                                      gudangNama: null,
                                      kasirGudangIds: [],
                                    }
                                  : {}),
                              }));
                            }}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center ${
                                form.role.includes(r)
                                  ? "bg-primary border-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {form.role.includes(r) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium capitalize">{r}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Gudang Section - Only show if not owner */}
                  {!form.role.includes("owner") && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-darkblue">
                          Gudang Utama *
                        </h4>
                        <select
                          value={form.gudangId || ""}
                          onChange={(e) => {
                            const g = gudangList.find(
                              (x) => x.id === e.target.value,
                            );
                            setForm({
                              ...form,
                              gudangId: g?.id || null,
                              gudangNama: g?.nama || null,
                            });
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        >
                          <option value="">-- Pilih Gudang Utama --</option>
                          {gudangList.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.nama}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-darkblue">
                          Gudang Jualan
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          User dapat melakukan transaksi di gudang terpilih
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {gudangList.map((g) => (
                            <label
                              key={g.id}
                              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                                form.kasirGudangIds.includes(g.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 hover:border-primary/50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.kasirGudangIds.includes(g.id)}
                                onChange={() =>
                                  setForm((f) => ({
                                    ...f,
                                    kasirGudangIds: f.kasirGudangIds.includes(
                                      g.id,
                                    )
                                      ? f.kasirGudangIds.filter(
                                          (x) => x !== g.id,
                                        )
                                      : [...f.kasirGudangIds, g.id],
                                  }))
                                }
                                className="mr-3 h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span>{g.nama}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      disabled={submitting}
                      type="button"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      type="button"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Simpan User
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
