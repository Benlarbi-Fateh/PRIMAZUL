"use client";

import { useTheme } from "@/context/ThemeContext";

export default function TypingIndicator({ contactName }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bubbleClass =
    "rounded-2xl rounded-bl-md border px-4 py-3 shadow-sm " +
    (isDark
      ? "bg-slate-800 border-slate-700"
      : "bg-white border-gray-200");

  const dotClass =
    "w-1.5 h-1.5 rounded-full animate-bounce " +
    (isDark ? "bg-slate-400" : "bg-gray-400");

  return (
    <div className="flex items-end gap-2">
      {/* Avatar simple */}
      <div
        className={
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 " +
          (isDark ? "bg-sky-500/20" : "bg-blue-100")
        }
      >
        <div
          className={
            "w-4 h-4 rounded-full " +
            (isDark ? "bg-sky-400" : "bg-blue-400")
          }
        />
      </div>

      {/* Bulle */}
      <div className={bubbleClass}>
        <div className="flex gap-1 items-center">
          <span className={dotClass} style={{ animationDelay: "0s" }} />
          <span className={dotClass} style={{ animationDelay: "0.15s" }} />
          <span className={dotClass} style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    </div>
  );
}