// printRollLabelCode128.js
export const printRollLabel = ({ rollId, produkNama, berat, gudangNama }) => {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir");
    return;
  }

  w.document.write(`
    <html>
      <head>
        <title>Print Barcode</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
          }
          .label {
            width: 320px;
            border: 1px solid #000;
            padding: 8px;
          }
          .title {
            font-size: 12px;
            font-weight: bold;
          }
          .meta {
            font-size: 11px;
            margin-bottom: 4px;
          }
          svg {
            width: 100%;
            height: 60px;
          }
          .human {
            text-align: center;
            font-size: 11px;
            margin-top: 2px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="title">${gudangNama}</div>
          <div class="meta">${produkNama} • ${berat} KG</div>
          <svg id="barcode"></svg>
          <div class="human">${rollId}</div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <script>
          JsBarcode("#barcode", "${rollId}", {
            format: "CODE128",
            displayValue: false,
            lineColor: "#000",
            width: 3,
            height: 80,
            displayValue: false,
            margin: 0
          });
          window.print();
        </script>
      </body>
    </html>
  `);

  w.document.close();
};

// Ekspor juga fungsi printAllRollsLabel dari sini
export { printAllRollsLabel } from "./printAllRollsLabel";
