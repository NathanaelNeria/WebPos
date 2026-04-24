import DotMatrixNota from "./PrintNotaDotMatrix";

export default function ModalPreviewNota({ data, onClose, tipeNota, onPrint }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] print:hidden">
      <div
        className={`bg-white max-h-[90vh] overflow-y-auto p-3 relative
          ${tipeNota === "thermal" ? "w-[80mm]" : "w-[9.5in]"}
        `}
      >
        <div className="flex justify-between mb-2 print:hidden">
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border rounded"
          >
            Tutup
          </button>

          <button
            onClick={onPrint}
            className="text-xs px-2 py-1 bg-black text-white rounded"
          >
            Print
          </button>
        </div>

        <DotMatrixNota data={data} tipeNota={tipeNota} />
      </div>
    </div>
  );
}
