// src/Services/kasirService.js
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { updateCustomerStats } from "./customerService";
import { toUnit, fromUnit } from "../Utils/weight";

/* ======================================================
   CONSTANTS
====================================================== */
export const TIPE_ITEM = {
  ECER: "ECER",
  ROL: "ROL",
};

export const STATUS_PEMBAYARAN = {
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  UNPAID: "UNPAID",
};

export const STATUS_OWNER = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  LUNAS: "LUNAS",
};

export const STATUS_NOTA = {
  ACTIVE: "ACTIVE",
  VOIDED: "VOIDED",
  REPRINTED: "REPRINTED",
};

export const STATUS_ROLL = {
  AVAILABLE: "AVAILABLE",
  OPENED: "OPENED",
  SOLD: "SOLD",
  USED: "USED",
  DAMAGED: "DAMAGED",
};

/* ======================================================
   HELPER FUNCTIONS
====================================================== */
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
};

const formatDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const parseBarcode = (barcode) => {
  if (!barcode) return null;
  return barcode.trim().toUpperCase();
};

/* ======================================================
   GENERATE NOMOR NOTA
====================================================== */
export const generateNomorNota = async (gudangId, prefix = "INV") => {
  try {
    const today = new Date();
    const dateStr = formatDateStr(today);
    const seqDateStr = dateStr.replace(/-/g, "");

    const seqRef = doc(db, "sequences", `nota_${gudangId}_${seqDateStr}`);

    const seq = await runTransaction(db, async (trx) => {
      const snap = await trx.get(seqRef);
      let lastNumber = 1;

      if (snap.exists()) {
        lastNumber = snap.data().lastNumber + 1;
        trx.update(seqRef, {
          lastNumber,
          updatedAt: serverTimestamp(),
        });
      } else {
        trx.set(seqRef, {
          lastNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          gudangId,
          date: seqDateStr,
        });
      }
      return lastNumber;
    });

    return `${prefix}-${dateStr}-${String(seq).padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating nomor nota:", error);
    const today = new Date();
    const dateStr = formatDateStr(today);
    return `${prefix}-${dateStr}-${Date.now().toString().slice(-4)}`;
  }
};

/* ======================================================
   PRODUK SERVICES
====================================================== */
export const getProdukById = async (produkId) => {
  try {
    if (!produkId) return null;
    const produkSnap = await getDoc(doc(db, "produk", produkId));
    return produkSnap.exists()
      ? { id: produkSnap.id, ...produkSnap.data() }
      : null;
  } catch (error) {
    console.error("Error getting produk:", error);
    return null;
  }
};

export const getMultipleProduk = async (produkIds) => {
  try {
    if (!produkIds?.length) return new Map();
    const produkMap = new Map();

    for (let i = 0; i < produkIds.length; i += 10) {
      const batch = produkIds.slice(i, i + 10);
      const produkQuery = query(
        collection(db, "produk"),
        where("__name__", "in", batch),
      );
      const produkSnap = await getDocs(produkQuery);
      produkSnap.forEach((doc) => {
        produkMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }
    return produkMap;
  } catch (error) {
    console.error("Error getting multiple produk:", error);
    return new Map();
  }
};

/* ======================================================
   VALIDASI ROLL
====================================================== */
export const validateRollForCart = async (barcode, gudangId) => {
  try {
    const cleanBarcode = parseBarcode(barcode);
    if (!cleanBarcode) {
      return { valid: false, message: "❌ Barcode tidak valid" };
    }

    const rollQuery = query(
      collection(db, "stockRolls"),
      where("kode_barcode", "==", cleanBarcode),
      limit(1),
    );

    const rollSnap = await getDocs(rollQuery);
    if (rollSnap.empty) {
      return { valid: false, message: "❌ Roll tidak ditemukan" };
    }

    const rollDoc = rollSnap.docs[0];
    const rollData = rollDoc.data();
    const roll = { id: rollDoc.id, ...rollData };

    if (roll.gudang_id !== gudangId) {
      return { valid: false, message: `❌ Roll di gudang ${roll.gudang_id}` };
    }

    if (
      roll.status !== STATUS_ROLL.AVAILABLE &&
      roll.status !== STATUS_ROLL.OPENED
    ) {
      return { valid: false, message: `❌ Status roll: ${roll.status}` };
    }

    if (roll.berat_sisa <= 0) {
      return { valid: false, message: "❌ Roll sudah habis" };
    }

    let hargaReferensi = 0;
    let produkData = {};

    if (roll.produk_id) {
      const produk = await getProdukById(roll.produk_id);
      if (produk) {
        produkData = produk;
        hargaReferensi =
          produk.hargaReferensi || produk.harga_referensi_jual || 0;
      }
    }

    return {
      valid: true,
      roll: {
        id: roll.id,
        kode_barcode: roll.kode_barcode || roll.id,
        produk_id: roll.produk_id,
        produk_nama: roll.produk_nama || produkData.nama || "Unknown",
        kategori: roll.kategori || produkData.kategori || "Umum",
        berat_sisa: roll.berat_sisa || 0,
        berat_awal: roll.berat_awal || roll.berat_sisa || 0,
        status: roll.status,
        gudang_id: roll.gudang_id,
        is_rol_dibuka: roll.is_rol_dibuka || false,
        supplier_id: roll.supplier_id,
        supplier_nama: roll.supplier_nama,
        lokasi_rak: roll.lokasi_rak,
        produk_data: produkData,
        harga_referensi: hargaReferensi,
        harga_jual: hargaReferensi,
        max_berat: roll.berat_sisa,
      },
    };
  } catch (error) {
    console.error("Error validating roll:", error);
    return { valid: false, message: "❌ Terjadi kesalahan" };
  }
};

/* ======================================================
   GET AVAILABLE ROLLS
====================================================== */
export const getAvailableRolls = async (gudangId, limitCount = 50) => {
  try {
    if (!gudangId) throw new Error("Gudang ID diperlukan");

    const rollQuery = query(
      collection(db, "stockRolls"),
      where("gudang_id", "==", gudangId),
      where("status", "in", [STATUS_ROLL.AVAILABLE, STATUS_ROLL.OPENED]),
      where("berat_sisa", ">", 0),
      orderBy("berat_sisa", "desc"),
      // limit(limitCount),
    );

    const rollSnap = await getDocs(rollQuery);
    if (rollSnap.empty) return [];

    const produkIds = [
      ...new Set(
        rollSnap.docs.map((doc) => doc.data().produk_id).filter(Boolean),
      ),
    ];

    const produkMap = await getMultipleProduk(produkIds);

    return rollSnap.docs.map((doc) => {
      const data = doc.data();
      const produkData = produkMap.get(data.produk_id) || {};
      const hargaReferensi =
        produkData.hargaReferensi || produkData.harga_referensi_jual || 0;

      return {
        id: doc.id,
        kode_barcode: data.kode_barcode || doc.id,
        produk_id: data.produk_id,
        produk_nama: data.produk_nama || produkData.nama || "Unknown",
        kategori: data.kategori || produkData.kategori || "Umum",
        berat_sisa: data.berat_sisa || 0,
        berat_awal: data.berat_awal || data.berat_sisa || 0,
        harga_referensi: hargaReferensi,
        harga_jual: hargaReferensi,
        status: data.status,
        gudang_id: data.gudang_id,
        is_rol_dibuka: data.is_rol_dibuka || false,
        tanggal_masuk: data.tanggal_masuk,
        supplier_id: data.supplier_id,
        supplier_nama: data.supplier_nama,
        lokasi_rak: data.lokasi_rak,
        catatan: data.catatan,
      };
    });
  } catch (error) {
    console.error("Error getting available rolls:", error);
    throw error;
  }
};

/* ======================================================
   SEARCH AVAILABLE ROLLS
====================================================== */
export const searchAvailableRolls = async (
  gudangId,
  searchTerm,
  limitCount = 20,
) => {
  try {
    if (!gudangId || !searchTerm) return [];

    const searchTermUpper = searchTerm.toUpperCase();

    const barcodeQuery = query(
      collection(db, "stockRolls"),
      where("gudang_id", "==", gudangId),
      where("status", "in", [STATUS_ROLL.AVAILABLE, STATUS_ROLL.OPENED]),
      where("berat_sisa", ">", 0),
      where("kode_barcode", ">=", searchTermUpper),
      where("kode_barcode", "<=", searchTermUpper + "\uf8ff"),
      // limit(limitCount),
    );

    const produkNamaQuery = query(
      collection(db, "stockRolls"),
      where("gudang_id", "==", gudangId),
      where("status", "in", [STATUS_ROLL.AVAILABLE, STATUS_ROLL.OPENED]),
      where("berat_sisa", ">", 0),
      where("produk_nama", ">=", searchTerm),
      where("produk_nama", "<=", searchTerm + "\uf8ff"),
      limit(limitCount),
    );

    const [barcodeSnap, produkNamaSnap] = await Promise.all([
      getDocs(barcodeQuery),
      getDocs(produkNamaQuery),
    ]);

    const rollMap = new Map();
    [...barcodeSnap.docs, ...produkNamaSnap.docs].forEach((doc) => {
      if (!rollMap.has(doc.id)) rollMap.set(doc.id, doc);
    });

    const produkIds = [
      ...new Set(
        [...rollMap.values()]
          .map((doc) => doc.data().produk_id)
          .filter(Boolean),
      ),
    ];

    const produkMap = await getMultipleProduk(produkIds);

    return [...rollMap.values()]
      .map((doc) => {
        const data = doc.data();
        const produkData = produkMap.get(data.produk_id) || {};
        const hargaReferensi =
          produkData.hargaReferensi || produkData.harga_referensi_jual || 0;

        return {
          id: doc.id,
          kode_barcode: data.kode_barcode || doc.id,
          produk_id: data.produk_id,
          produk_nama: data.produk_nama || produkData.nama || "Unknown",
          kategori: data.kategori || produkData.kategori || "Umum",
          berat_sisa: data.berat_sisa || 0,
          berat_awal: data.berat_awal || data.berat_sisa || 0,
          harga_referensi: hargaReferensi,
          harga_jual: hargaReferensi,
          status: data.status,
          gudang_id: data.gudang_id,
          is_rol_dibuka: data.is_rol_dibuka || false,
          tanggal_masuk: data.tanggal_masuk,
          supplier_id: data.supplier_id,
          supplier_nama: data.supplier_nama,
          lokasi_rak: data.lokasi_rak,
          catatan: data.catatan,
        };
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error searching available rolls:", error);
    throw error;
  }
};

/* ======================================================
   HITUNG SUBTOTAL ITEM
====================================================== */
export const calculateItemSubtotal = (item) => {
  if (!item) return 0;
  if (item.tipe === TIPE_ITEM.ROL) {
    return (item.berat || 0) * (item.harga_per_kg || 0);
  }
  return (item.berat_jual || 0) * (item.harga_per_kg || 0);
};

/* ======================================================
   PROSES TRANSAKSI PENJUALAN
====================================================== */
export const processPenjualan = async ({
  gudangId,
  gudangNama,
  kasir,
  items,
  pembayaran,
  customer,
  catatan,
}) => {
  if (!gudangId) throw new Error("Gudang ID diperlukan");
  if (!kasir?.uid) throw new Error("Data kasir tidak lengkap");
  if (!items?.length) throw new Error("Tidak ada item");

  console.log("keseluruhan items", items);

  const getNotaPrefix = (gudangNama = "") => {
    const name = gudangNama.toUpperCase();
    if (name.includes("CID")) return "CID";
    if (name.includes("AA")) return "AA";
    return "INV";
  };

  try {
    const prefix = getNotaPrefix(gudangNama);
    const nomorNota = await generateNomorNota(gudangId, prefix);
    const now = serverTimestamp();
    const transaksiId = generateId("TRX");

    let totalBerat = 0,
      totalUjung = 0,
      totalHarga = 0;

    const itemsForDb = items.map((item) => {
      if (item.tipe === TIPE_ITEM.ROL) {
        totalBerat += item.berat || 0;
        totalHarga += (item.berat || 0) * (item.harga_per_kg || 0);
        return {
          rollId: item.rollId,
          barcode: item.barcode,
          produkId: item.produkId,
          produkNama: item.produkNama,
          kategori: item.kategori,
          tipe: TIPE_ITEM.ROL,
          berat: item.berat,
          harga_referensi: item.harga_referensi || 0,
          harga_per_kg: item.harga_per_kg,
          subtotal: (item.berat || 0) * (item.harga_per_kg || 0),
        };
      } else {
        totalBerat += item.berat_jual || 0;
        totalUjung += item.berat_ujung || 0;
        totalHarga += (item.berat_jual || 0) * (item.harga_per_kg || 0);
        return {
          rollId: item.rollId,
          barcode: item.barcode,
          produkId: item.produkId,
          produkNama: item.produkNama,
          kategori: item.kategori,
          tipe: TIPE_ITEM.ECER,
          berat_jual: item.berat_jual,
          berat_ujung: item.berat_ujung || 0,
          harga_referensi: item.harga_referensi || 0,
          harga_per_kg: item.harga_per_kg,
          subtotal: (item.berat_jual || 0) * (item.harga_per_kg || 0),
        };
      }
    });

    // Ambil data roll sebelum transaction
    // const rollSnapshots = await Promise.all(
    //   items
    //     .filter((item) => !item.isManual)
    //     .map((item) => getDoc(doc(db, "stockRolls", item.rollId))),
    // );

    // const rollDataMap = new Map();
    // rollSnapshots.forEach((snap, index) => {
    //   if (snap.exists()) rollDataMap.set(items[index].rollId, snap.data());
    // });

    const rollDataMap = new Map();

    const rollItems = items.filter((item) => !item.isManual);

    const rollSnapshots = await Promise.all(
      rollItems.map((item) =>
        getDoc(doc(db, "stockRolls", item.rollId)).then((snap) => ({
          rollId: item.rollId,
          snap,
        })),
      ),
    );

    rollSnapshots.forEach(({ rollId, snap }) => {
      if (!snap.exists()) {
        throw new Error(`Roll ${rollId} tidak ditemukan`);
      }
      rollDataMap.set(rollId, snap.data());
    });

    // Validasi semua roll masih tersedia
    for (const item of items) {
      if (item.isManual) continue; // skip validasi untuk item manual
      console.log("isi item for loop", item);
      const rollData = rollDataMap.get(item.rollId);
      if (!rollData) throw new Error(`Roll ${item.rollId} tidak ditemukan`);
      if (
        rollData.status !== STATUS_ROLL.AVAILABLE &&
        rollData.status !== STATUS_ROLL.OPENED
      ) {
        throw new Error(`Roll ${item.rollId} sudah tidak tersedia`);
      }
      const stokUnit = toUnit(rollData.berat_sisa);
      const pakaiUnit = toUnit(item.berat_jual || item.berat || 0);

      if (pakaiUnit > stokUnit) {
        throw new Error(`Berat roll ${item.rollId} tidak mencukupi`);
      }
    }

    const ongkir = Number(pembayaran.ongkir) || 0;
    const potongan = Number(pembayaran.potongan) || 0;

    // totalHarga di sini = SUBTOTAL BARANG
    const totalFinal = totalHarga + ongkir - potongan;

    const jumlahDibayar = Number(pembayaran.totalBayar) || totalFinal;

    const kembalian = jumlahDibayar - totalFinal;

    // Transaction
    await runTransaction(db, async (trx) => {
      const transaksiRef = doc(
        collection(db, "transaksiPenjualan"),
        transaksiId,
      );
      trx.set(transaksiRef, {
        id: transaksiId,
        nomor_nota: nomorNota,
        gudang_id: gudangId,
        gudang_nama: gudangNama,
        kasir_id: kasir.uid,
        kasir_email: kasir.email,
        kasir_nama: kasir.displayName || kasir.email,
        tanggal_transaksi: now,
        items: itemsForDb,
        total_berat: totalBerat,
        total_ujung: totalUjung,
        subtotal: totalHarga, // ✅ BARANG AJA
        ongkir: ongkir, // ✅
        potongan: potongan, // ✅
        total_harga: totalFinal,
        metode_pembayaran: pembayaran.metode,
        status_pembayaran: pembayaran.status || STATUS_PEMBAYARAN.PAID,
        status_owner: STATUS_OWNER.PENDING,
        jumlah_dibayar: jumlahDibayar,
        kembalian: kembalian,
        customer: customer?.nama
          ? {
              id: customer.id || null,
              nama: customer.nama,
              no_telp: customer.noTelp || "",
              alamat: customer.alamat || "",
              kode: customer.kode || "",
            }
          : null,
        approved: {
          Vinna: false,
          Ari: false,
        },
        catatan: catatan || "",
        created_at: now,
        created_by: kasir.uid,
      });

      const notaRef = doc(collection(db, "nota"), nomorNota);
      trx.set(notaRef, {
        id: nomorNota,
        nota_id: nomorNota,
        transaksi_id: transaksiId,
        nomor_urut: nomorNota.split("-").pop(),
        gudang_id: gudangId,
        kasir_id: kasir.uid,
        subtotal: totalHarga,
        ongkir: ongkir,
        potongan: potongan,
        total_amount: totalFinal,
        status_nota: STATUS_NOTA.ACTIVE,
        print_count: 1,
        first_printed_at: now,
        last_printed_at: now,
        status_pembayaran: pembayaran.status || STATUS_PEMBAYARAN.PAID,
        created_at: now,
      });

      for (const item of items) {
        if (item.isManual) continue; // skip update untuk item manual
        const rollRef = doc(db, "stockRolls", item.rollId);
        const rollData = rollDataMap.get(item.rollId);

        if (item.tipe === TIPE_ITEM.ROL) {
          const ledgerId = generateId("LEDG");
          const ledgerRef = doc(collection(db, "stockLedger"), ledgerId);

          trx.set(ledgerRef, {
            id: ledgerId,
            roll_id: item.rollId,
            tipe: "PENJUALAN",
            berat: item.berat,
            gudang_asal: gudangId,
            gudang_tujuan: null,
            ref_nota: nomorNota,
            user_id: kasir.uid,
            user_role: kasir.role || "KASIR",
            timestamp: now,
            metadata: {
              tipe_penjualan: "ROL",
              harga_referensi: item.harga_referensi,
              kategori: item.kategori,
              harga_jual: item.harga_per_kg,
              total_harga: item.berat * item.harga_per_kg,
            },
          });

          trx.update(rollRef, {
            status: STATUS_ROLL.SOLD,
            last_updated: now,
            terjual_pada: now,
            nota_terakhir: nomorNota,
            harga_jual_terakhir: item.harga_per_kg,
          });
        } else {
          const ledgerJualId = generateId("LEDG-J");
          const ledgerJualRef = doc(
            collection(db, "stockLedger"),
            ledgerJualId,
          );

          const hasAdjustment =
            item.berat_neto !== null &&
            item.berat_neto !== undefined &&
            item.berat_sisa_db !== null &&
            !rollData?.is_rol_dibuka;

          const sumberBerat = hasAdjustment
            ? item.berat_neto
            : rollData?.berat_sisa || 0;

          trx.set(ledgerJualRef, {
            id: ledgerJualId,
            roll_id: item.rollId,
            tipe: "PENJUALAN",
            berat: item.berat_jual,
            gudang_asal: gudangId,
            gudang_tujuan: null,
            ref_nota: nomorNota,
            user_id: kasir.uid,
            user_role: kasir.role || "KASIR",
            timestamp: now,
            metadata: {
              tipe_penjualan: "ECER",
              harga_referensi: item.harga_referensi,
              kategori: item.kategori,
              harga_jual: item.harga_per_kg,
              total_harga: item.berat_jual * item.harga_per_kg,
            },
          });

          if (item.berat_ujung > 0) {
            const ledgerUjungId = generateId("LEDG-U");
            const ledgerUjungRef = doc(
              collection(db, "stockLedger"),
              ledgerUjungId,
            );

            trx.set(ledgerUjungRef, {
              id: ledgerUjungId,
              roll_id: item.rollId,
              tipe: "UJUNG_KAIN",
              berat: item.berat_ujung,
              gudang_asal: gudangId,
              gudang_tujuan: null,
              ref_nota: nomorNota,
              user_id: kasir.uid,
              user_role: kasir.role || "KASIR",
              timestamp: now,
              metadata: { alasan: "Ujung kain dari penjualan ecer" },
            });

            const wasteId = generateId("WASTE");
            const wasteRef = doc(collection(db, "sisaUjungKain"), wasteId);

            trx.set(wasteRef, {
              id: wasteId,
              roll_id: item.rollId,
              berat: item.berat_ujung,
              tanggal: now,
              user_id: kasir.uid,
              gudang_id: gudangId,
              nota_id: nomorNota,
              produk_id: item.produkId,
              produk_nama: item.produkNama,
            });
          }

          const sumberUnit = toUnit(sumberBerat);
          const jualUnit = toUnit(item.berat_jual);
          const ujungUnit = toUnit(item.berat_ujung || 0);

          const sisaUnitBaru = sumberUnit - jualUnit - ujungUnit;
          const beratSisaBaru = Math.max(0, fromUnit(sisaUnitBaru));

          const updateData = {
            berat_sisa: Math.max(0, beratSisaBaru),
            last_updated: now,
            nota_terakhir: nomorNota,
            harga_jual_terakhir: item.harga_per_kg,
          };

          if (!rollData?.is_rol_dibuka) {
            updateData.is_rol_dibuka = true;
            updateData.tanggal_buka = now;
          }

          updateData.berat_sisa = beratSisaBaru;
          updateData.status =
            sisaUnitBaru <= 0 ? STATUS_ROLL.SOLD : STATUS_ROLL.OPENED;

          if (hasAdjustment) {
            const selisihUnit =
              toUnit(item.berat_neto) - toUnit(item.berat_sisa_db);

            const selisih = fromUnit(selisihUnit);

            if (Math.abs(selisih) > 0.001) {
              const ledgerAdjId = generateId("LEDG-ADJ");
              const ledgerAdjRef = doc(
                collection(db, "stockLedger"),
                ledgerAdjId,
              );

              trx.set(ledgerAdjRef, {
                id: ledgerAdjId,
                roll_id: item.rollId,
                tipe: "ADJUSTMENT_TIMBANG",
                berat: selisih,
                gudang_asal: gudangId,
                gudang_tujuan: null,
                ref_nota: nomorNota,
                user_id: kasir.uid,
                user_role: kasir.role || "KASIR",
                timestamp: now,
                metadata: {
                  berat_sisa_db: item.berat_sisa_db,
                  berat_neto: item.berat_neto,
                  berat_sisa_akhir: Math.max(0, beratSisaBaru),
                  alasan:
                    "Penyesuaian timbang ulang saat penjualan ecer pertama",
                },
              });
            }
          }

          trx.update(rollRef, updateData);
        }
      }

      const activityId = generateId("ACT");
      const activityRef = doc(collection(db, "userActivities"), activityId);

      trx.set(activityRef, {
        id: activityId,
        user_id: kasir.uid,
        user_role: kasir.role || "KASIR",
        user_email: kasir.email,
        action_type: "PENJUALAN",
        entity_type: "TRANSAKSI",
        entity_id: transaksiId,
        action_details: `Penjualan ${nomorNota} - ${items.length} item (${totalBerat.toFixed(2)} kg) - ${formatRupiah(totalHarga)}`,
        gudang_id: gudangId,
        timestamp: now,
        ip_address: "web-app",
        metadata: {
          nomor_nota: nomorNota,
          total_item: items.length,
          total_berat: totalBerat,
          total_ujung: totalUjung,
          total_harga: totalHarga,
          metode_pembayaran: pembayaran.metode,
        },
      });
    });

    // Update customer stats
    if (customer?.id) {
      await updateCustomerStats(customer.id, totalHarga).catch((err) =>
        console.error("Error updating customer stats:", err),
      );
    }

    return {
      success: true,
      nomorNota,
      transaksiId,
      totalHarga,
      totalBerat,
      totalUjung,
    };
  } catch (error) {
    console.error("Error processing penjualan:", error);
    throw error;
  }
};

/* ======================================================
   GET DASHBOARD DATA - FIXED
====================================================== */
export const getDashboardData = async (gudangId, tanggal = new Date()) => {
  try {
    console.log("📊 Fetching dashboard for gudang:", gudangId);

    const startOfDay = new Date(tanggal);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(tanggal);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("📅 Date range:", {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString(),
    });

    // Gunakan "tanggal_transaksi" karena di database pake field itu
    const transaksiQuery = query(
      collection(db, "transaksiPenjualan"),
      where("gudang_id", "==", gudangId),
      where("tanggal_transaksi", ">=", startOfDay),
      where("tanggal_transaksi", "<=", endOfDay),
      orderBy("tanggal_transaksi", "desc"),
    );

    const transaksiSnap = await getDocs(transaksiQuery);
    console.log("📦 Raw transactions count:", transaksiSnap.size);

    // Transformasi data
    const transaksi = transaksiSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nomor_nota: data.nomor_nota || "-",
        total_harga: data.total_harga || 0,
        total_berat: data.total_berat || 0,
        total_ujung: data.total_ujung || 0,
        metode_pembayaran: data.metode_pembayaran || "CASH",
        status_pembayaran: data.status_pembayaran || "PAID",
        tanggal_transaksi: data.tanggal_transaksi,
        items: data.items || [],
        customer: data.customer || null,
        kasir_nama:
          data.kasir_nama || data.kasir_email?.split("@")[0] || "Kasir",
      };
    });

    console.log("✅ Processed transactions:", transaksi.length);

    // Hitung total
    const totalPenjualan = transaksi.reduce(
      (sum, t) => sum + (t.total_harga || 0),
      0,
    );

    const totalBerat = transaksi.reduce(
      (sum, t) => sum + (t.total_berat || 0),
      0,
    );

    const totalTransaksi = transaksi.length;

    const rataKg = totalBerat > 0 ? totalPenjualan / totalBerat : 0;

    // Hitung unpaid nota (UNPAID atau PARTIAL)
    const unpaidNota = transaksi.filter(
      (t) =>
        t.status_pembayaran === STATUS_PEMBAYARAN.UNPAID ||
        t.status_pembayaran === STATUS_PEMBAYARAN.PARTIAL,
    ).length;

    const result = {
      totalPenjualan,
      totalBerat: parseFloat(totalBerat.toFixed(2)),
      totalTransaksi,
      rataKg: parseFloat(rataKg.toFixed(2)),
      unpaidNota,
      transaksiHariIni: transaksi.slice(0, 10), // 10 transaksi terakhir
    };

    console.log("📊 Dashboard result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting dashboard data:", error);
    return {
      totalPenjualan: 0,
      totalBerat: 0,
      totalTransaksi: 0,
      rataKg: 0,
      unpaidNota: 0,
      transaksiHariIni: [],
    };
  }
};

/* ======================================================
   GET TRANSACTIONS BY DATE RANGE (untuk riwayat)
====================================================== */
export const getTransactionsByDateRange = async (
  gudangId,
  startDate,
  endDate,
  user,
) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const transaksiQuery = query(
      collection(db, "transaksiPenjualan"),
      where("gudang_id", "==", gudangId),
      where("tanggal_transaksi", ">=", start),
      where("tanggal_transaksi", "<=", end),
      where("kasir_nama", "==", user),
      orderBy("tanggal_transaksi", "desc"),
    );

    const transaksiSnap = await getDocs(transaksiQuery);

    return transaksiSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
};

/* ======================================================
   GET TRANSACTION BY NOTA NUMBER
====================================================== */
export const getTransactionByNota = async (nomorNota) => {
  try {
    const notaRef = doc(db, "nota", nomorNota);
    const notaSnap = await getDoc(notaRef);

    if (!notaSnap.exists()) return null;

    const transaksiRef = doc(
      db,
      "transaksiPenjualan",
      notaSnap.data().transaksi_id,
    );
    const transaksiSnap = await getDoc(transaksiRef);

    return transaksiSnap.exists() ? transaksiSnap.data() : null;
  } catch (error) {
    console.error("Error getting transaction:", error);
    return null;
  }
};

/* ======================================================
   VOID NOTA
====================================================== */
export const voidNota = async (nomorNota, alasan, user) => {
  try {
    await runTransaction(db, async (trx) => {
      const notaRef = doc(db, "nota", nomorNota);
      const notaSnap = await trx.get(notaRef);
      if (!notaSnap.exists()) throw new Error("Nota tidak ditemukan");

      if (notaSnap.data().status_nota === STATUS_NOTA.VOIDED) {
        throw new Error("Nota sudah di-void");
      }

      const transaksiRef = doc(
        db,
        "transaksiPenjualan",
        notaSnap.data().transaksi_id,
      );
      const transaksiSnap = await trx.get(transaksiRef);
      if (!transaksiSnap.exists()) throw new Error("Transaksi tidak ditemukan");

      trx.update(notaRef, {
        status_nota: STATUS_NOTA.VOIDED,
        void_reason: alasan,
        void_by: user.uid,
        void_at: serverTimestamp(),
      });

      trx.update(transaksiRef, {
        status_pembayaran: STATUS_NOTA.VOIDED,
        void_reason: alasan,
      });

      const activityId = generateId("ACT");
      const activityRef = doc(collection(db, "userActivities"), activityId);

      trx.set(activityRef, {
        id: activityId,
        user_id: user.uid,
        user_role: user.role || "KASIR",
        user_email: user.email,
        action_type: "VOID_NOTA",
        entity_type: "NOTA",
        entity_id: nomorNota,
        action_details: `Void nota ${nomorNota} - ${alasan}`,
        gudang_id: notaSnap.data().gudang_id,
        timestamp: serverTimestamp(),
        ip_address: "web-app",
        metadata: { alasan },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error voiding nota:", error);
    throw error;
  }
};

/* ======================================================
   REPRINT NOTA (update print count)
====================================================== */
export const reprintNota = async (nomorNota) => {
  try {
    const notaRef = doc(db, "nota", nomorNota);
    const notaSnap = await getDoc(notaRef);

    if (!notaSnap.exists()) throw new Error("Nota tidak ditemukan");

    const printCount = (notaSnap.data().print_count || 1) + 1;

    await updateDoc(notaRef, {
      print_count: printCount,
      last_printed_at: serverTimestamp(),
      status_nota: STATUS_NOTA.REPRINTED,
    });

    return { success: true, printCount };
  } catch (error) {
    console.error("Error reprinting nota:", error);
    throw error;
  }
};
