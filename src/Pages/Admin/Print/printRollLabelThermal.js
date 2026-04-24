// print/printRollLabelThermal.js
import { createPrintIframe, cleanupIframe } from "./Utils/printHelpers";

export const printRollLabelThermal = ({
  rollId,
  produkNama,
  berat,
  gudangNama,
  kategori,
  tanggal = new Date().toLocaleDateString("id-ID"),
}) => {
  if (!rollId) {
    console.error("❌ rollId wajib diisi");
    alert("Roll ID tidak ditemukan, harap generate ulang");
    return;
  }

  const barcodeValue = rollId;
  const formattedBerat =
    typeof berat === "number" ? berat.toFixed(2) : parseFloat(berat).toFixed(2);

  let produkDisplay = produkNama || "PRODUK";
  produkDisplay = produkDisplay.replace(/^Hg\s*60-?\s*/i, "");
  produkDisplay = produkDisplay.toUpperCase();

  // React Native
  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "PRINT_BARCODE",
        barcode: barcodeValue,
        displayBarcode: barcodeValue,
        berat: formattedBerat,
        produkNama: produkDisplay,
        kategori: kategori || null,
        rollId,
      }),
    );
    return;
  }

  // Web print
  const iframe = createPrintIframe();
  const doc = iframe.contentWindow.document;

  const styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 72mm auto; margin: 0mm; }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      width: 68mm;
      margin: 0 auto;
      background: #ffffff;
      display: flex;
      justify-content: center;
      padding: 2mm 0;
    }
    .label {
      width: 72mm;
      padding: 0mm;
      background: #ffffff;
      text-align: center;
    }
    .barcode-container {
      display: flex;
      justify-content: center;
      margin: 0mm 0;
    }
    .barcode-text {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      margin: 2mm 0;
      letter-spacing: 1px;
      color: #000000;
    }
    .produk {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 2mm 0 1mm 0;
      color: #000000;
    }
    .berat {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 2mm 0;
      color: #000000;
    }
    canvas {
      width: 70mm !important;
      height: auto !important;
    }
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Label</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="label">
        <div class="barcode-container">
          <canvas id="barcode" width="560" height="140"></canvas>
        </div>
        <div class="barcode-text">${barcodeValue}</div>
        <div class="produk">${produkDisplay}</div>
        <div class="berat">${formattedBerat} KG</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
      <script>
        (function() {
          const value = "${barcodeValue}";
          try {
            JsBarcode("#barcode", value, {
              format: "CODE128",
              width: 2,
              height: 120,
              displayValue: false,
              margin: 18,
              background: "#ffffff",
              lineColor: "#000000"
            });
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 800);
            }, 400);
          } catch (e) {
            console.error('❌ Error generating barcode:', e);
          }
        })();
      </script>
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.onafterprint = () => cleanupIframe(iframe);
};
