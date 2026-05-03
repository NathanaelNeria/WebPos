export const printNotaPenjualanRangkap = (data) => {
  if (!data) {
    console.error("Data transaksi tidak tersedia untuk dicetak.");
    return;
  }

  console.log(data);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocker aktif");
    return;
  }

  const formatRupiah = (n) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);
  };

  const formatTanggalIndonesia = (value) => {
    if (!value) return "-";

    let d;

    // ✅ Firestore Timestamp (PLAIN OBJECT)
    if (typeof value === "object" && typeof value.seconds === "number") {
      d = new Date(value.seconds * 1000);
    }
    // ✅ Date atau ISO string
    else {
      d = new Date(value);
    }

    if (isNaN(d.getTime())) return "-";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const getShortId = (item) => {
    const raw = item.barcode || item.rollId || "-";
    return raw.toString().slice(-4);
  };

  // 🔥 SPLIT ARRAY MAX 5
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const groupItemsForPrint = (items) => {
    const groups = {};

    items.forEach((item) => {
      const kategori = item.kategori || "LAINNYA";
      const key = `${kategori}_${item.produkNama}_${item.harga_per_kg}`;

      if (!groups[key]) {
        groups[key] = {
          kategori,
          produkNama: item.produkNama || "Unknown",
          harga: item.harga_per_kg || 0,
          qty: 0,
          totalBerat: 0,
          ids: [],
          beratList: [],
          tipe: item.tipe,
        };
      }

      const berat =
        item.tipe === "ROL" ? item.berat || 0 : item.berat_jual || 0;

      groups[key].qty += 1;
      groups[key].totalBerat += berat;

      groups[key].ids.push(getShortId(item));
      groups[key].beratList.push(berat.toFixed(2));
    });

    // ✅ SORT BERDASARKAN KATEGORI AGAR RAPI
    return Object.values(groups).sort((a, b) =>
      a.kategori.localeCompare(b.kategori),
    );
  };

  const grouped = groupItemsForPrint(data.items);

  const styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Courier New', monospace;
      }

      .header {
        text-align: center;
        border-bottom: 3px double #000;
        padding-bottom: 6px;
        margin-bottom: 8px;
      }
      
      .header h1 { 
        font-size: 28px; 
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 4px;
        margin-top: 0;
      }
      
      .header h2 {
        font-size: 18px;
        color: #000000;
        margin: 2px 0;
      }

      body {
        margin: 0;
        padding: 0;
      }

      .nota {
        width: 8in;
        margin: 0 auto;
        padding: 0.2in 0.3in 0.3in 0.3in;
        padding-bottom: 0.5in;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        table-layout: fixed;
      }

      th, td {
        padding: 6px 4px;
        vertical-align: top;
      }

      th {
        border-bottom: 1px solid #000;
        text-align: left;
      }

      .right {
        text-align: right;
      }

      .id-row {
        font-size: 11px;
        line-height: 1.4;
      }

    /* ===============================
   🛡️ MITIGASI PAGE BREAK PRINT
   =============================== */

      /* Jangan pecah baris tabel */
      tr {
        page-break-inside: avoid;
      }

      /* Footer wrapper:
        - berisi: subtotal + total + tanda tangan
        - default: ikut halaman yang sama
      */
      .footer-wrapper {
        page-break-inside: avoid;
      }

      /* Jika DIBUTUHKAN pindah halaman,
        class ini akan ditambahkan via JS */
      .footer-wrapper.force-break {
        page-break-before: always;
      }

      /* TTD tidak boleh terpotong */
      .signature-block {
        page-break-inside: avoid;
      }


      @media print {
        body { 
          padding: 0; 
          margin: 0;
          background: white;
        }

        .no-print { 
          display: none; 
        }  
        @page {
          size: 8.5in 11in;
          margin: 0.25in;
        }
      }
    </style>
  `;

  let currentKategori = null;

  const tableRows = grouped
    .map((g, i) => {
      const subtotal = g.totalBerat * g.harga;

      const idChunks = chunkArray(g.ids, 5);
      const idHtml = idChunks.map((chunk) => chunk.join("; ")).join("<br/>");

      // ✅ HEADER KATEGORI (HANYA MUNCUL SEKALI)
      let kategoriRow = "";
      if (g.kategori !== currentKategori) {
        kategoriRow = `
        <tr>
          <td colspan="6" style="
            font-weight:bold;
            padding-top:10px;
            padding-bottom:5px;
          ">
            Kategori : ${String(g.kategori).toUpperCase()}
          </td>
        </tr>
      `;
        currentKategori = g.kategori;
      }

      return `
      ${kategoriRow}
      <tr>
        <td><strong>${i + 1}</strong></td>
        <td>
          <strong>${g.produkNama.toUpperCase()}</strong><br/>
          <span style="font-size:14px">
            <strong>${g.beratList.join(" ")}</strong>
          </span>
        </td>
        <td class="id-row">
          <strong>${idHtml}</strong>
        </td>
        <td>
          <strong>${g.tipe === "ROL" ? g.qty + " Roll" : "Ecer"}</strong><br/>
          <strong>${g.totalBerat.toFixed(2)} Kg</strong>
        </td>
        <td><strong>${formatRupiah(g.harga)}</strong></td>
        <td><strong>${formatRupiah(subtotal)}</strong></td>
      </tr>
    `;
    })
    .join("");

  const subtotal = Number(data.subtotal) || 0;
  const ongkir = Number(data.ongkir) || 0;
  const potongan = Number(data.potongan) || 0;

  const totalFinal = subtotal + ongkir - potongan;

  const calcRollEcer = (items) => {
    let rollQty = 0;
    let rollKg = 0;
    let ecerQty = 0;
    let ecerKg = 0;

    items.forEach((item) => {
      if (item.tipe === "ROL") {
        rollQty += 1;
        rollKg += Number(item.berat || 0);
      } else {
        // ECER
        ecerQty += 1;
        ecerKg += Number(item.berat_jual || item.berat || 0);
      }
    });

    return {
      rollQty,
      rollKg,
      ecerQty,
      ecerKg,
    };
  };

  const { rollQty, rollKg, ecerQty, ecerKg } = calcRollEcer(data.items);

  const content = `
    <html>
    <head>
      <title>Nota Penjualan</title>
      ${styles}
    </head>
    <body>
      <div class="nota">

        <div class="header">
            <h1 style="text-align:center;"><strong>NOTA PENJUALAN</strong></h1>
            <h2 style="text-align:center;"><strong>Fajar Terang</strong></h2>
            <h2 style="text-align:center;"><strong>Ruko Auri, Jl. Anggrek IV Blok AA No.17</strong></h2>
            <h2 style="text-align:center;"><strong>Telp: 0811-239-191 / 0899-9522-200</strong></h2>

            <div style="display:flex; justify-content:space-between; margin:10px 0; font-size:14px;">
            <div><strong>No: ${data.nomorNota}</strong></div>
            <div><strong>Tanggal: ${formatTanggalIndonesia(data.tanggal)}</strong></div>
            </div>

            <div style="display:flex; justify-content:flex-start; margin:10px 0; font-size:14px;">
            <strong>Kepada:</strong><br/>
            <strong>${data.customer.nama.toUpperCase() || "-"}</strong>
            </div>
        </div>
        <table>
          <thead>
            <tr>
              <th><strong>No</strong></th>
              <th><strong>Barang</strong></th>
              <th><strong>ID</strong></th>
              <th><strong>Qty</strong></th>
              <th><strong>Harga</strong></th>
              <th><strong>Total</strong></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        
      <div class="footer-wrapper">
        <div style="margin-top:15px; display:flex; justify-content:flex-end;">
          <table style="font-size:14px; min-width:250px;">

          <tr>
              
              <td ><strong>
              Total Roll: ${rollQty} (${rollKg.toFixed(2)} Kg) <br/>
              Total Ecer: ${ecerQty} (${ecerKg.toFixed(2)} Kg)
              </strong></td>
            </tr>
            <tr>
              <td><strong>Subtotal</strong></td>
              <td style="text-align:right;"><strong>${formatRupiah(subtotal)}</strong></td>
            </tr>

            ${
              ongkir > 0
                ? `
              <tr>
                <td><strong>Ongkir</strong></td>
                <td style="text-align:right;"><strong>${formatRupiah(ongkir)}</strong></td>
              </tr>
              `
                : ""
            }

            ${
              potongan > 0
                ? `
              <tr>
                <td><strong>Potongan</strong></td>
                <td style="text-align:right;"><strong>-${formatRupiah(potongan)}</strong></td>
              </tr>
              `
                : ""
            }

            <tr>
              <td colspan="2"><hr /></td>
            </tr>

            <tr>
              <td><strong>Total</strong></td>
              <td style="text-align:right;"><strong>${formatRupiah(totalFinal)}</strong></td>
            </tr>
          </table>
        </div>
      </div>

      <div class="signature-block" style="margin-top:12px; display:flex; justify-content:space-between; gap:40px;">
      <!-- Penjual -->
      <div style="text-align:center; width:40%;">
        <strong>Penjual</strong>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #000; margin-top:6px;"></div>
        <div style="margin-top:4px;">
          <strong>${data.kasir.toUpperCase()}</strong>
        </div>
      </div>

      <!-- Pembeli -->
      <div style="text-align:center; width:40%;">
        <strong>Pembeli</strong>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #000; margin-top:6px;"></div>
        <div style="margin-top:4px;">
          <strong>${data.customer.nama.toUpperCase() || "__________________"}</strong>
        </div>
      </div>
    </div>

      </div>

      <!-- Tombol Print (hidden saat print) -->
      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="
          padding: 12px 40px; 
          background: #4CAF50; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          font-size: 16px; 
          font-weight: bold;
          cursor: pointer;
          margin-right: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">
          🖨️ Print
        </button>
        <button onclick="window.close()" style="
          padding: 12px 40px; 
          background: #f44336; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          font-size: 16px; 
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">
          ✖ Tutup
        </button>
      </div>

      <script>
          setTimeout(() => {
            window.print();
          }, 300);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};

export default printNotaPenjualanRangkap;
