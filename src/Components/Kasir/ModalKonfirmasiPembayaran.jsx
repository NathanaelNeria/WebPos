import React from "react";

export default function ModalKonfirmasiPembayaran({
  keranjang,
  totalHarga,
  tipeNota,
  setTipeNota,
  namaPembeli,
  setNamaPembeli,
  onClose,
  onConfirm,
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[20000]">
        <div className="bg-white w-full max-w-xl rounded-lg shadow-xl p-6 relative">
          <h2 className="text-xl font-bold text-[#000B42] mb-3">
            Konfirmasi Pembayaran
          </h2>

          {/* === Nama Pembeli === */}
          <label className="text-sm font-medium">Nama Pembeli</label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 mt-1 mb-4"
            placeholder="Opsional"
            value={namaPembeli}
            onChange={(e) => setNamaPembeli(e.target.value)}
          />

          {/* === Pilihan Nota === */}
          <label className="text-sm font-medium">Pilih Tipe Nota</label>
          <div className="flex gap-4 mt-1 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={tipeNota === "thermal"}
                onChange={() => setTipeNota("thermal")}
              />
              Thermal 80mm
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={tipeNota === "continuous"}
                onChange={() => setTipeNota("continuous")}
              />
              Continuous 9.5"
            </label>
          </div>

          {/* === Detail Order === */}
          <div className="max-h-[30vh] overflow-y-auto border rounded-md p-3 mb-4">
            {keranjang.map((item) => {
              const isRol = item.satuan === "rol";

              return (
                <div key={item.cartId} className="mb-3 border-b pb-2">
                  <p className="font-semibold">{item.nama}</p>

                  {isRol ? (
                    <p className="text-sm text-gray-500">
                      {item.qty} Rol | {item.totalBerat?.toFixed(2)} kg
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {item.beratEcer} kg (Ecer)
                    </p>
                  )}

                  <p className="text-sm">
                    Harga: Rp {item.hargaDipakai?.toLocaleString("id-ID")}
                  </p>

                  <p className="font-bold text-[#000B42]">
                    Total: Rp {item.totalHarga?.toLocaleString("id-ID")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* === Total Besar === */}
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total Belanja</span>
            <span>Rp {totalHarga.toLocaleString("id-ID")}</span>
          </div>

          {/* === Tombol Aksi === */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-[#000B42] text-white rounded-md hover:bg-[#001063]"
            >
              Konfirmasi & Bayar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
