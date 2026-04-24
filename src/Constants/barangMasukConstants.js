// constants/barangMasukConstants.js
export const SJ_TIPE = {
  BARANG_MASUK: "BARANG_MASUK",
};

export const SJ_STATUS = {
  COMPLETED: "completed",
};

export const STAT_CARD_COLORS = {
  primary: {
    bgLight: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary/5 to-transparent",
  },
  green: {
    bgLight: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-200",
    gradient: "from-emerald-500/5 to-transparent",
  },
  blue: {
    bgLight: "bg-sky-500/10",
    text: "text-sky-600",
    border: "border-sky-200",
    gradient: "from-sky-500/5 to-transparent",
  },
  yellow: {
    bgLight: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-500/5 to-transparent",
  },
  red: {
    bgLight: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-200",
    gradient: "from-rose-500/5 to-transparent",
  },
  purple: {
    bgLight: "bg-purple-500/10",
    text: "text-purple-600",
    border: "border-purple-200",
    gradient: "from-purple-500/5 to-transparent",
  },
};

export const EXCEL_TEMPLATE = {
  headers: ["Produk", "Berat (kg)", "Keterangan"],
  example: [
    ["Benang 40s", "25.5", "Roll 1"],
    ["Benang 40s", "24.8", "Roll 2"],
    ["Benang 50s", "30.0", ""],
  ],
};
