// 1 unit = 0.01 kg
export const toUnit = (kg) => Math.round((Number(kg) || 0) * 100);
export const fromUnit = (unit) => unit / 100;
