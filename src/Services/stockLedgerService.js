import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

const STOCK_LEDGER_COLLECTION = "stockLedger";

/**
 * GET harga dari ledger berdasarkan nomor surat jalan supplier.
 * Return: map per roll_id
 */
export const getHargaBeliByNomorSuratJalanSupplier = async (refSuratJalan) => {
  if (!refSuratJalan) return {};

  console.log(refSuratJalan);

  const q = query(
    collection(db, "stockLedger"),
    where("tipe", "==", "IN"),
    where("metadata.nomor_surat_jalan_supplier", "==", refSuratJalan),
  );

  const snap = await getDocs(q);
  if (snap.empty) return {};

  const hargaPerRoll = {};
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.roll_id) {
      hargaPerRoll[data.roll_id] = Number(data.harga_beli_per_kg || 0);
    }
  });

  return hargaPerRoll;
};

/**
 * SAVE harga ke ledger berdasarkan nomor surat jalan supplier.
 * Input hargaPerRoll:
 * {
 *   "rollId1": 44000,
 *   "rollId2": 42000
 * }
 */
export const saveHargaBeliByNomorSuratJalanSupplier = async ({
  nomorSuratJalanSupplier,
  hargaPerRoll,
}) => {
  if (!nomorSuratJalanSupplier) {
    throw new Error("nomorSuratJalanSupplier wajib diisi");
  }

  if (!hargaPerRoll || typeof hargaPerRoll !== "object") {
    throw new Error("hargaPerRoll tidak valid");
  }

  const q = query(
    collection(db, STOCK_LEDGER_COLLECTION),
    where("tipe", "==", "IN"),
    where("metadata.nomor_surat_jalan_supplier", "==", nomorSuratJalanSupplier),
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return { updated: 0, skipped: 0 };
  }

  const batch = writeBatch(db);
  let updated = 0;
  let skipped = 0;

  snap.docs.forEach((ledgerDoc) => {
    const data = ledgerDoc.data();
    const rollId = data.roll_id;

    if (
      !rollId ||
      !Object.prototype.hasOwnProperty.call(hargaPerRoll, rollId)
    ) {
      skipped++;
      return;
    }

    const harga = Number(hargaPerRoll[rollId]);
    if (isNaN(harga) || harga < 0) {
      skipped++;
      return;
    }

    const berat = Number(data.berat || 0);

    batch.update(doc(db, "stockLedger", ledgerDoc.id), {
      "metadata.nomor_surat_jalan_supplier": nomorSuratJalanSupplier,
      harga_beli_per_kg: harga,
      total_biaya: berat * harga,
      updated_at: new Date(),
    });

    updated++;
  });

  if (updated > 0) {
    await batch.commit();
  }

  return { updated, skipped };
};
