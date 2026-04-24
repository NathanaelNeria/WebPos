// src/Components/Kasir/WasteInput.jsx
import { useState, useEffect } from "react";
import {
  Scissors,
  X,
  AlertCircle,
  CheckCircle,
  Package,
  Scale,
  Tag,
} from "lucide-react";

import { toUnit, fromUnit } from "../../../Utils/weight";

/* ======================================================
   WASTE INPUT COMPONENT
   Untuk input berat jual dan ujung kain pada penjualan ecer
====================================================== */
export default function WasteInput({
  isOpen,
  onClose,
  roll,
  onConfirm,
  format2 = (n) => parseFloat(n || 0).toFixed(2),
  isEditing = false,
}) {
  const [beratJual, setBeratJual] = useState("");
  const [beratUjung, setBeratUjung] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [beratNeto, setBeratNeto] = useState("");
  const [errorBerat, setErrorBerat] = useState("");

  const notOpened =
    roll?.status?.toUpperCase().trim() === "AVAILABLE" &&
    (roll?.is_rol_dibuka === false || roll?.is_rol_dibuka === undefined);

  const isBeratNetoValid = notOpened
    ? !errorBerat && Number(beratNeto) > 0
    : true;

  // Reset state when roll changes
  useEffect(() => {
    if (roll) {
      setBeratJual("");
      setBeratNeto("");
      setBeratUjung("");
      setError("");
      setWarning("");
      setErrorBerat("");
    }
  }, [roll]);

  // Auto-calculate when values change
  useEffect(() => {
    if (!roll) return;

    const jual = parseFloat(beratJual) || 0;
    const ujung = parseFloat(beratUjung) || 0;
    const total = jual + ujung;
    const netoNumber = beratNeto !== "" ? parseFloat(beratNeto) : null;

    const sisa = notOpened
      ? netoNumber !== null
        ? netoNumber
        : roll.berat_sisa || 0
      : roll.berat_sisa || 0;

    if (jual > 0) {
      const jualUnit = toUnit(jual);
      const ujungUnit = toUnit(ujung);
      const sisaUnit = toUnit(sisa);

      if (jualUnit + ujungUnit > sisaUnit) {
        setError(
          `Total melebihi sisa roll (${format2(fromUnit(sisaUnit))} kg)`,
        );
      } else {
        setError("");
      }

      if (ujung > 0.5) {
        setWarning(
          `Ujung kain cukup besar (${format2(ujung)} kg). Pastikan ini benar.`,
        );
      } else {
        setWarning("");
      }
    } else {
      setError("");
      setWarning("");
    }
  }, [beratJual, beratUjung, roll, format2]);

  const handleSubmit = () => {
    if (!roll) return;

    const jual = parseFloat(beratJual);
    const ujung = parseFloat(beratUjung) || 0;

    if (!jual || jual <= 0) {
      setError("Berat jual harus diisi dengan angka positif");
      return;
    }

    const decimalCount = (beratJual.toString().split(".")[1] || "").length;
    if (decimalCount > 2) {
      setError("Berat maksimal 2 angka desimal");
      return;
    }

    if (ujung > 0) {
      const ujungDecimal = (beratUjung.toString().split(".")[1] || "").length;
      if (ujungDecimal > 2) {
        setError("Berat ujung maksimal 2 angka desimal");
        return;
      }
    }

    const jualUnit = toUnit(jual);
    const ujungUnit = toUnit(ujung);
    const sisaUnit = toUnit(roll.berat_sisa);

    if (jualUnit + ujungUnit > sisaUnit) {
      setError(`Total melebihi sisa roll (${format2(fromUnit(sisaUnit))} kg)`);
      return;
    }

    if (ujung > 0.5) {
      const confirm = window.confirm(
        `Ujung kain ${format2(ujung)} kg cukup besar. Lanjutkan?`,
      );
      if (!confirm) return;
    }

    onConfirm({
      beratJual: fromUnit(toUnit(jual)),
      beratUjung: fromUnit(toUnit(ujung)),
      beratNeto:
        notOpened && netoNumber !== null ? fromUnit(toUnit(netoNumber)) : null,
      beratSisaDB: fromUnit(toUnit(roll.berat_sisa)),
    });
  };

  if (!isOpen || !roll) return null;

  const netoNumber = beratNeto !== "" ? parseFloat(beratNeto) : null;

  const sumberBerat = notOpened
    ? netoNumber !== null
      ? netoNumber
      : roll.berat_sisa
    : roll.berat_sisa;

  const beratSisaDB = roll?.berat_sisa || 0;
  const jual = parseFloat(beratJual) || 0;
  const ujung = parseFloat(beratUjung) || 0;
  const total = jual + ujung;
  const sisaBaru = sumberBerat - total;

  console.log("DEBUG", {
    status: roll?.status,
    isRolDibuka: roll?.is_rol_dibuka,
    beratNeto,
    sumberBerat,
    beratSisaDB: roll?.berat_sisa,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
        {/* Header - Gradient Primary */}
        <div className="bg-gradient-primary p-4 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Scissors size={20} className="text-secondary" />
            <h2 className="text-base font-semibold">
              {isEditing ? "Edit Penjualan Ecer" : "Input Penjualan Ecer"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - lebih compact */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Info Roll - lebih kecil */}
          <div className="bg-secondary/5 p-3 rounded-lg border border-secondary/20">
            <h3 className="text-xs font-medium text-darkblue mb-2 flex items-center gap-1">
              <Package size={14} className="text-secondary" />
              Detail Roll
            </h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-gray-500">Roll ID:</span>
              <span className="font-mono font-medium truncate">
                {roll.rollId || roll.id}
              </span>

              <span className="text-gray-500">Kategori:</span>
              <span className="font-medium truncate">
                {roll.kategori || "-"}
              </span>

              <span className="text-gray-500">Produk:</span>
              <span className="font-medium truncate">
                {roll.produkNama || "-"}
              </span>

              <span className="text-gray-500">Berat Sisa:</span>
              <span className="font-bold text-primary">
                {format2(beratSisaDB)} kg
              </span>

              <span className="text-gray-500">Harga/kg:</span>
              <span className="font-medium text-primary">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(roll.harga_jual || 0)}
              </span>
            </div>
          </div>

          {/* Input Form - lebih compact */}
          <div className="space-y-3">
            {/* Berat Neto */}
            {notOpened && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Berat Netto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Scale
                    size={14}
                    className="absolute left-3 top-2.5 text-gray-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={sumberBerat}
                    className={`border border-gray-200 pl-9 pr-12 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition
                    ${
                      errorBerat
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-primary/20 focus:border-primary"
                    }

                      `}
                    placeholder="0.00"
                    value={beratNeto}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBeratNeto(value);

                      if (!value || Number(value) <= 0) {
                        setErrorBerat(
                          "Berat netto wajib diisi dan harus lebih dari 0!",
                        );
                      } else {
                        setErrorBerat("");
                      }
                    }}
                    autoFocus
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-500">
                    kg
                  </span>
                </div>
                {errorBerat ? (
                  <p className="text-[10px] text-red-500 mt-1">{errorBerat}</p>
                ) : (
                  <p className="text-[10px] text-red-500 mt-1">
                    Roll belum dibuka, masukkan berat netto untuk validasi
                  </p>
                )}
              </div>
            )}

            {/* Berat Jual */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Berat yang Dijual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Scale
                  size={14}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={sumberBerat}
                  className="border border-gray-200 pl-9 pr-12 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  placeholder="0.00"
                  value={beratJual}
                  onChange={(e) => setBeratJual(e.target.value)}
                  autoFocus
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">
                  kg
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Maksimal {format2(sumberBerat)} kg (2 desimal)
              </p>
            </div>

            {/* Ujung Kain */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ujung Kain (Waste)
              </label>
              <div className="relative">
                <Scissors
                  size={14}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={sumberBerat - jual}
                  className="border border-gray-200 pl-9 pr-12 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  placeholder="0.00"
                  value={beratUjung}
                  onChange={(e) => setBeratUjung(e.target.value)}
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">
                  kg
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Ujung kain 100-500gr per roll (0.1 - 0.5 kg)
              </p>
            </div>

            {/* Live Summary - lebih compact */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Berat Jual:</span>
                <span className="font-medium text-darkblue">
                  {format2(jual)} kg
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Ujung Kain:</span>
                <span className="font-medium text-amber-600">
                  {format2(ujung)} kg
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1.5 border-t border-gray-200">
                <span className="text-gray-700">Total Digunakan:</span>
                <span
                  className={
                    total > sumberBerat ? "text-red-600" : "text-primary"
                  }
                >
                  {format2(total)} kg
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Sisa Baru:</span>
                <span
                  className={`font-medium ${sisaBaru < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {format2(Math.max(0, sisaBaru))} kg
                </span>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 p-2 rounded-lg flex items-start gap-1.5 text-red-700 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {warning && !error && (
              <div className="bg-yellow-50 p-2 rounded-lg flex items-start gap-1.5 text-yellow-700 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            )}

            {!error && !warning && jual > 0 && (
              <div className="bg-green-50 p-2 rounded-lg flex items-start gap-1.5 text-green-700 text-xs">
                <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Valid, silakan lanjutkan</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!jual || jual <= 0 || !!error || !isBeratNetoValid}
              className="flex-1 bg-gradient-primary text-white px-3 py-2 rounded-lg text-xs
             disabled:opacity-50 disabled:cursor-not-allowed
             transition hover:shadow-soft font-medium"
            >
              {isEditing ? "Update Item" : "Tambah ke Keranjang"}
            </button>
          </div>
        </div>

        {/* Footer Note - lebih kecil */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Tag size={10} className="text-secondary" />
            Ujung kain tercatat sebagai waste untuk audit
          </p>
        </div>
      </div>
    </div>
  );
}
