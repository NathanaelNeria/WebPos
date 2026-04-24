const dataPenjualan = [
  // ==================== 01 DES ====================
  {
    tanggal: "01/12/2025 - 08:55",
    invoice: "INV-20251201-101",
    pembeli: "Toko Murni Jaya",
    total: "Rp. 2.880.000",
    metode: "Cash",
    sales: "Ari",
    gudang: "AA17",
    approved: { Vinna: true, Ari: true },
    status: "Lunas",
    detail: [
      {
        item: "CD30_abu_md",
        jumlahRol: 12,
        beratPerRol: [
          25.33, 25.88, 26.12, 25.91, 25.55, 26.22, 25.64, 25.78, 26.01, 25.41,
          26.17, 25.92,
        ],
        hargaRol: 240000,
      },
    ],
  },

  // ==================== 02 DES ====================
  {
    tanggal: "02/12/2025 - 11:22",
    invoice: "INV-20251202-102",
    pembeli: "UD Karya Abadi",
    total: "Rp. 2.560.000",
    metode: "Transfer",
    sales: "Vinna",
    gudang: "Cideng",
    approved: { Vinna: false, Ari: false },
    status: "Pending",
    detail: [
      {
        item: "CD30_putih_sd",
        beratEcer: 32.0,
        hargaEcer: 80000,
      },
    ],
  },

  // ==================== 03 DES ====================
  {
    tanggal: "03/12/2025 - 14:30",
    invoice: "INV-20251203-103",
    pembeli: "Toko Surya Baru",
    total: "Rp. 3.270.000",
    metode: "Cash",
    sales: "Yakob",
    gudang: "A38",
    approved: { Vinna: true, Ari: false },
    status: "Lunas",
    detail: [
      {
        item: "CD30_coklat_md",
        jumlahRol: 10,
        beratPerRol: [
          26.12, 25.93, 26.33, 25.81, 26.04, 25.54, 26.18, 25.79, 26.29, 25.72,
        ],
        hargaRol: 327000,
      },
    ],
  },

  // ==================== 04 DES ====================
  {
    tanggal: "04/12/2025 - 09:44",
    invoice: "INV-20251204-104",
    pembeli: "Toko Sembada",
    total: "Rp. 1.680.000",
    metode: "Tempo",
    sales: "Egi",
    gudang: "AA17",
    approved: { Vinna: false, Ari: false },
    status: "Pending",
    detail: [
      {
        item: "CD30_pon_sd",
        beratEcer: 21.0,
        hargaEcer: 80000,
      },
    ],
  },

  // ==================== 05 DES ====================
  {
    tanggal: "05/12/2025 - 13:10",
    invoice: "INV-20251205-105",
    pembeli: "PT Karya Mandiri",
    total: "Rp. 3.150.000",
    metode: "Cash",
    sales: "Wanto",
    gudang: "Cideng",
    approved: { Vinna: true, Ari: true },
    status: "Lunas",
    detail: [
      {
        item: "CD30_biru_md",
        jumlahRol: 10,
        beratPerRol: [
          25.55, 26.23, 25.88, 26.14, 25.67, 25.91, 26.05, 25.73, 26.21, 25.87,
        ],
        hargaRol: 315000,
      },
    ],
  },

  // ==================== 06 DES ====================
  {
    tanggal: "06/12/2025 - 16:12",
    invoice: "INV-20251206-106",
    pembeli: "UD Berkah Abadi",
    total: "Rp. 2.720.000",
    metode: "Transfer",
    sales: "Doel",
    gudang: "A38",
    approved: { Vinna: true, Ari: false },
    status: "Lunas",
    detail: [
      {
        item: "CD30_hijau_md",
        jumlahRol: 8,
        beratPerRol: [25.41, 26.08, 25.78, 26.11, 25.92, 26.32, 25.67, 26.14],
        hargaRol: 340000,
      },
    ],
  },

  // ==================== 07 DES ====================
  {
    tanggal: "07/12/2025 - 10:29",
    invoice: "INV-20251207-107",
    pembeli: "Toko Setia Kawan",
    total: "Rp. 1.920.000",
    metode: "Cash",
    sales: "Kurnia",
    gudang: "AA17",
    approved: { Vinna: false, Ari: true },
    status: "Pending",
    detail: [
      {
        item: "CD30_kopi_sd",
        beratEcer: 24.0,
        hargaEcer: 80000,
      },
    ],
  },

  // ==================== 08 DES ====================
  {
    tanggal: "08/12/2025 - 15:55",
    invoice: "INV-20251208-108",
    pembeli: "CV Cahaya Mulya",
    total: "Rp. 3.360.000",
    metode: "Cash",
    sales: "Rahmat",
    gudang: "Cideng",
    approved: { Vinna: true, Ari: true },
    status: "Lunas",
    detail: [
      {
        item: "CD30_cream_md",
        jumlahRol: 12,
        beratPerRol: [
          26.15, 25.78, 26.22, 25.91, 26.08, 25.63, 26.33, 25.77, 26.11, 25.66,
          26.04, 25.92,
        ],
        hargaRol: 280000,
      },
    ],
  },

  // ==================== 09 DES ====================
  {
    tanggal: "09/12/2025 - 09:18",
    invoice: "INV-20251209-109",
    pembeli: "PT Kharisma",
    total: "Rp. 1.760.000",
    metode: "Tempo",
    sales: "Jana",
    gudang: "A38",
    approved: { Vinna: false, Ari: false },
    status: "Pending",
    detail: [
      {
        item: "CD30_salmon_sd",
        beratEcer: 22.0,
        hargaEcer: 80000,
      },
    ],
  },

  // ==================== 10 DES ====================
  {
    tanggal: "10/12/2025 - 14:02",
    invoice: "INV-20251210-110",
    pembeli: "Toko Prima",
    total: "Rp. 2.460.000",
    metode: "Cash",
    sales: "Ari",
    gudang: "AA17",
    approved: { Vinna: true, Ari: true },
    status: "Lunas",
    detail: [
      {
        item: "CD30_ungu_md",
        jumlahRol: 8,
        beratPerRol: [25.88, 26.22, 25.77, 26.04, 25.69, 26.18, 25.91, 26.15],
        hargaRol: 307500,
      },
    ],
  },

  // ==================== 11 DES ====================
  {
    tanggal: "11/12/2025 - 11:33",
    invoice: "INV-20251211-111",
    pembeli: "Toko Jaya Sentosa",
    total: "Rp. 1.840.000",
    metode: "Tempo",
    sales: "Vinna",
    gudang: "Cideng",
    approved: { Vinna: false, Ari: false },
    status: "Pending",
    detail: [
      {
        item: "CD30_pon_sd",
        beratEcer: 23.0,
        hargaEcer: 80000,
      },
    ],
  },

  // ==================== 12 DES ====================
  {
    tanggal: "12/12/2025 - 09:48",
    invoice: "INV-20251212-112",
    pembeli: "CV Sumber Makmur",
    total: "Rp. 3.150.000",
    metode: "Cash",
    sales: "Yakob",
    gudang: "A38",
    approved: { Vinna: true, Ari: true },
    status: "Lunas",
    detail: [
      {
        item: "CD30_toska_md",
        jumlahRol: 10,
        beratPerRol: [
          26.22, 25.88, 25.61, 26.14, 25.99, 25.55, 26.08, 25.81, 26.19, 25.74,
        ],
        hargaRol: 315000,
      },
    ],
  },

  // ==================== 13 DES ====================
  {
    tanggal: "13/12/2025 - 13:50",
    invoice: "INV-20251213-113",
    pembeli: "PT Mulya Abadi",
    total: "Rp. 2.240.000",
    metode: "Transfer",
    sales: "Egi",
    gudang: "AA17",
    approved: { Vinna: false, Ari: false },
    status: "Pending",
    detail: [
      {
        item: "CD30_kuning_sd",
        beratEcer: 28.0,
        hargaEcer: 80000,
      },
    ],
  },

  // ==================== 14 DES ====================
  {
    tanggal: "14/12/2025 - 10:05",
    invoice: "INV-20251214-114",
    pembeli: "UD Tekstil Sejahtera",
    total: "Rp. 3.360.000",
    metode: "Cash",
    sales: "Wanto",
    gudang: "Cideng",
    approved: { Vinna: true, Ari: true },
    status: "Lunas",
    detail: [
      {
        item: "CD30_abu_md",
        jumlahRol: 12,
        beratPerRol: [
          25.44, 26.12, 25.91, 26.31, 25.72, 25.88, 26.11, 25.93, 26.23, 25.66,
          26.09, 25.85,
        ],
        hargaRol: 280000,
      },
    ],
  },

  // ==================== 15 DES ====================
  {
    tanggal: "15/12/2025 - 15:25",
    invoice: "INV-20251215-115",
    pembeli: "Toko Cahaya Baru",
    total: "Rp. 1.760.000",
    metode: "Tempo",
    sales: "Doel",
    gudang: "AA17",
    approved: { Vinna: false, Ari: true },
    status: "Pending",
    detail: [
      {
        item: "CD30_coklat_sd",
        beratEcer: 22.0,
        hargaEcer: 80000,
      },
    ],
  },
];

export default dataPenjualan;
