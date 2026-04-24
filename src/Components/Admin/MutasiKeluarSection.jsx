// src/Components/Admin/MutasiKeluarSection.jsx
import { useState, useMemo, useEffect } from "react";
import { Package, Check, X, Scale, Eye, Truck } from "lucide-react";
import { getRollStatus } from "../../Constants/rollStatus";
import Swal from "sweetalert2";

export default function MutasiKeluarSection({
  stokRolls = [],
  gudangList = [],
  gudangId,
  onBuatMutasi,
  loading = false,
  currentGudangNama = "",
}) {
  const [selectedGudang, setSelectedGudang] = useState("");
  const [selectedRolls, setSelectedRolls] = useState([]);
  const [filterProduk, setFilterProduk] = useState("");
  const [searchRoll, setSearchRoll] = useState("");

  // Debug logging
  useEffect(() => {
    console.log("🔍 [KeluarSection] Data received:", {
      stokRollsCount: stokRolls.length,
      gudangListCount: gudangList.length,
      gudangId,
      sampleRoll: stokRolls[0],
      statuses: stokRolls.map((r) => r.status),
    });
  }, [stokRolls, gudangList, gudangId]);

  // Filter stok - hanya AVAILABLE yang ditampilkan
  const filteredStok = useMemo(() => {
    if (!stokRolls || stokRolls.length === 0) return [];

    // Hanya tampilkan roll dengan status AVAILABLE
    const availableRolls = stokRolls.filter((roll) => {
      const status = (roll.status || "").toUpperCase();
      return status === "AVAILABLE";
    });

    console.log("🎯 Available rolls for display:", availableRolls.length);

    return availableRolls.filter((roll) => {
      const matchProduk =
        !filterProduk ||
        roll.namaProduk?.toLowerCase().includes(filterProduk.toLowerCase()) ||
        roll.kategori?.toLowerCase().includes(filterProduk.toLowerCase());

      const matchSearch =
        !searchRoll ||
        roll.rollId?.toLowerCase().includes(searchRoll.toLowerCase()) ||
        roll.namaProduk?.toLowerCase().includes(searchRoll.toLowerCase()) ||
        roll.productId?.toLowerCase().includes(searchRoll.toLowerCase());

      return matchProduk && matchSearch;
    });
  }, [stokRolls, filterProduk, searchRoll]);

  // Produk options - hanya dari roll AVAILABLE
  const produkOptions = useMemo(() => {
    const produkMap = new Map();

    stokRolls.forEach((roll) => {
      // Hanya include roll AVAILABLE
      if (roll.status === "AVAILABLE" && roll.productId && roll.namaProduk) {
        const key = `${roll.productId}-${roll.namaProduk}`;
        if (!produkMap.has(key)) {
          produkMap.set(key, {
            id: roll.productId,
            nama: roll.namaProduk,
            kategori: roll.kategori || "Umum",
          });
        }
      }
    });

    return Array.from(produkMap.values());
  }, [stokRolls]);

  // Selection handlers
  const toggleRoll = (rollId) => {
    setSelectedRolls((prev) =>
      prev.includes(rollId)
        ? prev.filter((id) => id !== rollId)
        : [...prev, rollId],
    );
  };

  const selectAll = () => {
    if (selectedRolls.length === filteredStok.length) {
      setSelectedRolls([]);
    } else {
      setSelectedRolls(filteredStok.map((r) => r.id));
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedGudang) {
      Swal.fire({
        title: "Peringatan",
        text: "Pilih gudang tujuan terlebih dahulu",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (selectedRolls.length === 0) {
      Swal.fire({
        title: "Peringatan",
        text: "Pilih minimal 1 roll untuk dikirim",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    // Validasi: Pastikan semua selected roll masih AVAILABLE
    const selectedRollsData = filteredStok.filter((r) =>
      selectedRolls.includes(r.id),
    );

    const nonAvailableRolls = selectedRollsData.filter(
      (r) => r.status !== "AVAILABLE",
    );
    if (nonAvailableRolls.length > 0) {
      Swal.fire({
        title: "Roll Tidak Tersedia",
        html: `
          <div class="text-left">
            <p>${nonAvailableRolls.length} roll sudah tidak tersedia:</p>
            <ul class="list-disc pl-4 mt-2">
              ${nonAvailableRolls.map((r) => `<li>${r.rollId} - ${r.status}</li>`).join("")}
            </ul>
            <p class="mt-3 text-sm text-gray-600">
              Silakan refresh data dan pilih roll yang tersedia.
            </p>
          </div>
        `,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const totalBerat = selectedRollsData.reduce(
      (sum, r) => sum + (r.beratAwal || 0),
      0,
    );
    const gudangTujuan = gudangList.find((g) => g.id === selectedGudang);

    const confirmed = await Swal.fire({
      title: "Buat Mutasi?",
      html: `
        <div class="text-left">
          <p>Anda akan mengirim <strong>${selectedRollsData.length} roll</strong> ke:</p>
          <p class="font-bold text-lg">${gudangTujuan?.nama || selectedGudang}</p>
          <div class="mt-3">
            <div class="text-sm">Total berat: <strong>${totalBerat.toFixed(2)} kg</strong></div>
            <div class="text-sm">Jenis produk: <strong>${new Set(selectedRollsData.map((r) => r.namaProduk)).size}</strong></div>
            <div class="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
              ⚠️ Status roll akan berubah menjadi DRAFT setelah ini
            </div>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Buat Mutasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#0C1E6E",
    });

    if (!confirmed.isConfirmed) return;

    try {
      const result = await onBuatMutasi({
        toGudangId: selectedGudang,
        rollIds: selectedRolls,
      });

      // Reset selection
      setSelectedRolls([]);
      setSelectedGudang("");
    } catch (error) {
      console.error("Error creating mutasi:", error);
    }
  };

  // Helper functions
  const getRollDisplayId = (roll) => {
    return roll.rollId || roll.id?.substring(0, 8) || "N/A";
  };

  const showRollDetail = (roll) => {
    const statusObj = getRollStatus(roll.status);

    Swal.fire({
      title: "Detail Roll",
      html: `
        <div class="text-left">
          <div class="mb-3">
            <div class="text-sm text-gray-600">Kode Roll</div>
            <div class="font-mono font-bold text-lg">${getRollDisplayId(roll)}</div>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div class="text-sm text-gray-600">Produk</div>
              <div class="font-medium">${roll.namaProduk || "Unknown"}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Berat</div>
              <div class="font-bold text-lg">${(roll.beratAwal || 0).toFixed(2)} kg</div>
            </div>
          </div>
          <div class="text-xs text-gray-500 space-y-1">
            <div>Kategori: ${roll.kategori || "-"}</div>
            <div>Status: <span class="px-2 py-1 rounded-full ${statusObj.badgeClass}">${statusObj.label}</span></div>
            <div>Product ID: ${roll.productId || "-"}</div>
            ${
              roll.status === "AVAILABLE"
                ? '<div class="mt-2 text-green-600 font-medium">✓ Roll ini bisa dimutasi</div>'
                : '<div class="mt-2 text-red-600 font-medium">✗ Roll ini tidak bisa dimutasi</div>'
            }
          </div>
        </div>
      `,
      confirmButtonText: "Tutup",
      confirmButtonColor: "#0C1E6E",
    });
  };

  // Computed values
  const selectedRollsData = filteredStok.filter((r) =>
    selectedRolls.includes(r.id),
  );
  const totalBeratSelected = selectedRollsData.reduce(
    (sum, r) => sum + (r.beratAwal || 0),
    0,
  );
  const gudangTujuanList = gudangList.filter((g) => g.id !== gudangId);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-blue-600" />
            Kirim Barang ke Gudang Lain
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gudang: <strong>{currentGudangNama || gudangId}</strong>
            {stokRolls.length === 0 && (
              <span className="ml-2 text-yellow-600">(Stok kosong)</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Stok tersedia: <span className="font-bold">{stokRolls.length}</span>
          </div>
          <div className="text-xs text-gray-500">
            Filtered: <span className="font-medium">{filteredStok.length}</span>
          </div>
        </div>
      </div>

      {/* STATUS INFO */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Check className="text-green-600" />
          <div>
            <p className="font-medium text-green-800">
              Semua roll di tabel ini statusnya <strong>AVAILABLE</strong>
            </p>
            <p className="text-sm text-green-700">
              Roll dengan status OPEN, SOLD, DRAFT, atau IN_TRANSIT tidak
              ditampilkan di halaman ini.
            </p>
          </div>
        </div>
      </div>

      {/* GUDANG TUJUAN */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Gudang Tujuan *
        </label>
        <select
          value={selectedGudang}
          onChange={(e) => setSelectedGudang(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          disabled={loading || gudangTujuanList.length === 0}
        >
          <option value="">Pilih Gudang Tujuan</option>
          {gudangTujuanList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama} {g.kode ? `(${g.kode})` : ""}
            </option>
          ))}
        </select>
        {gudangTujuanList.length === 0 && (
          <p className="text-sm text-red-600">
            Tidak ada gudang lain yang tersedia
          </p>
        )}
      </div>

      {/* FILTERS */}
      {stokRolls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Produk
            </label>
            <select
              value={filterProduk}
              onChange={(e) => setFilterProduk(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Semua Produk</option>
              {produkOptions.map((produk) => (
                <option key={produk.id} value={produk.id}>
                  {produk.nama} ({produk.kategori})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Roll
            </label>
            <input
              type="text"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              placeholder="Kode roll, nama produk, atau ID..."
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        </div>
      )}

      {/* SELECTION SUMMARY */}
      {selectedRolls.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-blue-800 flex items-center gap-2">
                <Check className="text-green-600" />
                {selectedRolls.length} roll dipilih
              </div>
              <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                <Scale size={14} />
                Total berat: {totalBeratSelected.toFixed(2)} kg
              </div>
            </div>
            <button
              onClick={() => setSelectedRolls([])}
              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
            >
              <X size={16} />
              Hapus semua
            </button>
          </div>
        </div>
      )}

      {/* ROLL TABLE */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 flex justify-between items-center">
          <div className="font-medium text-gray-700">
            Daftar Roll Tersedia ({filteredStok.length})
            <div className="text-xs text-gray-500 mt-1">
              Hanya roll dengan status{" "}
              <span className="font-medium text-green-600">AVAILABLE</span> yang
              ditampilkan
            </div>
          </div>
          {filteredStok.length > 0 && (
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedRolls.length === filteredStok.length
                ? "Batal pilih semua"
                : "Pilih semua"}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {filteredStok.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="font-medium">
                Tidak ada roll tersedia untuk mutasi
              </p>
              <p className="text-sm mt-1">
                {stokRolls.length === 0
                  ? "Stok roll kosong"
                  : "Semua roll sudah tidak tersedia untuk mutasi (bukan status AVAILABLE)"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Pilih</th>
                  <th className="p-3 text-left">Kode Roll</th>
                  <th className="p-3 text-left">Produk</th>
                  <th className="p-3 text-left">Kategori</th>
                  <th className="p-3 text-left">Berat (kg)</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredStok.map((roll) => {
                  const statusObj = getRollStatus(roll.status);
                  return (
                    <tr
                      key={roll.id}
                      className={`border-t hover:bg-gray-50 ${
                        selectedRolls.includes(roll.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedRolls.includes(roll.id)}
                          onChange={() => toggleRoll(roll.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="p-3 font-mono font-medium">
                        {getRollDisplayId(roll)}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{roll.namaProduk}</div>
                        <div className="text-xs text-gray-500">
                          {roll.productId}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {roll.kategori}
                        </span>
                      </td>
                      <td className="p-3 font-medium">
                        {(roll.beratAwal || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${statusObj.badgeClass}`}
                        >
                          {statusObj.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => showRollDetail(roll)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      {selectedRolls.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedGudang}
            className={`
              w-full py-3 rounded-lg font-bold text-white
              ${
                loading || !selectedGudang
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Memproses...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Truck size={20} />
                Buat Mutasi ({selectedRolls.length} roll)
              </div>
            )}
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!selectedRolls.length && selectedGudang && stokRolls.length > 0 && (
        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="text-gray-400 mx-auto mb-3" size={32} />
          <p className="text-gray-600 font-medium">Belum ada roll dipilih</p>
          <p className="text-sm text-gray-500 mt-1">
            Pilih roll dari tabel di atas untuk melanjutkan
          </p>
        </div>
      )}
    </div>
  );
}
