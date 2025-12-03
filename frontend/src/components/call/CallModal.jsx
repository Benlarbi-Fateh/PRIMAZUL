"use client";

import React from "react";
import { X, Phone, Video, PhoneOff } from "lucide-react";

export default function CallModal({
  callStatus,
  currentCall,
  onAccept,
  onReject,
  onEnd,
  contact,
  localVideoRef,
  remoteVideoRef,
  permissionError,
}) {
  const [callDuration, setCallDuration] = React.useState(0);

  // Timer pour l'appel
  React.useEffect(() => {
    let interval;
    if (callStatus === "in-call") {
      const startTime = Date.now();
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 🔥 NE PAS AFFICHER si idle
  if (callStatus === "idle") return null;

  const isIncoming = !currentCall?.isInitiator;
  const isVideoCall = currentCall?.callType === "video";
  const callerName = isIncoming ? currentCall?.caller?.name : contact?.name;

  // 🔥 AFFICHAGE MESSAGE "NE RÉPOND PAS"
  if (callStatus === "no-answer") {
    const displayName = isIncoming
      ? currentCall?.caller?.name
      : contact?.name || "L'utilisateur";

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {displayName} ne répond pas
          </h3>
          <p className="text-gray-600">L'appel se termine automatiquement...</p>
        </div>
      </div>
    );
  }

  // 🔥 AFFICHAGE MESSAGE "APPEL REJETÉ"
  if (callStatus === "rejected") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Appel refusé</h3>
          <p className="text-gray-600">
            {callerName || "L'utilisateur"} a refusé l'appel
          </p>
        </div>
      </div>
    );
  }

  // 🔥 AFFICHAGE MESSAGE "OCCUPÉ"
  if (callStatus === "busy") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Utilisateur occupé
          </h3>
          <p className="text-gray-600">
            {callerName || "L'utilisateur"} est déjà en appel
          </p>
        </div>
      </div>
    );
  }

  // 🔥 AFFICHAGE ERREUR DE PERMISSION
  if (permissionError) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Permission requise
          </h3>
          <p className="text-gray-600 mb-6">{permissionError}</p>
          <button
            onClick={onReject}
            className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // 🔥 INTERFACE PRINCIPALE (calling, ringing, in-call)
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isVideoCall && callStatus === "in-call"
            ? "w-full h-full"
            : "max-w-md w-full"
        } bg-white rounded-2xl p-8 text-center shadow-2xl relative`}
      >
        {/* En-tête */}
        <div
          className={`${
            isVideoCall && callStatus === "in-call"
              ? "absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white rounded-lg px-4 py-2"
              : "mb-6"
          }`}
        >
          <h2 className="text-xl font-bold">
            {callStatus === "ringing" && isIncoming && "Appel entrant"}
            {callStatus === "calling" && "Appel en cours..."}
            {callStatus === "in-call" &&
              `Appel ${isVideoCall ? "vidéo" : "audio"}`}
          </h2>
          <p className="text-sm opacity-90">{callerName || "Utilisateur"}</p>
          {callStatus === "in-call" && (
            <p className="text-lg font-mono">{formatDuration(callDuration)}</p>
          )}
        </div>

        {/* Contenu */}
        <div
          className={`${
            isVideoCall && callStatus === "in-call"
              ? "h-full w-full relative"
              : ""
          }`}
        >
          {/* 🔥 VIDÉO EN APPEL */}
          {isVideoCall && callStatus === "in-call" && (
            <>
              {/* Vidéo distante */}
              <div className="w-full h-full bg-black rounded-lg">
                <div
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Vidéo locale */}
              <div className="absolute bottom-4 right-4 w-48 h-32 bg-black rounded-lg border-2 border-white shadow-lg">
                <div
                  ref={localVideoRef}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </>
          )}

          {/* 🔥 AUDIO EN APPEL */}
          {!isVideoCall && callStatus === "in-call" && (
            <div className="py-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6 flex items-center justify-center">
                <Phone className="w-12 h-12 text-white" />
              </div>
              <p className="text-2xl font-mono text-gray-800">
                {formatDuration(callDuration)}
              </p>
            </div>
          )}

          {/* 🔥 INTERFACE D'ATTENTE (calling ou ringing) */}
          {(callStatus === "ringing" || callStatus === "calling") && (
            <div className="py-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6 flex items-center justify-center animate-pulse">
                {isVideoCall ? (
                  <Video className="w-12 h-12 text-white" />
                ) : (
                  <Phone className="w-12 h-12 text-white" />
                )}
              </div>
              <p className="text-lg text-gray-600 animate-pulse">
                {callStatus === "ringing" && "Sonnerie..."}
                {callStatus === "calling" && "En attente de réponse..."}
              </p>
            </div>
          )}
        </div>

        {/* 🔥 BOUTONS */}
        <div
          className={`flex justify-center gap-4 ${
            isVideoCall && callStatus === "in-call"
              ? "absolute bottom-4 left-1/2 transform -translate-x-1/2"
              : "mt-6"
          }`}
        >
          {/* Boutons pour appel entrant (ringing + isIncoming) */}
          {callStatus === "ringing" && isIncoming && (
            <>
              <button
                onClick={onReject}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={onAccept}
                className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Bouton annuler pour émetteur en attente */}
          {callStatus === "calling" && (
            <button
              onClick={onEnd}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Bouton raccrocher pendant l'appel */}
          {callStatus === "in-call" && (
            <button
              onClick={onEnd}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
