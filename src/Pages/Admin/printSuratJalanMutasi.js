// src/Pages/Admin/printSuratJalanMutasi.js

/**
 * Format tanggal ke format Indonesia
 * @param {Date|string} date - Tanggal yang akan diformat
 * @returns {string} Tanggal dalam format DD/MM/YYYY, HH.MM.SS
 */
const formatTanggalIndonesia = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
};

/**
 * Print Surat Jalan Mutasi
 * @param {Object} data - Data untuk surat jalan
 * @param {string} data.sjId - ID Surat Jalan
 * @param {string} data.gudangAsal - Nama gudang asal
 * @param {string} data.gudangTujuan - Nama gudang tujuan
 * @param {string} data.tanggal - Tanggal surat jalan
 * @param {number} data.totalRolls - Jumlah roll
 * @param {string} data.totalBerat - Total berat dalam kg (sudah diformat)
 * @param {Array} data.items - Daftar items
 * @param {string} data.catatan - Catatan tambahan (opsional)
 * @param {string} data.adminPengirim - Nama admin pengirim
 * @param {string} data.userRole - Role user
 * @param {string} data.userEmail - Email user
 */
export const printSuratJalanMutasi = (data) => {
  // Validasi data
  if (!data) {
    console.error("Data tidak boleh kosong");
    return;
  }

  // Buka window baru untuk print
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocker terdeteksi. Mohon izinkan popup untuk mencetak.");
    return;
  }

  // Styles untuk surat jalan
  const styles = `
    <style>
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
        font-family: 'Courier New', Courier, monospace;
      }
      
      body {  
        background: #f0f0f0; 
        display: flex;
        justify-content: center;
      }
      
      .surat-jalan { 
        width: 100%;
        margin: 0 auto; 
        border: 2px solid #000; 
        padding: 0.2in; 
        background: white;
      }
      
      .header { 
        text-align: center; 
        border-bottom: 3px double #000; 
        padding-bottom: 15px; 
        margin-bottom: 20px; 
      }
      
      .header h1 { 
        font-size: 28px; 
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 5px;
      }
      
      .header h2 {
        font-size: 18px;
        color: #000000;
        margin-bottom: 10px;
      }
      
      .header .no-surat {
        font-size: 16px;
        font-family: monospace;
        padding: 5px 15px;
        display: inline-block;
        border-radius: 20px;
        margin-top: 5px;
      }
      
      .info-grid { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 15px; 
        margin-bottom: 25px; 
        padding: 15px;
        border-radius: 8px;
      }
      
      .info-item { 
        padding: 8px; 
      }
      
      .info-item .label { 
        font-weight: bold; 
        color: #000000; 
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-item .value { 
        font-size: 16px; 
        margin-top: 4px;
        font-weight: 500;
      }
      
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0; 
      }
      
      th { 
        color: black; 
        padding: 12px 8px; 
        text-align: left; 
        font-size: 13px;
        text-transform: uppercase;
      }
      
      td { 
        padding: 10px 8px; 
        border: 1px solid; 
        font-size: 13px;
      }
      
      tr:nth-child(even) {
        background: #f9f9f9;
      }
      
      .total { 
        text-align: right; 
        font-weight: bold; 
        font-size: 18px;
        margin: 20px 0;
        padding: 10px;
        border-radius: 5px;
      }
      
      .footer { 
        margin-top: 50px; 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 20px; 
        text-align: center; 
      }
      
      .signature { 
        margin-top: 30px; 
      }
      
      .signature-line { 
        border-top: 1px solid #000000; 
        width: 180px; 
        margin: 5px auto 0; 
        padding-top: 8px;
        font-size: 12px;
      }
      
      .note { 
        padding: 12px; 
        margin: 15px 0; 
        font-style: italic;
        border-radius: 4px;
      }
      
      .footer-note {
        margin-top: 30px;
        font-size: 11px;
        text-align: center;
        color: #000000;
        border-top: 1px solid #000000;
        padding-top: 15px;
      }
      
      .watermark {
        opacity: 0.1;
        font-size: 60px;
        position: absolute;
        transform: rotate(-45deg);
        pointer-events: none;
      }
      
      @media print { 
        body { 
          padding: 0; 
          background: white;
        }
        .surat-jalan {
          box-shadow: none;
          border: 2px solid #000;
        }
        .no-print { 
          display: none; 
        }
      }
    </style>
  `;

  // Build table rows
  const tableRows = data.items
    .map((item, index) => {
      // Format roll ID untuk tampilan yang lebih rapi
      const rollId = item.rollId || "-";
      const produkNama = item.produkNama || "-";
      const kategori = item.kategori || "-";
      const berat = item.berat || "0";

      return `
      <tr>
        <td style="text-align: center; width: 40px;"><strong>${index + 1}</strong></td>
        <td style="font-family: monospace;"><strong>${rollId}</strong></td>
        <td><strong>${produkNama}</strong></td>
        <td><strong>${kategori}</strong></td>
        <td style="text-align: right;"><strong>${berat}</strong></td>
      </tr>
    `;
    })
    .join("");

  // Get admin name with fallback
  const adminName =
    data.adminPengirim || data.userEmail?.split("@")[0] || "System";
  const adminInfo = data.userEmail
    ? `${adminName} (${data.userEmail})`
    : adminName;

  // Get role info
  const roleInfo = data.userRole || "Admin";

  // Current timestamp
  const now = new Date();
  const waktuCetak = formatTanggalIndonesia(now);

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Surat Jalan Mutasi - ${data.sjId}</title>
      ${styles}
    </head>
    <body>
      <div class="surat-jalan">
        <!-- Kop Surat -->
        <div class="header">
          <h1><strong>SURAT JALAN MUTASI</strong></h1>
          <h2><strong>ANTAR GUDANG</strong></h2>
          <div class="no-surat"><strong>NO: ${data.sjId}</strong></div>
        </div>

        <!-- Informasi -->
        <div class="info-grid">
          <div class="info-item">
            <div class="label"><strong>Tanggal</strong></div>
            <div class="value"><strong>${data.tanggal}</strong></div>
          </div>
          <div class="info-item">
            <div class="label"><strong>Dari Gudang</strong></div>
            <div class="value"><strong>${data.gudangAsal}</strong></div>
          </div>
          <div class="info-item">
            <div class="label"><strong>Ke Gudang</strong></div>
            <div class="value"><strong>${data.gudangTujuan}</strong></div>
          </div>
          <div class="info-item">
            <div class="label"><strong>Admin Pengirim</strong></div>
            <div class="value"><strong>${adminInfo}</strong></div>
          </div>
          <div class="info-item">
            <div class="label"><strong>Role</strong></div>
            <div class="value"><strong>${roleInfo}</strong></div>
          </div>
          <div class="info-item">
            <div class="label"><strong>Total Roll</strong></div>
            <div class="value"><strong>${data.totalRolls} Roll</strong></div>
          </div>
        </div>

        <!-- Tabel Detail -->
        <table>
          <thead>
            <tr>
              <th style="width: 40px;"><strong>No</strong></th>
              <th><strong>Roll ID / Barcode</strong></th>
              <th><strong>Produk</strong></th>
              <th><strong>Kategori</strong></th>
              <th style="text-align: right;"><strong>Berat (kg)</strong></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Total -->
        <div class="total">
          Total: <strong>${data.totalRolls} Roll</strong> | <strong>${data.totalBerat} Kg</strong>
        </div>
        
        <!-- Catatan jika ada -->
        ${
          data.catatan
            ? `
          <div class="note">
            <strong>Catatan: ${data.catatan}</strong>
          </div>
        `
            : ""
        }

        <!-- Tanda Tangan -->
        <div class="footer">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">Pengirim</div>
            <div class="signature">
              <div style="height: 50px;"></div>
              <div class="signature-line"><strong>${data.gudangAsal}</strong></div>
            </div>
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">Penerima</div>
            <div class="signature">
              <div style="height: 50px;"></div>
              <div class="signature-line"><strong>${data.gudangTujuan}</strong></div>
            </div>
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">Mengetahui</div>
            <div class="signature">
              <div style="height: 50px;"></div>
              <div class="signature-line"><strong>(Admin)</strong></div>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div class="footer-note">
          <p><strong>Dokumen ini digenerate secara otomatis oleh Sistem Manajemen Stok Kain</strong></p>
          <p><strong>ID Transaksi: ${data.sjId} | Waktu Cetak: ${waktuCetak}</strong></p>
          <p style="margin-top: 5px; font-weight: bold; color: #000000;">
            <strong>Admin: ${adminName}</strong>
          </p>
          <p style="margin-top: 5px; font-size: 10px; color: #000000;">
            <strong>Dokumen ini sah dan tidak dapat diubah setelah dicetak</strong>
          </p>
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
        // Auto print setelah 0.5 detik
        setTimeout(() => {
          window.print();
        }, 500);
      </script>
    </body>
    </html>
  `;

  // Write content to new window
  printWindow.document.write(content);
  printWindow.document.close();
};

// Export juga sebagai default untuk fleksibilitas
export default printSuratJalanMutasi;
