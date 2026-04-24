// src/Constants/rollStatus.js

export const ROLL_STATUS = {
  AVAILABLE: {
    code: "AVAILABLE",
    label: "Tersedia",
    canBeMutated: true,
    showInManagement: true,
    color: "green",
    badgeClass: "bg-green-100 text-green-800",
  },
  OPEN: {
    code: "OPEN",
    label: "Terbuka",
    canBeMutated: false,
    showInManagement: true,
    color: "yellow",
    badgeClass: "bg-yellow-100 text-yellow-800",
  },
  DRAFT: {
    code: "DRAFT",
    label: "Dikunci SJ",
    canBeMutated: false,
    showInManagement: false,
    color: "blue",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  IN_TRANSIT: {
    code: "IN_TRANSIT",
    label: "Dalam Perjalanan",
    canBeMutated: false,
    showInManagement: false,
    color: "orange",
    badgeClass: "bg-orange-100 text-orange-800",
  },
  SOLD: {
    code: "SOLD",
    label: "Terjual",
    canBeMutated: false,
    showInManagement: true,
    color: "red",
    badgeClass: "bg-red-100 text-red-800",
  },
};

export const getRollStatus = (statusCode) => {
  if (!statusCode) return ROLL_STATUS.AVAILABLE;
  const normalized = statusCode.toUpperCase();
  return ROLL_STATUS[normalized] || ROLL_STATUS.AVAILABLE;
};

export const STATUS_FOR_MUTATION = ["AVAILABLE"];
export const STATUS_FOR_MANAGEMENT = ["AVAILABLE", "OPEN", "SOLD"];
export const STATUS_HIDDEN_IN_MANAGEMENT = ["DRAFT", "IN_TRANSIT"];
