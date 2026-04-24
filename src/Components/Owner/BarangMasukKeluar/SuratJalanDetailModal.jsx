// src/Components/Owner/BarangMasukKeluar/SuratJalanDetailModal.jsx
import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Calendar,
  MapPin,
  Package,
  User,
  Tag,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  ChevronDown,
  ChevronUp,
  Layers,
  ShoppingBag,
  Building,
} from "lucide-react";
import {
  getHargaBeliByNomorSuratJalanSupplier,
  saveHargaBeliByNomorSuratJalanSupplier,
} from "../../../Services/stockLedgerService";
import Swal from "sweetalert2";

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatRupiah = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const parseRupiah = (value) => {
  return Number(value.replace(/[^0-9]/g, ""));
};

const format2 = (n) => parseFloat(n || 0).toFixed(2);

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "approved":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300";
    case "draft":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle size={14} className="text-emerald-600" />;
    case "approved":
      return <CheckCircle size={14} className="text-blue-600" />;
    case "pending":
      return <AlertCircle size={14} className="text-yellow-600" />;
    case "cancelled":
      return <AlertCircle size={14} className="text-red-600" />;
    default:
      return <Clock size={14} className="text-gray-600" />;
  }
};

const getTipeIcon = (tipe) => {
  switch (tipe) {
    case "BARANG_MASUK":
      return <Package size={14} className="text-green-600" />;
    case "MUTASI":
      return <Truck size={14} className="text-purple-600" />;
    default:
      return <FileText size={14} className="text-gray-600" />;
  }
};

const getGudangNamaFromId = (gudangId) => {
  if (!gudangId) return "-";
  const match = gudangId.match(/gudang_(.+)/);
  return match ? match[1].toUpperCase() : gudangId;
};

