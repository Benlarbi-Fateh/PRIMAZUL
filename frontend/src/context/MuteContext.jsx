"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getMutedConversations } from "@/lib/api";

const MuteContext = createContext(null);

export function MuteProvider({ children }) {
  const [mutedSet, setMutedSet] = useState(() => new Set());

  const refreshMuted = useCallback(async () => {
    try {
      const res = await getMutedConversations();
      const ids = res.data?.mutedConversationIds || [];
      setMutedSet(new Set(ids.map(String)));
    } catch (e) {
      console.error("❌ refreshMuted error:", e);
    }
  }, []);

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
    refreshMuted();
  }, [refreshMuted]);

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