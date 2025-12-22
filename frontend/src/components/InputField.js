export default function InputField({ type, placeholder, value, onChange }) {
  return (
    <div className="flex flex-col">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
          bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 
          outline-none text-gray-900 dark:text-gray-100 transition-all"
      />
    </div>
  );
}
