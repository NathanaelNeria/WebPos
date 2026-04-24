// src/Components/Owner/RiwayatMutasi/StatusBadge.jsx
import { Truck, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  dikirim: {
    label: "Dikirim",
    icon: Truck,
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  dalam_perjalanan: {
    label: "Dalam Perjalanan",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  sampai: {
    label: "Sampai",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700 border-green-300",
  },
  diterima: {
    label: "Diterima",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  draft: {
    label: "Draft",
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-700 border-gray-300",
  },
  dibatalkan: {
    label: "Dibatalkan",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-300",
  },
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};