/* ======================================================
   KOMPONEN PRODUK KATEGORI
====================================================== */
const ProductCategoryGroup = ({
  productName,
  kategori,
  items,
  onViewRoll,
  harga,
  onChangeHarga,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const totalBerat = items.reduce((sum, item) => sum + (item.berat || 0), 0);
  const totalItems = items.length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header Group - Clickable */}
      <div
        className="bg-gray-50 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <ShoppingBag size={16} className="text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-darkblue">{productName}</h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {kategori}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{totalItems} roll</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{format2(totalBerat)} kg</span>
              <span className="text-gray-400">•</span>
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs text-gray-500 mb-1">
                  Harga Beli /KG
                </label>
                <input
                  type="text"
                  value={formatRupiah(harga)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onChange={(e) => onChangeHarga(parseRupiah(e.target.value))}
                  placeholder="Rp. 0"
                  className="w-40 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {totalItems} roll
          </span>
          {expanded ? (
            <ChevronUp size={18} className="text-gray-500" />
          ) : (
            <ChevronDown size={18} className="text-gray-500" />
          )}
        </div>
      </div>

      {/* Daftar Roll - Muncul jika expanded */}
      {expanded && (
        <div className="p-2 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Roll ID
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                  Berat
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">
                    {item.rollId || item.id || "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {item.berat ? format2(item.berat) : "0"} kg
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onViewRoll(item)}
                      className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                      title="Lihat Detail Roll"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export const SuratJalanDetailModal = ({
  isOpen,
  onClose,
  surat,
  onViewRoll,
}) => {
  const [hargaPerProduk, setHargaPerProduk] = useState({});

  useEffect(() => {
    const loadHarga = async () => {
      if (!isOpen || !surat?.supplier_ref) return;

      console.log("isi surat:", surat.supplier_ref);

      try {
        const hargaPerRoll = await getHargaBeliByNomorSuratJalanSupplier(
          surat.supplier_ref,
        );

        // ✅ ambil SATU harga saja dari ledger
        const hargaLedger =
          Object.values(hargaPerRoll).find((h) => Number(h) > 0) ?? 0;

        const initialHarga = {};

        groupList.forEach((group) => {
          const key = `${group.productName}||${group.kategori}`;
          initialHarga[key] = hargaLedger;
        });

        setHargaPerProduk(initialHarga);
      } catch (err) {
        console.error("Gagal load harga beli:", err);
      }
    };

    loadHarga();
  }, [isOpen, surat]);

  if (!isOpen || !surat || !Array.isArray(surat.items)) {
    return null;
  }

  // Group items by kombinasi produk + kategori
  const groups = {};

  (surat?.items || []).forEach((item) => {
    const key = `${item.produkNama}||${item.kategori}`;

    if (!groups[key]) {
      groups[key] = {
        productName: item.produkNama,
        kategori: item.kategori,
        items: [],
      };
    }

    groups[key].items.push(item);
  });

  // Convert ke array dan urutkan
  const groupList = Object.values(groups).sort((a, b) => {
    if (a.productName !== b.productName) {
      return a.productName.localeCompare(b.productName);
    }
    return a.kategori.localeCompare(b.kategori);
  });

  const handleSaveHargaBeli = async () => {
    const nomorSupplier = surat?.supplier_ref;

    if (!nomorSupplier) {
      Swal.fire({
        icon: "warning",
        title: "Nomor supplier tidak ada",
        text: "Nomor surat jalan supplier tidak ditemukan.",
      });
      return;
    }

    const hargaPerRoll = {};

    groupList.forEach((group) => {
      const key = `${group.productName}||${group.kategori}`;
      const harga = Number(hargaPerProduk[key] || 0);

      group.items.forEach((item) => {
        const rollId = item.rollId || item.id;
        if (rollId) {
          hargaPerRoll[rollId] = harga;
        }
      });
    });

    if (Object.values(hargaPerRoll).some((h) => h <= 0)) {
      Swal.fire({
        icon: "warning",
        title: "Harga belum lengkap",
        text: "Masih ada harga yang kosong atau 0.",
      });
      return;
    }

    try {
      Swal.fire({
        title: "Menyimpan...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await saveHargaBeliByNomorSuratJalanSupplier({
        nomorSuratJalanSupplier: nomorSupplier,
        hargaPerRoll,
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Harga beli berhasil disimpan",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Gagal menyimpan harga beli", "error");
    }
  };

  // Hitung total
  const totalGroups = groupList.length;
  const totalRoll = surat.items?.length || 0;
  const totalBerat =
    surat.items?.reduce((sum, item) => sum + (item.berat || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="bg-gradient-primary px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white">Detail Surat Jalan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">No. Surat Jalan</p>
              <p className="font-mono font-bold text-darkblue text-lg">
                {surat.supplier_ref || surat.id}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Tipe Badge */}
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                {getTipeIcon(surat.tipe)}
                <span className="text-sm font-medium">
                  {surat.tipe === "BARANG_MASUK" ? "Barang Masuk" : "Mutasi"}
                </span>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(surat.status)}`}
              >
                {getStatusIcon(surat.status)}
                {surat.status === "completed"
                  ? "Selesai"
                  : surat.status === "approved"
                    ? "Disetujui"
                    : surat.status === "pending"
                      ? "Pending"
                      : surat.status === "cancelled"
                        ? "Dibatalkan"
                        : surat.status}
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipe */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-3 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Tag size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Tipe</span>
              </div>
              <p className="font-medium text-darkblue">
                {surat.tipe === "BARANG_MASUK"
                  ? "Barang Masuk"
                  : "Mutasi Antar Gudang"}
              </p>
            </div>

            {/* Tanggal */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-3 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Tanggal</span>
              </div>
              <p className="font-medium text-darkblue">
                {formatTanggal(surat.created_at)}
              </p>
            </div>

            {/* Asal (Supplier atau Gudang Asal) */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {surat.tipe === "BARANG_MASUK" ? (
                  <Building size={14} className="text-primary" />
                ) : (
                  <MapPin size={14} className="text-primary" />
                )}
                <span className="text-xs text-gray-500">
                  {surat.tipe === "BARANG_MASUK" ? "Supplier" : "Gudang Asal"}
                </span>
              </div>
              <p className="font-medium text-darkblue">
                {surat.tipe === "BARANG_MASUK"
                  ? surat.supplier_nama || surat.metadata?.supplier || "-"
                  : surat.gudang_asal_nama ||
                    (surat.gudang_asal
                      ? getGudangNamaFromId(surat.gudang_asal)
                      : "-")}
              </p>
              {surat.tipe === "BARANG_MASUK" && surat.supplier_ref && (
                <p className="text-xs text-gray-500 mt-1">
                  Ref Internal: {surat.nomor_surat || surat.id}
                </p>
              )}
            </div>

            {/* Gudang Tujuan */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Gudang Tujuan</span>
              </div>
              <p className="font-medium text-darkblue">
                {surat.gudang_tujuan_nama ||
                  (surat.gudang_tujuan
                    ? getGudangNamaFromId(surat.gudang_tujuan)
                    : "-")}
              </p>
            </div>
          </div>

          {/* Info User */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-primary" />
                <span className="text-xs text-gray-500">Dibuat Oleh</span>
              </div>
              <p className="font-medium text-darkblue">
                {surat.created_by_name || surat.created_by || "-"}
              </p>
              {surat.created_by_email && (
                <p className="text-xs text-gray-500 mt-1">
                  {surat.created_by_email}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formatTanggal(surat.created_at)}
              </p>
            </div>

            {surat.received_by && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-primary" />
                  <span className="text-xs text-gray-500">Diterima Oleh</span>
                </div>
                <p className="font-medium text-darkblue">
                  {surat.received_by_name || surat.received_by}
                </p>
                {surat.received_by_email && (
                  <p className="text-xs text-gray-500 mt-1">
                    {surat.received_by_email}
                  </p>
                )}
                {surat.received_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTanggal(surat.received_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-xs font-medium text-darkblue mb-2 flex items-center gap-1">
              <Clock size={12} className="text-primary" />
              Timeline
            </h4>
            <div className="space-y-2">
              {surat.approved_at && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle size={12} className="text-blue-600" />
                  <span className="text-gray-600">Approved:</span>
                  <span className="text-darkblue">
                    {formatTanggal(surat.approved_at)}
                  </span>
                </div>
              )}
              {surat.completed_at && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span className="text-gray-600">Completed:</span>
                  <span className="text-darkblue">
                    {formatTanggal(surat.completed_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Catatan */}
          {surat.catatan && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 font-medium mb-1">
                Catatan:
              </p>
              <p className="text-sm text-amber-700">{surat.catatan}</p>
            </div>
          )}

          {/* Summary Group */}
          <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-primary" />
              <span className="text-sm font-medium text-darkblue">
                {totalGroups} Group
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">
                <span className="font-medium text-darkblue">{totalRoll}</span>{" "}
                roll
              </span>
              <span className="text-xs text-gray-600">
                <span className="font-medium text-primary">
                  {format2(totalBerat)}
                </span>{" "}
                kg
              </span>
            </div>
          </div>

          {/* Daftar Roll per Group */}
          <div className="space-y-3">
            {groupList.map((group, index) => (
              <ProductCategoryGroup
                key={`${group.productName}-${group.kategori}-${index}`}
                productName={group.productName}
                kategori={group.kategori}
                items={group.items}
                onViewRoll={onViewRoll}
                harga={
                  hargaPerProduk[`${group.productName}||${group.kategori}`]
                }
                onChangeHarga={(val) =>
                  setHargaPerProduk((prev) => ({
                    ...prev,
                    [`${group.productName}||${group.kategori}`]: val,
                  }))
                }
                defaultExpanded={groupList.length === 1}
              />
            ))}
          </div>

          {/* Metadata */}
          {surat.metadata && Object.keys(surat.metadata).length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-xs font-medium text-darkblue mb-2">
                Metadata
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(surat.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-500">{key}:</span>
                    <span className="ml-1 text-darkblue">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Immutable Badge */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
            <Package size={16} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">
                View-only & Immutable
              </p>
              <p className="text-xs text-amber-600">
                Data surat jalan bersifat immutable dan tidak dapat diubah.
                Semua aktivitas tercatat di stockLedger.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={handleSaveHargaBeli}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Simpan Harga Beli
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
