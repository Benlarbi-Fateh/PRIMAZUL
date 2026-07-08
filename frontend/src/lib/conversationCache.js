"use client";

const CACHE_TTL_MS = 30000;
const conversationCache = new Map();

export function getCachedConversations(userId) {
  if (!userId) return null;

  const cached = conversationCache.get(userId.toString());
  if (!cached) return null;

  return {
    conversations: cached.conversations,
    isFresh: Date.now() - cached.updatedAt < CACHE_TTL_MS,
  };
}

export function setCachedConversations(userId, conversations) {
  if (!userId) return;

  conversationCache.set(userId.toString(), {
    conversations,
    updatedAt: Date.now(),
  });
}

export function updateCachedConversations(userId, updater) {
  if (!userId) return;

  const previous = conversationCache.get(userId.toString())?.conversations || [];
  setCachedConversations(userId, updater(previous));
}
