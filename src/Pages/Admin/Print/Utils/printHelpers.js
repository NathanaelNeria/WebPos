// print/Utils/printHelpers.js

/**
 * Membuat iframe untuk printing
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
 */
export const cleanupIframe = (iframe) => {
  if (iframe && iframe.parentNode) {
    setTimeout(() => {
      try {
        iframe.parentNode.removeChild(iframe);
      } catch (e) {
        console.warn("Gagal membersihkan iframe:", e);
      }
    }, 1000);
  }
};

/**
 * Memuat script JsBarcode
 */
export const loadJsBarcode = (doc) => {
  return new Promise((resolve, reject) => {
    if (window.JsBarcode) {
      resolve(window.JsBarcode);
      return;
    }

    const script = doc.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
    script.onload = () => {
      if (window.JsBarcode) {
        resolve(window.JsBarcode);
      } else {
        reject(new Error("JsBarcode tidak ditemukan"));
      }
    };
    script.onerror = () => reject(new Error("Gagal memuat JsBarcode"));
    doc.head.appendChild(script);
  });
};

/**
 * Menampilkan notifikasi printing
 */
export const showPrintNotification = (message) => {
  console.log("🖨️", message);
};
