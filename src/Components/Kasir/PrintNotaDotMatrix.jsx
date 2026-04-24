export default function DotMatrixNota({ data }) {
  if (!data) return null;

  return (
    <div
      id="print-area"
      className="font-mono text-[12px] text-black w-[9.2in] p-[0.3in]"
    >
      {/* HEADER */}
      <div className="table w-full">
        <div className="table-cell align-top">
          <h2 className="text-[18px] font-bold">
            <strong>Toko Fajar Terang</strong>
          </h2>
          <p>
            <strong>Jl. KH. Fachrudin No.36, Blok AA No.17</strong>
          </p>
          <p>
            <strong>Komplek Ruko Auri Tanah Abang</strong>
          </p>
          <p>
            <strong>Jakarta Pusat 10250</strong>
          </p>
          <p>
            <strong>HP: 0811 239 191</strong>
          </p>
        </div>

        <div className="table-cell align-top">
          <table className="ml-auto">
            <tbody>
              <tr>
                <td className="pr-2">
                  <strong>Kasir</strong>
                </td>
                <td>
                  <strong>: {data.kasir}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>No Invoice</strong>
                </td>
                <td>
                  <strong>: {data.invoice}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Tanggal</strong>
                </td>
                <td>
                  <strong>: {data.tanggal}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Metode</strong>
                </td>
                <td>
                  <strong>: {data.metode}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <hr className="my-3 border-black" />

      {/* TABLE BARANG */}
      <table className="w-full border-collapse border border-black">
        <thead>
          <tr>
            <th className="border border-black p-2 w-[40px]">
              <strong>No</strong>
            </th>
            <th className="border border-black p-2">
              <strong>Nama Barang</strong>
            </th>
            <th className="border border-black p-2 w-[90px]">
              <strong>Qty</strong>
            </th>
            <th className="border border-black p-2 w-[120px]">
              <strong>Harga</strong>
            </th>
            <th className="border border-black p-2 w-[140px]">
              <strong>Total</strong>
            </th>
          </tr>
        </thead>

        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td className="border border-black p-2 text-center">
                <strong>{i + 1}</strong>
              </td>

              <td className="border border-black p-2">
                <strong>{item.nama}</strong>
                {item.beratPerRol?.length > 0 && (
                  <div className="text-[11px]">
                    <strong>{item.beratPerRol.join("  ,  ")}</strong>
                  </div>
                )}
              </td>

              <td className="border border-black p-2 text-center">
                {item.satuan === "rol" ? (
                  <>
                    <strong>{item.qty} Rol</strong>
                    <div className="text-[11px]">
                      <strong>{item.totalBerat} Kg</strong>
                    </div>
                  </>
                ) : (
                  <strong>{item.beratEcer} Kg</strong>
                )}
              </td>

              <td className="border border-black p-2 text-right">
                <strong>Rp {item.hargaDipakai.toLocaleString("id-ID")}</strong>
              </td>

              <td className="border border-black p-2 text-right">
                <strong>Rp {item.totalHarga.toLocaleString("id-ID")}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <div className="mt-3 w-full">
        <table className="ml-auto border-collapse border border-black">
          <tbody>
            <tr>
              <td className="border border-black px-4 py-2 font-bold">
                <strong>Total</strong>
              </td>
              <td className="border border-black px-4 py-2 font-bold text-right">
                <strong>Rp {data.total.toLocaleString("id-ID")}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="table w-full mt-10">
        <div className="table-cell">
          <p>
            <strong>Syarat & Ketentuan</strong>
          </p>
        </div>
        <div className="table-cell text-right">
          <p>
            <strong>Hormat Kami,</strong>
          </p>
          <p className="font-bold">
            <strong>Toko Fajar Terang</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
