'use client'

export default function TypingIndicator({ contactName }) {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      {/* Avatar animé */}
      <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0 animate-pulse">
        <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-400 to-cyan-400"></div>
      </div>

      {/* Bulle de "écrit..." */}
      <div className="relative">
        <div className="bg-white text-slate-800 rounded-3xl rounded-bl-md border-2 border-blue-100 shadow-md px-6 py-4 animate-scale-in">
          <div className="flex gap-1.5 items-center">
            {/* Points animés avec gradient */}
            <div 
              className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 animate-bounce" 
              style={{ animationDelay: '0ms', animationDuration: '1s' }}
            ></div>
            <div 
              className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 animate-bounce" 
              style={{ animationDelay: '150ms', animationDuration: '1s' }}
            ></div>
            <div 
              className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 animate-bounce" 
              style={{ animationDelay: '300ms', animationDuration: '1s' }}
            ></div>
          </div>
          
          {/* Texte sous la bulle */}
          <div className="absolute -bottom-6 left-0 whitespace-nowrap">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              {contactName} écrit...
            </span>
          </div>
        </div>

        {/* Effet de vague derrière */}
        <div className="absolute inset-0 bg-blue-100 rounded-3xl rounded-bl-md -z-10 animate-ping opacity-20"></div>
      </div>
    </div>
  );
}