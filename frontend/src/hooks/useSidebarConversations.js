"use client";

import { useCallback, useRef, useState } from "react";
import { getConversations } from "@/lib/api";
import {
  getCachedConversations,
  setCachedConversations,
} from "@/lib/conversationCache";

export function useSidebarConversations(currentUserId) {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const isFirstLoadRef = useRef(true);

  const applyConversations = useCallback(
    (nextConversations) => {
      setConversations(nextConversations);
      setCachedConversations(currentUserId, nextConversations);
    },
    [currentUserId],
  );

  const updateConversations = useCallback(
    (updater) => {
      setConversations((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        setCachedConversations(currentUserId, next);
        return next;
      });
    },
    [currentUserId],
  );

  const fetchConversations = useCallback(
    async ({ force = true } = {}) => {
      try {
        const cached = getCachedConversations(currentUserId);
        if (cached?.conversations?.length) {
          applyConversations(cached.conversations);
          setConversationsLoading(false);
          setInitialLoading(false);

          if (!force && cached.isFresh) {
            isFirstLoadRef.current = false;
            return;
          }
        }

        if (isFirstLoadRef.current) {
          setConversationsLoading(true);
        }

        const response = await getConversations();
        applyConversations(response.data.conversations || []);
      } catch (error) {
        console.error("Erreur lors du chargement des conversations:", error);
      } finally {
        isFirstLoadRef.current = false;
        setConversationsLoading(false);
        setInitialLoading(false);
      }
    },
    [applyConversations, currentUserId],
  );

  return {
    conversations,
    conversationsLoading,
    initialLoading,
    fetchConversations,
    updateConversations,
  };
}
