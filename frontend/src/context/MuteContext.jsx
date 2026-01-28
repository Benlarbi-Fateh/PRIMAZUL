"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getMutedConversations } from "@/lib/api";
import { AuthContext } from "@/context/AuthProvider"; // 👈 IMPORT IMPORTANT

const MuteContext = createContext(null);

export function MuteProvider({ children }) {
  // 1. On récupère l'utilisateur depuis l'AuthContext
  const { user } = useContext(AuthContext); 
  
  const [mutedSet, setMutedSet] = useState(() => new Set());

  const refreshMuted = useCallback(async () => {
    // 🛑 PROTECTION : Si pas d'utilisateur, on ne fait rien !
    // Cela empêche la requête de partir avec un token invalide au démarrage
    if (!user) {
        setMutedSet(new Set()); // On vide la liste par sécurité
        return;
    }

    try {
      const res = await getMutedConversations();
      const ids = res.data?.mutedConversationIds || [];
      setMutedSet(new Set(ids.map(String)));
    } catch (e) {
      console.error("❌ refreshMuted error:", e);
      // Ici, on capture l'erreur silencieusement pour ne pas faire planter l'appli
    }
  }, [user]); // 👈 On ajoute user comme dépendance

  const setConversationMuted = useCallback((conversationId, muted) => {
    if (!conversationId) return;
    const id = conversationId.toString();

    setMutedSet((prev) => {
      const next = new Set(prev);
      if (muted) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const isMuted = useCallback(
    (conversationId) => {
      if (!conversationId) return false;
      return mutedSet.has(conversationId.toString());
    },
    [mutedSet]
  );

  // 2. Le useEffect ne se lance que si l'utilisateur change ou est présent
  useEffect(() => {
    if (user) {
        refreshMuted();
    }
  }, [refreshMuted, user]); 

  const value = useMemo(
    () => ({ mutedSet, refreshMuted, setConversationMuted, isMuted }),
    [mutedSet, refreshMuted, setConversationMuted, isMuted]
  );

  return <MuteContext.Provider value={value}>{children}</MuteContext.Provider>;
}

export function useMute() {
  const ctx = useContext(MuteContext);
  if (!ctx) throw new Error("useMute must be used inside MuteProvider");
  return ctx;
}