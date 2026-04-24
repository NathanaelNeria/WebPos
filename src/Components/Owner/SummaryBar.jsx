const SummaryBar = ({ label, value }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full">
      <div className="h-2 bg-yellow-400 rounded-full w-2/3" />
    </div>
  </div>
);
export default SummaryBar;
