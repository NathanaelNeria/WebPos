// printAllRollsLabel.js
export const printAllRollsLabel = (rolls) => {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir");
    return;
  }

  // Konfigurasi layout
  const labelsPerRow = 3; // 3 label per baris
  const labelsPerPage = 24; // Maksimal 24 label per halaman A4 (3x8)
  const pageHeight = 297; // mm (A4 height)
  const labelWidth = 65; // mm
  const labelHeight = 35; // mm
  const margin = 5; // mm

  // Pisahkan roll menjadi beberapa halaman jika perlu
  const pages = [];
  for (let i = 0; i < rolls.length; i += labelsPerPage) {
    pages.push(rolls.slice(i, i + labelsPerPage));
  }

  w.document.write(`
    <html>
      <head>
        <title>Print All Barcodes</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 5mm;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            
            .page {
              width: 210mm;
              min-height: ${pageHeight}mm;
              page-break-after: always;
              display: grid;
              grid-template-columns: repeat(${labelsPerRow}, ${labelWidth}mm);
              grid-auto-rows: ${labelHeight}mm;
              gap: ${margin}mm;
              align-content: start;
            }
            
            .label {
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              border: 1px solid #000;
              padding: 2mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              font-size: 8px;
              overflow: hidden;
            }
            
            .label-header {
              font-size: 7px;
              font-weight: bold;
              line-height: 1.2;
              margin-bottom: 1mm;
            }
            
            .label-meta {
              font-size: 6px;
              margin-bottom: 1mm;
              line-height: 1.2;
            }
            
            .barcode-container {
              flex-grow: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 1mm 0;
            }
            
            .barcode-svg {
              width: 100%;
              height: 15mm;
            }
            
            .roll-id {
              text-align: center;
              font-size: 7px;
              font-family: monospace;
              letter-spacing: 0.5px;
              margin-top: 1mm;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
            
            .no-print {
              display: none;
            }
          }
          
          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
            }
            
            .page {
              background: white;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              width: 210mm;
              min-height: ${pageHeight}mm;
              display: grid;
              grid-template-columns: repeat(${labelsPerRow}, ${labelWidth}mm);
              grid-auto-rows: ${labelHeight}mm;
              gap: ${margin}mm;
              align-content: start;
            }
            
            .label {
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              border: 1px solid #000;
              padding: 2mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              font-size: 8px;
              overflow: hidden;
              background: white;
            }
            
            .label-header {
              font-size: 7px;
              font-weight: bold;
              line-height: 1.2;
              margin-bottom: 1mm;
            }
            
            .label-meta {
              font-size: 6px;
              margin-bottom: 1mm;
              line-height: 1.2;
            }
            
            .barcode-container {
              flex-grow: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 1mm 0;
            }
            
            .barcode-svg {
              width: 100%;
              height: 15mm;
            }
            
            .roll-id {
              text-align: center;
              font-size: 7px;
              font-family: monospace;
              letter-spacing: 0.5px;
              margin-top: 1mm;
            }
            
            .controls {
              position: fixed;
              top: 10px;
              right: 10px;
              background: white;
              padding: 10px;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0,0,0,0.2);
              z-index: 1000;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print controls">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
            🖨️ Print
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
            ✕ Close
          </button>
          <p style="margin-top: 10px; font-size: 12px;">
            Total: ${rolls.length} roll | Halaman: ${pages.length}
          </p>
        </div>
        
        ${pages
          .map(
            (pageRolls, pageIndex) => `
          <div class="page">
            ${pageRolls
              .map(
                (roll, index) => `
              <div class="label">
                <div class="label-header">${roll.gudangNama}</div>
                <div class="label-meta">
                  ${roll.produkNama}<br>
                  ${roll.berat} KG
                </div>
                <div class="barcode-container">
                  <svg class="barcode-svg" id="barcode-${pageIndex}-${index}"></svg>
                </div>
                <div class="roll-id">${roll.rollId}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
          )
          .join("")}
        
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <script>
          // Generate semua barcode
          ${pages
            .map((pageRolls, pageIndex) =>
              pageRolls
                .map(
                  (roll, index) => `
              JsBarcode("#barcode-${pageIndex}-${index}", "${roll.rollId}", {
                format: "CODE128",
                displayValue: false,
                lineColor: "#000",
                width: 1.5,
                height: 15,
                margin: 0
              });
            `,
                )
                .join(""),
            )
            .join("")}
          
          // Auto print setelah load
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);

  w.document.close();
};
