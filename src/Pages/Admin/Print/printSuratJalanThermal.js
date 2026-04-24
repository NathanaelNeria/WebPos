// src/Pages/Owner/printSuratJalanMutasiThermal.js

/**
 * Print Surat Jalan Mutasi untuk printer thermal 72mm
 * Format: KATEGORI > NAMA PRODUK [JUMLAH] (rata kanan) > ROLLID
 */
const printSuratJalanThermal = ({
  sjId,
  gudangAsal,
  gudangTujuan,
  via,
  totalRolls,
  totalBerat,
  items,
  catatan,
  adminPengirim,
  userRole,
  mode = "INTERNAL",
  customerNama,
}) => {
  // Validasi input
  if (!sjId) {
    console.error("❌ sjId wajib diisi");
    return;
  }

  // Format tanggal
  const tglSekarang = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Cek apakah di React Native WebView
  if (window.ReactNativeWebView?.postMessage) {
    const payload = {
      type: "PRINT_SURAT_JALAN_THERMAL",
      data: {
        sjId,
        gudangAsal,
        gudangTujuan,
        tanggal: tglSekarang,
        totalRolls,
        totalBerat,
        mode,
        customerNama,

        // ✅ KIRIM BERAT PER ROLL KE RN
        items: items.map((item) => ({
          ...item,
          berat: Number(item.berat) || 0, // ✅ berat per roll
        })),

        catatan: catatan || "-",
        adminPengirim,
        userRole,
        via,
      },
    };

    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    return;
  }

  // Buat iframe untuk print
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  // CSS untuk thermal 72mm
  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: 72mm auto;
      margin: 3mm;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      width: 66mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 2mm 0;
      font-size: 10pt;
      line-height: 1.3;
    }
    
    .container {
      width: 100%;
    }
    
    /* Header Toko */
    .toko {
      text-align: center;
      margin-bottom: 3mm;
      padding-bottom: 2mm;
      border-bottom: 1px dashed #000;
    }
    
    .nama-toko {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .alamat-toko {
      font-size: 8pt;
      white-space: pre-line;
      color: #333;
    }
    
    .telp-toko {
      font-size: 8pt;
      margin-top: 1mm;
    }
    
    /* Header Surat Jalan */
    .header-sj {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin: 2mm 0;
      padding: 1mm 0;
      border-bottom: 1px solid #000;
    }
    
    /* Info Pengiriman */
    .info-pengiriman {
      margin: 2mm 0;
      padding: 1mm 0;
      font-size: 9pt;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 1mm;
    }
    
    .info-label {
      width: 35mm;
      font-weight: bold;
    }
    
    .info-value {
      flex: 1;
    }
    
    /* Daftar Items */
    .items-container {
      margin: 3mm 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 2mm 0;
    }
    
    .kategori {
      font-weight: bold;
      margin: 2mm 0 1mm 0;
      font-size: 11pt;
    }
    
    .produk-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-left: 2mm;
      margin-bottom: 1mm;
    }
    
    .nama-produk {
      font-weight: bold;
      font-size: 10pt;
    }
    
    .jumlah-produk {
      font-weight: bold;
      font-size: 10pt;
      text-align: right;
    }
    
    .roll-list {
      margin-left: 4mm;
      margin-bottom: 2mm;
    }
    
    .roll-id {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      margin-bottom: 0.5mm;
    }
    
    /* Total */
    .total-section {
      margin: 2mm 0;
      padding: 1mm 0;
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 12pt;
      border-bottom: 1px solid #000;
    }
    
    /* Footer */
    .footer {
      margin-top: 3mm;
      font-size: 8pt;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 2mm;
    }
    
    .pengirim {
      margin-top: 3mm;
      text-align: right;
      font-size: 9pt;
    }
    
    /* Catatan */
    .catatan {
      margin: 2mm 0;
      padding: 1mm;
      font-size: 8pt;
      border: 1px dashed #999;
    }
  `;

  // Group items: KATEGORI > PRODUK > ROLLS
  // Group items: KATEGORI > PRODUK > ROLL + BERAT
  const groupedData = {};
  let calculatedTotalBerat = 0;

  items.forEach((item) => {
    const kategori = item.kategori || "TANPA KATEGORI";
    const produkNama = item.produkNama || "PRODUK";
    const berat = Number(item.berat) || 0;

    calculatedTotalBerat += berat;

    if (!groupedData[kategori]) {
      groupedData[kategori] = {};
    }

    if (!groupedData[kategori][produkNama]) {
      groupedData[kategori][produkNama] = [];
    }

    groupedData[kategori][produkNama].push({
      rollId: item.rollId,
      berat,
    });
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Surat Jalan - ${sjId}</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="container">
        <!-- NAMA TOKO & ALAMAT -->
        <div class="toko">
          <div class="nama-toko">FAJAR TERANG</div>
          <div class="alamat-toko">Ruko Auri, Jl. Anggrek IV No.17 Blok AA</div>
          <div class="alamat-toko">Kampung Bali, Tanah Abang</div>
          <div class="alamat-toko">Jakarta Pusat 10250</div>
          <div class="telp-toko">Telp: 0811-239-191/0899-9522-200</div>
        </div>

        <!-- HEADER SURAT JALAN -->
        <div class="header-sj">
          ${mode === "CUSTOMER" ? "SURAT JALAN" : "SURAT JALAN MUTASI"}
        </div>

        <!-- INFORMASI PENGIRIMAN -->
        <div class="info-pengiriman">
          <div class="info-row">
            <span class="info-label">No. Surat Jalan:</span>
            <span class="info-value">${sjId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal:</span>
            <span class="info-value">${tglSekarang}</span>
          </div>
          ${
            mode === "CUSTOMER"
              ? `
              <div class="info-row">
                <span class="info-label">Customer:</span>
                <span class="info-value">${customerNama.toUpperCase() || "-"}</span>
              </div>
            `
              : `
              <div class="info-row">
                <span class="info-label">Dari Gudang:</span>
                <span class="info-value">${gudangAsal}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tujuan Gudang:</span>
                <span class="info-value">${gudangTujuan}</span>
              </div>
            `
          }
          <div class="info-row">
            <span class="info-label">Pengirim:</span>
            <span class="info-value">${adminPengirim.toUpperCase()}</span>
          </div>
        </div>

        <!-- DAFTAR ITEMS - DENGAN JUMLAH PER PRODUK -->
        <div class="items-container">
          ${Object.entries(groupedData)
            .map(
              ([kategori, produkMap]) => `
            <div class="kategori">${kategori.toUpperCase()}</div>
            ${Object.entries(produkMap)
              .map(
                ([produkNama, rollIds]) => `
              <div>
                <div class="produk-row">
                  <span class="nama-produk">${produkNama.toUpperCase()}</span>
                  <span class="jumlah-produk">${rollIds.length}</span>
                </div>
                <div class="roll-list">
                  ${rollIds
                    .map(
                      (r) => `
                        <div class="roll-id">
                          ${r.rollId.toUpperCase()}
                          <span style="float:right;">${r.berat.toFixed(2)} KG</span>
                        </div>
                      `,
                    )
                    .join("")}
                </div>
              </div>
            `,
              )
              .join("")}
          `,
            )
            .join("")}
        </div>

        <!-- TOTAL ROL -->
        <div class="total-section">
          <span>TOTAL ROLL</span>
          <span>${totalRolls}</span>
        </div>

        <div class="total-section">
          <span>TOTAL BERAT</span>
          <span>${calculatedTotalBerat.toFixed(2)} KG</span>
        </div>

        <!-- CATATAN (opsional) -->
        ${
          catatan && catatan !== "-"
            ? `
          <div class="catatan">
            <strong>Catatan:</strong> ${catatan}
          </div>
        `
            : ""
        }

        <!-- PENGIRIM -->
        <div class="pengirim">
          <div>Pengirim,</div>
          <div style="margin-top: 5mm;">( ${adminPengirim.toUpperCase()} )</div>
        </div>

        <!-- FOOTER -->
       <div class="footer">
          <div>
            ${
              mode === "CUSTOMER"
                ? `${sjId}`
                : `${sjId} | ${gudangAsal} → ${gudangTujuan}`
            }
          </div>
          <div style="margin-top: 1mm;">Terima Kasih</div>
        </div>

      <script>
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            window.close();
          }, 500);
        }, 300);
      </script>
    </body>
    </html>
  `);
  doc.close();

  // Cleanup setelah print
  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe);
  };
};

export default printSuratJalanThermal;
