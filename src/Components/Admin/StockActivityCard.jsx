// Components/Admin/StockActivityCard.jsx
import {
  Search,
  ChevronDown,
  X,
  Package,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Warehouse,
  FileText,
  Calendar,
  RefreshCw,
  ArrowDownCircle,
  FileBox,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../Services/firebase";
import { useAuth } from "../../Hooks/useAuth";
import Swal from "sweetalert2";

const StockActivityCard = () => {
  const { currentUser } = useAuth();
  const gudangId = currentUser?.gudangId || null;

  const [activities, setActivities] = useState([]);
  const [openDays, setOpenDays] = useState({ 0: true });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [detailItems, setDetailItems] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // STATISTICS
  const [stats, setStats] = useState({
    today: { masuk: 0, keluar: 0, totalBerat: 0 },
    week: { masuk: 0, keluar: 0, totalBerat: 0 },
  });

  const toggleDay = (i) => setOpenDays((p) => ({ ...p, [i]: !p[i] }));

  /* ================= FILTER OPTIONS ================= */
  const filterOptions = [
    {
      value: "all",
      label: "Semua Aktivitas",
      icon: <Package size={16} />,
      color: "bg-gray-500",
    },
    {
      value: "barang_masuk",
      label: "Barang Masuk",
      icon: <ArrowDownCircle size={16} />,
      color: "bg-green-500",
    },
    {
      value: "mutasi_masuk",
      label: "Mutasi Masuk",
      icon: <ArrowLeft size={16} />,
      color: "bg-purple-500",
    },
    {
      value: "mutasi_keluar",
      label: "Mutasi Keluar",
      icon: <ArrowRight size={16} />,
      color: "bg-amber-500",
    },
    {
      value: "adjustment",
      label: "Adjustment",
      icon: <BarChart3 size={16} />,
      color: "bg-teal-500",
    },
  ];

  const getSelectedFilterLabel = () => {
    const option = filterOptions.find((f) => f.value === selectedFilter);
    return option ? option.label : "Semua Aktivitas";
  };

  /* ================= FETCH STOK TRANSAKSI ================= */
  const fetchStokTransaksi = useCallback(async () => {
    if (!gudangId) return;

    try {
      setRefreshing(true);

      // Fetch stokTransaksi dari database
      const stokTransaksiRef = collection(db, "transaksiStok");
      const q = query(
        stokTransaksiRef,
        where("gudangId", "==", gudangId),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snap = await getDocs(q);
      const grouped = {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      let todayStats = { masuk: 0, keluar: 0, totalBerat: 0 };
      let weekStats = { masuk: 0, keluar: 0, totalBerat: 0 };

      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();

        if (!d.createdAt) return;

        const dateObj = d.createdAt.toDate();
        const dateKey = dateObj.toLocaleDateString("id-ID");
        if (!grouped[dateKey]) grouped[dateKey] = [];

        const time = dateObj.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const timeFull = dateObj.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        // Determine activity type berdasarkan field 'type' yang sudah ada
        let actionType = "";
        let icon = <Package size={16} />;
        let color = "bg-blue-500";
        let bgColor = "bg-blue-50";
        let textColor = "text-blue-700";
        let borderColor = "border-blue-200";
        let isMasuk = false;

        // Gunakan langsung field 'type' dari database
        switch (d.type) {
          case "barang_masuk":
            actionType = "BARANG MASUK";
            isMasuk = true;
            icon = <ArrowDownCircle size={16} />;
            color = "bg-green-500";
            bgColor = "bg-green-50";
            textColor = "text-green-700";
            borderColor = "border-green-200";
            break;

          case "mutasi_masuk":
            actionType = "MUTASI MASUK";
            isMasuk = true;
            icon = <ArrowLeft size={16} />;
            color = "bg-purple-500";
            bgColor = "bg-purple-50";
            textColor = "text-purple-700";
            borderColor = "border-purple-200";
            break;

          case "mutasi_keluar":
            actionType = "MUTASI KELUAR";
            isMasuk = false;
            icon = <ArrowRight size={16} />;
            color = "bg-amber-500";
            bgColor = "bg-amber-50";
            textColor = "text-amber-700";
            borderColor = "border-amber-200";
            break;

          case "adjustment":
            const qty = d.qty || 0;
            if (qty > 0) {
              actionType = "ADJUSTMENT (+)";
              isMasuk = true;
              icon = <TrendingUp size={16} />;
              color = "bg-teal-500";
              bgColor = "bg-teal-50";
              textColor = "text-teal-700";
              borderColor = "border-teal-200";
            } else {
              actionType = "ADJUSTMENT (-)";
              isMasuk = false;
              icon = <TrendingDown size={16} />;
              color = "bg-orange-500";
              bgColor = "bg-orange-50";
              textColor = "text-orange-700";
              borderColor = "border-orange-200";
            }
            break;

          default:
            actionType = d.type?.toUpperCase() || "TRANSAKSI";
            isMasuk = true;
        }

        // Get jumlah roll and berat
        const jumlahRol = d.qty || 1;
        const totalBerat = d.beratKg || 0;

        // Update stats
        if (dateObj >= today) {
          if (isMasuk) {
            todayStats.masuk += jumlahRol;
            todayStats.totalBerat += totalBerat;
          } else {
            todayStats.keluar += jumlahRol;
            todayStats.totalBerat += totalBerat;
          }
        }
        if (dateObj >= weekAgo) {
          if (isMasuk) {
            weekStats.masuk += jumlahRol;
            weekStats.totalBerat += totalBerat;
          } else {
            weekStats.keluar += jumlahRol;
            weekStats.totalBerat += totalBerat;
          }
        }

        // Get info pihak terkait
        let pihakNama = "-";
        let pihakTipe = "-";

        if (d.type === "barang_masuk" && d.supplier) {
          pihakNama = d.supplier;
          pihakTipe = "Supplier";
        }
        // Untuk mutasi, ekstrak info dari notes atau data lainnya
        else if (
          (d.type === "mutasi_masuk" || d.type === "mutasi_keluar") &&
          d.notes
        ) {
          // Coba ekstrak nama gudang dari notes
          pihakTipe = "Gudang";

          // Cari pola "dari [gudang]" atau "ke [gudang]" dalam notes
          const dariMatch = d.notes.match(/dari\s+([^\s]+)/i);
          const keMatch = d.notes.match(/ke\s+([^\s]+)/i);

          if (d.type === "mutasi_masuk" && dariMatch) {
            pihakNama = dariMatch[1];
          } else if (d.type === "mutasi_keluar" && keMatch) {
            pihakNama = keMatch[1];
          } else {
            pihakNama = "Gudang Lain";
          }
        }

        // Untuk display text
        let displayText = `${d.produkNama || "Produk"} (${
          d.produkKode || "-"
        })`;

        // Tambahkan info mutasi jika ada
        if (d.type === "mutasi_masuk" || d.type === "mutasi_keluar") {
          if (d.type === "mutasi_masuk") {
            displayText = `${d.produkNama} (Mutasi Masuk)`;
          } else {
            displayText = `${d.produkNama} (Mutasi Keluar)`;
          }
        }

        grouped[dateKey].push({
          id: docSnap.id,
          jenis: d.type,
          filterType: d.type,
          actionType,
          text: displayText,
          time,
          timeFull,
          tanggal: d.createdAt,
          jumlahRol: Math.abs(jumlahRol),
          jumlahRolSigned: jumlahRol,
          totalBerat,
          kode: d.produkKode || "-",
          nama: d.produkNama || "Produk",
          kategori: d.kategori || "-",
          pihakNama,
          pihakTipe,
          referenceId: d.referenceId,
          rollId: d.rollId,
          notes: d.notes || "",
          supplier: d.supplier,
          statusBefore: d.statusBefore,
          statusAfter: d.statusAfter,
          icon,
          color,
          bgColor,
          textColor,
          borderColor,
          docData: d,
          isMasuk,
          qty: jumlahRol,
        });
      });

      // Convert to array and sort by date
      const sortedActivities = Object.entries(grouped)
        .map(([dateKey, logs]) => ({
          date: new Date(
            dateKey.split("/").reverse().join("-")
          ).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          dateShort: new Date(
            dateKey.split("/").reverse().join("-")
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          }),
          dateKey,
          logs: logs.sort((a, b) => b.tanggal - a.tanggal),
        }))
        .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));

      setActivities(sortedActivities);
      setStats({
        today: todayStats,
        week: weekStats,
      });
    } catch (err) {
      console.error("ERROR FETCH STOK TRANSAKSI:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat data",
        text: err.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gudangId]);

  useEffect(() => {
    fetchStokTransaksi();
  }, [fetchStokTransaksi]);

  /* ================= FILTER ACTIVITIES ================= */
  const filteredActivities = useMemo(() => {
    return activities
      .map((day) => ({
        ...day,
        logs: day.logs.filter((log) => {
          // Filter by selected type - langsung gunakan filterType yang sama dengan type
          if (selectedFilter !== "all") {
            return log.filterType === selectedFilter;
          }

          // Filter by search term
          if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            return (
              log.nama?.toLowerCase().includes(searchLower) ||
              log.kode?.toLowerCase().includes(searchLower) ||
              log.rollId?.toLowerCase().includes(searchLower) ||
              log.notes?.toLowerCase().includes(searchLower) ||
              log.pihakNama?.toLowerCase().includes(searchLower)
            );
          }

          return true;
        }),
      }))
      .filter((day) => day.logs.length > 0);
  }, [activities, searchTerm, selectedFilter]);

  /* ================= OPEN DETAIL ================= */
  const openDetail = async (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
    setLoadingDetail(true);
    setDetailItems([]);

    try {
      setModalTitle(`${activity.actionType} - ${activity.nama}`);

      const items = [
        {
          label: "Kode Produk",
          value: activity.kode,
          icon: <Package size={14} />,
        },
        {
          label: "Nama Produk",
          value: activity.nama,
          icon: <FileBox size={14} />,
        },
        {
          label: "Jumlah Roll",
          value: `${activity.isMasuk ? "+" : "-"}${activity.jumlahRol} roll`,
          icon: <Package size={14} />,
        },
        {
          label: "Berat",
          value: `${activity.totalBerat?.toFixed(2)} KG`,
          icon: <TrendingUp size={14} />,
        },
      ];

      if (activity.pihakNama && activity.pihakNama !== "-") {
        items.push({
          label: activity.pihakTipe,
          value: activity.pihakNama,
          icon:
            activity.pihakTipe === "Gudang" ? (
              <Warehouse size={14} />
            ) : (
              <Users size={14} />
            ),
        });
      }

      if (activity.rollId) {
        items.push({
          label: "Nomor Roll",
          value: activity.rollId,
          icon: <FileText size={14} />,
        });
      }

      items.push(
        {
          label: "Waktu Transaksi",
          value: activity.timeFull,
          icon: <Calendar size={14} />,
        },
        {
          label: "Dibuat Oleh",
          value: activity.docData?.createdByName || "-",
          icon: <Users size={14} />,
        }
      );

      // Tambahkan info dari notes jika ada
      if (activity.notes) {
        items.push({
          label: "Keterangan",
          value: activity.notes,
          icon: <FileText size={14} />,
        });
      }

      // Status sebelum dan sesudah untuk mutasi
      if (
        activity.jenis === "mutasi_masuk" ||
        activity.jenis === "mutasi_keluar"
      ) {
        items.push(
          {
            label: "Status Sebelum",
            value: activity.statusBefore || "-",
            icon: <Calendar size={14} />,
          },
          {
            label: "Status Sesudah",
            value: activity.statusAfter || "-",
            icon: <Calendar size={14} />,
          }
        );
      }

      setDetailItems(items);
    } catch (err) {
      console.error("ERROR LOADING DETAIL:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg mt-8 border">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C1E6E]"></div>
          <span className="ml-3 text-gray-600">Memuat aktivitas stok...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CARD */}
      <div className="bg-white rounded-2xl shadow-lg mt-8 overflow-hidden border">
        {/* Header dengan stats */}
        <div className="bg-gradient-to-r from-[#0C1E6E] to-[#07124A] px-6 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-white font-bold text-xl">Aktivitas Stok</h2>
              <p className="text-blue-100 text-sm mt-1">
                {currentUser?.gudangNama || "Gudang"} • {activities.length} hari
                terakhir
              </p>
            </div>
            <button
              onClick={fetchStokTransaksi}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition disabled:opacity-50 text-white"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memuat..." : "Refresh"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <div className="text-white/80 text-sm">Masuk (Hari Ini)</div>
              <div className="text-white text-xl font-bold">
                {stats.today.masuk} roll
              </div>
              <div className="text-white/60 text-xs">
                {stats.today.totalBerat.toFixed(2)} KG
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <div className="text-white/80 text-sm">Keluar (Hari Ini)</div>
              <div className="text-white text-xl font-bold">
                {stats.today.keluar} roll
              </div>
              <div className="text-white/60 text-xs">
                {stats.today.totalBerat.toFixed(2)} KG
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <div className="text-white/80 text-sm">Total (7 Hari)</div>
              <div className="text-white text-xl font-bold">
                {stats.week.masuk + stats.week.keluar} roll
              </div>
              <div className="text-white/60 text-xs">
                {stats.week.totalBerat.toFixed(2)} KG
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <div className="text-white/80 text-sm">Transaksi</div>
              <div className="text-white text-xl font-bold">
                {activities.reduce((sum, day) => sum + day.logs.length, 0)}
              </div>
              <div className="text-white/60 text-xs">Total aktivitas</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder="Cari produk, kode, roll, atau catatan..."
                className="w-full pl-10 pr-4 py-3 rounded-lg outline-none text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition whitespace-nowrap min-w-[180px] justify-between"
              >
                <span>{getSelectedFilterLabel()}</span>
                <ChevronDown
                  size={16}
                  className={showFilterDropdown ? "rotate-180" : ""}
                />
              </button>

              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-20 w-full min-w-[200px] py-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-50 ${
                          selectedFilter === option.value ? "bg-gray-100" : ""
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${option.color}`}
                        ></div>
                        <span className="text-gray-700">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="px-4 py-2 max-h-[600px] overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Package size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                Tidak ada aktivitas stok
              </p>
              {searchTerm ? (
                <p className="text-sm text-gray-500 mt-1">
                  Tidak ditemukan untuk "{searchTerm}"
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFilter !== "all"
                    ? `Tidak ada aktivitas ${filterOptions
                        .find((f) => f.value === selectedFilter)
                        ?.label?.toLowerCase()}`
                    : "Belum ada transaksi"}
                </p>
              )}
            </div>
          ) : (
            filteredActivities.map((day, i) => (
              <div key={i} className="mb-4 last:mb-0">
                {/* Day Header */}
                <div className="sticky top-0 bg-white z-10 pt-4 pb-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#0C1E6E] rounded-full"></div>
                      <div>
                        <h3 className="font-bold text-gray-800">{day.date}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            {day.logs.filter((l) => l.isMasuk).length} Masuk
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingDown size={12} />
                            {day.logs.filter((l) => !l.isMasuk).length} Keluar
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleDay(i)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition text-gray-400 ${
                          openDays[i] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Activities */}
                {openDays[i] && (
                  <div className="space-y-2 mt-3">
                    {day.logs.map((log, idx) => (
                      <div
                        key={idx}
                        onClick={() => openDetail(log)}
                        className={`${log.bgColor} ${log.borderColor} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 group`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${log.color} text-white mt-1`}
                            >
                              {log.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${log.textColor} ${log.bgColor} border ${log.borderColor}`}
                                >
                                  {log.actionType}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {log.time}
                                </span>
                              </div>

                              <h4 className="font-bold text-gray-800 truncate">
                                {log.text}
                              </h4>

                              <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                <span
                                  className={`font-semibold ${
                                    log.isMasuk
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {log.isMasuk ? "+" : "-"}
                                  {log.jumlahRol} roll
                                </span>
                                <span className="font-semibold text-gray-700">
                                  {log.totalBerat?.toFixed(2)} KG
                                </span>
                              </div>

                              {log.pihakNama && log.pihakNama !== "-" && (
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  {log.pihakTipe === "Gudang" ? (
                                    <Warehouse
                                      size={12}
                                      className="text-gray-400"
                                    />
                                  ) : (
                                    <Users
                                      size={12}
                                      className="text-gray-400"
                                    />
                                  )}
                                  <span className="text-gray-600">
                                    {log.pihakNama}
                                  </span>
                                </div>
                              )}

                              {log.rollId && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <Package size={10} />
                                  <span>Roll: {log.rollId}</span>
                                </div>
                              )}

                              {log.notes && (
                                <div className="mt-2 text-xs text-gray-600 line-clamp-2">
                                  {log.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="hidden group-hover:block ml-4">
                            <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                              <ChevronDown
                                size={16}
                                className="text-gray-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredActivities.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Menampilkan{" "}
                <span className="font-semibold">
                  {filteredActivities.reduce(
                    (sum, day) => sum + day.logs.length,
                    0
                  )}
                </span>{" "}
                dari{" "}
                <span className="font-semibold">
                  {activities.reduce((sum, day) => sum + day.logs.length, 0)}
                </span>{" "}
                aktivitas
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-sm text-[#0C1E6E] hover:text-[#243A8C] font-medium"
              >
                Kembali ke atas ↑
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-[#0C1E6E] to-[#07124A] text-white">
              <div>
                <h3 className="font-bold text-xl">{modalTitle}</h3>
                {selectedActivity && (
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedActivity.actionType} • {selectedActivity.timeFull}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C1E6E]"></div>
                  <span className="ml-3 text-gray-600">Memuat detail...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          {item.icon}
                          {item.label}
                        </div>
                        <div className="font-medium text-gray-800 break-words">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  {selectedActivity && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-xl border">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">
                            Jenis Transaksi
                          </div>
                          <div
                            className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold inline-block ${selectedActivity.textColor} ${selectedActivity.bgColor}`}
                          >
                            {selectedActivity.actionType}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">
                            Total Roll
                          </div>
                          <div className="text-2xl font-bold text-gray-800 mt-1">
                            {selectedActivity.isMasuk ? "+" : "-"}
                            {selectedActivity.jumlahRol}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">
                            Total Berat
                          </div>
                          <div className="text-2xl font-bold text-gray-800 mt-1">
                            {selectedActivity.totalBerat?.toFixed(2)} KG
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                ID: {selectedActivity?.id?.substring(0, 8)}...
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StockActivityCard;
