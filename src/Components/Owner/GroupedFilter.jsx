import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { printRollLabelThermal } from "../../Pages/Admin/Print/printRollLabelThermal";

export default function GroupedFilter({ page, onFilter }) {
  const [filterColumn, setFilterColumn] = useState("tanggal");
  const [filterValue, setFilterValue] = useState("");
  const [filterOptions, setFilterOptions] = useState([]);

  useEffect(() => {
    switch (page) {
      case "monitoringNota":
        setFilterOptions(filterOptionsMonitoringNota);
        break;
      case "monitoringNotaTempo":
        setFilterOptions(filterOptionsMonitoringNotaTempo);
        break;
      default:
        setFilterOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filterOptionsMonitoringNota = [
    { label: "Tanggal", value: "tanggal_transaksi" },
    { label: "No. Invoice", value: "nomor_nota" },
    { label: "Pembeli", value: "customer" },
    { label: "Metode", value: "metode_pembayaran" },
    { label: "Nama Sales", value: "kasir_nama" },
    { label: "Gudang", value: "gudang_nama" },
    { label: "Status", value: "status_owner" },
  ];

  const filterOptionsMonitoringNotaTempo = [
    { label: "Tanggal", value: "tanggal_transaksi" },
    { label: "No. Invoice", value: "nomor_nota" },
    { label: "Pembeli", value: "customer" },
    { label: "Nama Sales", value: "kasir_nama" },
    { label: "Gudang", value: "gudang_nama" },
    { label: "Status", value: "status_owner" },
  ];

  const opsiMetodePembayaran = ["CASH", "TRANSFER", "QRIS", "CARD"];

  const userOptions = [
    "Ari",
    "Vinna",
    "Wanto",
    "Doel",
    "Kurnia",
    "Rahmat",
    "Jana",
    "Yakob",
    "Egi",
    "nathan",
    "balya",
  ];
  const gudangOptions = ["CIDENG", "AA17", ""];
  const statusPengirimanOptions = ["Dikirim", "Dalam Perjalanan", "Sampai"];
  const statusNotaOptions = ["APPROVED", "PENDING", "COMPLETED"];

  const handleReset = () => {
    setFilterValue("");
    onFilter({ column: filterColumn, value: "" });
  };

  const handleChange = (value) => {
    setFilterValue(value);
    onFilter({ column: filterColumn, value });
  };

  // Tampilan input sesuai page dan kolom yang dipilih
  const renderFilterInput = () => {
    if (page === "monitoringNota") {
      //MONITORING NOTA
      switch (filterColumn) {
        case "tanggal_transaksi":
          return (
            <div className="flex items-center bg-white rounded-md overflow-hidden w-1/3">
              <input
                type="date"
                value={filterValue}
                onChange={(e) => handleChange(e.target.value)}
                className="text-black w-full px-3 py-2 outline-none"
              />
              <div className="bg-white px-3 text-gray-500">
                <CalendarDays size={18} />
              </div>
            </div>
          );

        case "nomor_nota":
          return (
            <input
              type="text"
              placeholder="Masukkan nomor invoice..."
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black w-1/3 px-3 py-2 rounded-md outline-none"
            />
          );
        case "customer":
          return (
            <input
              type="text"
              placeholder="Masukkan nama pembeli..."
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black w-1/3 px-3 py-2 rounded-md outline-none"
            />
          );

        case "metode_pembayaran":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih metode</option>
              {opsiMetodePembayaran.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
          );
        case "kasir_nama":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih sales</option>
              {userOptions.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          );
        case "gudang_nama":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih gudang</option>
              {gudangOptions.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          );
        case "status_owner":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih status</option>
              {statusNotaOptions.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          );
        default:
          return null;
      }
    } else if (page === "monitoringNotaTempo") {
      //MONITORING NOTA
      switch (filterColumn) {
        case "tanggal_transaksi":
          return (
            <div className="flex items-center bg-white rounded-md overflow-hidden w-1/3">
              <input
                type="date"
                value={filterValue}
                onChange={(e) => handleChange(e.target.value)}
                className="text-black w-full px-3 py-2 outline-none"
              />
              <div className="bg-white px-3 text-gray-500">
                <CalendarDays size={18} />
              </div>
            </div>
          );

        case "nomor_nota":
          return (
            <input
              type="text"
              placeholder="Masukkan nomor invoice..."
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black w-1/3 px-3 py-2 rounded-md outline-none"
            />
          );
        case "customer":
          return (
            <input
              type="text"
              placeholder="Masukkan nama pembeli..."
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black w-1/3 px-3 py-2 rounded-md outline-none"
            />
          );

        case "metode_pembayaran":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih metode</option>
              {opsiMetodePembayaran.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
          );
        case "kasir_nama":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih sales</option>
              {userOptions.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          );
        case "gudang_nama":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih gudang</option>
              {gudangOptions.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          );
        case "status_owner":
          return (
            <select
              value={filterValue}
              onChange={(e) => handleChange(e.target.value)}
              className="text-black px-3 py-2 rounded-md outline-none"
            >
              <option value="">Pilih status</option>
              {statusNotaOptions.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          );
        default:
          return null;
      }
    }
  };

  // const testPrint = () => {
  //   const data = {
  //     type: "PRINT_BARCODE",
  //     barcode: "HG60SP1XXXXX0106",
  //   };

  //   window.ReactNativeWebView?.postMessage(JSON.stringify(data));
  // };

  return (
    <section className="bg-[#0B2C85] text-white rounded-xl shadow-md p-6 mt-4">
      <h2 className="font-semibold mb-3">Filter</h2>

      <div className="flex items-center gap-4">
        {/* Dropdown pilih kolom */}
        {page === "aktifitasUser" ? null : (
          <select
            value={filterColumn}
            onChange={(e) => {
              setFilterColumn(e.target.value);
              setFilterValue("");
              onFilter({ column: e.target.value, value: "" });
            }}
            className="px-3 py-2 rounded-md text-black outline-none"
          >
            {filterOptions.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Input sesuai kolom */}
        {renderFilterInput()}

        {/* Reset */}
        <button
          onClick={handleReset}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-md transition"
        >
          Reset
        </button>

        {/* <button onClick={testPrint}>TEST MESSAGE</button> */}
      </div>
    </section>
  );
}
