export default function ActionButton({ onClick, loading, text, color }) {
  const classes = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    green: "bg-green-600 hover:bg-green-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full px-4 py-3 rounded-xl text-white font-semibold 
        shadow-lg hover:scale-[1.02] disabled:opacity-60 
        transition-transform ${classes[color]}`}
    >
      {loading ? "Veuillez patienter..." : text}
    </button>
  );
}
