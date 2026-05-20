// src/Pages/Kasir/Retur.jsx
import { useState, useEffect, useCallback } from "react";
import { db } from "../../Services/firebase";
import {
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Barcode, Scan, CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../Hooks/useAuth";
import { useGudang } from "../../Hooks/useGudang";
import {
  validateReturnRoll,
  getRollsFromNota,
} from "../../Services/kasirService";

// Reuse the existing Cart component which already supports editing price
import Cart from "../../Components/Kasir/Cart";

const format2 = (n) => parseFloat(n || 0).toFixed(2);

export default function Retur() {
  const { user } = useAuth();
  const { activeGudangId, gudangNama } = useGudang();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [cart, setCart] = useState([]);
  const [notaPembelian, setNotaPembelian] = useState("");
  const [loading, setLoading] = useState(false);

  // Load gudang check – if missing, alert and stop
  useEffect(() => {
    if (!activeGudangId) {
      Swal.fire({
        icon: "warning",
        title: "Gudang tidak terpilih",
        text: "Pilih gudang terlebih dahulu",
        confirmButtonColor: "#243A8C",
      });
    }
  }, [activeGudangId]);

  const handleLoadRollsFromNota = async () => {
    if (!notaPembelian.trim()) return;
    setLoading(true);
    try {
      const result = await getRollsFromNota(notaPembelian);
      if (!result.valid) {
        Swal.fire({
          icon: "error",
          title: "Gagal memuat roll",
          text: result.message || "Tidak dapat memuat roll dari nota",
          confirmButtonColor: "#243A8C",
        });
        return;
      }

      const { rolls, skippedRolls } = result;

      // Clear cart and build new cart from nota
      const newCart = [];

      rolls.forEach((roll) => {
        const beratTerjual = roll.berat_terjual || 0;
        const hargaPerKg = roll.harga_per_kg || 0;
        const newItem = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          rollId: roll.id,
          barcode: roll.kode_barcode || roll.id,
          produkId: roll.produk_id,
          produkNama: roll.produk_nama || "Unknown",
          kategori: roll.kategori || "Umum",
          harga_referensi: roll.harga_referensi || 0,
          harga_per_kg: hargaPerKg,
          tipe: "ECER",
          berat_jual: beratTerjual,
          berat_ujung: 0,
          berat_neto: null,
          subtotal: beratTerjual * hargaPerKg,
        };
        newCart.push(newItem);
      });

      setCart(newCart);

      // Show success message with details
      let message = `Berhasil memuat ${rolls.length} roll`;
      if (skippedRolls && skippedRolls.length > 0) {
        message += `\n${skippedRolls.length} roll dilewati (bukan SOLD atau tidak ditemukan)`;
      }

      Swal.fire({
        icon: "success",
        title: "Roll berhasil dimuat",
        text: message,
        confirmButtonColor: "#243A8C",
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message || "Terjadi kesalahan",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setLoading(true);
    try {
      const result = await validateReturnRoll(barcodeInput);
      if (!result.valid) {
        Swal.fire({
          icon: "error",
          title: "Tidak dapat menambahkan",
          text: result.message || "Roll tidak valid",
          confirmButtonColor: "#243A8C",
        });
        setBarcodeInput("");
        return;
      }
      const roll = result.roll;
      // Only allow rolls with status "SOLD"
      if (roll.status !== "SOLD") {
        Swal.fire({
          icon: "error",
          title: "Roll tidak dapat diretur",
          text: `Roll ${roll.id} statusnya bukan SOLD`,
          confirmButtonColor: "#243A8C",
        });
        setBarcodeInput("");
        return;
      }
      // Prevent duplicate entries
      if (cart.find((i) => i.rollId === roll.id)) {
        Swal.fire({
          icon: "info",
          title: "Sudah di keranjang",
          text: `Roll ${roll.id} sudah ditambahkan`,
          confirmButtonColor: "#243A8C",
        });
        setBarcodeInput("");
        return;
      }
      // For return we treat each roll as an ECER item with auto-filled sold weight and price
      const beratTerjual = roll.berat_terjual || 0;
      const hargaPerKg = roll.harga_per_kg || 0;
      const newItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        rollId: roll.id,
        barcode: roll.kode_barcode || roll.id,
        produkId: roll.produk_id,
        produkNama: roll.produk_nama || "Unknown",
        kategori: roll.kategori || "Umum",
        harga_referensi: roll.harga_referensi || 0,
        harga_per_kg: hargaPerKg,
        tipe: "ECER",
        berat_jual: beratTerjual,
        berat_ujung: 0,
        berat_neto: null,
        subtotal: beratTerjual * hargaPerKg,
      };
      setCart((prev) => [...prev, newItem]);
      setBarcodeInput("");
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message || "Terjadi kesalahan",
        confirmButtonColor: "#243A8C",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (itemId) => {
    Swal.fire({
      title: "Hapus item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#243A8C",
      confirmButtonText: "Ya, hapus",
    }).then((res) => {
      if (res.isConfirmed) {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
      }
    });
  };

  const updateCartItem = (itemId, updates) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
    );
  };

  const handleUpdateHarga = (itemId, newHarga) => {
    // Update price per kg for the item and recalc subtotal
    const harga = Number(newHarga) || 0;
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const subtotal = (i.berat_jual || 0) * harga;
        return { ...i, harga_per_kg: harga, subtotal };
      }),
    );
  };

  // Generate a unique return number with "RET-<ddMMyyyy>-<seq>"
  const generateReturNumber = async () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const dateStr = `${day}${month}${year}`;
    const seqRef = doc(db, "sequences", `retur_${dateStr}`);
    const seq = await runTransaction(db, async (trx) => {
      const snap = await trx.get(seqRef);
      let lastNumber = 1;
      if (snap.exists()) {
        lastNumber = snap.data().lastNumber + 1;
        trx.update(seqRef, { lastNumber, updatedAt: serverTimestamp() });
      } else {
        trx.set(seqRef, {
          lastNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          date: dateStr,
        });
      }
      return lastNumber;
    });
    const seqPadded = String(seq).padStart(3, "0");
    return `RET-${dateStr}-${seqPadded}`;
  };

  // Save return data to Firestore
  const handleSaveRetur = async () => {
    if (!notaPembelian.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nomor Nota Pembelian kosong",
        text: "Masukkan nomor nota pembelian sebelum menyimpan retur",
        confirmButtonColor: "#243A8C",
      });
      return;
    }
    if (cart.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Keranjang kosong",
        text: "Tidak ada item yang akan diretur",
        confirmButtonColor: "#243A8C",
      });
      return;
    }
    setLoading(true);
    try {
      const nomorRetur = await generateReturNumber();
      const itemsForDb = cart.map((item) => ({
        rollId: item.rollId,
        barcode: item.barcode,
        produkId: item.produkId,
        produkNama: item.produkNama,
        kategori: item.kategori,
        tipe: item.tipe,
        berat_jual: item.berat_jual || 0,
        berat_ujung: item.berat_ujung || 0,
        berat_neto: null,
        harga_referensi: item.harga_referensi || 0,
        harga_per_kg: item.harga_per_kg || 0,
        subtotal: item.subtotal || 0,
      }));
      const totalRetur = summary.totalHarga;
      const totalBerat = summary.totalBerat;

      // Use transaction to save retur and update roll status atomically
      await runTransaction(db, async (trx) => {
        // Save retur document
        const returRef = doc(db, "retur", nomorRetur);
        trx.set(returRef, {
          nomorNotaPembelian: notaPembelian,
          nomorRetur,
          totalRetur,
          totalBerat,
          items: itemsForDb,
          kasir: {
            uid: user?.uid,
            nama: user?.displayName || user?.email || "",
            email: user?.email || "",
          },
          createdAt: serverTimestamp(),
        });

        // Update each roll status to AVAILABLE
        for (const item of cart) {
          const rollRef = doc(db, "stockRolls", item.rollId);
          trx.update(rollRef, {
            status: "AVAILABLE",
            berat_sisa: item.berat_jual || 0,
            nota_terakhir: null,
            last_updated: serverTimestamp(),
          });
        }
      });

      Swal.fire({
        icon: "success",
        title: "Retur disimpan",
        text: `Retur ${nomorRetur} berhasil disimpan`,
        confirmButtonColor: "#243A8C",
      });
      setCart([]);
      setNotaPembelian("");
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan retur",
        text: e.message || "Terjadi kesalahan",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  // Compute simple summary for display (total berat and total harga)
  const summary = cart.reduce(
    (acc, item) => {
      if (item.tipe === "ECER") {
        acc.totalBerat += item.berat_jual || 0;
        acc.totalHarga += item.subtotal || 0;
      }
      acc.totalItem = (acc.totalItem || 0) + 1;
      return acc;
    },
    { totalBerat: 0, totalHarga: 0, totalItem: 0 },
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-card p-4 rounded-xl text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Retur Barang</h1>
        <div className="text-sm">{gudangNama}</div>
      </div>

      {/* Return Info & Cek Nota Button */}
      <div className="bg-white rounded-xl shadow-soft border p-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Nomor Nota Pembelian"
          value={notaPembelian}
          onChange={(e) => setNotaPembelian(e.target.value)}
          disabled={loading}
          className="border border-gray-200 pl-3 pr-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
        />
        <button
          onClick={handleLoadRollsFromNota}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition flex items-center gap-1 disabled:opacity-50"
          disabled={loading}
        >
          <CheckCircle size={16} /> Cek Nota
        </button>
      </div>

      {/* Scan Input */}
      <div className="bg-white rounded-xl shadow-soft border p-4 flex gap-2 items-center mt-4">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            className="border border-gray-200 pl-10 pr-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition hover:border-primary/30"
            placeholder="Scan atau ketik barcode roll..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScanBarcode()}
            disabled={loading}
          />
        </div>
        <button
          onClick={handleScanBarcode}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition flex items-center gap-1"
          disabled={loading}
        >
          <CheckCircle size={16} /> Tambah
        </button>
      </div>

      {/* Cart */}
      <Cart
        cart={cart}
        onRemove={removeFromCart}
        onUpdateItem={updateCartItem}
        onUpdateHarga={handleUpdateHarga}
        summary={summary}
        format2={format2}
      />

      {/* Simpan Retur Button */}
      {cart.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border p-4 flex justify-end">
          <button
            onClick={handleSaveRetur}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            <CheckCircle size={20} /> Simpan Retur
          </button>
        </div>
      )}
    </div>
  );
}
