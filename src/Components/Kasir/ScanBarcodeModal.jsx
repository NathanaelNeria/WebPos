// src/Pages/Kasir/components/ScanBarcodeModal.jsx
import { useState, useEffect, useRef } from "react";
import { Barcode, X, Camera, AlertCircle } from "lucide-react";

export default function ScanBarcodeModal({ isOpen, onClose, onScan, loading }) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setBarcode("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!barcode.trim()) {
      setError("Masukkan barcode");
      return;
    }
    onScan(barcode.trim());
    setBarcode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Barcode size={20} />
            <h2 className="text-lg font-semibold">Scan Barcode Roll</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scan atau Masukkan Barcode
              </label>
              <div className="relative">
                <Barcode
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  className="border pl-10 pr-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Scan barcode..."
                  value={barcode}
                  onChange={(e) => {
                    setBarcode(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {error}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Camera size={16} />
                Gunakan scanner barcode atau ketik manual
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition font-medium"
              >
                {loading ? "Memvalidasi..." : "Cek Roll"}
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Tekan Enter setelah scan
          </p>
        </div>
      </div>
    </div>
  );
}
