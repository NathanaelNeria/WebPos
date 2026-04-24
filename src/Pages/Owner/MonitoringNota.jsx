import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { useAuth } from "../../Hooks/useAuth";

import { db } from "../../Services/firebase";
import TabelTransaksi from "../../Components/Owner/TabelTransaksi";
import FilterBar from "../../Components/Owner/FilterTransaksi"; // pastikan path benar

export default function MonitoringNota() {
  const { user } = useAuth();
  const currentUserName = user?.nama;

  const [dataTransaksi, setDataTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

  // ======================
  // FILTER STATE
  // ======================
  const [periode, setPeriode] = useState("7days");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [approvedStatus, setApprovedStatus] = useState("ALL");

  // ======================
  // FILTER OPTIONS
  // ======================
  const periodeOptions = [
    { value: "today", label: "Hari Ini" },
    { value: "7days", label: "7 Hari Terakhir" },
    { value: "30days", label: "30 Hari Terakhir" },
    { value: "custom", label: "Custom" },
  ];

  const statusOptions = [
    { value: "", label: "Semua" },
    { value: "LUNAS", label: "Lunas" },
    { value: "PENDING", label: "PENDING" },
  ];

  // ======================
  // FETCH DATA
  // ======================
  useEffect(() => {
    const q = query(
      collection(db, "transaksiPenjualan"),
      where("metode_pembayaran", "in", ["CASH", "TRANSFER", "QRIS", "CARD"]),
      orderBy("tanggal_transaksi", "desc"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDataTransaksi(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ======================
  // FILTER LOGIC
  // ======================
  const filteredLogs = useMemo(() => {
    let result = [...dataTransaksi];

    // ======================================================
    // 🔍 SEARCH (nota, customer, sales)
    // ======================================================
    if (searchTerm) {
      const keyword = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.nomor_nota?.toLowerCase().includes(keyword) ||
          item.customer?.nama?.toLowerCase().includes(keyword) ||
          item.kasir_nama?.toLowerCase().includes(keyword),
      );
    }

    // ======================================================
    // ✅ FILTER STATUS APPROVED (CHECKLIST)
    // ======================================================
    if (approvedStatus === "APPROVED") {
      result = result.filter(
        (item) => item.approved?.[currentUserName] === true,
      );
    }

    if (approvedStatus === "UNAPPROVED") {
      result = result.filter(
        (item) =>
          item.approved?.[currentUserName] === false ||
          item.approved?.[currentUserName] === undefined,
      );
    }

    // ======================================================
    // 🏷️ STATUS OWNER
    // ======================================================
    if (status) {
      result = result.filter((item) => item.status_owner === status);
    }

    // ======================================================
    // 📅 PERIODE
    // ======================================================
    if (periode !== "custom") {
      let startDate = null;
      const now = new Date();

      if (periode === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      if (periode === "7days") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }

      if (periode === "30days") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      if (startDate) {
        result = result.filter(
          (item) => item.tanggal_transaksi?.toDate() >= startDate,
        );
      }
    }

    // ======================================================
    // 📆 CUSTOM RANGE
    // ======================================================
    if (periode === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);

      result = result.filter((item) => {
        const date = item.tanggal_transaksi?.toDate();
        return date >= start && date <= end;
      });
    }

    return result;
  }, [
    dataTransaksi,
    searchTerm,
    status,
    periode,
    customRange,
    approvedStatus,
    currentUserName,
  ]);

  // ======================
  // RENDER
  // ======================
  return (
    <div className="flex min-h-screen bg-[#F5F6FA]">
      <main className="flex-1 px-6 py-6 overflow-y-auto space-y-4">
        <FilterBar
          periode={periode}
          setPeriode={setPeriode}
          customRange={customRange}
          setCustomRange={setCustomRange}
          periodeOptions={periodeOptions}
          statusOptions={statusOptions}
          selectedStatus={status}
          setSelectedStatus={setStatus}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onApply={() => {}}
          onReset={() => {
            setPeriode("7days");
            setCustomRange({ start: "", end: "" });
            setStatus("");
            setSearchTerm("");
          }}
          approvedStatus={approvedStatus}
          setApprovedStatus={setApprovedStatus}
          showApproved={true}
        />

        <TabelTransaksi
          page="Nota"
          invoiceData={filteredLogs}
          loading={loading}
        />
      </main>
    </div>
  );
}
