// src/Pages/Admin/Print/printEcerLabel.js

/**
 * Print label untuk barang ecer
 * Format sederhana untuk printer thermal 72mm
 */
export const printEcerLabel = ({
  produkNama,
  kategori,
  qty,
  beratPerItem,
  totalBerat,
  catatan,
  gudangNama,
  tanggal,
}) => {
  // Buat iframe untuk print
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
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
    
    .header {
      text-align: center;
      margin-bottom: 3mm;
      padding-bottom: 2mm;
      border-bottom: 2px solid #000;
    }
    
    .title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .subtitle {
      font-size: 12pt;
      margin-bottom: 2mm;
    }
    
    .info-grid {
      margin: 3mm 0;
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
    
    .product-name {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 3mm 0;
    }
    
    .qty-info {
      font-size: 14pt;
      text-align: center;
      margin: 2mm 0;
    }
    
    .berat-info {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 3mm 0;
    }
    
    .total-berat {
      font-size: 20pt;
      font-weight: bold;
      text-align: center;
      color: #059669;
      margin: 3mm 0;
    }
    
    .catatan {
      margin: 2mm 0;
      padding: 1mm;
      font-size: 9pt;
      border: 1px dashed #999;
      background: #f9f9f9;
    }
    
    .footer {
      margin-top: 3mm;
      font-size: 8pt;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 2mm;
    }
  `;

  const tglSekarang = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Label Ecer - ${produkNama}</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="title">PT FAJAR TERANG</div>
          <div class="subtitle">LABEL BARANG ECER</div>
        </div>

        <!-- Nama Produk -->
        <div class="product-name">${produkNama}</div>
        <div style="text-align: center; font-size: 10pt; margin-bottom: 2mm;">${kategori}</div>

        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Quantity:</span>
            <span class="info-value">${qty} item</span>
          </div>
          <div class="info-row">
            <span class="info-label">Berat per Item:</span>
            <span class="info-value">${beratPerItem} kg</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gudang:</span>
            <span class="info-value">${gudangNama}</span>
          </div>
        </div>

        <!-- Total Berat -->
        <div class="total-berat">
          ${totalBerat} kg
        </div>

        <!-- Catatan -->
        ${catatan ? `
          <div class="catatan">
            <strong>Catatan:</strong> ${catatan}
          </div>
        ` : ''}

        <!-- Barcode Sederhana (untuk keperluan tracking) -->
        <div style="text-align: center; margin: 3mm 0; font-family: 'Courier New'; font-size: 14pt;">
          ${'*'.repeat(20)}
        </div>
        <div style="text-align: center; font-family: 'Courier New'; font-size: 9pt;">
          ${produkNama.replace(/[^A-Z0-9]/g, '').substring(0, 10)}-${qty}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>${tglSekarang}</div>
          <div style="margin-top: 1mm;">* Barang Ecer - Periksa sebelum diterima</div>
        </div>
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

  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe);
  };
};