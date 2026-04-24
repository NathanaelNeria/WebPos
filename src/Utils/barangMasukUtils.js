// Utils/barangMasukUtils.js

export const normalize = (v) =>
  (v || "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, "");

export const pad4 = (n) => String(n).padStart(4, "0");

export const buildRollId = (kategori, nama, no) =>
  `${kategori}-${nama}-${pad4(no)}`;

export const format2 = (n) => parseFloat(n || 0).toFixed(2);

export const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export const validateBerat = (berat) => {
  if (!berat && berat !== 0) {
    return { valid: false, message: "Berat tidak boleh kosong" };
  }
  const beratNum = parseFloat(berat);
  if (isNaN(beratNum) || beratNum <= 0) {
    return { valid: false, message: "Berat harus angka positif" };
  }
  const decimalCount = (berat.toString().split(".")[1] || "").length;
  if (decimalCount > 2) {
    return { valid: false, message: "Berat maksimal 2 angka desimal" };
  }
  if (beratNum > 999.99) {
    return { valid: false, message: "Berat maksimal 999.99 kg" };
  }
  return { valid: true, value: beratNum };
};

export const groupByProduct = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        productId: item.productId,
        produkNama: item.produkNama,
        produkKode: item.produkKode,
        kategori: item.kategori,
        namaNormalized: item.namaNormalized,
        rolls: [],
      };
    }
    acc[item.productId].rolls.push({
      berat: item.berat.toString(),
      rollId: null,
      isPrinted: false,
      keterangan: item.keterangan,
    });
    return acc;
  }, {});
};

export const calculateTotals = (items) => {
  const totalRolls = items.reduce((sum, item) => sum + item.rolls.length, 0);
  const totalBerat = items.reduce(
    (sum, item) =>
      sum +
      item.rolls.reduce(
        (rollSum, roll) => rollSum + parseFloat(roll.berat || 0),
        0,
      ),
    0,
  );
  const printedRolls = items.reduce(
    (sum, item) => sum + item.rolls.filter((r) => r.isPrinted).length,
    0,
  );
  return { totalRolls, totalBerat, printedRolls };
};

export const prepareItemsForDb = (items) => {
  const itemsForDb = [];
  for (const item of items) {
    for (const roll of item.rolls) {
      const berat = parseFloat(roll.berat);
      itemsForDb.push({
        rollId: roll.rollId,
        barcode: roll.rollId,
        berat: parseFloat(berat.toFixed(2)),
        produkId: item.productId,
        produkNama: item.produkNama,
        kategori: item.kategori,
      });
    }
  }
  return itemsForDb;
};

export const prepareSuratJalanPrintData = ({
  sjId,
  supplier,
  gudangNama,
  items,
  totalRolls,
  totalBerat,
  noPO,
  catatan,
  user,
  nomorSuratJalanSupplier,
}) => {
  return {
    sjId,
    supplier,
    gudangNama,
    tanggal: new Date().toLocaleDateString("id-ID"),
    totalRolls,
    totalBerat: format2(totalBerat),
    items: items.map((item) => {
      const totalBeratItem = item.rolls.reduce(
        (sum, r) => sum + parseFloat(r.berat || 0),
        0,
      );
      return {
        produkNama: item.produkNama,
        kategori: item.kategori,
        qty: item.rolls.length,
        beratList: item.rolls.map((r) => format2(r.berat)),
        totalBerat: totalBeratItem,
      };
    }),
    noPO,
    catatan,
    adminPenerima: user?.email || "System",
    userRole: user?.role || "UNKNOWN",
    nomorSuratJalanSupplier,
  };
};
