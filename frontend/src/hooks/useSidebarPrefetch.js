"use client";

import { useEffect } from "react";

export function useSidebarPrefetch(router, conversations) {
  useEffect(() => {
    router.prefetch("/profile");
    router.prefetch("/group/create");
    router.prefetch("/status");
    router.prefetch("/settings");
  }, [router]);

  useEffect(() => {
    conversations.slice(0, 30).forEach((conv) => {
      router.prefetch(`/chat/${conv._id}`);
    });
  }, [conversations, router]);
}
