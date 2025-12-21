// frontend/src/components/Chat/CallMessage.jsx
"use client";

import {
  Phone,
  PhoneMissed,
  PhoneOff,
  Video,
  VideoOff,
  Clock,
  Users,
  CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CallMessage({ message, isMine, currentUserId }) {
  const { callDetails } = message;

  if (!callDetails) return null;

  const {
    status,
    duration,
    callType,
    isGroup,
    groupName,
    participants,
    answeredBy,
    missedBy,
    initiator,
    startedAt,
    endedAt,
  } = callDetails;

  // Formater la durée
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Déterminer l'état de l'appel pour l'utilisateur actuel
  const isInitiator = initiator?.toString() === currentUserId?.toString();
  const wasAnswered = answeredBy?.some(
    (id) => id.toString() === currentUserId?.toString()
  );
  const wasMissed = missedBy?.some(
    (id) => id.toString() === currentUserId?.toString()
  );

  // Déterminer le texte et l'icône
  let statusText = "";
  let StatusIcon = Phone;
  let iconColor = "text-gray-500";
  let bgColor = isMine ? "bg-blue-600" : "bg-white dark:bg-slate-800";
  let textColor = isMine ? "text-white" : "text-gray-900 dark:text-white";
  let subTextColor = isMine
    ? "text-blue-100"
    : "text-gray-500 dark:text-gray-400";

  switch (status) {
    case "ended":
      if (duration > 0) {
        statusText = isGroup ? "Appel de groupe terminé" : "Appel terminé";
        StatusIcon = callType === "video" ? Video : Phone;
        iconColor = isMine ? "text-white" : "text-green-500";
      } else {
        statusText = "Appel annulé";
        StatusIcon = PhoneOff;
        iconColor = isMine ? "text-white" : "text-gray-500";
      }
      break;

    case "missed":
      if (isInitiator) {
        statusText = "Pas de réponse";
      } else {
        statusText = "Appel manqué";
      }
      StatusIcon = PhoneMissed;
      iconColor = "text-red-500";
      if (!isMine) {
        bgColor =
          "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800";
      }
      break;

    case "declined":
      if (isInitiator) {
        statusText = "Appel refusé";
      } else {
        statusText = "Vous avez refusé l'appel";
      }
      StatusIcon = PhoneOff;
      iconColor = "text-orange-500";
      break;

    case "no_answer":
      statusText = "Pas de réponse";
      StatusIcon = PhoneMissed;
      iconColor = "text-orange-500";
      break;

    case "busy":
      statusText = "Occupé";
      StatusIcon = PhoneOff;
      iconColor = "text-yellow-500";
      break;

    default:
      statusText = "Appel";
      StatusIcon = callType === "video" ? Video : Phone;
  }

  // Formater l'heure
  const callTime = startedAt || message.createdAt;
  const formattedTime = callTime
    ? format(new Date(callTime), "HH:mm", { locale: fr })
    : "";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-2xl max-w-xs shadow-sm
          ${bgColor} ${textColor}
        `}
      >
        {/* Icône */}
        <div
          className={`
            p-2.5 rounded-full flex-shrink-0
            ${
              isMine
                ? "bg-white/20"
                : status === "missed"
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-gray-100 dark:bg-slate-700"
            }
          `}
        >
          <StatusIcon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* Type d'appel et statut */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {callType === "video" ? "Appel vidéo" : "Appel audio"}
            </span>
            {isGroup && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                Groupe
              </span>
            )}
          </div>

          {/* Statut */}
          <p className={`text-xs mt-0.5 ${subTextColor}`}>{statusText}</p>

          {/* Durée et heure */}
          <div
            className={`flex items-center gap-2 mt-1 text-xs ${subTextColor}`}
          >
            {duration > 0 && (
              <>
                <Clock className="w-3 h-3" />
                <span>{formatDuration(duration)}</span>
                <span className="opacity-50">•</span>
              </>
            )}
            <span>{formattedTime}</span>
          </div>

          {/* Participants (pour les appels de groupe) */}
          {isGroup && participants && participants.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Users className="w-3 h-3" />
              <span className="text-xs">
                {participants.length} participant
                {participants.length > 1 ? "s" : ""}
              </span>
              {/* Avatars miniatures */}
              <div className="flex -space-x-2 ml-2">
                {participants.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden bg-gray-200"
                  >
                    {p.profilePicture ? (
                      <img
                        src={p.profilePicture}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
                        {p.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {participants.length > 3 && (
                  <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[8px] font-bold">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Indicateur de lecture (pour mes messages) */}
        {isMine && (
          <CheckCheck className={`w-4 h-4 flex-shrink-0 ${subTextColor}`} />
        )}
      </div>
    </div>
  );
}
