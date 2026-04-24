import { useEffect, useState, useMemo, Fragment } from "react";
import ReactPaginate from "react-paginate";
import { Dialog, Transition } from "@headlessui/react";
import { db } from "../../Services/firebase";
import { updateDoc, collection, doc } from "firebase/firestore";

// status berubah hanya jika vinna checklist
const TabelTransaksiKasir = ({ invoiceData, loading }) => {
  const [data, setData] = useState(invoiceData || []);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const openModal = (row) => {
    setSelectedRow(row);
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    setData(invoiceData || []);
  }, [invoiceData]);

  useEffect(() => {
    setCurrentPage(0);
  }, [invoiceData]);

  const currentItems = useMemo(() => {
    const offset = currentPage * itemsPerPage;
    return (invoiceData || []).slice(offset, offset + itemsPerPage);
  }, [invoiceData, currentPage]);

  const pageCount = Math.ceil((invoiceData || []).length / itemsPerPage);

  const handlePageClick = ({ selected }) => setCurrentPage(selected);

  const getBadgeColor = (type, value) => {
    if (type === "metode") {
      switch (value) {
        case "Cash":
          return "bg-red-100 text-red-600";
        case "Transfer":
          return "bg-blue-100 text-blue-600";
        case "Tempo":
          return "bg-yellow-100 text-yellow-700";
        default:
          return "bg-gray-100 text-gray-600";
      }
    } else if (type === "status") {
      switch (value) {
        case "Lunas":
          return "bg-green-100 text-green-700";
        case "Pending":
          return "bg-yellow-100 text-yellow-700";
        default:
          return "bg-gray-100 text-gray-600";
      }
    }
  };

  const handleCheckboxChange = async (id, role, value) => {
    const ref = doc(db, "transaksi", id);

    const updatedData = data.map((item) =>
      item.id === id
        ? { ...item, approved: { ...item.approved, [role]: value } }
        : item
    );
    setData(updatedData);

    //status lunas hanya jika approved Vinna true
    switch (role) {
      case "Vinna":
        if (!value) {
          try {
            await updateDoc(ref, {
              [`approved.${role}`]: value,
              status: "Pending",
            });
            console.log(`Approved ${role}: ${value}`);
          } catch (err) {
            console.error("🔥 Error updating approval:", err);
          }
        } else {
          try {
            await updateDoc(ref, {
              [`approved.${role}`]: value,
              status: "Lunas",
            });
            console.log(`Approved ${role}: ${value}`);
          } catch (err) {
            console.error("🔥 Error updating approval:", err);
          }
        }
        break;

      case "Ari":
        try {
          await updateDoc(ref, {
            [`approved.${role}`]: value,
          });
          console.log(`Approved ${role}: ${value}`);
        } catch (err) {
          console.error("🔥 Error updating approval:", err);
        }
        break;

      default:
        return null;
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
            <th className="px-4 py-3 whitespace-nowrap">Gudang</th>
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
                  {row.tanggal}
                </td>
                <td className="px-4 py-2">{row.invoice}</td>
                <td className="px-4 py-2">{row.pembeli}</td>
                <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                  {row.total}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(
                      "metode",
                      row.metode
                    )}`}
                  >
                    {row.metode}
                  </span>
                </td>
                <td className="px-4 py-2">{row.sales}</td>
                <td className="px-4 py-2">{row.gudang}</td>
              </tr>
            ))
          ) : (
            <td
              colSpan={9}
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
                      <strong>Tanggal:</strong> {selectedRow.tanggal}
                    </p>
                    <p>
                      <strong>No. Invoice:</strong> {selectedRow.invoice}
                    </p>
                    <p>
                      <strong>Pembeli:</strong> {selectedRow.pembeli}
                    </p>
                    <p>
                      <strong>Total:</strong> {selectedRow.total}
                    </p>
                    <p>
                      <strong>Metode:</strong> {selectedRow.metode}
                    </p>
                    <p>
                      <strong>Sales:</strong> {selectedRow.sales}
                    </p>
                    {selectedRow.gudang && (
                      <p>
                        <strong>Gudang:</strong> {selectedRow.gudang}
                      </p>
                    )}
                    {selectedRow &&
                    selectedRow.detail &&
                    selectedRow.detail.length > 0 ? (
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
                                Jumlah / Berat
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Total Berat
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Harga Satuan
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Total Item
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRow.detail.map((d, idx) => {
                              const isRol = d.jumlahRol !== undefined;
                              const isEcer = d.beratEcer !== undefined;

                              const tipe = isRol
                                ? "Rol"
                                : isEcer
                                ? "Ecer"
                                : "-";
                              const jumlah = isRol
                                ? d.jumlahRol
                                : isEcer
                                ? d.beratEcer
                                : "-";
                              const harga = isRol
                                ? d.hargaRol
                                : isEcer
                                ? d.hargaEcer
                                : 0;
                              const totalItem = jumlah * harga;
                              const totalBerat = isRol
                                ? d.beratPerRol?.reduce(
                                    (sum, b) => sum + b,
                                    0
                                  ) ?? 0
                                : d.beratEcer ?? 0;

                              return (
                                <Fragment key={idx}>
                                  <tr className="hover:bg-gray-50 align-top">
                                    <td className="border px-2 py-1">
                                      {d.item}
                                    </td>
                                    <td className="border px-2 py-1 text-center">
                                      {tipe}
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      {jumlah}{" "}
                                      {isRol ? "Rol" : isEcer ? "Kg" : ""}
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      {totalBerat.toFixed(2)} kg
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      Rp {harga.toLocaleString()}
                                    </td>
                                    <td className="border px-2 py-1 text-right font-semibold">
                                      Rp {totalItem.toLocaleString()}
                                    </td>
                                  </tr>

                                  {/* Berat per rol jika ada */}
                                  {isRol && d.beratPerRol && (
                                    <tr className="bg-gray-50 text-xs text-gray-600">
                                      <td
                                        colSpan="5"
                                        className="border px-3 py-1"
                                      >
                                        <strong>Berat per rol:</strong>{" "}
                                        {d.beratPerRol.map((b, i) => (
                                          <span key={i}>
                                            {b}
                                            {i < d.beratPerRol.length - 1
                                              ? ", "
                                              : ""}{" "}
                                          </span>
                                        ))}{" "}
                                        kg
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>

                          {/* Total keseluruhan */}
                          <tfoot>
                            <tr className="bg-blue-50 font-semibold">
                              <td
                                colSpan="3"
                                className="border px-3 py-2 text-right"
                              >
                                Total Berat Keseluruhan
                              </td>
                              <td className="border px-3 py-2 text-right text-blue-700">
                                {selectedRow.detail
                                  .reduce((sum, d) => {
                                    if (d.beratPerRol)
                                      return (
                                        sum +
                                        d.beratPerRol.reduce((a, b) => a + b, 0)
                                      );
                                    if (d.beratEcer) return sum + d.beratEcer;
                                    return sum;
                                  }, 0)
                                  .toFixed(2)}{" "}
                                kg
                              </td>
                              <td className="border px-3 py-2 text-right">
                                Total Harga
                              </td>
                              <td className="border px-3 py-2 text-right text-blue-700">
                                {selectedRow.total}
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

export default TabelTransaksiKasir;
