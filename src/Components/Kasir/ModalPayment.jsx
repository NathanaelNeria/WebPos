// src/Components/Kasir/ModalPayment.jsx
import { useState, useEffect, useRef, useCallback } from "react"; // TAMBAH useCallback
import {
  X,
  DollarSign,
  CreditCard,
  Clock,
  Calendar,
  Loader,
} from "lucide-react";
import Swal from "sweetalert2";

export default function ModalPayment({ total, onClose, onConfirm, customer }) {
  const [paymentData, setPaymentData] = useState({
    metode: "tunai",
    tunai: total.toString(),
    transfer: total.toString(),
    catatan: "",
    jatuhTempo: new Date().toISOString().split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Focus trap untuk a11y
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === "Tab" && !isSubmitting) {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      modalElement.addEventListener("keydown", handleTabKey);
      return () => modalElement.removeEventListener("keydown", handleTabKey);
    }
  }, [isSubmitting]);
  const handleSubmit = () => {
    // ================= VALIDASI =================
    if (paymentData.metode === "tunai") {
      const tunai = parseFloat(paymentData.tunai) || 0;
      if (tunai < total) {
        Swal.fire({
          icon: "error",
          title: "Uang Kurang",
          confirmButtonColor: "#0C1E6E",
        });
        return;
      }
    }

    if (paymentData.metode === "transfer") {
      const transfer = parseFloat(paymentData.transfer) || 0;
      if (transfer < total) {
        Swal.fire({
          icon: "error",
          title: "Transfer Kurang",
          confirmButtonColor: "#0C1E6E",
        });
        return;
      }
    }

    if (paymentData.metode === "tempo" && !paymentData.jatuhTempo) {
      Swal.fire({
        icon: "warning",
        title: "Jatuh Tempo Kosong",
        confirmButtonColor: "#0C1E6E",
      });
      return;
    }

    // ================= DATA FINAL =================
    const finalPaymentData = {
      ...paymentData,
      total,
      tunai: parseFloat(paymentData.tunai) || 0,
      transfer: parseFloat(paymentData.transfer) || 0,
      kembalian:
        paymentData.metode === "tunai"
          ? Math.max(0, (parseFloat(paymentData.tunai) || 0) - total)
          : 0,
    };

    // ================== KUNCI ==================
    setIsSubmitting(true);

    // 1️⃣ TUTUP MODAL DULU
    onClose();

    // 2️⃣ KIRIM DATA KE PARENT
    onConfirm(finalPaymentData);
  };

  const formatCurrency = (amount) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const kembalian =
    paymentData.metode === "tunai"
      ? Math.max(0, (parseFloat(paymentData.tunai) || 0) - total)
      : 0;

  // Method labels dengan icon
  const methods = [
    { id: "tunai", label: "Tunai", icon: DollarSign, color: "emerald" },
    { id: "transfer", label: "Transfer", icon: CreditCard, color: "blue" },
    { id: "tempo", label: "Tempo", icon: Clock, color: "amber" },
  ];

  // PERBAIKAN: Gunakan useCallback untuk handleResetForm
  const handleResetForm = useCallback(() => {
    setPaymentData({
      metode: "tunai",
      tunai: total.toString(),
      transfer: total.toString(),
      catatan: "",
      jatuhTempo: new Date().toISOString().split("T")[0],
    });
  }, [total]); // total sebagai dependency

  // Reset form ketika modal dibuka atau total berubah
  useEffect(() => {
    if (total > 0) {
      handleResetForm();
    }
  }, [total, handleResetForm]); // Sekarang include handleResetForm

  // Juga reset form ketika metode pembayaran berubah
  useEffect(() => {
    if (paymentData.metode === "tunai") {
      setPaymentData((prev) => ({
        ...prev,
        tunai: total.toString(),
        jatuhTempo: new Date().toISOString().split("T")[0],
      }));
    } else if (paymentData.metode === "transfer") {
      setPaymentData((prev) => ({
        ...prev,
        transfer: total.toString(),
        jatuhTempo: new Date().toISOString().split("T")[0],
      }));
    } else if (paymentData.metode === "tempo") {
      // Untuk tempo, set jatuh tempo 7 hari dari sekarang
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setPaymentData((prev) => ({
        ...prev,
        jatuhTempo: nextWeek.toISOString().split("T")[0],
      }));
    }
  }, [paymentData.metode, total]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
      style={{ minHeight: "100vh" }}
    >
      {/* Modal Container - Responsive Height */}
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto"
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
      >
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2
                id="payment-title"
                className="text-2xl font-bold flex items-center gap-3"
              >
                <DollarSign size={28} className="text-emerald-200" />
                Pembayaran
                {isSubmitting && (
                  <Loader size={20} className="animate-spin ml-2" />
                )}
              </h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-emerald-100">Total:</span>
                <span className="text-3xl font-bold tracking-tight">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Tutup modal"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          <div className="space-y-6">
            {/* Customer Info */}
            {customer && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-blue-800">{customer.nama}</h3>
                    <p className="text-blue-600 text-sm">{customer.telepon}</p>
                    {customer.alamat && (
                      <p className="text-blue-500 text-xs mt-1 truncate">
                        {customer.alamat}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-400">Customer</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 text-lg">
                Metode Pembayaran
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() =>
                      !isSubmitting &&
                      setPaymentData({ ...paymentData, metode: method.id })
                    }
                    disabled={isSubmitting}
                    className={`
                      p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all
                      ${
                        paymentData.metode === method.id
                          ? `border-${method.color}-500 bg-${method.color}-50 shadow-md scale-[1.02]`
                          : "border-gray-200 hover:border-gray-300 hover:shadow"
                      }
                      ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <method.icon
                      size={28}
                      className={`mb-2 ${
                        paymentData.metode === method.id
                          ? `text-${method.color}-600`
                          : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        paymentData.metode === method.id
                          ? `text-${method.color}-700`
                          : "text-gray-700"
                      }`}
                    >
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Input */}
            <div className="space-y-4">
              {paymentData.metode === "tunai" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <label className="block font-bold text-emerald-800 mb-3 text-lg">
                    Jumlah Tunai
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-emerald-600 font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={paymentData.tunai}
                      onChange={(e) =>
                        !isSubmitting &&
                        setPaymentData({
                          ...paymentData,
                          tunai: e.target.value,
                        })
                      }
                      className="w-full border-2 border-emerald-300 rounded-xl p-4 text-2xl font-bold pl-12 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0"
                      min="0"
                      step="1000"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Tunai Summary */}
                  {paymentData.tunai && parseFloat(paymentData.tunai) > 0 && (
                    <div className="mt-4 bg-white rounded-lg border border-emerald-200 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">
                            Tunai Diberikan
                          </div>
                          <div className="text-xl font-bold text-emerald-700">
                            {formatCurrency(parseFloat(paymentData.tunai))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Kembalian</div>
                          <div
                            className={`text-xl font-bold ${
                              kembalian >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(kembalian)}
                          </div>
                        </div>
                      </div>
                      {kembalian < 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-semibold">
                              Pembayaran kurang!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {paymentData.metode === "transfer" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <label className="block font-bold text-blue-800 mb-3 text-lg">
                    Jumlah Transfer
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-blue-600 font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={paymentData.transfer}
                      onChange={(e) =>
                        !isSubmitting &&
                        setPaymentData({
                          ...paymentData,
                          transfer: e.target.value,
                        })
                      }
                      className="w-full border-2 border-blue-300 rounded-xl p-4 text-2xl font-bold pl-12 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0"
                      min="0"
                      step="1000"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
                    <CreditCard size={16} />
                    <span>
                      Pastikan transfer sudah diterima sebelum konfirmasi
                    </span>
                  </div>
                </div>
              )}

              {paymentData.metode === "tempo" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Calendar className="text-amber-700" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 text-lg">
                        Pembayaran Tempo
                      </h4>
                      <p className="text-amber-700 mt-1">
                        Nota akan berstatus <strong>"Belum Lunas"</strong>{" "}
                        sampai pembayaran diterima.
                      </p>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Tanggal Jatuh Tempo
                        </label>
                        <input
                          type="date"
                          value={paymentData.jatuhTempo}
                          onChange={(e) =>
                            !isSubmitting &&
                            setPaymentData({
                              ...paymentData,
                              jatuhTempo: e.target.value,
                            })
                          }
                          className="w-full border-2 border-amber-300 rounded-lg p-3 bg-white focus:border-amber-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          min={new Date().toISOString().split("T")[0]}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <label className="block font-bold text-gray-800 mb-3">
                  Catatan Pembayaran{" "}
                  <span className="text-gray-500 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={paymentData.catatan}
                  onChange={(e) =>
                    !isSubmitting &&
                    setPaymentData({ ...paymentData, catatan: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 rounded-xl p-4 bg-white focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows="3"
                  placeholder="Contoh: Transfer via BCA, DP 50%, atau keterangan khusus lainnya..."
                  disabled={isSubmitting}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Catatan akan tercetak di nota dan riwayat transaksi
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-300">
                    Ringkasan Pembayaran
                  </div>
                  <div className="text-3xl font-bold mt-1 tracking-tight">
                    {formatCurrency(total)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-300">Metode</div>
                  <div className="text-xl font-bold capitalize">
                    {paymentData.metode === "tunai"
                      ? "💵 Tunai"
                      : paymentData.metode === "transfer"
                      ? "💳 Transfer"
                      : "⏰ Tempo"}
                  </div>
                </div>
              </div>
              {paymentData.metode === "tunai" && kembalian > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-300">Kembalian</div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {formatCurrency(kembalian)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="sticky bottom-0 border-t bg-gray-50 p-6 rounded-b-2xl">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} />
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <DollarSign size={24} onClick={handleSubmit} />
                  Konfirmasi Pembayaran
                </>
              )}
            </button>
          </div>

          {/* Shortcut Info */}
          <div className="text-center text-xs text-gray-500 mt-4">
            Tekan <kbd className="px-2 py-1 bg-gray-200 rounded mx-1">ESC</kbd>{" "}
            untuk batal
            <span className="mx-2">•</span>
            Klik di luar modal untuk tutup
          </div>
        </div>
      </div>
    </div>
  );
}
