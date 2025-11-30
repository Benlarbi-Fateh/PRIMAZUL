"use client";

import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  File,
  Mic,
  Download,
  ExternalLink,
  Check,
  CheckCheck,
} from "lucide-react";
import Image from "next/image";
import VoiceMessage from "./VoiceMessage";
import { useTheme } from "@/context/ThemeContext";

// Composant séparateur de date
export function DateSeparator({ date }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const formatDate = (d) => {
    const dateObj = new Date(d);
    if (isToday(dateObj)) return "Aujourd'hui";
    if (isYesterday(dateObj)) return "Hier";
    return format(dateObj, "EEEE d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div
        className={
          "px-3 py-1 rounded-full " +
          (isDark ? "bg-slate-800/80" : "bg-slate-100")
        }
      >
        <span
          className={
            "text-xs font-medium capitalize " +
            (isDark ? "text-slate-200" : "text-slate-500")
          }
        >
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}

export default function MessageBubble({
  message,
  isMine,
  isGroup,
  isLast = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const formatTime = (date) => {
    try {
      return format(new Date(date), "HH:mm", { locale: fr });
    } catch {
      return "";
    }
  };

  const getFileType = () => {
    if (message.type === "image") return "image";
    if (message.type === "audio") return "audio";
    if (message.type === "file") return "file";
    if (message.type === "voice") return "voice";
    return "text";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleOpenFile = () =>
    message.fileUrl && window.open(message.fileUrl, "_blank");

  const handleDownload = () => {
    if (message.fileUrl) {
      const link = document.createElement("a");
      link.href = message.fileUrl;
      link.download = message.fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const status = message.status || "sent";
  const fileType = getFileType();
  const avatarUrl =
    message.sender?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      message.sender?.name || "U"
    )}&background=6366f1&color=fff`;

  const showTimestamp = isHovered || isLast;

  const renderStatus = () => {
    if (!isMine) return null;
    if (status === "read")
      return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    if (status === "delivered")
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    return <Check className="w-3.5 h-3.5 text-slate-400" />;
  };

  const renderTimestamp = () => (
    <div
      className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${
        showTimestamp ? "max-h-6 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
      }`}
    >
      <span className="text-[10px] text-slate-400">
        {formatTime(message.createdAt)}
      </span>
      {renderStatus()}
    </div>
  );

  const myBubbleBase =
    "rounded-2xl px-4 py-2.5 max-w-xs lg:max-w-md bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-br-md";
  const otherBubbleBase =
    "rounded-2xl px-4 py-2.5 max-w-xs lg:max-w-md rounded-bl-md " +
    (isDark
      ? "bg-slate-800 text-slate-100 border border-slate-700"
      : "bg-white text-slate-700 shadow-sm border border-slate-100");

  // Voice Message
  if (fileType === "voice") {
    return (
      <div
        className={`flex flex-col ${
          isMine ? "items-end" : "items-start"
        } text-slate-50`}
      >
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-400 mb-1 ml-10">
            {message.sender?.name}
          </span>
        )}
        <div
          className={`flex items-end gap-2 ${
            isMine ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-900 shadow-sm shrink-0">
              <Image
                src={avatarUrl}
                alt={message.sender?.name || "User"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <VoiceMessage
              voiceUrl={message.voiceUrl}
              voiceDuration={message.voiceDuration}
              isMine={isMine}
              isGroup={isGroup}
              sender={message.sender}
            />
          </div>
        </div>
        {renderTimestamp()}
      </div>
    );
  }

  // Image Message
  if (fileType === "image") {
    return (
      <div
        className={`flex flex-col ${
          isMine ? "items-end" : "items-start"
        } ${isDark ? "text-slate-50" : ""}`}
      >
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-400 mb-1 ml-10">
            {message.sender?.name}
          </span>
        )}
        <div
          className={`flex items-end gap-2 ${
            isMine ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-900 shadow-sm shrink-0">
              <Image
                src={avatarUrl}
                alt={message.sender?.name || "User"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div
            className={`rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group ${
              isMine ? "rounded-br-md" : "rounded-bl-md"
            }`}
            onClick={handleOpenFile}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={
                "relative w-56 h-44 sm:w-64 sm:h-52 " +
                (isDark ? "bg-slate-800" : "bg-slate-100")
              }
            >
              <Image
                src={message.fileUrl}
                alt={message.fileName || "Image"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {message.content && (
              <div
                className={
                  "px-3 py-2 " +
                  (isMine
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white"
                    : isDark
                    ? "bg-slate-900/90 text-slate-100"
                    : "bg-white text-slate-700")
                }
              >
                <p className="text-sm">{message.content}</p>
              </div>
            )}
          </div>
        </div>
        {renderTimestamp()}
      </div>
    );
  }

  // File / audio Message
  if (fileType !== "text") {
    const fileBubbleBase =
      "p-3 rounded-2xl flex items-center gap-3 " +
      (isMine
        ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-br-md"
        : isDark
        ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-md"
        : "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md");

    const iconBg =
      "w-10 h-10 rounded-xl flex items-center justify-center " +
      (isMine
        ? "bg-white/20"
        : isDark
        ? "bg-slate-700"
        : "bg-blue-50");

    const buttonBg =
      "p-2 rounded-lg transition-colors " +
      (isMine
        ? "hover:bg-white/20"
        : isDark
        ? "hover:bg-slate-700"
        : "hover:bg-slate-100");

    return (
      <div
        className={`flex flex-col ${
          isMine ? "items-end" : "items-start"
        } ${isDark ? "text-slate-50" : ""}`}
      >
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-400 mb-1 ml-10">
            {message.sender?.name}
          </span>
        )}
        <div
          className={`flex items-end gap-2 ${
            isMine ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-900 shadow-sm shrink-0">
              <Image
                src={avatarUrl}
                alt={message.sender?.name || "User"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div
            className={fileBubbleBase}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={iconBg}>
              {fileType === "audio" ? (
                <Mic className="w-5 h-5" />
              ) : (
                <File className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {message.fileName || "Fichier"}
              </p>
              <p className="text-xs opacity-70">
                {formatFileSize(message.fileSize)}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={handleOpenFile} className={buttonBg}>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button onClick={handleDownload} className={buttonBg}>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {renderTimestamp()}
      </div>
    );
  }

  // Text Message
  return (
    <div
      className={`flex flex-col ${
        isMine ? "items-end" : "items-start"
      } ${isDark ? "text-slate-50" : ""}`}
    >
      {!isMine && isGroup && (
        <span className="text-xs font-semibold text-blue-400 mb-1 ml-10">
          {message.sender?.name}
        </span>
      )}
      <div
        className={`flex items-end gap-2 ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isMine && (
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-900 shadow-sm shrink-0">
            <Image
              src={avatarUrl}
              alt={message.sender?.name || "User"}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div
          className={isMine ? myBubbleBase : otherBubbleBase}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
      {renderTimestamp()}
    </div>
  );
}