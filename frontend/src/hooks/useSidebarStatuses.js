"use client";

import { useCallback, useState } from "react";

export function useSidebarStatuses() {
  const [statusViewedCache, setStatusViewedCache] = useState(new Map());
  const [statusCache, setStatusCache] = useState(new Map());

  const loadAllStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const statusMap = new Map();
        const unviewedMap = new Map();

        if (data?.friendsStatuses && Array.isArray(data.friendsStatuses)) {
          data.friendsStatuses.forEach((group) => {
            if (group.user?._id) {
              const userId = group.user._id;
              statusMap.set(userId, true);
              unviewedMap.set(userId, Boolean(group.hasUnviewed));
            }
          });
        }

        setStatusCache(statusMap);
        setStatusViewedCache(unviewedMap);
      } else {
        console.error("Erreur API Status");
      }
    } catch (error) {
      console.error("Erreur chargement status:", error);
    }
  }, []);

  const checkContactHasUnviewedStatus = useCallback(
    (contactId) => {
      if (!contactId || !statusCache.has(contactId)) return false;
      return statusViewedCache.get(contactId) === true;
    },
    [statusCache, statusViewedCache],
  );

  const checkContactHasStatus = useCallback(
    (contactId) => statusCache.has(contactId),
    [statusCache],
  );

  const markStatusAsViewed = useCallback((contactId) => {
    setStatusViewedCache((prev) => {
      const next = new Map(prev);
      next.set(contactId, true);
      return next;
    });
  }, []);

  return {
    loadAllStatuses,
    checkContactHasUnviewedStatus,
    checkContactHasStatus,
    markStatusAsViewed,
  };
}
