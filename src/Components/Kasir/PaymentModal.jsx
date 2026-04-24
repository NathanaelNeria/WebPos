// src/Components/Kasir/PaymentModal.jsx
import { useState, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  X,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Landmark,
  Clock,
  Calendar,
  Receipt,
  Banknote,
  Truck,
  Percent,
  Plus,
  Minus,
} from "lucide-react";

/* ======================================================
   PAYMENT MODAL COMPONENT
====================================================== */
export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  totalHarga,
  processing,
  formatRupiah,
}) {
  const [metode, setMetode] = useState("CASH");
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [kembalian, setKembalian] = useState(0);
  const [error, setError] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [catatan, setCatatan] = useState("");

  // State untuk ongkir dan potongan
  const [ongkir, setOngkir] = useState(0);
  const [potongan, setPotongan] = useState(0);
  const [totalSetelahDiskon, setTotalSetelahDiskon] = useState(totalHarga);
  const [showExtraFields, setShowExtraFields] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setMetode("CASH");
      setJumlahBayar("");
      setKembalian(0);
      setError("");
      setCatatan("");
      setOngkir(0);
      setPotongan(0);
      setTotalSetelahDiskon(totalHarga);
      setShowExtraFields(false);

      // Set default jatuh tempo +7 days
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setJatuhTempo(date.toISOString().split("T")[0]);
    }
  }, [isOpen, totalHarga]);

  // Hitung total setelah ongkir dan potongan
  useEffect(() => {
    const ongkirValue = parseFloat(ongkir) || 0;
    const potonganValue = parseFloat(potongan) || 0;

    // Ongkir ditambahkan, potongan dikurangi
    let newTotal = totalHarga + ongkirValue - potonganValue;

    // Pastikan total tidak negatif
    if (newTotal < 0) newTotal = 0;

    setTotalSetelahDiskon(newTotal);
  }, [ongkir, potongan, totalHarga]);

  // Hitung kembalian dengan total yang sudah dihitung ongkir+potongan
  useEffect(() => {
    const bayar = parseFloat(jumlahBayar) || 0;
    if (bayar >= totalSetelahDiskon) {
      setKembalian(bayar - totalSetelahDiskon);
      setError("");
    } else {
      setKembalian(0);
      if (bayar > 0) {
        setError(`Kurang ${formatRupiah(totalSetelahDiskon - bayar)}`);
      } else {
        setError("");
      }
    }
  }, [jumlahBayar, totalSetelahDiskon, formatRupiah]);

  const handleConfirm = () => {
    if (metode === "CASH") {
      const bayar = parseFloat(jumlahBayar) || 0;
      if (bayar < totalSetelahDiskon) {
        setError("Jumlah bayar kurang dari total");
        return;
      }
      onConfirm({
        metode: "CASH",
        totalBayar: bayar,
        status: "PAID",
        kembalian: bayar - totalSetelahDiskon,
        catatan: catatan,
        ongkir: parseFloat(ongkir) || 0,
        potongan: parseFloat(potongan) || 0,
        totalAwal: totalHarga,
        subtotal: totalHarga,
        totalAkhir: totalSetelahDiskon,
      });
    } else if (metode === "TEMPO") {
      if (!jatuhTempo) {
        setError("Pilih tanggal jatuh tempo");
        return;
      }
      onConfirm({
        metode: "TEMPO",
        totalBayar: totalSetelahDiskon,
        status: "UNPAID",
        jatuhTempo: jatuhTempo,
        catatan: catatan,
        kembalian: 0,
        ongkir: parseFloat(ongkir) || 0,
        potongan: parseFloat(potongan) || 0,
        totalAwal: totalHarga,
        subtotal: totalHarga,
        totalAkhir: totalSetelahDiskon,
      });
    } else {
      // Non-cash (TRANSFER, QRIS, CARD)
      onConfirm({
        metode: metode,
        totalBayar: totalSetelahDiskon,
        status: "PAID",
        kembalian: 0,
        catatan: catatan,
        ongkir: parseFloat(ongkir) || 0,
        potongan: parseFloat(potongan) || 0,
        totalAwal: totalHarga,
        subtotal: totalHarga,
        totalAkhir: totalSetelahDiskon,
      });
    }
  };

  const handleQuickAmount = (amount) => {
    setJumlahBayar(amount.toString());
  };

  const handleOngkirChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setOngkir(numValue);
  };

  const handlePotonganChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setPotongan(numValue);
  };

  if (!isOpen) return null;

  // Metode pembayaran dengan tema
  const metodeList = [
    {
      id: "CASH",
      label: "Tunai",
      icon: Wallet,
      color: "primary",
      bgLight: "bg-primary/5",
      border: "border-primary/20",
      text: "text-primary",
      gradient: "from-primary to-midblue",
    },
    {
      id: "TRANSFER",
      label: "Transfer",
      icon: Landmark,
      color: "secondary",
      bgLight: "bg-secondary/5",
      border: "border-secondary/20",
      text: "text-secondary",
      gradient: "from-secondary to-amber-500",
    },
    {
      id: "QRIS",
      label: "QRIS",
      icon: Smartphone,
      color: "purple",
      bgLight: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
      gradient: "from-purple-500 to-purple-700",
    },
    {
      id: "CARD",
      label: "Kartu",
      icon: CreditCard,
      color: "indigo",
      bgLight: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      gradient: "from-indigo-500 to-indigo-700",
    },
    {
      id: "TEMPO",
      label: "Tempo",
      icon: Clock,
      color: "amber",
      bgLight: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  // Selected method details
  const selectedMethod = metodeList.find((m) => m.id === metode);

  // Hitung perubahan total
  const ongkirValue = parseFloat(ongkir) || 0;
  const potonganValue = parseFloat(potongan) || 0;
  const selisih = ongkirValue - potonganValue;
  const isTotalBerubah = selisih !== 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header dengan gradient sesuai metode */}
        <div
          className={`bg-gradient-to-r ${selectedMethod?.gradient || "from-primary to-midblue"} p-4 rounded-t-xl sticky top-0 z-10`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <Receipt size={20} />
              <h2 className="text-lg font-semibold">Pembayaran</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition text-white"
              disabled={processing}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Total Harga - Card dengan shadow */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-2 border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Belanja</p>
              <p className="text-3xl font-bold text-primary">
                {formatRupiah(totalHarga)}
              </p>
            </div>

            {/* Tombol toggle untuk ongkir/potongan */}
            <button
              onClick={() => setShowExtraFields(!showExtraFields)}
              className="mt-3 w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-lg transition flex items-center justify-center gap-1"
            >
              {showExtraFields ? (
                <>Sembunyikan Ongkir & Potongan</>
              ) : (
                <>+ Tambah Ongkir / Potongan</>
              )}
            </button>
          </div>

          {/* Ongkir & Potongan Fields */}
          {showExtraFields && (
            <div className="space-y-3 animate-fade-in">
              {/* Ongkir Field */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Truck size={12} className="text-blue-600" />
                  Ongkir
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 pl-12 pr-4 py-2.5 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    placeholder="0"
                    value={ongkir}
                    onChange={(e) => handleOngkirChange(e.target.value)}
                    min="0"
                    step="1000"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Biaya pengiriman akan ditambahkan ke total
                </p>
              </div>

              {/* Potongan Field */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Percent size={12} className="text-green-600" />
                  Potongan / Diskon
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 pl-12 pr-4 py-2.5 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    placeholder="0"
                    value={potongan}
                    onChange={(e) => handlePotonganChange(e.target.value)}
                    min="0"
                    step="1000"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Potongan harga akan dikurangi dari total
                </p>
              </div>

              {/* Ringkasan Perubahan Total */}
              {isTotalBerubah && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg border border-blue-100">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Awal:</span>
                      <span className="font-medium">
                        {formatRupiah(totalHarga)}
                      </span>
                    </div>
                    {ongkirValue > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span className="flex items-center gap-1">
                          <Plus size={10} /> Ongkir:
                        </span>
                        <span>+ {formatRupiah(ongkirValue)}</span>
                      </div>
                    )}
                    {potonganValue > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span className="flex items-center gap-1">
                          <Minus size={10} /> Potongan:
                        </span>
                        <span>- {formatRupiah(potonganValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t border-blue-200 mt-1">
                      <span className="text-gray-800">Total Akhir:</span>
                      <span className="text-primary text-sm">
                        {formatRupiah(totalSetelahDiskon)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {metodeList.map((m) => {
                const Icon = m.icon;
                const isSelected = metode === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => setMetode(m.id)}
                    disabled={processing}
                    className={`
                      p-3 rounded-xl border-2 transition-all duration-200
                      flex flex-col items-center gap-1.5
                      ${
                        isSelected
                          ? `${m.bgLight} ${m.border} scale-[1.02] shadow-soft`
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }
                      ${processing ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <Icon
                      size={22}
                      className={isSelected ? m.text : "text-gray-400"}
                    />
                    <span
                      className={`text-xs font-medium ${isSelected ? m.text : "text-gray-600"}`}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Jumlah Bayar (khusus tunai) */}
          {metode === "CASH" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Jumlah Bayar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 pl-10 pr-4 py-3 rounded-xl text-lg font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    placeholder="0"
                    value={jumlahBayar}
                    onChange={(e) => setJumlahBayar(e.target.value)}
                    autoFocus
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Pilih nominal:</p>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      disabled={processing}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs transition"
                    >
                      Rp {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian */}
              {kembalian > 0 && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                  <span className="text-primary font-medium flex items-center gap-1">
                    <Banknote size={16} />
                    Kembalian:
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatRupiah(kembalian)}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 p-3 rounded-xl flex items-start gap-2 text-red-600 border border-red-200">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Form untuk Tempo */}
          {metode === "TEMPO" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-800 text-sm mb-1">
                      Pembayaran Tempo
                    </h4>
                    <p className="text-xs text-amber-600 mb-3">
                      Nota akan berstatus{" "}
                      <span className="font-bold">BELUM LUNAS</span> sampai
                      pembayaran diterima
                    </p>

                    <label className="block text-xs font-medium text-amber-700 mb-1">
                      Tanggal Jatuh Tempo
                    </label>
                    <input
                      type="date"
                      value={jatuhTempo}
                      onChange={(e) => setJatuhTempo(e.target.value)}
                      className="w-full border-2 border-amber-200 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber/20 outline-none"
                      min={new Date().toISOString().split("T")[0]}
                      disabled={processing}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info untuk non-tunai (selain tempo) */}
          {metode !== "CASH" && metode !== "TEMPO" && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 animate-fade-in">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                Pembayaran akan diproses sebagai{" "}
                <span className="font-bold">LUNAS</span>
              </p>
            </div>
          )}

          {/* Catatan untuk semua metode */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Catatan <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Transfer BCA, DP 50%, dll..."
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              rows="2"
              disabled={processing}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                processing ||
                (metode === "CASH" &&
                  (!jumlahBayar ||
                    parseFloat(jumlahBayar) < totalSetelahDiskon)) ||
                (metode === "TEMPO" && !jatuhTempo)
              }
              className={`flex-1 bg-gradient-to-r ${selectedMethod?.gradient || "from-primary to-midblue"} text-white px-4 py-3 rounded-xl disabled:opacity-50 transition font-medium flex items-center justify-center gap-2 hover:shadow-medium`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {metode === "TEMPO" ? "Buat Nota Tempo" : "Bayar"}
                </>
              )}
            </button>
          </div>

          {/* Info tambahan */}
          <p className="text-center text-xs text-gray-400">
            {metode === "TEMPO"
              ? "Nota tempo akan tercetak dengan status BELUM LUNAS"
              : metode === "CASH"
                ? "Pastikan jumlah bayar sesuai atau lebih"
                : "Transaksi akan langsung tercatat sebagai LUNAS"}
          </p>
        </div>
      </div>
    </div>
  );
}
