// Utils/printHelpers.js

/**
 * Membuat iframe untuk printing (lebih aman dari popup blocker)
 * @returns {HTMLIFrameElement} - Iframe element
 */
export const createPrintIframe = () => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);
  return iframe;
};

/**
 * Membersihkan iframe setelah printing
 * @param {HTMLIFrameElement} iframe - Iframe yang akan dibersihkan
 */
export const cleanupIframe = (iframe) => {
  if (iframe && iframe.parentNode) {
    setTimeout(() => {
      iframe.parentNode.removeChild(iframe);
    }, 1000);
  }
};

/**
 * Memuat script JsBarcode ke dalam dokumen
 * @param {Document} doc - Dokumen target
 */
export const loadJsBarcode = (doc) => {
  return new Promise((resolve, reject) => {
    const script = doc.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
    script.onload = resolve;
    script.onerror = reject;
    doc.head.appendChild(script);
  });
};

/**
 * Menampilkan notasi ilmiah untuk printer thermal
 * @param {string} message - Pesan yang akan ditampilkan
 */
export const showPrintNotification = (message) => {
  // Bisa diintegrasikan dengan toast notification system
  console.log("🖨️", message);
};
