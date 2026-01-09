// src/components/Socket/SocketInitializer.jsx
"use client";

import { useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { initSocket, getSocket, isSocketConnected } from "@/services/socket";

export default function SocketInitializer({ children }) {
  const { user, token } = useContext(AuthContext);
  const initializedRef = useRef(false);
  const retryIntervalRef = useRef(null);

  useEffect(() => {
    // Attendre que user soit disponible
    if (!user) {
      console.log("⏳ SocketInitializer: En attente de l'utilisateur...");
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      console.log("⏳ SocketInitializer: userId non disponible");
      return;
    }

    // Éviter les doubles initialisations
    if (initializedRef.current && isSocketConnected()) {
      console.log("✅ SocketInitializer: Socket déjà initialisé et connecté");
      return;
    }

    console.log("🔌 SocketInitializer: Initialisation du socket pour:", userId);

    // Initialiser le socket
    const socket = initSocket(userId);

    if (socket) {
      initializedRef.current = true;

      // Vérifier périodiquement la connexion
      retryIntervalRef.current = setInterval(() => {
        if (!isSocketConnected()) {
          console.log("🔄 SocketInitializer: Reconnexion...");
          initSocket(userId);
        }
      }, 5000);
    }

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [user, token]);

  return children;
}
