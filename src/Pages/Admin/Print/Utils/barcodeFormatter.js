// print/Utils/barcodeFormatter.js

/**
 * Konfigurasi barcode untuk 16 karakter seragam
 */
export const BARCODE_CONFIG = {
  targetLength: 16,
  paddingChar: "X",
  format: "CODE128",
  height: 30,
};

/**
 * Membersihkan string barcode dari karakter tidak valid
 */
export const cleanBarcode = (rollId) => {
  if (!rollId) return "";
  return rollId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
};

/**
 * Memastikan barcode tepat 16 karakter
 */
export const ensure16Char = (barcode) => {
  if (!barcode) return "XXXXXXXXXXXXXXXX";

  let cleaned = cleanBarcode(barcode);

  if (cleaned.length > 16) {
    return cleaned.substring(0, 16);
  }

  if (cleaned.length < 16) {
    return cleaned.padEnd(16, "X");
  }

  return cleaned;
};

/**
 * Format untuk display (16 karakter)
 */
export const formatBarcodeForDisplay = (rollId) => {
  return ensure16Char(rollId);
};

/**
 * Memotong teks
 */
export const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

/**
 * Mendapatkan nama produk singkat (max 15 karakter)
 */
export const getProdukSingkat = (produkNama) => {
  if (!produkNama) return "PRODUK";

  // Hapus prefix umum
  let singkat = produkNama.replace(/^Hg\s*60-?\s*/i, "");

  // Bersihkan dari karakter khusus
  singkat = singkat.replace(/[^A-Za-z0-9\s]/g, "");

  // Ambil kata pertama jika terlalu panjang
  if (singkat.length > 15) {
    const words = singkat.split(/\s+/);
    if (words.length > 0) {
      singkat = words[0];
    }
  }

  return singkat.toUpperCase().substring(0, 15);
};

/**
 * Ekstrak informasi untuk label
 */
export const extractLabelInfo = (roll) => {
  const barcode16 = ensure16Char(roll.rollId);

  return {
    rollId: roll.rollId,
    barcode16: barcode16,
    displayBarcode: barcode16,
    produkNama: roll.produkNama || "Produk",
    produkSingkat: getProdukSingkat(roll.produkNama),
    kategori: truncateText(roll.kategori || "-", 10),
    berat: roll.berat ? parseFloat(roll.berat).toFixed(2) : "0.00",
    gudangNama: roll.gudangNama || "Gudang",
    tanggal: roll.tanggal || new Date().toLocaleDateString("id-ID"),
  };
};

/**
 * Validasi barcode 16 karakter
 */
export const validateBarcodeScannable = (barcode) => {
  if (!barcode) return false;

  if (barcode.length !== 16) {
    console.warn(`Barcode harus 16 karakter: ${barcode} (${barcode.length})`);
    return false;
  }

  const validChars = /^[A-Z0-9]+$/;
  if (!validChars.test(barcode)) {
    console.warn("Barcode mengandung karakter tidak valid");
    return false;
  }

  return true;
};
