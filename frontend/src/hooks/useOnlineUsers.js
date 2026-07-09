"use client";

import { useCallback, useEffect, useState } from "react";
import {
  onOnlineUsersUpdate,
  requestOnlineUsers,
} from "@/services/socket";

export function useOnlineUsers(enabled = true) {
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = onOnlineUsersUpdate((userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    requestOnlineUsers();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [enabled]);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers.has(userId.toString());
    },
    [onlineUsers],
  );

  return { onlineUsers, isUserOnline };
}
