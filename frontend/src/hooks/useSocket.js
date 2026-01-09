// src/hooks/useSocket.js
"use client";

import { useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { initSocket, getSocket, isSocketConnected } from "@/services/socket";

export const useSocket = () => {
  const { user } = useContext(AuthContext);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const userId = user._id || user.id;
    if (!userId) return;

    // Le socket est déjà initialisé par SocketInitializer
    // On vérifie juste qu'il est connecté
    if (!isSocketConnected()) {
      console.log("🔌 useSocket: Initialisation du socket");
      initSocket(userId);
    }

    initializedRef.current = true;
  }, [user]);

  return getSocket();
};
