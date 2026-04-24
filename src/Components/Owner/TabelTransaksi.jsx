import { useEffect, useState, useMemo, Fragment } from "react";
import ReactPaginate from "react-paginate";
import { Dialog, Transition } from "@headlessui/react";
import UpdateItemFirestore from "../../Utils/updateItemFirestore";
import { db } from "../../Services/firebase";
import { updateDoc, collection, doc, getDoc } from "firebase/firestore";
import { formatCurrency } from "../../Utils/formatCurrency";
import { formatWeight } from "../../Utils/formatters";
import { STATUS_OWNER } from "../../Services/kasirService";
import { useAuth } from "../../Hooks/useAuth";
import Swal from "sweetalert2";

// status berubah hanya jika vinna checklist
const TabelTransaksi = ({ page, invoiceData, loading }) => {
  const [pageNota, setPageNota] = useState(false);
  const [data, setData] = useState(invoiceData || []);
  const [currentPage, setCurrentPage] = useState(0);
  const [beratPerRol, setBeratPerRol] = useState({});
  const [hargaProduk, setHargaProduk] = useState({});
  const [ongkir, setOngkir] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [potongan, setPotongan] = useState(0);

  const itemsPerPage = 5;
  const { user } = useAuth();

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const openModal = (row) => {
    setSelectedRow(row);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setBeratPerRol([]);
  };

  useEffect(() => {
    setPageNota(page === "Nota");
  }, [page]);

  useEffect(() => {
    setData(invoiceData || []);
  }, [invoiceData]);

  useEffect(() => {
    if (selectedRow?.metode_pembayaran) {
      setMetodePembayaran(selectedRow.metode_pembayaran);
    }
  }, [selectedRow]);

  useEffect(() => {
    const maxPage = Math.ceil(invoiceData.length / itemsPerPage) - 1;

    if (currentPage > maxPage) {
      setCurrentPage(0);
    }
  }, [invoiceData, currentPage]);

  useEffect(() => {
    if (!selectedRow?.items) return;

    const fetchRolls = async () => {
      const result = {};

      const rollIds = selectedRow.items.flatMap((item) =>
        item.tipe === "roll_utuh" ? item.rollIds || [] : [],
      );

      await Promise.all(
        rollIds.map(async (rollId) => {
          const ref = doc(db, "stockRolls", rollId);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            result[rollId] = snap.data().beratKg;
          }
        }),
      );

      setBeratPerRol(result);
    };

    fetchRolls();
  }, [selectedRow]);

  const currentItems = useMemo(() => {
    const offset = currentPage * itemsPerPage;
    return (invoiceData || []).slice(offset, offset + itemsPerPage);
  }, [invoiceData, currentPage]);

  const pageCount = Math.ceil((invoiceData || []).length / itemsPerPage);

  const handlePageClick = ({ selected }) => setCurrentPage(selected);

  const getBadgeColor = (type, value) => {
    if (type === "status") {
      switch (value) {
        case "APPROVED":
          return "bg-green-100 text-green-700";

        case "PENDING":
          return "bg-yellow-100 text-yellow-700";

        case "LUNAS":
          return "bg-green-100 text-green-700";

        default:
          return "bg-gray-100 text-gray-600";
      }
    }

    if (type === "metode") {
      switch (value) {
        case "TUNAI":
          return "bg-red-100 text-red-600";
        case "TRANSFER":
          return "bg-blue-100 text-blue-600";
        case "TEMPO":
          return "bg-yellow-100 text-yellow-700";
        default:
          return "bg-gray-100 text-gray-600";
      }
    }
  };

  const handleCheckboxChange = async (row, role, value) => {
    const ref = doc(db, "transaksiPenjualan", row.id);

    //false-false PENDING
    //false-true APPROVED
    //true-false APPROVED (tapi bisa diubah lagi jadi PENDING)
    //true-true COMPLETED (final, tidak bisa diubah lagi)

    try {
      const updatedApproved = {
        ...row.approved,
        [role]: value,
      };

      const { Vinna = false, Ari = false } = updatedApproved;

      let newStatus;

      if (Vinna && Ari) {
        newStatus = STATUS_OWNER.LUNAS;
      } else if (Vinna || Ari) {
        newStatus = STATUS_OWNER.LUNAS;
      } else {
        newStatus = STATUS_OWNER.PENDING;
      }

      await updateDoc(ref, {
        approved: updatedApproved,
        status_owner: newStatus,
      });
    } catch (err) {
      console.error("🔥 Error updating approval:", err);
    }
  };

  const groupedItems = useMemo(() => {
    if (!selectedRow?.items) return null;

    return selectedRow.items.reduce((acc, item) => {
      const kategori = item.kategori || "TANPA KATEGORI";
      const produkNama = item.produkNama || "UNKNOWN";
      const tipe = item.tipe; // ✅ ROL / ECER

      // LEVEL 1: KATEGORI
      if (!acc[kategori]) {
        acc[kategori] = { kategori, produk: {} };
      }

      // LEVEL 2: PRODUK
      if (!acc[kategori].produk[produkNama]) {
        acc[kategori].produk[produkNama] = {
          produkNama,
          tipe: {},
        };
      }

      // LEVEL 3: TIPE (ROL / ECER)
      if (!acc[kategori].produk[produkNama].tipe[tipe]) {
        acc[kategori].produk[produkNama].tipe[tipe] = {
          tipe,
          hargaPerKg: Number(item.harga_per_kg || 0),
          totalBerat: 0,
          items: [],
        };
      }

      const berat =
        tipe === "ROL" ? Number(item.berat || 0) : Number(item.berat_jual || 0);

      acc[kategori].produk[produkNama].tipe[tipe].totalBerat += berat;
      acc[kategori].produk[produkNama].tipe[tipe].items.push({
        rollId: item.rollId || "-",
        berat,
        tipe,
      });

      return acc;
    }, {});
  }, [selectedRow]);

  useEffect(() => {
    if (!groupedItems) return;

    const initialHarga = {};
    Object.values(groupedItems).forEach((kat) => {
      Object.values(kat.produk).forEach((prod) => {
        Object.values(prod.tipe).forEach((t) => {
          const key = `${kat.kategori}__${prod.produkNama}__${t.tipe}`;
          initialHarga[key] = t.hargaPerKg;
        });
      });
    });

    setHargaProduk(initialHarga);
  }, [groupedItems]);

  useEffect(() => {
    if (selectedRow?.ongkir !== undefined) {
      setOngkir(Number(selectedRow.ongkir));
    } else {
      setOngkir(0);
    }
  }, [selectedRow]);

  useEffect(() => {
    if (selectedRow?.potongan !== undefined) {
      setPotongan(Number(selectedRow.potongan));
    } else {
      setPotongan(0);
    }
  }, [selectedRow]);

  const handleHargaChange = (produkNama, value) => {
    const harga = Number(value) || 0;
    setHargaProduk((prev) => ({
      ...prev,
      [produkNama]: harga,
    }));
  };

  const handleSaveHarga = async () => {
    if (!selectedRow) return;

    Swal.fire({
      title: "Menyimpan...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const updatedItems = selectedRow.items.map((item) => {
        const kategori = item.kategori || "TANPA KATEGORI";
        const key = `${kategori}__${item.produkNama}__${item.tipe}`;
        const hargaBaru = hargaProduk.hasOwnProperty(key)
          ? hargaProduk[key]
          : item.harga_per_kg;

        const berat =
          item.tipe === "ROL"
            ? Number(item.berat || 0)
            : Number(item.berat_jual || 0);

        return {
          ...item,
          harga_per_kg: hargaBaru,
          subtotal: berat * hargaBaru,
        };
      });

      const totalHargaBarang = updatedItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0,
      );

      const totalHargaBaru =
        totalHargaBarang + Number(ongkir || 0) - Number(potongan || 0);

      const ref = doc(db, "transaksiPenjualan", selectedRow.id);

      await updateDoc(ref, {
        items: updatedItems,
        ongkir: Number(ongkir || 0),
        potongan: Number(potongan || 0),
        metode_pembayaran: metodePembayaran,
        total_harga: totalHargaBaru,
        jumlah_dibayar: totalHargaBaru,
      });

      // update state lokal
      setSelectedRow((prev) => ({
        ...prev,
        items: updatedItems,
        ongkir: Number(ongkir || 0),
        potongan: Number(potongan || 0),
        metode_pembayaran: metodePembayaran,
        total_harga: totalHargaBaru,
      }));

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Harga dan ongkir berhasil disimpan",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Gagal simpan data:", error);

      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat menyimpan ongkir",
      });
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-md p-4 mt-4">
      <table className="min-w-full text-sm text-left border-collapse">
        <thead>
          <tr
            className="text-white"
            style={{
              background: "linear-gradient(90deg, #000B42 0%, #142370 90%)",
            }}
          >
            <th className="px-4 py-3 rounded-tl-xl whitespace-nowrap">
              Tanggal
            </th>
            <th className="px-4 py-3 whitespace-nowrap">No. Invoice</th>
            <th className="px-4 py-3 whitespace-nowrap">Pembeli</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">Total</th>
            <th className="px-4 py-3 whitespace-nowrap">Metode</th>
            <th className="px-4 py-3 whitespace-nowrap">Nama Sales</th>
            {pageNota && (
              <th className="px-4 py-3 whitespace-nowrap">Gudang</th>
            )}
            <th className="px-4 py-3 whitespace-nowrap">Status</th>
            {pageNota && (
              <th className="px-4 py-3 rounded-tr-xl whitespace-nowrap">
                Approved By
              </th>
            )}
          </tr>
        </thead>

        <tbody className="bg-blue-50">
          {loading ? (
            <p className="text-gray-400 text-center col-span-5 italic">
              Memuat data transaksi...
            </p>
          ) : currentItems.length > 0 ? (
            currentItems.map((row, i) => (
              <tr
                key={i}
                className="border-t border-blue-100 hover:bg-blue-100 cursor-pointer transition"
                onClick={() => openModal(row)}
              >
                <td className="px-4 py-2 text-blue-700 font-semibold">
                  {row.tanggal_transaksi
                    ? row.tanggal_transaksi.toDate().toLocaleDateString("id-ID")
                    : "-"}
                </td>

                <td className="px-4 py-2">{row.nomor_nota || "-"}</td>

                <td className="px-4 py-2">{row.customer?.nama || "-"}</td>

                <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                  {formatCurrency(row.total_harga)}
                </td>

                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(
                      "metode",
                      row.metode_pembayaran,
                    )}`}
                  >
                    {row.metode_pembayaran || "-"}
                  </span>
                </td>

                <td className="px-4 py-2">{row.kasir_nama || "-"}</td>

                {pageNota && (
                  <td className="px-4 py-2">{row.gudang_nama || "-"}</td>
                )}

                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(
                      "status",
                      row.status_owner,
                    )}`}
                  >
                    {row.status_owner || "-"}
                  </span>
                </td>

                {pageNota && (
                  <td
                    className="px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={row.approved?.Vinna || false}
                          disabled={
                            user.nama !== "Vinna" && user.nama !== "vinna"
                          }
                          onChange={(e) =>
                            handleCheckboxChange(row, "Vinna", e.target.checked)
                          }
                          className="accent-blue-600"
                        />
                        <span>Vinna</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={row.approved?.Ari || false}
                          disabled={user.nama !== "Ari" && user.nama !== "ari"}
                          onChange={(e) =>
                            handleCheckboxChange(row, "Ari", e.target.checked)
                          }
                          className="accent-green-600"
                        />
                        <span>Ari</span>
                      </label>
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <td
              colSpan={pageNota ? 9 : 8}
              className="text-center px-3 py-8 text-gray-500 w-full"
            >
              No data available
            </td>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <ReactPaginate
          previousLabel={"← Prev"}
          nextLabel={"Next →"}
          breakLabel={"..."}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={2}
          onPageChange={handlePageClick}
          containerClassName="pagination flex gap-2 cursor-pointer"
          pageClassName="border border-gray-300 rounded-md"
          pageLinkClassName="block px-3 py-1 w-full h-full text-center"
          activeClassName="bg-blue-600 text-white border-blue-600"
          previousClassName="border border-gray-300 rounded-md"
          previousLinkClassName="block px-3 py-1 w-full h-full text-center"
          nextClassName="border border-gray-300 rounded-md"
          nextLinkClassName="block px-3 py-1 w-full h-full text-center"
          disabledClassName="opacity-50 cursor-not-allowed"
          renderOnZeroPageCount={null}
        />
      </div>

      {/* MODAL SECTION */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          {/* Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-[90vw] max-w-4xl bg-white rounded-xl p-6 shadow-xl overflow-y-auto max-h-[85vh] transition-all">
                <Dialog.Title className="text-lg font-bold text-blue-900 mb-4">
                  Detail Invoice
                </Dialog.Title>

                {selectedRow && (
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>Tanggal:</strong>{" "}
                      {selectedRow.tanggal_transaksi
                        ? selectedRow.tanggal_transaksi
                            .toDate()
                            .toLocaleString("id-ID")
                        : "-"}
                    </p>
                    <p>
                      <strong>No. Invoice:</strong> {selectedRow.nomor_nota}
                    </p>
                    <p>
                      <strong>Pembeli:</strong> {selectedRow.customer?.nama}
                    </p>
                    <p>
                      <strong>Total:</strong>{" "}
                      {formatCurrency(selectedRow.total_harga || 0)}
                    </p>

                    <p className="flex items-center gap-2">
                      <strong>Metode:</strong>

                      <select
                        value={metodePembayaran}
                        onChange={(e) => setMetodePembayaran(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="CASH">CASH</option>
                        <option value="TRANSFER">TRANSFER</option>
                        <option value="CARD">CARD</option>
                        <option value="TEMPO">TEMPO</option>
                      </select>
                    </p>

                    <p>
                      <strong>Sales:</strong> {selectedRow.kasir_nama}
                    </p>
                    <p>
                      <strong>Gudang:</strong> {selectedRow.gudang_nama}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedRow.status_owner}
                    </p>
                    {selectedRow &&
                    selectedRow.items &&
                    selectedRow.items.length > 0 ? (
                      <div className="overflow-x-auto mt-4">
                        <h3 className="font-semibold text-blue-800 mb-2">
                          Detail Transaksi:
                        </h3>

                        <table className="w-full border border-gray-300 text-sm rounded-md overflow-hidden">
                          <thead className="bg-blue-50 text-blue-800">
                            <tr>
                              <th className="border px-2 py-1 text-left">
                                Item
                              </th>
                              <th className="border px-2 py-1 text-center">
                                Tipe
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Jumlah Rol
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Total Berat
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Harga per Kg
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Total Harga
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedItems &&
                              Object.values(groupedItems).map((kat, kIdx) => (
                                <Fragment key={kIdx}>
                                  {/* ================= HEADER KATEGORI ================= */}
                                  <tr className="bg-blue-100 font-bold text-blue-900">
                                    <td
                                      colSpan={6}
                                      className="border px-3 py-2"
                                    >
                                      {kat.kategori}
                                    </td>
                                  </tr>

                                  {/* ================= PRODUK DALAM KATEGORI ================= */}
                                  {Object.values(kat.produk).map(
                                    (prod, pIdx) => (
                                      <Fragment key={pIdx}>
                                        {/* HEADER PRODUK */}
                                        <tr className="bg-blue-50 font-semibold">
                                          <td
                                            colSpan={6}
                                            className="border px-3 py-2"
                                          >
                                            └ {prod.produkNama}
                                          </td>
                                        </tr>

                                        {/* ================= SUMMARY PER TIPE (ROL / ECER) ================= */}
                                        {Object.values(prod.tipe).map(
                                          (t, tIdx) => {
                                            const hargaKey = `${kat.kategori}__${prod.produkNama}__${t.tipe}`;
                                            return (
                                              <Fragment key={tIdx}>
                                                <tr className="bg-indigo-50 font-semibold">
                                                  <td className="border px-6 py-2">
                                                    └─{" "}
                                                    {t.tipe === "ROL"
                                                      ? "ROL"
                                                      : "ECER"}
                                                  </td>
                                                  <td className="border px-3 py-2 text-center">
                                                    {t.tipe}
                                                  </td>
                                                  <td className="border px-3 py-2 text-center">
                                                    {t.items.length}
                                                  </td>
                                                  <td className="border px-3 py-2 text-right">
                                                    {formatWeight(t.totalBerat)}
                                                  </td>
                                                  <td className="border px-3 py-2 text-right">
                                                    <input
                                                      type="number"
                                                      className="w-28 border rounded px-2 py-1 text-right"
                                                      value={
                                                        hargaProduk[hargaKey] ??
                                                        0
                                                      }
                                                      onChange={(e) =>
                                                        handleHargaChange(
                                                          hargaKey,
                                                          e.target.value,
                                                        )
                                                      }
                                                    />
                                                  </td>
                                                  <td className="border px-3 py-2 text-right text-blue-700">
                                                    {formatCurrency(
                                                      t.totalBerat *
                                                        (hargaProduk[
                                                          hargaKey
                                                        ] ?? 0),
                                                    )}
                                                  </td>
                                                </tr>

                                                {/* ================= DETAIL ROLL / ECER ================= */}
                                                {t.items.map((it, iIdx) => (
                                                  <tr
                                                    key={iIdx}
                                                    className="bg-gray-50 text-sm text-gray-600"
                                                  >
                                                    <td className="border px-10 py-2">
                                                      └─ {it.rollId || "-"}
                                                    </td>
                                                    <td className="border px-3 py-2 text-center">
                                                      {it.tipe}
                                                    </td>
                                                    <td className="border px-3 py-2"></td>
                                                    <td className="border px-3 py-2 text-right">
                                                      {formatWeight(it.berat)}
                                                    </td>
                                                    <td className="border px-3 py-2"></td>
                                                    <td className="border px-3 py-2"></td>
                                                  </tr>
                                                ))}
                                              </Fragment>
                                            );
                                          },
                                        )}
                                      </Fragment>
                                    ),
                                  )}
                                </Fragment>
                              ))}
                          </tbody>

                          {/* Total keseluruhan */}
                          <tfoot>
                            <tr className="bg-yellow-50 font-semibold">
                              <td
                                colSpan="5"
                                className="border px-3 py-2 text-right"
                              >
                                Ongkir
                              </td>
                              <td className="border px-3 py-2 text-right">
                                <input
                                  type="number"
                                  className="w-32 border rounded px-2 py-1 text-right"
                                  value={ongkir}
                                  min="0"
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setOngkir(value < 0 ? 0 : value);
                                  }}
                                />
                              </td>
                            </tr>

                            {/* ✅ POTONGAN */}
                            <tr className="bg-red-50 font-semibold">
                              <td
                                colSpan="5"
                                className="border px-3 py-2 text-right"
                              >
                                Potongan
                              </td>
                              <td className="border px-3 py-2 text-right">
                                <input
                                  type="number"
                                  className="w-32 border rounded px-2 py-1 text-right text-red-600"
                                  min="0"
                                  value={potongan}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setPotongan(value < 0 ? 0 : value);
                                  }}
                                />
                              </td>
                            </tr>

                            <tr className="bg-blue-50 font-semibold">
                              <td
                                colSpan="3"
                                className="border px-3 py-2 text-right"
                              >
                                Total Berat Keseluruhan
                              </td>
                              <td className="border px-3 py-2 text-right text-blue-700">
                                {formatWeight(selectedRow.total_berat || 0)}
                              </td>
                              <td className="border px-3 py-2 text-right">
                                Total Harga
                              </td>
                              <td className="border px-3 py-2 text-right text-blue-700">
                                {formatCurrency(selectedRow.total_harga || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-4 italic text-gray-500">
                        Tidak ada detail transaksi untuk invoice ini.
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveHarga}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mr-2"
                  >
                    Simpan Perubahan Harga
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Tutup
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default TabelTransaksi;
