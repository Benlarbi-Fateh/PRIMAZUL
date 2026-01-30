"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getMutedConversations } from "@/lib/api";
import { AuthContext } from "@/context/AuthProvider"; // 👈 IMPORT IMPORTANT

const MuteContext = createContext(null);

export function MuteProvider({ children }) {
  // 1. On récupère l'utilisateur depuis l'AuthContext
  const { user } = useContext(AuthContext); 
  
  const [mutedSet, setMutedSet] = useState(() => new Set());
    const [isLoaded, setIsLoaded] = useState(false);

  // Dans MuteContext.jsx

const refreshMuted = useCallback(async () => {
    if (!user) {
        setMutedSet(new Set());
        // Ne pas mettre isLoaded à true ici si pas de user
        return;
    }

    try {
      const res = await getMutedConversations();
      const ids = res.data?.mutedConversationIds || [];
      
      // Mise à jour atomique : on prépare le Set avant
      const newSet = new Set(ids.map(id => id.toString())); // Force string
      
      setMutedSet(newSet);
      // setIsLoaded est mis à true uniquement APRÈS le setMutedSet
      // Même si React batch, c'est sémantiquement plus sûr.
    } catch (e) {
      console.error("❌ refreshMuted error:", e);
    }
    finally {
      setIsLoaded(true); 
    }
}, [user]);

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

   useEffect(() => {
    if (user) {
        refreshMuted();
    } else {
        setIsLoaded(false); // 👈 AJOUT (Sécurité logout)
    }
  }, [refreshMuted, user]); 

   const value = useMemo(
    () => ({ mutedSet, refreshMuted, setConversationMuted, isMuted, isLoaded }), // 👈 AJOUTE isLoaded ICI
    [mutedSet, refreshMuted, setConversationMuted, isMuted, isLoaded]            // 👈 ET ICI
  );
  return <MuteContext.Provider value={value}>{children}</MuteContext.Provider>;
}

export function useMute() {
  const ctx = useContext(MuteContext);
  if (!ctx) throw new Error("useMute must be used inside MuteProvider");
  return ctx;
}