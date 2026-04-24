import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function LogAktifitas({ logs = [] }) {
  const [expandedUser, setExpandedUser] = useState(null);

  const grouped = useMemo(() => {
    const result = {};
    logs.forEach((l) => {
      if (!result[l.user]) result[l.user] = [];
      result[l.user].push(l);
    });
    return result;
  }, [logs]);

  const dateHeader = logs.length > 0 ? logs[0].tanggal : null;

  return (
    <section className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-[#0B2C85] text-white px-6 py-3 font-semibold">
        {dateHeader
          ? `Log Aktivitas User - ${dateHeader.split("-").reverse().join("/")}`
          : "Log Aktivitas User"}
      </div>

      {logs.length === 0 ? (
        <p className="text-center text-gray-400 py-6">
          Pilih tanggal untuk melihat aktivitas.
        </p>
      ) : (
        <div className="bg-[#E9F0FB] divide-y divide-blue-200">
          {Object.entries(grouped).map(([user, list], idx) => (
            <div key={idx}>
              <div
                className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-blue-100 transition"
                onClick={() =>
                  setExpandedUser(expandedUser === user ? null : user)
                }
              >
                <div className="flex items-center gap-2">
                  {expandedUser === user ? (
                    <ChevronDown size={18} className="text-blue-600" />
                  ) : (
                    <ChevronRight size={18} className="text-blue-600" />
                  )}
                  <span className="font-semibold text-[#0B2C85]">{user}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {list.length} aktivitas
                </span>
              </div>

              {expandedUser === user && (
                <div className="bg-[#E9F0FB] px-10 py-2 space-y-2">
                  {list.map((log, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        <p className="text-sm text-gray-800">{log.text}</p>
                      </div>
                      <span className="text-sm text-gray-500">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
