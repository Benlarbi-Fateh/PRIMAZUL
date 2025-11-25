'use client'

export default function TypingIndicator({ contactName }) {
  return (
    <div className="flex items-end gap-2">
      {/* Avatar simple */}
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <div className="w-4 h-4 rounded-full bg-blue-400"></div>
      </div>

      {/* Bulle discrète */}
      <div className="bg-white rounded-2xl rounded-bl-md border border-gray-200 shadow-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
        </div>
      </div>
    </div>
  );
}