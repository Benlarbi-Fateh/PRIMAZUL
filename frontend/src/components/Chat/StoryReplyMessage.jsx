"use client";
import { Image, Video, Type } from "lucide-react";

// Adapter selon ton URL
const SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";
const getFullUrl = (url) =>
  url?.startsWith("http") ? url : `${SERVER_URL}${url}`;

export default function StoryReplyMessage({ message, isMine }) {
  const { storyUrl, storyType, storyText } = message.storyReply || {};

  return (
    <div
      className={`flex flex-col gap-2 p-2 rounded-xl max-w-xs shadow-sm ${
        isMine ? "bg-blue-600 text-white" : "bg-white border border-gray-200"
      }`}
    >
      {/* PREVIEW STORY */}
      <div className="flex items-center gap-3 bg-black/10 p-2 rounded-lg border-l-4 border-white/50">
        <div className="w-10 h-14 bg-gray-300 rounded overflow-hidden flex items-center justify-center shrink-0">
          {storyType === "image" && (
            <img
              src={getFullUrl(storyUrl)}
              className="w-full h-full object-cover"
            />
          )}
          {storyType === "video" && <Video className="text-gray-600 w-5 h-5" />}
          {storyType === "text" && <Type className="text-gray-600 w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-wide">
            Réponse à une story
          </p>
          <p className="text-xs truncate opacity-90 font-medium">
            {storyType === "text"
              ? storyText
              : storyType === "video"
              ? "🎥 Vidéo"
              : "📷 Photo"}
          </p>
        </div>
      </div>

      {/* MESSAGE */}
      <div className="px-1 pb-1">
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}
