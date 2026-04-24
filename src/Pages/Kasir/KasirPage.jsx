import { useState, useEffect } from "react";
import { db } from "../../Services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../Hooks/useAuth";
import Swal from "sweetalert2";

import ModalOrderProduk from "../../Components/Kasir/ModalOrderProduk";
import ModalCustomer from "../../Components/Kasir/ModalCustomer";
import ModalPayment from "../../Components/Kasir/ModalPayment";

import { ShoppingCart, RefreshCw, AlertCircle } from "lucide-react";

import LogoSidebar from "../../Assets/logo kasir.png";
import LogoProduk from "../../Assets/fabric.png";
import { GenerateNomor } from "../../Components/GenerateNomor";

/* ================= UTIL ================= */

// normalisasi ID gudang (UNTUK CEK AKSES, BUKAN QUERY)
const normalizeGudangId = (id) =>
  id
    ?.toString()
    .replace(/^gudang_/i, "")
    .toUpperCase();

export default function KasirPage() {
  const { currentUser, activeGudangId } = useAuth();

  /* ================= ROLE & AKSES ================= */

  const roles = Array.isArray(currentUser?.role)
    ? currentUser.role
    : [currentUser?.role];

  const isOwner = roles.includes("owner");

  const gudangAktifRaw = isOwner ? activeGudangId : currentUser?.gudangId;
  const gudangAktifNormalized = normalizeGudangId(gudangAktifRaw);

  const kasirGudangIds = (currentUser?.kasirGudangIds || []).map(
    normalizeGudangId,
  );

  const ownerBolehKasir =
    isOwner &&
    gudangAktifNormalized &&
    kasirGudangIds.includes(gudangAktifNormalized);

  const nonOwnerBolehKasir = !isOwner && !!currentUser?.gudangId;

  const bolehKasir = ownerBolehKasir || nonOwnerBolehKasir;

  /* ================= STATE ================= */

  const [produk, setProduk] = useState([]);
  const [filteredProduk, setFilteredProduk] = useState([]);
  const [search, setSearch] = useState("");

  const [loadingProduk, setLoadingProduk] = useState(false);
  const [forceReload, setForceReload] = useState(0);

  const [modalOrderOpen, setModalOrderOpen] = useState(false);
  const [modalCustomerOpen, setModalCustomerOpen] = useState(false);
  const [modalPaymentOpen, setModalPaymentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* ================= FETCH STOK ROLL (LEGACY) ================= */

  useEffect(() => {
    if (!currentUser || !bolehKasir || !gudangAktifRaw) return;

    setLoadingProduk(true);

    console.log("id gudang aktif kasir:", gudangAktifRaw);

    const q = query(
      collection(db, "stockRolls"),
      where("gudangId", "==", gudangAktifRaw),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rolls = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        /**
         * GROUP BY PRODUK
         * produkKode → produk
         */
        const map = new Map();

        console.log("rolls", rolls);

        rolls
          .filter((r) => r.status === "AVAILABLE" || r.status === "OPEN")
          .forEach((r) => {
            // const kode = r.produkKode || "UNKNOWN";
            const kode = r.productId || r.produkId || "UNKNOWN";

            if (!map.has(kode)) {
              map.set(kode, {
                id: kode,
                kode,
                nama: r.produkNama || r.namaProduk || kode,
                stok: 0,
                berat: 0,
                rolls: [],
              });
            }

            const p = map.get(kode);

            const beratRoll = Number(r.beratKg ?? 0);

            p.stok += 1;
            p.berat += beratRoll;

            // 🔥 SHAPE ROLL AMAN BUAT MODAL
            p.rolls.push({
              rollId: r.rollId,
              berat: beratRoll,
              kondisi: r.kondisi || "UTUH",
              status: r.status,
            });
          });

        const data = Array.from(map.values());
        console.log("data", data);
        setProduk(data);
        setFilteredProduk(data);
        setLoadingProduk(false);
      },
      (err) => {
        console.error(err);
        Swal.fire("Error", err.message, "error");
        setLoadingProduk(false);
      },
    );

    return () => unsub();
  }, [currentUser, gudangAktifRaw, bolehKasir, forceReload]);

  /* ================= FILTER ================= */

  useEffect(() => {
    if (!search) {
      setFilteredProduk(produk);
      return;
    }

    const s = search.toLowerCase();
    setFilteredProduk(
      produk.filter(
        (p) =>
          p.nama.toLowerCase().includes(s) || p.kode.toLowerCase().includes(s),
      ),
    );
  }, [search, produk]);

  /* ================= HANDLER ================= */

  const handleRefresh = () => setForceReload((n) => n + 1);

  /* ================= GUARD ================= */

  if (!currentUser) return null;

  if (isOwner && !gudangAktifRaw) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Silakan pilih gudang terlebih dahulu</p>
      </div>
    );
  }

  if (isOwner && gudangAktifRaw && !ownerBolehKasir) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto text-red-600 mb-2" />
          <p className="text-red-700 font-medium">
            Anda tidak memiliki akses kasir ke gudang {gudangAktifNormalized}
          </p>
        </div>
      </div>
    );
  }

  if (!isOwner && !nonOwnerBolehKasir) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto text-red-600 mb-2" />
          <p className="text-red-700 font-medium">
            Akun Anda tidak terdaftar di gudang manapun
          </p>
        </div>
      </div>
    );
  }

  if (loadingProduk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-[#F5F6FA] p-4 gap-4">
      {/* LEFT */}
      <div className="flex-1 bg-white rounded-xl shadow p-5">
        <div className="flex items-center gap-4 mb-4">
          <img src={LogoSidebar} className="w-40" alt="Kasir" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />

          <button
            onClick={handleRefresh}
            className="p-2 bg-blue-600 text-white rounded-lg"
            title="Refresh Produk"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {filteredProduk.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProduct(p);
                setModalOrderOpen(true);
              }}
              className="border rounded-lg p-3 cursor-pointer hover:shadow"
            >
              <img src={LogoProduk} className="w-16 mx-auto" alt={p.nama} />
              <p className="font-semibold text-sm mt-2">{p.nama}</p>
              <p className="text-xs text-gray-500">
                {p.stok} roll • {p.berat.toFixed(2)} kg
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-96 bg-white rounded-xl shadow p-5">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ShoppingCart size={18} /> Keranjang
        </h2>
        <p className="text-gray-400 text-sm italic mt-4">
          (keranjang & payment pakai logic lama)
        </p>
      </div>

      {/* MODALS */}
      {modalOrderOpen && selectedProduct && (
        <ModalOrderProduk
          product={selectedProduct}
          onClose={() => setModalOrderOpen(false)}
        />
      )}

      {modalCustomerOpen && (
        <ModalCustomer onClose={() => setModalCustomerOpen(false)} />
      )}

      {modalPaymentOpen && (
        <ModalPayment total={0} onClose={() => setModalPaymentOpen(false)} />
      )}
    </div>
  );
}
