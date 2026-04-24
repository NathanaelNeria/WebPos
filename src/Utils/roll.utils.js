// src/utils/roll.utils.js
// =======================
// Helper utilities for roll management
// - splitRoll: dari satu roll jadi dua (atau lebih) bila perlu
// - generateRollId: buat ID roll unik & konsisten
// - roundTo2: angka 2 desimal aman
// - audit helpers: buat catatan jika perlu
// =======================

/**
 * Round to 2 decimals, reliably (avoid floating math issues).
 * Returns number.
 */
export function roundTo2(value) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

/**
 * Generate unique roll ID.
 *
 * Structure:
 *   {produkKode}-{YYYYMMDD}-{random3}
 *
 * Optionally with suffix for split:
 *   {produkKode}-{YYYYMMDD}-{random3}-{A/B/...}
 *
 * @param {string} produkKode
 * @param {Date=} date
 * @param {string=} suffix  // e.g. "A", "B"
 * @returns {string}
 */
export function generateRollId(produkKode, date = new Date(), suffix = "") {
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const random3 = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const base = `${produkKode}-${dateStr}-${random3}`;
  return suffix ? `${base}-${suffix}` : base;
}

/**
 * Split a roll into two parts.
 *
 * Given an existing roll (rollData) and a wanted splitWeight (kg)
 * - Validates weight
 * - Calculates remaining weight
 * - Returns new rolls: [soldOrUsedRoll, remainingRoll]
 *
 * Does NOT persist to database — caller handles transaction writes.
 *
 * rollData shape expected (minimum):
 *  {
 *    rollId,
 *    beratKg,
 *    kondisi,    // e.g., "UTUH"/"TERBUKA"
 *    status,     // e.g., "available", "sold", etc.
 *    produkKode,
 *    ...other
 *  }
 *
 * @param {object} rollData - original roll document data
 * @param {number} splitWeight - berat yang akan dipakai / dipotong (kg)
 * @returns {object} { partUsed, partRemaining }
 *
 * Throws Error on invalid conditions.
 */
export function splitRoll(rollData, splitWeight) {
  if (!rollData || typeof rollData !== "object") {
    throw new Error("rollData tidak valid");
  }

  const originalWeight = roundTo2(rollData.beratKg);
  const wantWeight = roundTo2(splitWeight);

  if (wantWeight <= 0) {
    throw new Error("Berat split harus lebih dari 0");
  }
  if (wantWeight > originalWeight) {
    throw new Error("Berat split melebihi berat roll asli");
  }

  // If equal, no need to split — caller can treat as whole roll move.
  if (wantWeight === originalWeight) {
    // Return partUsed = original, no remaining
    return {
      partUsed: {
        ...rollData,
        beratKg: originalWeight,
      },
      partRemaining: null,
    };
  }

  // Otherwise, split into two
  const remainingWeight = roundTo2(originalWeight - wantWeight);

  // We must generate IDs for new rolls (or suffix).
  // Caller may override ID generation if desired.
  // But for helper, we provide suffix-based ID:
  const date = new Date();
  // Original roll ID might already include kode+date+rand
  // We'll append suffix A/B based on context.
  const baseId = rollData.rollId || generateRollId(rollData.produkKode, date);
  // Decide suffix: A for used part, B for remaining
  const usedRollId = `${baseId}-A`;
  const remainingRollId = `${baseId}-B`;

  const partUsed = {
    ...rollData,
    rollId: usedRollId,
    beratKg: wantWeight,
    kondisi: "TERBUKA", // potongan jadi terbuka / dipakai
    // status set by caller (e.g., "sold", "on_mutation", etc.)
  };

  const partRemaining = {
    ...rollData,
    rollId: remainingRollId,
    beratKg: remainingWeight,
    kondisi: "TERBUKA",
    // status usually remains "available", but caller can adjust
  };

  return { partUsed, partRemaining };
}

/**
 * Helper: validasi array roll sebelum mutasi.
 *
 * Checks:
 *  - Array exists and not empty
 *  - each entry has rollId and beratKg > 0
 *  - sum beratKg matches expected total (optional)
 *
 * @param {Array} rolls
 * @param {number=} expectedTotalKg
 * @returns {boolean}
 * Throws Error with message if invalid.
 */
export function validateRolls(rolls, expectedTotalKg) {
  if (!Array.isArray(rolls) || rolls.length === 0) {
    throw new Error("Daftar roll kosong atau tidak valid");
  }

  let sum = 0;
  for (const r of rolls) {
    if (!r.rollId) {
      throw new Error("Ada roll tanpa rollId");
    }
    const w = roundTo2(r.beratKg);
    if (!(w > 0)) {
      throw new Error(`Berat roll ${r.rollId} tidak boleh 0 atau negatif`);
    }
    sum += w;
  }

  if (typeof expectedTotalKg === "number") {
    expectedTotalKg = roundTo2(expectedTotalKg);
    sum = roundTo2(sum);
    if (sum !== expectedTotalKg) {
      throw new Error(
        `Total berat roll (${sum} KG) tidak sama dengan nilai yang diharapkan (${expectedTotalKg} KG)`
      );
    }
  }

  return true;
}

/**
 * Optional helper to create audit note when splitting.
 *
 * Example return:
 *   "[split] rollId: HG001-20251226-123-A, berat: 5.00 KG; remaining: 10.50 KG"
 *
 * @param {object} partUsed
 * @param {object|null} partRemaining
 * @returns {string}
 */
export function splitAuditNote(partUsed, partRemaining) {
  if (!partUsed) return "";
  const usedStr = `rollId: ${partUsed.rollId}, berat: ${roundTo2(
    partUsed.beratKg
  ).toFixed(2)} KG`;
  if (!partRemaining) {
    return `[split] ${usedStr}`;
  }
  const remStr = `rollId: ${partRemaining.rollId}, berat: ${roundTo2(
    partRemaining.beratKg
  ).toFixed(2)} KG`;
  return `[split] ${usedStr}; remaining: ${remStr}`;
}
