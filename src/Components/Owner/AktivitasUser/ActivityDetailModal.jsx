// src/Components/Owner/AktivitasUser/ActivityDetailModal.jsx
import {
  X,
  User,
  Shield,
  Clock,
  MapPin,
  FileText,
  Tag,
  Activity,
} from "lucide-react";

const formatTanggal = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
};

const getActivityIcon = (tipe) => {
  switch (tipe) {
    case "LOGIN":
      return "🔑";
    case "LOGOUT":
      return "🚪";
    case "PENJUALAN":
      return "💰";
    case "VOID_NOTA":
      return "❌";
    case "OVERRIDE_HARGA":
      return "✏️";
    case "MUTASI":
      return "🔄";
    case "BARANG_MASUK":
      return "📦";
    case "CREATE_USER":
      return "👤➕";
    case "UPDATE_USER":
      return "👤✏️";
    case "DELETE_USER":
      return "👤🗑️";
    default:
      return "📋";
  }
};

const getActivityColor = (tipe) => {
  switch (tipe) {
    case "LOGIN":
    case "LOGOUT":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "PENJUALAN":
      return "bg-green-100 text-green-700 border-green-300";
    case "VOID_NOTA":
      return "bg-red-100 text-red-700 border-red-300";
    case "OVERRIDE_HARGA":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "MUTASI":
    case "BARANG_MASUK":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "CREATE_USER":
    case "UPDATE_USER":
    case "DELETE_USER":
      return "bg-indigo-100 text-indigo-700 border-indigo-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export const ActivityDetailModal = ({ isOpen, onClose, activity }) => {
  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-primary px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Activity className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white">Detail Aktivitas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-4">
          {/* Activity Type Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getActivityColor(activity.tipe)}`}
            >
              <span className="mr-1">{getActivityIcon(activity.tipe)}</span>
              {activity.tipe}
            </span>
            <span className="text-xs text-gray-500">ID: {activity.id}</span>
          </div>

          {/* User Info */}
          <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/10">
            <h3 className="text-sm font-medium text-darkblue mb-3 flex items-center gap-2">
              <User size={16} className="text-primary" />
              Informasi User
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nama</p>
                <p className="font-medium text-darkblue">
                  {activity.user_name || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-medium text-darkblue">
                  {activity.user_email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="font-medium text-darkblue">
                  {activity.user_role || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">User ID</p>
                <p className="font-mono text-xs text-gray-600">
                  {activity.user_id}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-darkblue mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Detail Aktivitas
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Waktu</p>
                  <p className="text-sm text-darkblue">
                    {formatTanggal(activity.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Tag size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Entity ID</p>
                  <p className="font-mono text-sm text-darkblue">
                    {activity.entity_id || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileText size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Deskripsi</p>
                  <p className="text-sm text-darkblue">
                    {activity.action_details || "-"}
                  </p>
                </div>
              </div>

              {activity.metadata &&
                Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-darkblue mb-2">
                      Metadata
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span>
                          <span className="ml-1 text-darkblue">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-darkblue mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Informasi Lokasi
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Gudang</p>
                <p className="font-medium text-darkblue">
                  {activity.gudang_nama || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">IP Address</p>
                <p className="font-mono text-sm text-darkblue">
                  {activity.ip_address || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Immutable Badge */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
            <Shield size={16} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">
                Immutable Record
              </p>
              <p className="text-xs text-amber-600">
                Aktivitas ini bersifat immutable dan tidak dapat diubah atau
                dihapus. Tercatat di audit trail sebagai source of truth.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
