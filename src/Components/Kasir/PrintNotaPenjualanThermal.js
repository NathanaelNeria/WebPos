import printSuratJalanThermal from "../../Pages/Admin/Print/printSuratJalanThermal";

const printNotaPenjualanThermal = (data) => {
  if (!data) {
    console.error("Data transaksi tidak tersedia untuk dicetak.");
    return;
  }
  console.log("data transaksi untuk nota thermal:", data);

  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "PRINT_NOTA_PENJUALAN_THERMAL",
        data,
      }),
    );
    return;
  }

  const win = window.open("", "_blank");
  win.printSuratJalanThermal = () => {
    printSuratJalanThermal({
      sjId: data.nomorNota,
      mode: "CUSTOMER",
      customerNama: data.customer?.nama || "-",
      adminPengirim: data.kasir,
      totalRolls: data.items?.length || 0,
      subtotal: data.subtotal || 0,
      ongkir: data.ongkir || 0,
      potongan: data.potongan || 0,
      items: data.items.map((i) => ({
        rollId: i.rollId || i.barcode,
        berat: i.berat || i.berat_jual || 0,
        produkNama: i.produkNama,
        kategori: i.kategori,
      })),
    });
  };

  if (!win) {
    alert("Popup diblok oleh browser.");
    return;
  }

  const formatRupiah = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);

  const formatTanggal = (value) => {
    if (!value) return "-";

    // ✅ Firestore Timestamp
    if (typeof value.toDate === "function") {
      const d = value.toDate();
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    // ✅ ISO string / Date biasa
    const d = new Date(value);
    if (isNaN(d)) return "-";

    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getShortId = (raw) => raw.toString().slice(-4);

  // ===========================
  // 1. GROUPING PRODUK
  // ===========================
  const groupItems = (items) => {
    const groups = {};

    items.forEach((item) => {
      const kategori = item.kategori || "LAINNYA";
      const key = `${kategori}_${item.produkNama}_${item.harga_per_kg}`;

      if (!groups[key]) {
        groups[key] = {
          kategori,
          nama: item.produkNama,
          harga: item.harga_per_kg,
          tipe: item.tipe,
          totalBerat: 0,
          qty: 0,
          rolls: [], // ✅ SIMPAN DETAIL ROLL
        };
      }

      const berat =
        item.tipe === "ROL"
          ? parseFloat(item.berat || 0)
          : parseFloat(item.berat_jual || 0);

      const idRaw = item.barcode || item.rollId || "-";
      const shortId = getShortId(idRaw);

      groups[key].totalBerat += berat;
      groups[key].qty += 1;

      // ✅ simpan per roll
      groups[key].rolls.push({
        id: shortId,
        berat: berat,
      });
    });

    return Object.values(groups).sort((a, b) =>
      a.kategori.localeCompare(b.kategori),
    );
  };

  // ===========================
  // 2. CHUNK MAX 3 ID PER BARIS
  // ===========================
  const chunkIds = (ids) => {
    const chunks = [];
    for (let i = 0; i < ids.length; i += 3) {
      chunks.push(ids.slice(i, i + 3).join("; "));
    }
    return chunks;
  };

  const groupedItems = groupItems(data.items);

  const groupedByKategori = groupedItems.reduce((acc, item) => {
    if (!acc[item.kategori]) {
      acc[item.kategori] = [];
    }
    acc[item.kategori].push(item);
    return acc;
  }, {});

  // ===========================
  // 3. CREATE HTML ITEMS
  // ===========================
  const itemsHtml = Object.entries(groupedByKategori)
    .map(([kategori, items]) => {
      const header = `
      <div class="kategori-header">
        ${kategori}
      </div>
    `;

      const itemHtml = items
        .map((item) => {
          const total = item.totalBerat * item.harga;

          const rollLines = item.rolls
            .map(
              (r) => `
                <div class="line3">
                  <span class="rollid">
                    ID: ${r.id} (${r.berat.toFixed(2)} Kg)
                  </span>
                </div>
              `,
            )
            .join("");

          return `
          <div class="item">
            <div class="line1">
              <span class="name">${item.nama.toUpperCase()}</span>
              <span class="price">${formatRupiah(total)}</span>
            </div>

            <div class="line2">
              ${item.totalBerat.toFixed(2)} Kg × ${formatRupiah(item.harga)}
            </div>

            <div class="line3">
              ${item.qty} Roll
            </div>

            ${rollLines}

            <div class="line3">
              <span class="tipe">${item.tipe}</span>
            </div>
          </div>
        `;
        })
        .join("");

      return header + itemHtml;
    })
    .join("");

  const subtotal = Number(data.subtotal) || 0;
  const ongkir = Number(data.ongkir) || 0;
  const potongan = Number(data.potongan) || 0;
  const totalFinal = subtotal + ongkir - potongan;

  // ===========================
  // 4. FULL HTML THERMAL 72mm
  // ===========================
  const content = `
  <html>
  <head>
    <title>Nota Thermal</title>
    <style>
      @page { size: 72mm auto; margin: 0; }

      body {
        width: 66mm;
        font-family: 'Arial', sans-serif;
        font-size: 12pt;
        line-height: 1.35;
        padding: 4mm;
      }

      .center { text-align: center; }

      .header {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 3mm;
      }

      .sub {
        font-size: 11pt;
        margin-bottom: 4mm;
        font-weight: bold;
      }

      .item {
        border-bottom: 1px dashed #000;
        padding-bottom: 3mm;
        margin-bottom: 3mm;
      }

      .line1 {
        display: flex;
        justify-content: space-between;
        font-size: 13pt;
      }

      .line2 {
        font-size: 12pt;
        margin-top: 1mm;
      }

      .line3 {
        display: flex;
        justify-content: space-between;
        font-size: 11pt;
        margin-top: 1mm;
      }

      .rollid {
        font-family: 'Courier New', monospace;
        font-weight: bold;
      }

      .total-section {
        margin-top: 4mm;
        border-top: 2px dashed #000;
        padding-top: 3mm;
        font-size: 14pt;
      }

      .total-section .line1 {
        font-size: 14pt;
        
      }

      .footer {
        margin-top: 5mm;
        text-align: center;
        font-size: 11pt;
        
      }

      .kategori-header {
        text-align: center;
        font-weight: bold;
        margin: 6px 0;
        padding: 2px 0;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
      }

      @media print {
        .no-print { display: none; }
      }
    </style>
  </head>

  <body>

    <div class="center header">NOTA PENJUALAN</div>
    <div class="center sub">
        Fajar Terang<br/>
        Ruko Auri, Jl. Anggrek IV<br/>
        Blok AA No.17<br/>
        Komplek Ruko Auri, Tanah Abang<br/>
        Jakarta Pusat 10250<br/>
        Telp: 0811-239-191/0899-9522-200
    </div>

    <div style="font-size:12pt; margin-bottom:4mm;">
      No Nota: ${data.nomorNota}<br/>
      Tanggal: ${formatTanggal(data.tanggal)}<br/>
      Customer: ${data.customer.nama.toUpperCase() || "-"}
    </div>

    ${itemsHtml}

    <div class="total-section">
    <!-- Subtotal -->
    <div class="line1">
      <span>Subtotal</span>
      <span>${formatRupiah(subtotal)}</span>
    </div>

    ${
      ongkir > 0
        ? `
    <div class="line1" style="font-size:12pt;">
      <span>Ongkir</span>
      <span>${formatRupiah(ongkir)}</span>
    </div>
    `
        : ""
    }

    ${
      potongan > 0
        ? `
    <div class="line1" style="font-size:12pt;">
      <span>Potongan</span>
      <span>-${formatRupiah(potongan)}</span>
    </div>
    `
        : ""
    }

    <!-- Total akhir -->
    <div class="line1" style="border-top:1px dashed #000; margin-top:4px; padding-top:4px;">
      <span>Total</span>
      <span>${formatRupiah(totalFinal)}</span>
    </div>
  </div>

    <div class="footer">
      Kasir: ${data.kasir.toUpperCase()}<br/>
      Terima kasih
    </div>

 <!-- Tombol Print (hidden saat print) -->
      <div class="no-print" style="text-align:center; margin-top:20px;">
        <button onclick="window.print()" style="
          padding: 12px 28px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          margin-right: 8px;
        ">
          🖨️ Print Nota
        </button>

        <button onclick="window.printSuratJalanThermal()" style="
          padding: 12px 28px;
          background: #243A8C;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          margin-right: 8px;
        ">
          📦 Surat Jalan
        </button>

        <button onclick="window.close()" style="
          padding: 12px 28px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        ">
          ✖ Tutup
        </button>

      </div>

      <script>
        // Auto print setelah 0.3 detik
        setTimeout(() => {
          window.print();
        }, 300);
      </script>

  </body>
  </html>
  `;

  win.document.write(content);
  win.document.close();
};

export default printNotaPenjualanThermal;
