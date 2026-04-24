// src/Components/Kasir/ModalOrderProduk.jsx
import { useState, useEffect, useMemo } from "react";
import {
  X,
  Package,
  Scale,
  DollarSign,
  Info,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../Services/firebase"; // Pastikan path ini benar

export default function ModalOrderProduk({ product, onClose, onAdd }) {
  // State utama
  const [jenisPenjualan, setJenisPenjualan] = useState("roll");
  const [selectedRolls, setSelectedRolls] = useState([]);
  const [eceranData, setEceranData] = useState({
    rollId: "",
    beratAwal: 0,
    beratDijual: "",
    beratSisa: 0,
    hargaPerKg: 0,
  });
  const [hargaJual, setHargaJual] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [searchRoll, setSearchRoll] = useState("");
  const [showAllRolls, setShowAllRolls] = useState(false);
  const [availableRolls, setAvailableRolls] = useState([]);
  const [loadingRolls, setLoadingRolls] = useState(false);
  const [error, setError] = useState(null);

  // DEBUG: Log data product
  useEffect(() => {
    console.log("🔍 DEBUG ModalOrderProduk - Product Data:");
    console.log("Product:", product);
    console.log("Product ID:", product?.id);
    console.log("Product hargaReferensi:", product?.hargaReferensi);
  }, [product]);

  // Fetch rolls dari Firestore berdasarkan produkId
  useEffect(() => {
    const fetchRolls = async () => {
      if (!product?.id) {
        console.log("❌ No product ID");
        return;
      }

      setLoadingRolls(true);
      setError(null);

      try {
        console.log("📥 Fetching rolls for product:", product.id);

        // Query stokRolls berdasarkan produkId dan status available
        const rollsQuery = query(
          collection(db, "stockRolls"),
          where("produkId", "==", product.id),
          where("status", "in", ["available", "open"]),
        );

        const querySnapshot = await getDocs(rollsQuery);
        console.log("📊 Found rolls:", querySnapshot.size, "items");

        const rollsData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Roll data:", data);

          rollsData.push({
            id: doc.id,
            rollId: data.rollId || doc.id,
            nomorRol:
              data.nomorRol || data.rollNumber || `ROLL-${doc.id.slice(-6)}`,
            berat: parseFloat(data.beratKg || data.berat || data.weight || 0),
            kondisi: data.kondisi || data.condition || "UTUH",
            status: data.status || "available",
            gudangId: data.gudangId,
            createdAt: data.createdAt,
            // Simpan semua data asli
            ...data,
          });
        });

        console.log("✅ Processed rolls:", rollsData);
        setAvailableRolls(rollsData);
      } catch (error) {
        console.error("❌ Error fetching rolls:", error);
        setError("Gagal memuat data roll dari database");
      } finally {
        setLoadingRolls(false);
      }
    };

    fetchRolls();
  }, [product]);

  // Harga dari produk - dari field yang ada di database
  const hargaBeliKg = useMemo(() => {
    if (!product) return 0;

    // Coba berbagai field untuk harga beli
    const harga =
      product.hargaReferensi || product.hargaBeli || product.purchasePrice || 0;
    console.log("💰 hargaBeliKg:", harga);
    return Number(harga) || 0;
  }, [product]);

  // Harga jual - mungkin ada field terpisah atau kita hitung dari margin
  const hargaJualKg = useMemo(() => {
    if (!product) return 0;

    // Coba field untuk harga jual
    const harga =
      product.hargaJual || product.sellingPrice || product.hargaJualKg || 0;
    console.log("💰 hargaJualKg:", harga);
    return Number(harga) || 0;
  }, [product]);

  // Harga rekomendasi: jika ada harga jual, pakai itu. Jika tidak, hitung dari harga beli + margin
  const hargaRekomendasi = useMemo(() => {
    if (hargaJualKg > 0) {
      return hargaJualKg;
    } else if (hargaBeliKg > 0) {
      // Default margin 20%
      return Math.round(hargaBeliKg * 1.2);
    } else {
      // Fallback jika tidak ada harga
      return 50000;
    }
  }, [hargaBeliKg, hargaJualKg]);

  console.log("🎯 Final prices:", {
    hargaBeliKg,
    hargaJualKg,
    hargaRekomendasi,
  });

  // Harga referensi: gunakan hargaReferensi dari produk atau harga beli
  const hargaReferensi = useMemo(() => {
    return hargaBeliKg || 0;
  }, [hargaBeliKg]);

  // Filter roll berdasarkan pencarian
  const filteredRolls = useMemo(() => {
    if (!searchRoll.trim()) {
      return availableRolls;
    }

    const searchTerm = searchRoll.toLowerCase().trim();
    return availableRolls.filter((roll) => {
      // Cari berdasarkan nomorRol
      if (roll.nomorRol && roll.nomorRol.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Cari berdasarkan rollId
      if (roll.rollId && roll.rollId.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Cari berdasarkan berat
      if (roll.berat && roll.berat.toString().includes(searchTerm)) {
        return true;
      }

      // Cari berdasarkan kondisi
      if (roll.kondisi && roll.kondisi.toLowerCase().includes(searchTerm)) {
        return true;
      }

      return false;
    });
  }, [availableRolls, searchRoll]);

  // Roll yang akan ditampilkan (dibatasi 3 atau semua)
  const displayedRolls = useMemo(() => {
    if (showAllRolls || searchRoll) {
      return filteredRolls;
    }
    return filteredRolls.slice(0, 3);
  }, [filteredRolls, showAllRolls, searchRoll]);

  // Reset ketika ganti jenis penjualan
  useEffect(() => {
    if (jenisPenjualan === "roll") {
      setSelectedRolls([]);
      setHargaJual(0);
      setIsManualPrice(false);
      setSearchRoll("");
      setShowAllRolls(false);
    } else {
      setEceranData({
        rollId: "",
        beratAwal: 0,
        beratDijual: "",
        beratSisa: 0,
        hargaPerKg: hargaRekomendasi,
      });
      setHargaJual(0);
      setIsManualPrice(false);
      setSearchRoll("");
      setShowAllRolls(false);
    }
  }, [jenisPenjualan, hargaRekomendasi]);

  // Hitung total harga untuk roll utuh
  useEffect(() => {
    if (
      jenisPenjualan === "roll" &&
      selectedRolls.length > 0 &&
      !isManualPrice
    ) {
      const totalBerat = selectedRolls.reduce(
        (sum, roll) => sum + (roll.berat || 0),
        0,
      );
      const totalHarga = Math.round(totalBerat * hargaRekomendasi);
      setHargaJual(totalHarga);
    }
  }, [selectedRolls, jenisPenjualan, hargaRekomendasi, isManualPrice]);

  // Hitung harga untuk eceran
  useEffect(() => {
    if (
      jenisPenjualan === "ecer" &&
      eceranData.beratDijual &&
      eceranData.hargaPerKg
    ) {
      const berat = parseFloat(eceranData.beratDijual);
      if (berat > 0 && berat <= eceranData.beratAwal) {
        const totalHarga = Math.round(berat * eceranData.hargaPerKg);
        setHargaJual(totalHarga);

        // Update berat sisa
        const sisa = eceranData.beratAwal - berat;
        setEceranData((prev) => ({ ...prev, beratSisa: sisa }));
      } else {
        setHargaJual(0);
      }
    }
  }, [
    eceranData.beratDijual,
    eceranData.hargaPerKg,
    eceranData.beratAwal,
    jenisPenjualan,
  ]);

  // Pilih roll untuk eceran
  const handleSelectRollForEceran = (rollId) => {
    const selectedRoll = availableRolls.find((r) => r.id === rollId);
    if (selectedRoll) {
      setEceranData({
        rollId: selectedRoll.id,
        beratAwal: selectedRoll.berat || 0,
        beratDijual: "",
        beratSisa: selectedRoll.berat || 0,
        hargaPerKg: hargaRekomendasi,
      });
      setHargaJual(0);
    }
  };

  // Toggle pilih roll untuk roll utuh
  const toggleRollSelection = (roll) => {
    if (selectedRolls.some((r) => r.id === roll.id)) {
      setSelectedRolls((prev) => prev.filter((r) => r.id !== roll.id));
    } else {
      setSelectedRolls((prev) => [...prev, roll]);
    }
    setIsManualPrice(false);
  };

  // Handle perubahan harga manual untuk roll utuh
  const handleHargaJualChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setHargaJual("");
      setIsManualPrice(true);
      return;
    }

    const numValue = parseInt(value) || 0;
    setHargaJual(numValue);
    setIsManualPrice(true);
  };

  // Handle perubahan harga per kg untuk eceran
  const handleHargaPerKgChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setEceranData((prev) => ({ ...prev, hargaPerKg: "" }));
      return;
    }

    const numValue = parseInt(value) || 0;
    setEceranData((prev) => ({ ...prev, hargaPerKg: numValue }));
  };

  // Handle perubahan berat untuk eceran
  const handleBeratDijualChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setEceranData((prev) => ({ ...prev, beratDijual: "" }));
      return;
    }

    const numValue = parseFloat(value) || 0;
    if (numValue <= eceranData.beratAwal) {
      setEceranData((prev) => ({ ...prev, beratDijual: numValue }));
    }
  };

  // Validasi form
  const validateForm = () => {
    if (jenisPenjualan === "roll") {
      if (selectedRolls.length === 0) {
        alert("Pilih minimal 1 roll");
        return false;
      }
      if (!hargaJual || hargaJual <= 0) {
        alert("Masukkan harga yang valid");
        return false;
      }
    } else {
      if (!eceranData.rollId) {
        alert("Pilih roll untuk dijual eceran");
        return false;
      }
      if (!eceranData.beratDijual || parseFloat(eceranData.beratDijual) <= 0) {
        alert("Masukkan berat yang valid");
        return false;
      }
      if (parseFloat(eceranData.beratDijual) > eceranData.beratAwal) {
        alert("Berat dijual tidak boleh lebih dari berat roll");
        return false;
      }
      if (!eceranData.hargaPerKg || eceranData.hargaPerKg <= 0) {
        alert("Masukkan harga per kg yang valid");
        return false;
      }
    }
    return true;
  };

  // Submit order
  const handleSubmit = () => {
    if (!validateForm()) return;

    const orderData = {
      product,
      jenisPenjualan,
      hargaJual: parseInt(hargaJual) || 0,
      detailHarga: {},
    };

    if (jenisPenjualan === "roll") {
      const totalBerat = selectedRolls.reduce(
        (sum, roll) => sum + (roll.berat || 0),
        0,
      );
      const hargaPerKg =
        totalBerat > 0 ? Math.round(hargaJual / totalBerat) : 0;

      orderData.selectedRolls = selectedRolls;
      orderData.jumlahRoll = selectedRolls.length;
      orderData.berat = totalBerat;
      orderData.hargaPerKg = hargaPerKg;
      orderData.detailHarga = {
        rollPerRoll:
          selectedRolls.length > 0
            ? Math.round(hargaJual / selectedRolls.length)
            : 0,
        hargaPerKg,
        totalBerat,
      };
    } else {
      const selectedRoll = availableRolls.find(
        (r) => r.id === eceranData.rollId,
      );
      const beratDijual = parseFloat(eceranData.beratDijual) || 0;
      const hargaPerKg = parseInt(eceranData.hargaPerKg) || 0;

      orderData.selectedRolls = [selectedRoll];
      orderData.jumlahRoll = 1;
      orderData.berat = beratDijual;
      orderData.hargaPerKg = hargaPerKg;
      orderData.detailHarga = {
        ecerPerKg: hargaPerKg,
        beratAwal: eceranData.beratAwal,
        beratSisa: eceranData.beratSisa,
      };
    }

    orderData.catatan = catatan;

    onAdd(orderData);
  };

  // Format currency
  const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  // Hitung total berat terpilih
  const totalBeratTerpilih = selectedRolls.reduce(
    (sum, roll) => sum + (roll.berat || 0),
    0,
  );

  // Harga per kg untuk roll utuh
  const hargaPerKgRollUtuh =
    totalBeratTerpilih > 0
      ? Math.round((hargaJual || 0) / totalBeratTerpilih)
      : 0;

  // Helper function untuk menampilkan nomor roll
  const getRollDisplayName = (roll) => {
    if (!roll) return "ROLL-TANPA-ID";

    // Prioritaskan nomorRol
    if (roll.nomorRol && roll.nomorRol.trim() !== "") {
      return roll.nomorRol;
    }

    // Kemudian rollId
    if (roll.rollId) {
      return roll.rollId;
    }

    // Terakhir ID dengan format singkat
    if (roll.id) {
      const idStr = String(roll.id);
      if (idStr.length > 6) {
        return `ROLL-${idStr.slice(-6)}`;
      }
      return `ROLL-${idStr}`;
    }

    return "ROLL-TANPA-ID";
  };

  // Jika tidak ada product
  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-4xl w-full rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-red-100 p-6 text-red-800">
            <h2 className="text-xl font-bold">Error</h2>
            <p>Produk tidak ditemukan</p>
          </div>
          <div className="p-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper untuk mendapatkan nama produk
  const getProductName = () => {
    return product.nama || product.name || "Nama Produk";
  };

  // Helper untuk mendapatkan kode produk
  const getProductCode = () => {
    return product.kode || product.code || product.sku || "-";
  };

  // Helper untuk mendapatkan kategori produk
  const getProductCategory = () => {
    return product.kategori || product.category || product.type || "-";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000B42] to-[#243A8C] p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Order Produk</h2>
              <div className="mt-2">
                <p className="font-semibold text-lg">{getProductName()}</p>
                <div className="flex gap-4 text-sm text-blue-100">
                  <span>Kode: {getProductCode()}</span>
                  <span>Kategori: {getProductCategory()}</span>
                  <span>Stok: {availableRolls.length} roll tersedia</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Pilihan Jenis Penjualan */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package size={20} />
              Jenis Penjualan
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setJenisPenjualan("roll")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex-1 ${
                  jenisPenjualan === "roll"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex flex-col items-center">
                  <Package size={24} />
                  <span className="mt-1">Roll Utuh</span>
                  <span className="text-xs opacity-80">Jual per roll</span>
                </div>
              </button>

              <button
                onClick={() => setJenisPenjualan("ecer")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex-1 ${
                  jenisPenjualan === "ecer"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex flex-col items-center">
                  <Scale size={24} />
                  <span className="mt-1">Eceran</span>
                  <span className="text-xs opacity-80">Jual per kg</span>
                </div>
              </button>
            </div>
          </div>

          {/* Info Harga Referensi */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Info size={16} />
              <span className="font-semibold">Informasi Harga</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Harga Referensi</div>
                <div className="font-bold">
                  {formatCurrency(hargaReferensi)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Harga Beli Terakhir</div>
                <div className="font-bold">
                  {formatCurrency(hargaBeliKg)}/kg
                </div>
              </div>
              <div>
                <div className="text-gray-600">Harga Rekomendasi</div>
                <div className="font-bold text-green-700">
                  {formatCurrency(hargaRekomendasi)}/kg
                </div>
              </div>
            </div>

            {/* Loading/Error info */}
            {loadingRolls && (
              <div className="mt-3 text-sm text-blue-600">
                🔄 Memuat data roll...
              </div>
            )}
            {error && (
              <div className="mt-3 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>

          {/* Konten berdasarkan jenis penjualan */}
          {jenisPenjualan === "roll" ? (
            /* ROLL UTUH */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Pilih Roll</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pilih roll yang akan dijual (bisa pilih lebih dari satu)
                </p>

                {/* Search Bar untuk Roll */}
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchRoll}
                      onChange={(e) => setSearchRoll(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cari roll berdasarkan ID, berat, atau kondisi..."
                    />
                    {searchRoll && (
                      <button
                        onClick={() => setSearchRoll("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {searchRoll && (
                    <div className="text-sm text-gray-500 mt-1">
                      Menampilkan {filteredRolls.length} dari{" "}
                      {availableRolls.length} roll
                    </div>
                  )}
                </div>

                {loadingRolls ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-3">Memuat data roll...</p>
                  </div>
                ) : availableRolls.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Package size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada roll tersedia</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Stok roll untuk produk ini kosong
                    </p>
                  </div>
                ) : filteredRolls.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Search size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Tidak ada roll yang cocok dengan pencarian
                    </p>
                    <button
                      onClick={() => setSearchRoll("")}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Reset pencarian
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-2">
                      {displayedRolls.map((roll, index) => (
                        <div
                          key={roll.id || `roll-${index}`}
                          onClick={() => {
                            toggleRollSelection(roll);
                            console.log("Roll selected:", roll);
                          }}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            selectedRolls.some((r) => r.id === roll.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-sm">
                                {getRollDisplayName(roll)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Berat: {(roll.berat || 0).toFixed(2)} kg
                              </div>
                              <div className="text-xs text-gray-500">
                                Kondisi: {roll.kondisi || "BAIK"}
                              </div>
                              {roll.gudangId && (
                                <div className="text-xs text-gray-400">
                                  Gudang: {roll.gudangId}
                                </div>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedRolls.some(
                                (r) => r.id === roll.id,
                              )}
                              onChange={() => {}}
                              className="rounded text-blue-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tombol Tampilkan Semua/Sembunyikan */}
                    {!searchRoll && filteredRolls.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowAllRolls(!showAllRolls)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          {showAllRolls ? (
                            <>
                              <ChevronUp size={16} />
                              Sembunyikan {filteredRolls.length - 3} roll
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              Tampilkan semua {filteredRolls.length} roll
                            </>
                          )}
                        </button>
                        <div className="text-xs text-gray-500 mt-1">
                          {showAllRolls
                            ? "Menampilkan semua roll tersedia"
                            : "Hanya menampilkan 3 roll pertama"}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedRolls.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <span className="font-semibold">
                        {selectedRolls.length} roll
                      </span>{" "}
                      dipilih
                      <div className="mt-1 text-xs">
                        {selectedRolls.map((r, idx) => (
                          <span
                            key={r.id || idx}
                            className="inline-block bg-white px-2 py-1 rounded mr-1 mb-1"
                          >
                            {getRollDisplayName(r)} ({(r.berat || 0).toFixed(2)}
                            kg)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Setting Harga untuk Roll Utuh */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Atur Harga</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Berat</div>
                    <div className="text-xl font-bold">
                      {totalBeratTerpilih.toFixed(2)} kg
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Jumlah Roll</div>
                    <div className="text-xl font-bold">
                      {selectedRolls.length}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga Per Kg (Rp)
                      </label>
                      <input
                        type="number"
                        value={hargaPerKgRollUtuh}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga Total (Rp)
                      </label>
                      <input
                        type="number"
                        value={hargaJual}
                        onChange={handleHargaJualChange}
                        className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold"
                        placeholder="Masukkan harga total"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    <div>
                      Perkiraan berdasarkan rekomendasi:{" "}
                      {formatCurrency(totalBeratTerpilih * hargaRekomendasi)}
                    </div>
                    <div>
                      Harga rekomendasi per kg:{" "}
                      {formatCurrency(hargaRekomendasi)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Harga beli: {formatCurrency(hargaBeliKg)}/kg
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ECERAN PER KG */
            <div className="space-y-6">
              {/* Pilih Roll untuk Eceran */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Pilih Roll untuk Eceran
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pilih 1 roll yang akan dibuka untuk dijual per kg
                </p>

                {/* Search Bar untuk Roll Eceran */}
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchRoll}
                      onChange={(e) => setSearchRoll(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Cari roll berdasarkan ID, berat, atau kondisi..."
                    />
                    {searchRoll && (
                      <button
                        onClick={() => setSearchRoll("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {searchRoll && (
                    <div className="text-sm text-gray-500 mt-1">
                      Menampilkan {filteredRolls.length} dari{" "}
                      {availableRolls.length} roll
                    </div>
                  )}
                </div>

                {loadingRolls ? (
                  <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-3">Memuat data roll...</p>
                  </div>
                ) : filteredRolls.length === 0 ? (
                  <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                    {searchRoll ? (
                      <>
                        <Search
                          size={48}
                          className="text-gray-300 mx-auto mb-3"
                        />
                        <p className="text-gray-500">
                          Tidak ada roll yang cocok dengan pencarian
                        </p>
                        <button
                          onClick={() => setSearchRoll("")}
                          className="mt-2 text-green-600 hover:text-green-800 text-sm"
                        >
                          Reset pencarian
                        </button>
                      </>
                    ) : (
                      <>
                        <Package
                          size={48}
                          className="text-gray-300 mx-auto mb-3"
                        />
                        <p className="text-gray-500">Tidak ada roll tersedia</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-2">
                      {displayedRolls.map((roll, index) => (
                        <div
                          key={roll.id || `roll-${index}`}
                          onClick={() => handleSelectRollForEceran(roll.id)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            eceranData.rollId === roll.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-sm">
                                {getRollDisplayName(roll)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Berat: {(roll.berat || 0).toFixed(2)} kg
                              </div>
                              <div className="text-xs text-gray-500">
                                Kondisi: {roll.kondisi || "BAIK"}
                              </div>
                            </div>
                            {eceranData.rollId === roll.id && (
                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tombol Tampilkan Semua/Sembunyikan untuk Eceran */}
                    {!searchRoll && filteredRolls.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowAllRolls(!showAllRolls)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                        >
                          {showAllRolls ? (
                            <>
                              <ChevronUp size={16} />
                              Sembunyikan {filteredRolls.length - 3} roll
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              Tampilkan semua {filteredRolls.length} roll
                            </>
                          )}
                        </button>
                        <div className="text-xs text-gray-500 mt-1">
                          {showAllRolls
                            ? "Menampilkan semua roll tersedia"
                            : "Hanya menampilkan 3 roll pertama"}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Detail Eceran */}
              {eceranData.rollId && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Berat Awal</div>
                        <div className="font-bold">
                          {eceranData.beratAwal.toFixed(2)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Berat Sisa</div>
                        <div className="font-bold text-green-700">
                          {eceranData.beratSisa.toFixed(2)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div
                          className={`font-bold ${
                            eceranData.beratSisa > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {eceranData.beratSisa > 0
                            ? "MASIH ADA SISA"
                            : "HABIS"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Berat Dijual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Berat yang Dijual (kg)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={eceranData.beratDijual}
                        onChange={handleBeratDijualChange}
                        className="flex-1 border border-gray-300 rounded-lg p-3"
                        placeholder="Contoh: 5.25"
                        max={eceranData.beratAwal}
                        min="0.01"
                      />
                      <div className="bg-gray-100 px-4 py-3 rounded-lg text-sm flex items-center">
                        Maks: {eceranData.beratAwal.toFixed(2)} kg
                      </div>
                    </div>
                  </div>

                  {/* Harga Per Kg */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga per kg (Rp)
                    </label>
                    <input
                      type="number"
                      value={eceranData.hargaPerKg}
                      onChange={handleHargaPerKgChange}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      placeholder="Masukkan harga per kg"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      Rekomendasi: {formatCurrency(hargaRekomendasi)}/kg
                    </div>
                  </div>

                  {/* Preview Harga */}
                  {eceranData.beratDijual &&
                    parseFloat(eceranData.beratDijual) > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">
                          Perhitungan Harga
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <div className="font-semibold">
                              {parseFloat(eceranData.beratDijual).toFixed(2)} kg
                            </div>
                            <div className="text-sm text-gray-600">
                              × {formatCurrency(eceranData.hargaPerKg)}/kg
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-700">
                            {formatCurrency(hargaJual)}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Catatan */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3"
              rows="2"
              placeholder="Contoh: Untuk customer tetap, pesanan khusus, dll."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Total Harga</div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(hargaJual)}
              </div>
              <div className="text-xs text-gray-500">
                {jenisPenjualan === "roll"
                  ? `${selectedRolls.length} roll (${totalBeratTerpilih.toFixed(
                      2,
                    )} kg)`
                  : eceranData.beratDijual
                    ? `${eceranData.beratDijual} kg eceran`
                    : "Belum ada berat"}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  (jenisPenjualan === "roll" && selectedRolls.length === 0) ||
                  (jenisPenjualan === "ecer" &&
                    (!eceranData.rollId ||
                      !eceranData.beratDijual ||
                      !eceranData.hargaPerKg)) ||
                  hargaJual <= 0
                }
                className={`px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 ${
                  (jenisPenjualan === "roll" && selectedRolls.length === 0) ||
                  (jenisPenjualan === "ecer" &&
                    (!eceranData.rollId ||
                      !eceranData.beratDijual ||
                      !eceranData.hargaPerKg)) ||
                  hargaJual <= 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                <DollarSign size={20} />
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
