"use client";
import { Phone, PhoneMissed, Video, VideoOff, Clock } from "lucide-react";

export default function CallMessage({ message, isMine }) {
  const { status, duration, callType } = message.callDetails || {};
  const isMissed = status === "missed";

  const formatDuration = (sec) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  let Icon = Phone;
  if (callType === "video") Icon = isMissed ? VideoOff : Video;
  else Icon = isMissed ? PhoneMissed : Phone;

  const containerClass = isMine
    ? "bg-blue-600 text-white"
    : isMissed
    ? "bg-red-50 border border-red-200 text-red-800"
    : "bg-white border border-gray-200 text-gray-800";

  const iconBgClass = isMine
    ? "bg-white/20 text-white"
    : isMissed
    ? "bg-red-100 text-red-500"
    : "bg-gray-100 text-gray-600";

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl max-w-xs shadow-sm ${containerClass}`}
    >{/**
      <div className={`p-2 rounded-full ${iconBgClass}`}>
        <Icon size={20} />
      </div>
      <div>
         <p className="font-semibold text-sm">
          {isMissed ? "Appel manqué" : "Appel terminé"}
        </p>
        {!isMissed && duration > 0 && (
          <div
            className={`flex items-center gap-1 text-xs mt-1 ${
              isMine ? "opacity-90" : "text-gray-500"
            }`}
          >
            <Clock size={12} /> <span>{formatDuration(duration)}</span>
          </div>
        )} 
      </div>*/}
    </div>
  );
}
