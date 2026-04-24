// Components/Admin/ImportExcelModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";
import { EXCEL_TEMPLATE } from "../../../Constants/barangMasukConstants";

export default function ImportExcelModal({
  isOpen,
  onClose,
  onImport,
  produkList,
}) {
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState("upload"); // upload, preview, done
  const [fileName, setFileName] = useState("");

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      EXCEL_TEMPLATE.headers,
      ...EXCEL_TEMPLATE.example,
    ]);

    // Add styling info
    ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(wb, ws, "Template Barang Masuk");
    XLSX.writeFile(wb, "template_barang_masuk.xlsx");
  };

  const parseExcelData = (rows) => {
    const headers = rows[0];
    const produkIndex = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes("produk"),
    );
    const beratIndex = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes("berat"),
    );
    const keteranganIndex = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes("keterangan"),
    );

    if (produkIndex === -1 || beratIndex === -1) {
      throw new Error(
        "Format Excel salah. Harus ada kolom 'Produk' dan 'Berat (kg)'",
      );
    }

    const importedData = [];
    const newErrors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const produkNama = row[produkIndex]?.toString().trim();
      const beratStr = row[beratIndex]?.toString().trim();
      const keterangan =
        keteranganIndex !== -1
          ? row[keteranganIndex]?.toString().trim() || ""
          : "";

      // Skip empty rows
      if (!produkNama && !beratStr) continue;

      if (!produkNama) {
        newErrors.push(`Baris ${i + 1}: Nama produk tidak boleh kosong`);
        continue;
      }

      if (!beratStr) {
        newErrors.push(`Baris ${i + 1}: Berat tidak boleh kosong`);
        continue;
      }

      // Parse berat (handle both . and , as decimal separator)
      const berat = parseFloat(beratStr.replace(",", "."));
      if (isNaN(berat) || berat <= 0) {
        newErrors.push(
          `Baris ${i + 1}: Berat harus angka positif (${beratStr})`,
        );
        continue;
      }

      if (berat > 999.99) {
        newErrors.push(`Baris ${i + 1}: Berat maksimal 999.99 kg`);
        continue;
      }

      // Find product in master
      const produk = produkList.find(
        (p) =>
          p.nama?.toLowerCase() === produkNama.toLowerCase() ||
          p.kode?.toLowerCase() === produkNama.toLowerCase(),
      );

      if (!produk) {
        newErrors.push(
          `Baris ${i + 1}: Produk "${produkNama}" tidak ditemukan di master`,
        );
        continue;
      }

      importedData.push({
        productId: produk.id,
        produkNama: produk.nama,
        produkKode: produk.kode,
        kategori: produk.kategori || "UNKNOWN",
        namaNormalized: produkNama.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        berat: berat,
        keterangan: keterangan,
        rowNumber: i + 1,
      });
    }

    return { importedData, errors: newErrors };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Remove empty rows
        const filteredRows = rows.filter(
          (row) =>
            row &&
            row.some(
              (cell) => cell !== null && cell !== undefined && cell !== "",
            ),
        );

        if (filteredRows.length < 2) {
          Swal.fire("Error", "File Excel kosong atau tidak ada data", "error");
          return;
        }

        const { importedData, errors: parseErrors } =
          parseExcelData(filteredRows);

        if (importedData.length === 0 && parseErrors.length > 0) {
          Swal.fire({
            title: "Error Validasi",
            html: `
              <div class="text-left max-h-96 overflow-auto">
                <p class="font-semibold text-red-600">${parseErrors.length} error ditemukan:</p>
                <ul class="list-disc pl-5 mt-2 text-sm">
                  ${parseErrors
                    .slice(0, 10)
                    .map((e) => `<li class="text-red-600">${e}</li>`)
                    .join("")}
                  ${parseErrors.length > 10 ? `<li class="text-gray-500">...dan ${parseErrors.length - 10} error lainnya</li>` : ""}
                </ul>
              </div>
            `,
            icon: "error",
            confirmButtonText: "OK",
          });
          return;
        }

        setData(importedData);
        setErrors(parseErrors);
        setStep("preview");
      } catch (error) {
        console.error("Error parsing Excel:", error);
        Swal.fire(
          "Error",
          "Gagal membaca file Excel. Pastikan format file benar.",
          "error",
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (data.length === 0) {
      Swal.fire("Error", "Tidak ada data untuk diimport", "error");
      return;
    }

    if (errors.length > 0) {
      Swal.fire({
        title: "Ada Error",
        html: `
          <div class="text-left max-h-96 overflow-auto">
            <p class="font-semibold text-red-600">Terdapat ${errors.length} error:</p>
            <ul class="list-disc pl-5 mt-2 text-sm">
              ${errors
                .slice(0, 10)
                .map((e) => `<li class="text-red-600">${e}</li>`)
                .join("")}
              ${errors.length > 10 ? `<li class="text-gray-500">...dan ${errors.length - 10} error lainnya</li>` : ""}
            </ul>
            <p class="mt-3 text-amber-600">Perbaiki file Excel dan upload ulang.</p>
          </div>
        `,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    onImport(data);
    setStep("done");
  };

  const resetModal = () => {
    setData([]);
    setErrors([]);
    setStep("upload");
    setFileName("");
    onClose();
  };

  if (!isOpen) return null;

  const totalBerat = data.reduce((sum, item) => sum + item.berat, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-hard max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-darkblue">Import Excel</h2>
              <p className="text-sm text-gray-500">
                {step === "upload" &&
                  "Upload file Excel dengan format yang sesuai"}
                {step === "preview" &&
                  `Preview ${data.length} data akan diimport`}
                {step === "done" && "Import berhasil!"}
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800">
                      Download Template Excel
                    </h3>
                    <p className="text-sm text-blue-600 mb-3">
                      Gunakan template ini untuk memastikan format yang benar
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition text-sm font-medium"
                    >
                      <Download size={16} />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary/50 transition group">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-primary transition" />
                <p className="text-gray-600 mb-2 font-medium">
                  Drag & drop file Excel disini, atau klik untuk memilih
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Format: .xlsx, .xls (maks 5MB)
                </p>
                {fileName && (
                  <p className="text-sm text-primary mb-2">
                    File terpilih: {fileName}
                  </p>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-midblue transition cursor-pointer font-medium"
                >
                  Pilih File Excel
                </label>
              </div>

              {/* Format Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-primary" />
                  Format Excel yang benar:
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-200">
                    <thead className="bg-gray-200">
                      <tr>
                        {EXCEL_TEMPLATE.headers.map((header, i) => (
                          <th
                            key={i}
                            className="px-4 py-2 text-left border-r last:border-r-0"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {EXCEL_TEMPLATE.example.map((row, i) => (
                        <tr key={i} className="border-t">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="px-4 py-2 border-r last:border-r-0"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Nama produk harus sesuai dengan master produk (case
                  insensitive) * Kolom keterangan opsional
                </p>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600">Data Valid</div>
                  <div className="text-2xl font-bold text-green-700">
                    {data.length}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600">Total Berat</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {totalBerat.toFixed(2)} kg
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600">Unique Produk</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {new Set(data.map((d) => d.productId)).size}
                  </div>
                </div>
              </div>

              {/* Error List */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Daftar Error ({errors.length}):
                  </h4>
                  <div className="max-h-40 overflow-auto">
                    <ul className="space-y-1">
                      {errors.map((err, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-red-600 flex items-start gap-2"
                        >
                          <span>•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Preview Data:
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-auto max-h-96">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">No</th>
                        <th className="px-4 py-2 text-left">Produk</th>
                        <th className="px-4 py-2 text-left">Kategori</th>
                        <th className="px-4 py-2 text-right">Berat (kg)</th>
                        <th className="px-4 py-2 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{idx + 1}</td>
                          <td className="px-4 py-2 font-medium">
                            {item.produkNama}
                          </td>
                          <td className="px-4 py-2">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {item.berat.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-sm truncate max-w-[200px]">
                            {item.keterangan || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-darkblue mb-2">
                Import Berhasil!
              </h3>
              <p className="text-gray-600 mb-2">
                {data.length} data roll berhasil diimport
              </p>
              <p className="text-sm text-gray-500">
                Total berat: {totalBerat.toFixed(2)} kg
              </p>
              <p className="text-sm text-gray-500">
                {new Set(data.map((d) => d.productId)).size} jenis produk
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          {step === "upload" && (
            <button
              onClick={resetModal}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => setStep("upload")}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Kembali
              </button>
              <button
                onClick={handleImport}
                disabled={data.length === 0 || errors.length > 0}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {data.length} Data
              </button>
            </>
          )}
          {step === "done" && (
            <button
              onClick={resetModal}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-midblue transition"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
