import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  PlusCircle,
  MinusCircle,
} from "lucide-react";

const AktivitasStok = () => {
  const [openDate, setOpenDate] = useState("18/08/2023");

  const data = [
    {
      date: "18/08/2025",
      logs: [
        { type: "in", text: "20 rol ke Gudang A38", time: "14:43" },
        { type: "out", text: "5 rol terjual ke Cideng", time: "14:02" },
        { type: "in", text: "12 kg ke Gudang AA17", time: "10:30" },
      ],
    },
    { date: "17/08/2025", logs: [] },
    { date: "16/08/2025", logs: [] },
    { date: "15/08/2025", logs: [] },
    { date: "14/08/2025", logs: [] },
  ];

  return (
    <div className="rounded-2xl shadow-soft overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="card-gradient-dark">
        <h3>Aktivitas Stok</h3>
        <div className="flex items-center bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm w-40">
          <Search className="text-white" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="text-xs pl-2 w-full placeholder-white/60"
          />
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="aktivitas-body">
        {data.map((item) => (
          <div key={item.date} className="mb-3">
            <button
              onClick={() =>
                setOpenDate(openDate === item.date ? null : item.date)
              }
              className="flex items-center gap-2 text-[#000B42] font-medium w-full"
            >
              {openDate === item.date ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              <span className="hover:underline cursor-pointer">
                {item.date}
              </span>
            </button>

            {openDate === item.date && (
              <div className="mt-2 ml-6 space-y-2 transition-all duration-200">
                {item.logs.length > 0 ? (
                  item.logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm text-[#000B42]"
                    >
                      <div className="flex items-center gap-2">
                        {log.type === "in" ? (
                          <PlusCircle
                            size={16}
                            className="text-[#52D726]"
                            strokeWidth={2.2}
                          />
                        ) : (
                          <MinusCircle
                            size={16}
                            className="text-[#E94B3C]"
                            strokeWidth={2.2}
                          />
                        )}
                        <span>{log.text}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{log.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs ml-6">
                    Tidak ada aktivitas
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AktivitasStok;
