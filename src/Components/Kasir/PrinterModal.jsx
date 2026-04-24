// src/Components/Kasir/PrinterModal.jsx
import { useState } from "react";
import { Printer, FileText, X, ChevronRight } from "lucide-react";

export default function PrinterModal({
  isOpen,
  onClose,
  onSelectPrinter,
  totalHarga,
  formatRupiah,
}) {
  const [selectedPrinter, setSelectedPrinter] = useState(null);

  if (!isOpen) return null;

  const printerOptions = [
    {
      id: "thermal",
      name: "Printer Thermal (72mm)",
      icon: Printer,
      description: "Cetak nota kecil / struk",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      id: "a4",
      name: "Nota Rangkap",
      icon: FileText,
      description: "Cetak nota format lengkap seperti gambar",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
  ];

  const handleSelect = (printerId) => {
    setSelectedPrinter(printerId);
  };

  const handleConfirm = () => {
    if (selectedPrinter) {
      onSelectPrinter(selectedPrinter);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-midblue p-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <Printer size={20} />
              <h2 className="text-lg font-semibold">Pilih Jenis Printer</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Info Total */}
          <div className="bg-gray-50 p-4 rounded-xl text-center border-2 border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total Pembayaran</p>
            <p className="text-2xl font-bold text-primary">
              {formatRupiah(totalHarga)}
            </p>
          </div>

          {/* Pilihan Printer */}
          <div className="space-y-3">
            {printerOptions.map((printer) => {
              const Icon = printer.icon;
              const isSelected = selectedPrinter === printer.id;

              return (
                <button
                  key={printer.id}
                  onClick={() => handleSelect(printer.id)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200
                    flex items-center gap-4
                    ${
                      isSelected
                        ? `${printer.bgColor} ${printer.borderColor} scale-[1.02] shadow-soft`
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className={`${printer.iconBg} p-3 rounded-lg`}>
                    <Icon size={24} className={printer.textColor} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-800">
                      {printer.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {printer.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className={isSelected ? printer.textColor : "text-gray-400"}
                  />
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedPrinter}
              className="flex-1 bg-gradient-to-r from-primary to-midblue text-white px-4 py-3 rounded-xl disabled:opacity-50 transition font-medium flex items-center justify-center gap-2 hover:shadow-medium"
            >
              <Printer size={16} />
              Lanjutkan
            </button>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-gray-400">
            Pilih jenis printer yang akan digunakan untuk mencetak nota
          </p>
        </div>
      </div>
    </div>
  );
}
