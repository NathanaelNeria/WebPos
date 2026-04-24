// print/printAllRollsLabelA4.js
import { ensure16Char } from "./Utils/barcodeFormatter";
import { createPrintIframe, cleanupIframe } from "./Utils/printHelpers";

export const printAllRollsLabelA4 = (rolls) => {
  if (!rolls || rolls.length === 0) {
    console.error("Tidak ada roll untuk dicetak");
    return;
  }

  const CONFIG = {
    cols: 3,
    rows: 8,
    labelsPerPage: 24,
    labelWidth: 63,
    labelHeight: 35,
    gap: 3,
    margin: 5,
  };

  // Pastikan semua barcode 16 karakter
  const formattedRolls = rolls.map((roll) => ({
    ...roll,
    barcode16: ensure16Char(roll.rollId),
  }));

  const pages = [];
  for (let i = 0; i < formattedRolls.length; i += CONFIG.labelsPerPage) {
    pages.push(formattedRolls.slice(i, i + CONFIG.labelsPerPage));
  }

  const iframe = createPrintIframe();
  const doc = iframe.contentWindow.document;

  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 5mm;
    }
    
    body {
      font-family: Arial, sans-serif;
      background: white;
      padding: 5mm;
    }
    
    .page {
      page-break-after: always;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin-bottom: 5mm;
    }
    
    .label {
      border: 2px solid black;
      padding: 3mm;
      height: 35mm;
      display: flex;
      flex-direction: column;
      background: white;
    }
    
    .sip {
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
    }
    
    .gudang {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 3px;
    }
    
    .barcode-container {
      text-align: center;
      margin: 2px 0;
    }
    
    .barcode-small {
      width: 100%;
      height: 40px;
    }
    
    .barcode-text-small {
      font-family: monospace;
      font-size: 9px;
      font-weight: bold;
      text-align: center;
      background: #f5f5f5;
      padding: 2px;
      border: 1px solid #999;
      letter-spacing: 0.5px;
    }
    
    .produk-small {
      font-size: 9px;
      font-weight: bold;
      text-align: center;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .empty-label {
      border: 1px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print All Labels - ${rolls.length} Roll</title>
      <style>${styles}</style>
    </head>
    <body>
  `);

  pages.forEach((pageRolls, pageIndex) => {
    doc.write(`<div class="page">`);

    for (let i = 0; i < 24; i++) {
      const roll = pageRolls[i];

      if (roll) {
        doc.write(`
          <div class="label">
            <div class="sip">SIP</div>
            <div class="gudang">${roll.gudangNama || "GUD"}</div>
            
            <div class="barcode-container">
              <svg class="barcode-small" id="barcode-${pageIndex}-${i}"></svg>
            </div>
            
            <div class="barcode-text-small">${roll.barcode16}</div>
            
            <div class="produk-small" title="${roll.produkNama}">
              ${roll.produkNama?.substring(0, 20) || "PRODUK"}
            </div>
          </div>
        `);
      } else {
        doc.write(`<div class="label empty-label">KOSONG</div>`);
      }
    }

    doc.write(`</div>`);
  });

  doc.write(`
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
      <script>
        (function() {
          try {
            ${pages
              .map((pageRolls, pageIndex) => {
                return pageRolls
                  .map((roll, index) => {
                    return `
                  setTimeout(() => {
                    const el = document.getElementById('barcode-${pageIndex}-${index}');
                    if (el) {
                      JsBarcode(el, '${roll.barcode16}', {
                        format: 'CODE128',
                        width: 2,
                        height: 35,
                        displayValue: false,
                        margin: 3
                      });
                    }
                  }, ${index * 10});
                `;
                  })
                  .join("");
              })
              .join("")}
            
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 1000);
          } catch (e) {
            console.error('Error:', e);
          }
        })();
      </script>
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.onafterprint = () => cleanupIframe(iframe);
};
