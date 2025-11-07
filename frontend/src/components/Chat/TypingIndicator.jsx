'use client'

export default function TypingIndicator({ contactName }) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        <span className="text-sm text-gray-500">{contactName} écrit...</span>
      </div>
    </div>
  );
}