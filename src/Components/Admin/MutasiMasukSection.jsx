import React, { useState } from "react";
import {
  Package,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  Scale,
  Calendar,
  User,
  Printer,
} from "lucide-react";
import Swal from "sweetalert2";

export default function MutasiMasukSection({
  mutasiMasuk = [],
  onTerimaMutasi,
  onBatalkanMutasi,
  onPrintSuratJalan,
  loading = false,
  gudangId,
  currentUser = {},
}) {
  const [detailView, setDetailView] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const handleTerima = async (mutasi) => {
    const confirmed = await Swal.fire({
      title: "Terima Barang?",
      html: `
        <div class="text-left">
          <p><strong>${mutasi.totalRoll} roll</strong> dari ${mutasi.fromGudangId}</p>
          <p class="text-sm">Total berat: ${(mutasi.totalBerat || 0).toFixed(2)} kg</p>
          <p class="text-xs text-gray-600 mt-2">
            Pastikan barang fisik sudah sampai di gudang
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Terima Barang",
      cancelButtonText: "Periksa Kembali",
    });

    if (confirmed.isConfirmed) {
      try {
        await onTerimaMutasi(mutasi.id || mutasi.sjId);
      } catch (error) {
        console.error("❌ Error receiving mutasi:", error);
      }
    }
  };

  const handleBatalkan = async (mutasi, e) => {
    e.stopPropagation();

    const { isConfirmed } = await Swal.fire({
      title: "Batalkan Mutasi?",
      text: "Hanya pembuat mutasi yang bisa membatalkan",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tidak",
    });

    if (isConfirmed) {
      try {
        await onBatalkanMutasi(mutasi.id || mutasi.sjId);
      } catch (error) {
        console.error("❌ Error cancelling mutasi:", error);
      }
    }
  };

  const handlePrint = async (mutasi) => {
    if (onPrintSuratJalan) {
      await onPrintSuratJalan(mutasi.sjId || mutasi.id);
    } else {
      Swal.fire("Info", "Fungsi print belum tersedia", "info");
    }
  };

  const showDetail = (mutasi) => {
    setDetailView(mutasi);
  };

  const closeDetail = () => {
    setDetailView(null);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-green-600" />
              Terima Barang dari Gudang Lain
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Barang yang sedang dalam perjalanan ke gudang Anda
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Menunggu: <span className="font-bold">{mutasiMasuk.length}</span>
          </div>
        </div>

        {/* MUTASI LIST */}
        {mutasiMasuk.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium">Tidak ada mutasi masuk</p>
            <p className="text-sm">
              Semua barang sudah diterima atau belum ada pengiriman
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mutasiMasuk.map((mutasi) => (
              <div
                key={mutasi.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock size={16} className="text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                          MENUNGGU PENERIMAAN
                        </span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        SJ:{" "}
                        {mutasi.sjId?.substring(0, 8) ||
                          mutasi.id?.substring(0, 8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600">Dari Gudang</div>
                        <div className="font-bold">{mutasi.fromGudangId}</div>
                        <div className="text-xs text-gray-500">
                          <Calendar size={12} className="inline mr-1" />
                          {formatDate(mutasi.createdAt)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">
                          Informasi Roll
                        </div>
                        <div className="font-bold text-lg">
                          {mutasi.totalRoll}
                        </div>
                        <div className="text-sm text-gray-500">roll</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Total Berat</div>
                        <div className="font-bold text-lg">
                          {(mutasi.totalBerat || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">kg</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">
                          Dikirim Oleh
                        </div>
                        <div className="font-medium">
                          {mutasi.createdByName || mutasi.createdBy}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => showDetail(mutasi)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                      <Eye size={14} />
                      Detail
                    </button>
                    <button
                      onClick={() => handlePrint(mutasi)}
                      className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                    >
                      <Printer size={14} />
                      Print
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Pastikan barang sudah sampai sebelum menerima
                  </div>

                  <div className="flex gap-2">
                    {mutasi.createdBy === currentUser?.uid && (
                      <button
                        onClick={(e) => handleBatalkan(mutasi, e)}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                      >
                        Batalkan
                      </button>
                    )}

                    <button
                      onClick={() => handleTerima(mutasi)}
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Terima
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INFO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>Petunjuk:</strong> Klik "Terima" setelah memastikan barang
            fisik sudah sampai di gudang Anda dan kondisi barang sesuai.
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Detail Mutasi Masuk</h3>
                  <p className="text-green-100">
                    Surat Jalan: {detailView.sjId || detailView.id}
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  className="text-white hover:text-green-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Dari Gudang</div>
                  <div className="font-bold text-lg">
                    {detailView.fromGudangId}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Tanggal Kirim</div>
                  <div className="font-bold text-lg">
                    {formatDate(detailView.createdAt)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">
                    {detailView.totalRoll}
                  </div>
                  <div className="text-sm text-blue-700">Total Roll</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">
                    {(detailView.totalBerat || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-green-700">Total Berat (kg)</div>
                </div>
              </div>

              {detailView.rollDetails && detailView.rollDetails.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Detail Roll</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3">No</th>
                          <th className="p-3">Kode Roll</th>
                          <th className="p-3">Produk</th>
                          <th className="p-3">Berat (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailView.rollDetails.map((roll, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-3 text-center">{idx + 1}</td>
                            <td className="p-3 font-mono">{roll.rollId}</td>
                            <td className="p-3">{roll.namaProduk}</td>
                            <td className="p-3 text-right">
                              {roll.berat?.toFixed(2) ||
                                roll.beratAwal?.toFixed(2) ||
                                "0.00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => handlePrint(detailView)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print Surat Jalan
                </button>
                <button
                  onClick={closeDetail}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleTerima(detailView);
                    closeDetail();
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Terima Barang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
