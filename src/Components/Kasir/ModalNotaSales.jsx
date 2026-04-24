import { db } from "../../Services/firebase";
import { useEffect, useState } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import TabelTransaksiKasir from "./TabelTransaksiKasir";
import { X } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";

export default function ModalNotaSales({ onClose }) {
  const [nota, setNota] = useState([]);
  const [loading, setLoading] = useState(true);
  const { nama } = useAuth();
  const [filteredLogs, setFilteredLogs] = useState([]);
  const date = new Date().toLocaleDateString("id-ID");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transaksi"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.sales === nama);
      setNota(data);
      setLoading(false);
    });
    return () => unsub();
  }, [nama]);

  useEffect(() => {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    const todayFormatted = `${dd}/${mm}/${yyyy}`;
    console.log("Today formatted:", todayFormatted);

    const filtered = nota.filter((item) => {
      if (!item.tanggal) return false;

      const tanggalOnly = item.tanggal.split(" - ")[0];

      return tanggalOnly === todayFormatted;
    });

    setFilteredLogs(filtered);
  }, [nota]);

  return (
    <div className="fixed rounded-lg inset-0 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-fit shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          <X size={24} strokeWidth={2} />
        </button>
        <h2 className="text-lg font-semibold mb-4">
          Daftar Nota {nama} Hari Ini {date}
        </h2>

        <TabelTransaksiKasir invoiceData={filteredLogs} loading={loading} />
      </div>
    </div>
  );
}
