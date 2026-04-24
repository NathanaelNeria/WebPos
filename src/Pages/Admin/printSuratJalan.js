// export const printSuratJalan = ({ sjId, supplier, gudangNama, items }) => {
//   const w = window.open("", "_blank");
//   if (!w) return;

//   w.document.write(`
//     <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; font-size: 12px; }
//           h2 { margin-bottom: 4px; }
//           .meta { margin-bottom: 10px; }
//           table {
//             border-collapse: collapse;
//             width: 100%;
//           }
//           th, td {
//             border: 1px solid #000;
//             padding: 6px;
//             vertical-align: top;
//           }
//           th {
//             background: #f2f2f2;
//           }
//           .berat-list {
//             line-height: 1.6;
//             word-break: break-word;
//           }
//           .footer {
//             margin-top: 40px;
//           }
//         </style>
//       </head>

//       <body onload="window.print()">
//         <h2>SURAT JALAN</h2>

//         <div class="meta">
//           <div><strong>No:</strong> ${sjId}</div>
//           <div><strong>Supplier:</strong> ${supplier}</div>
//           <div><strong>Gudang Tujuan:</strong> ${gudangNama}</div>
//         </div>

//         <table>
//           <thead>
//             <tr>
//               <th style="width:40px">No</th>
//               <th>Nama Barang</th>
//               <th>Berat per Roll (KG)</th>
//               <th style="width:80px">Qty</th>
//               <th style="width:90px">Total (KG)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${items
//               .map(
//                 (item, idx) => `
//               <tr>
//                 <td align="center">${idx + 1}</td>
//                 <td>${item.produkNama}</td>
//                 <td class="berat-list">
//                   ${item.beratList.join(" · ")}
//                 </td>
//                 <td align="center">${item.qty} Roll</td>
//                 <td align="right">${item.totalBerat.toFixed(2)}</td>
//               </tr>
//             `,
//               )
//               .join("")}
//           </tbody>
//         </table>

//         <div class="footer">
//           <div>Admin Gudang:</div>
//           <br/><br/>
//           ________________________
//         </div>
//       </body>
//     </html>
//   `);

//   w.document.close();
// };

