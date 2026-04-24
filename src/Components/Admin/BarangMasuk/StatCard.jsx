// Components/BarangMasuk/StatCard.jsx
import { Package } from "lucide-react";
import { STAT_CARD_COLORS } from "../../constants/barangMasukConstants";

export default function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color = "primary",
}) {
  const classes = STAT_CARD_COLORS[color] || STAT_CARD_COLORS.primary;

  return (
    <div
      className={`bg-white rounded-xl shadow-soft border ${classes.border} p-5 hover:shadow-medium transition-all duration-300 group hover:scale-[1.02] relative overflow-hidden`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${classes.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${classes.text}`}>{value}</p>
            {subValue && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Package size={12} className="text-gray-400" />
                {subValue}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${classes.bgLight} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`w-6 h-6 ${classes.text}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
