// Components/CardStat.jsx - TETAP SAMA
const CardStat = ({ title, value, subvalue, icon }) => {
  return (
    <div
      className="flex flex-col justify-between p-5 rounded-xl text-white shadow-md"
      style={{
        background: "linear-gradient(90deg, #000B42 0%, #142370 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        {icon && <div className="text-lg">{icon}</div>}
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        {subvalue && <p className="text-sm opacity-80 mt-1">{subvalue}</p>}
      </div>
    </div>
  );
};

export default CardStat;
