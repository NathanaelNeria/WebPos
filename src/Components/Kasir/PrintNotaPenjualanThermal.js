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

  // ===========================
  // THERMAL HELPER (ESC/POS LOOK)
  // ===========================

  const MAX = 42;
  const line = "-".repeat(MAX);

  const right = (label, value) => {
    const space = MAX - (label.length + value.length);
    return label + " ".repeat(space > 1 ? space : 1) + value;
  };

  const center = (text) => {
    const pad = Math.floor((MAX - text.length) / 2);
    return " ".repeat(pad > 0 ? pad : 0) + text;
  };

  const rupiah = (n) => n.toLocaleString("id-ID", { minimumFractionDigits: 0 });

  const formatTanggal = (value) => {
    if (!value) return "-";
    if (typeof value.toDate === "function") value = value.toDate();
    const d = new Date(value);
    return d.toLocaleDateString("id-ID");
  };

  // ===========================
  // GROUP ITEM (SAMA DENGAN RN)
  // ===========================
  const groupItems = (items) => {
    const groups = {};
    items.forEach((i) => {
      const kategori = i.kategori || "LAINNYA";
      const key = `${kategori}_${i.produkNama}_${i.harga_per_kg}`;

      if (!groups[key]) {
        groups[key] = {
          kategori,
          nama: i.produkNama,
          harga: i.harga_per_kg,
          tipe: i.tipe,
          totalBerat: 0,
          qty: 0,
          rolls: [],
        };
      }

      const berat =
        i.tipe === "ROL"
          ? Number(i.berat || 0)
          : Number(i.berat_jual || i.berat || 0);

      const id = String(i.barcode || i.rollId || "-").slice(-4);

      groups[key].totalBerat += berat;
      groups[key].qty += 1;
      groups[key].rolls.push({ id, berat });
    });

    return Object.values(groups).sort((a, b) =>
      a.kategori.localeCompare(b.kategori),
    );
  };

  const grouped = groupItems(data.items || []);
  const groupedByKategori = grouped.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});

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
        ecerQty += 1;
        ecerKg += Number(item.berat_jual || item.berat || 0);
      }
    });

    return { rollQty, rollKg, ecerQty, ecerKg };
  };

  const { rollQty, rollKg, ecerQty, ecerKg } = calcRollEcer(data.items || []);

  // ===========================
  // TOTAL
  // ===========================
  const subtotal = Number(data.subtotal || 0);
  const ongkir = Number(data.ongkir || 0);
  const potongan = Number(data.potongan || 0);
  const totalFinal = subtotal + ongkir - potongan;

  let out = "";

  /* ===== HEADER ===== */
  out += center("FAJAR TERANG") + "\n";
  out += center("Ruko Auri, Jl. Anggrek IV Blok AA No.17") + "\n";
  out += center("Telp: 0811-239-191/0899-9522-200") + "\n\n";

  out += center("NOTA PENJUALAN") + "\n";
  out += line + "\n";

  /* ===== META ===== */
  out += right("No Nota:", data.nomorNota) + "\n";
  out += right("Tanggal:", formatTanggal(data.tanggal)) + "\n";
  out += right("Customer:", (data.customer?.nama || "-").toUpperCase()) + "\n";
  out += right("Kasir:", data.kasir.toUpperCase()) + "\n";
  out += line + "\n";

  /* ===== ITEMS ===== */
  Object.entries(groupedByKategori).forEach(([kategori, items]) => {
    out += center(kategori.toUpperCase()) + "\n";
    out += line + "\n";

    items.forEach((item) => {
      const total = item.totalBerat * item.harga;

      out += item.nama.toUpperCase() + "\n";
      out += right("Rp", "Rp" + rupiah(total)) + "\n";
      out += `${item.totalBerat.toFixed(2)} Kg x Rp${rupiah(item.harga)}\n`;
      out += `${item.qty} Roll\n`;

      item.rolls.forEach((r) => {
        out += `ID: ${r.id} (${r.berat.toFixed(2)} Kg)\n`;
      });

      out += item.tipe.toUpperCase() + "\n";
      out += line + "\n";
    });
  });

  out +=
    right("Total Roll:", `${rollQty} Roll (${rollKg.toFixed(2)} Kg)`) + "\n";

  out +=
    right("Total Ecer:", `${ecerQty} Item (${ecerKg.toFixed(2)} Kg)`) + "\n";

  out += line + "\n";

  /* ===== TOTAL ===== */
  out += right("Subtotal:", "Rp" + rupiah(subtotal)) + "\n";
  out += line + "\n";
  out += right("TOTAL:", "Rp" + rupiah(totalFinal)) + "\n";
  out +=
    right(
      "Metode Pembayaran:",
      (data.metodePembayaran || "TRANSFER").toUpperCase(),
    ) + "\n";
  out += line + "\n";

  /* ===== FOOTER ===== */
  out += center("Terima Kasih") + "\n\n\n\n";

  // ===========================
  // FINAL HTML (PURE THERMAL)
  // ===========================
  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>Nota Thermal</title>
  <style>
    @page { size: 72mm auto; margin: 0; }
    
body {
      margin: 0;
      padding: 0;
      background: #fff;
    }


    
pre {
      font-family: "Courier New", Courier, monospace;
      font-size: 10px;
      font-weight: 550;
      line-height: 1.25;
      white-space: pre;
      word-break: keep-all;
      overflow-wrap: normal;
      padding-top: 4mm;
      padding-bottom: 4mm;
      padding-left: 0mm;
      padding-right: 8mm;
      box-sizing: border-box;
      font-variant-ligatures: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
<pre>${out}</pre>
<br/>


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
