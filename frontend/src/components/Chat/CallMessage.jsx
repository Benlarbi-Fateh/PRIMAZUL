"use client";

import { Phone, PhoneOff, Video, VideoOff } from "lucide-react";

export default function CallMessage({ message, isMine }) {
  const isMissed = message.callStatus === "missed";
  const duration = message.callDuration || 0;

  const icon =
    message.callType === "audio" ? (
      isMissed ? (
        <PhoneOff className="text-red-500" />
      ) : (
        <Phone className="text-blue-600" />
      )
    ) : isMissed ? (
      <VideoOff className="text-red-500" />
    ) : (
      <Video className="text-blue-600" />
    );

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm max-w-xs ${
        isMine ? "ml-auto bg-blue-50" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
        {icon}
      </div>

      <div className="flex flex-col">
        <span className="font-semibold text-sm">
          {message.callType === "audio" ? "Appel audio" : "Appel vidéo"}
        </span>

        <span
          className={`text-xs ${isMissed ? "text-red-500" : "text-gray-600"}`}
        >
          {isMissed
            ? "Appel manqué"
            : duration > 0
            ? `Durée : ${Math.floor(duration / 60)}m ${duration % 60}s`
            : "Appel terminé"}
        </span>

        <span className="text-[11px] text-gray-400">
          {new Date(message.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
