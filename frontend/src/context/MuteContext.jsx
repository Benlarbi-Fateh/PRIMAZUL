"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { getMutedConversations } from "@/lib/api";
import { AuthContext } from "@/context/AuthProvider"; // 1. Importer AuthContext

const MuteContext = createContext(null);

export function MuteProvider({ children }) {
  const { user } = useContext(AuthContext); // 2. Récupérer l'utilisateur
  const [mutedSet, setMutedSet] = useState(() => new Set());

  const refreshMuted = useCallback(async () => {
    // 3. Sécurité : Ne rien faire si pas d'utilisateur
    if (!user) return;

    try {
      const res = await getMutedConversations();
      const ids = res.data?.mutedConversationIds || [];
      setMutedSet(new Set(ids.map(String)));
    } catch (e) {
      console.error("❌ refreshMuted error:", e);
    }
  }, [user]); // Ajouter user aux dépendances

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
    [mutedSet],
  );

  // 4. Lancer l'effet uniquement si user existe
  useEffect(() => {
    if (user) {
      refreshMuted();
    }
  }, [refreshMuted, user]);

  const value = useMemo(
    () => ({ mutedSet, refreshMuted, setConversationMuted, isMuted }),
    [mutedSet, refreshMuted, setConversationMuted, isMuted],
  );

  return <MuteContext.Provider value={value}>{children}</MuteContext.Provider>;
}

export function useMute() {
  const ctx = useContext(MuteContext);
  if (!ctx) throw new Error("useMute must be used inside MuteProvider");
  return ctx;
}