export const printSuratJalan = (data) => {
  // Tentukan template berdasarkan tipe atau struktur data
  const isMutasi =
    data.tipe === "MUTASI" ||
    data.hasOwnProperty("fromGudangId") ||
    data.hasOwnProperty("fromGudang");

  const w = window.open("", "_blank");
  if (!w) return;

  // Helper untuk format date
  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString("id-ID");
    if (date.toDate) date = date.toDate();
    return new Date(date).toLocaleDateString("id-ID");
  };

  // Fungsi untuk format item berdasarkan tipe
  const formatItems = (items) => {
    if (!items || items.length === 0) {
      return '<tr><td colspan="5" align="center">Tidak ada data</td></tr>';
    }

    if (isMutasi) {
      // Format untuk mutasi
      return items
        .map(
          (item, idx) => `
          <tr>
            <td align="center">${idx + 1}</td>
            <td>${item.rollId || "-"}</td>
            <td>${item.namaProduk || item.produkNama || "-"}</td>
            <td align="right">${item.berat ? item.berat.toFixed(2) : item.beratAwal ? item.beratAwal.toFixed(2) : "0.00"}</td>
            <td>${item.kategori || "-"}</td>
          </tr>
        `,
        )
        .join("");
    } else {
      // Format untuk barang masuk
      return items
        .map((item, idx) => {
          // Pastikan beratList adalah array
          const beratList = Array.isArray(item.beratList) ? item.beratList : [];
          return `
            <tr>
              <td align="center">${idx + 1}</td>
              <td>${item.produkNama || "-"}</td>
              <td class="berat-list">
                ${beratList.join(" · ")}
              </td>
              <td align="center">${item.qty || 0} Roll</td>
              <td align="right">${item.totalBerat ? item.totalBerat.toFixed(2) : "0.00"}</td>
            </tr>
          `;
        })
        .join("");
    }
  };

  // Hitung total
  const calculateTotals = (items) => {
    if (!items || items.length === 0) return { totalQty: 0, totalBerat: 0 };

    if (isMutasi) {
      const totalQty = items.length;
      const totalBerat = items.reduce(
        (sum, item) => sum + (item.berat || item.beratAwal || 0),
        0,
      );
      return { totalQty, totalBerat };
    } else {
      const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
      const totalBerat = items.reduce(
        (sum, item) => sum + (item.totalBerat || 0),
        0,
      );
      return { totalQty, totalBerat };
    }
  };

  // Ekstrak data berdasarkan tipe
  let items, sjNumber, tanggal, fromInfo, toInfo, additionalInfo;

  if (isMutasi) {
    // Data mutasi
    items = data.rollDetails || data.items || [];
    sjNumber = data.sjId || data.noSuratJalan || `MUT-${Date.now()}`;
    tanggal = formatDate(data.tanggal || data.createdAt || new Date());

    // Info gudang asal
    if (data.fromGudang) {
      fromInfo = {
        title: "GUDANG ASAL",
        name: data.fromGudang.nama || data.fromGudangId,
        detail: data.fromGudang.alamat || "",
      };
    } else if (data.fromGudangId) {
      fromInfo = {
        title: "GUDANG ASAL",
        name: data.fromGudangId,
        detail: "",
      };
    }

    // Info gudang tujuan
    if (data.toGudang) {
      toInfo = {
        title: "GUDANG TUJUAN",
        name: data.toGudang.nama || data.toGudangId,
        detail: data.toGudang.alamat || "",
      };
    } else if (data.toGudangId) {
      toInfo = {
        title: "GUDANG TUJUAN",
        name: data.toGudangId,
        detail: "",
      };
    } else if (data.gudangNama) {
      toInfo = {
        title: "GUDANG TUJUAN",
        name: data.gudangNama,
        detail: "",
      };
    }

    // Info tambahan untuk mutasi
    additionalInfo = `
      <div class="info-row">
        <strong>Dibuat Oleh:</strong> ${data.createdByName || data.pengirim?.nama || "-"}
      </div>
      ${data.createdByEmail ? `<div class="info-row"><strong>Email:</strong> ${data.createdByEmail}</div>` : ""}
      <div class="info-row">
        <strong>Status:</strong> 
        <span style="color: ${
          data.status === "PENDING"
            ? "#e67e22"
            : data.status === "COMPLETED"
              ? "#27ae60"
              : data.status === "CANCELLED"
                ? "#e74c3c"
                : "#3498db"
        };
                     font-weight: bold;">
          ${data.status || "PENDING"}
        </span>
      </div>
    `;
  } else {
    // Data barang masuk
    items = data.items || [];
    sjNumber = data.sjId || `SJ-${Date.now()}`;
    tanggal = formatDate(data.tanggal || new Date());

    fromInfo = {
      title: "SUPPLIER",
      name: data.supplier || "-",
      detail: "",
    };

    toInfo = {
      title: "GUDANG TUJUAN",
      name: data.gudangNama || "-",
      detail: "",
    };

    additionalInfo = `
      <div class="info-row">
        <strong>Dicetak pada:</strong> ${new Date().toLocaleString("id-ID")}
      </div>
    `;
  }

  const totals = calculateTotals(items);
  const printDate = new Date().toLocaleString("id-ID");

  w.document.write(`
    <html>
      <head>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 11px;
              line-height: 1.4;
            }
            
            .no-print { display: none !important; }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px;
            margin: 0;
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          
          .document-title {
            font-size: 16px;
            margin: 5px 0;
            text-transform: uppercase;
          }
          
          .sj-info {
            font-size: 12px;
            margin-bottom: 10px;
          }
          
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
          }
          
          .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 3px;
            background: #f9f9f9;
          }
          
          .info-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 12px;
          }
          
          .info-detail {
            font-size: 13px;
            font-weight: bold;
          }
          
          .info-alamat {
            font-size: 10px;
            color: #666;
            margin-top: 3px;
          }
          
          .info-row {
            margin: 3px 0;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 5px;
            vertical-align: top;
          }
          
          th {
            background: #f2f2f2;
            font-weight: bold;
            font-size: 11px;
          }
          
          .berat-list {
            line-height: 1.5;
            word-break: break-word;
            font-size: 10px;
          }
          
          .totals {
            margin-top: 15px;
            text-align: right;
            font-weight: bold;
            font-size: 12px;
            padding: 8px;
            background: #f0f0f0;
            border-radius: 3px;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 40px;
            text-align: center;
          }
          
          .signature-box {
            padding-top: 40px;
            position: relative;
          }
          
          .signature-line {
            position: absolute;
            top: 0;
            left: 15%;
            right: 15%;
            height: 1px;
            background: #000;
          }
          
          .signature-name {
            font-weight: bold;
            margin-top: 5px;
            font-size: 12px;
          }
          
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }
          
          .print-btn {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 15px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            z-index: 1000;
            font-size: 12px;
          }
          
          .print-btn:hover {
            background: #0056b3;
          }
        </style>
      </head>

      <body>
        <button class="print-btn no-print" onclick="window.print()">🖨️ Cetak</button>
        
        <div class="header">
          <div class="company-name">PT. SINAR ABADI TEXTILE</div>
          <div class="document-title">SURAT JALAN ${isMutasi ? "MUTASI GUDANG" : "BARANG MASUK"}</div>
          <div class="sj-info">
            <div><strong>No:</strong> ${sjNumber}</div>
            <div><strong>Tanggal:</strong> ${tanggal}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="info-title">${fromInfo.title}</div>
            <div class="info-detail">${fromInfo.name}</div>
            ${fromInfo.detail ? `<div class="info-alamat">${fromInfo.detail}</div>` : ""}
          </div>
          
          <div class="info-box">
            <div class="info-title">${toInfo.title}</div>
            <div class="info-detail">${toInfo.name}</div>
            ${toInfo.detail ? `<div class="info-alamat">${toInfo.detail}</div>` : ""}
          </div>
        </div>

        <div style="margin: 10px 0;">
          ${additionalInfo}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px">No</th>
              ${
                isMutasi
                  ? `
                <th>Kode Roll</th>
                <th>Nama Barang</th>
                <th style="width:70px">Berat (KG)</th>
                <th style="width:80px">Kategori</th>
              `
                  : `
                <th>Nama Barang</th>
                <th>Berat per Roll (KG)</th>
                <th style="width:60px">Qty</th>
                <th style="width:70px">Total (KG)</th>
              `
              }
            </tr>
          </thead>
          <tbody>
            ${formatItems(items)}
          </tbody>
        </table>

        <div class="totals">
          ${
            isMutasi
              ? `
            <div>Total Roll: <strong>${totals.totalQty}</strong></div>
            <div>Total Berat: <strong>${totals.totalBerat.toFixed(2)} KG</strong></div>
          `
              : `
            <div>Total Roll: <strong>${totals.totalQty} Roll</strong></div>
            <div>Total Berat: <strong>${totals.totalBerat.toFixed(2)} KG</strong></div>
          `
          }
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">PENERIMA</div>
            <div style="font-size: 9px; margin-top: 2px;">Nama & Tanda Tangan</div>
          </div>
          
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">PENGIRIM</div>
            <div style="font-size: 9px; margin-top: 2px;">Nama & Tanda Tangan</div>
          </div>
          
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">ADMIN GUDANG</div>
            <div style="font-size: 9px; margin-top: 2px;">Nama & Tanda Tangan</div>
          </div>
        </div>

        <div class="footer">
          <div>${isMutasi ? "Dokumen Mutasi Gudang" : "Dokumen Barang Masuk"} • Dicetak: ${printDate}</div>
          <div style="margin-top: 3px;">PT. SINAR ABADI TEXTILE • Jl. Industri Raya No. 123, Jakarta • Telp: (021) 1234-5678</div>
        </div>

        <script>
          // Auto print setelah 500ms
          setTimeout(function() {
            window.print();
            
            // Auto close setelah 5 detik
            setTimeout(function() {
              if (!window.closed) {
                window.close();
              }
            }, 5000);
          }, 500);
          
          // Close dengan ESC
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              window.close();
            }
          });
        </script>
      </body>
    </html>
  `);

  w.document.close();
};

// Untuk backward compatibility dengan kode lama
export const printSuratJalanBarangMasuk = ({
  sjId,
  supplier,
  gudangNama,
  items,
}) => {
  return printSuratJalan({
    tipe: "BARANG_MASUK",
    sjId,
    supplier,
    gudangNama,
    items,
  });
};

// Fungsi khusus untuk mutasi
export const printSuratJalanMutasi = (printData) => {
  return printSuratJalan({
    tipe: "MUTASI",
    ...printData,
  });
};
