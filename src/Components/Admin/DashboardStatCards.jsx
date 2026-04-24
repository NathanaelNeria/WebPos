import IconManajemenBarang from "../../Assets/manajemenbarangadmin.png";
import IconBarangMasuk from "../../Assets/barangmasukadmin.png";
import IconBarangKeluar from "../../Assets/barangkeluaradmin.png";
import { useNavigate } from "react-router-dom";

const DashboardStatCards = () => {
  const navigate = useNavigate(); // ✅ FIX DI SINI

  const cards = [
    {
      title: "Manajemen Barang dari Pabrik",
      desc: "Lihat daftar barang di Gudang",
      button: "Kelola",
      icon: IconManajemenBarang,
      path: "/Warehouse/manajemenBarang",
    },
    {
      title: "Barang Masuk dari Gudang Lain",
      desc: "Catat barang yang masuk ke gudang",
      button: "Input",
      icon: IconBarangMasuk,
      path: "/Warehouse/barangMasuk",
    },
    {
      title: "Barang Keluar dari Gudang",
      desc: "Catat pemindahan stock antar gudang",
      button: "Mutasi",
      icon: IconBarangKeluar,
      path: "/Warehouse/MutasiGudang",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {cards.map((item, i) => (
        <div
          key={i}
          className="
            bg-gradient-to-b from-[#0C1E6E] to-[#07124A]
            rounded-3xl px-8 py-10
            text-white shadow-xl
            flex flex-col items-center text-center
          "
        >
          <img
            src={item.icon}
            alt={item.title}
            className="w-20 h-20 mb-6 object-contain"
          />

          <h3 className="text-base font-semibold leading-snug mb-2">
            {item.title}
          </h3>

          <p className="text-xs text-white/70 mb-8">{item.desc}</p>

          <button
            onClick={() => navigate(item.path)}
            className="
              bg-yellow-400 hover:bg-yellow-500
              text-[#000B42] text-sm font-semibold
              px-8 py-2.5 rounded-lg transition
            "
          >
            {item.button}
          </button>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatCards;
