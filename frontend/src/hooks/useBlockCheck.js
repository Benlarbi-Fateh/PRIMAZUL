"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

export default function useBlockCheck(targetUserId) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    iBlocked: false,
    blockedMe: false,
    isBlocked: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lastTargetRef = useRef(null);
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);

  // ✅ Protection anti-spam (debounce)
  const errorCountRef = useRef(0);
  const lastCheckTimeRef = useRef(0);

  const checkBlockStatus = useCallback(
    async (forceCheck = false) => {
      if (!targetUserId) {
        if (mountedRef.current) {
          setBlockStatus({
            iBlocked: false,
            blockedMe: false,
            isBlocked: false,
          });
          setIsBlocked(false);
          setLoading(false);
        }
        return;
      }

      // ✅ Protection : Si trop d'erreurs récentes, on arrête
      if (
        errorCountRef.current > 3 &&
        Date.now() - lastCheckTimeRef.current < 10000
      ) {
        console.warn(
          "⚠️ Trop d'erreurs de vérification de blocage, pause de 10s",
        );
        return;
      }

      if (isCheckingRef.current && !forceCheck) return;

      try {
        isCheckingRef.current = true;
        lastCheckTimeRef.current = Date.now();

        // ✅ Si c'est un premier chargement, on met loading true
        // Si c'est un refresh (forceCheck), on garde l'ancien état pour éviter le clignotement
        if (!blockStatus.isBlocked && !forceCheck) {
          setLoading(true);
        }

        setError(null);

        const response = await api.get(
          `/message-settings/check-blocked/${targetUserId}`,
          {
            timeout: 5000, // Timeout court
          },
        );

        if (!mountedRef.current) return;

        if (response.data?.success) {
          const { iBlocked, blockedMe, isBlocked: blocked } = response.data;
          const newStatus = {
            iBlocked: Boolean(iBlocked),
            blockedMe: Boolean(blockedMe),
            isBlocked: Boolean(blocked || iBlocked || blockedMe),
          };

          setBlockStatus(newStatus);
          setIsBlocked(newStatus.isBlocked);
          errorCountRef.current = 0; // Reset erreurs si succès
        }
      } catch (err) {
        console.error("❌ Erreur useBlockCheck:", err.message);
        errorCountRef.current += 1;

        if (!mountedRef.current) return;

        if (err.response?.status === 404) {
          setError("Utilisateur introuvable");
        } else {
          setError("Erreur vérification");
        }

        // En cas d'erreur, on assume pas bloqué par défaut pour ne pas bloquer l'UI
        if (errorCountRef.current > 1) {
          setBlockStatus((prev) => ({ ...prev, isBlocked: false }));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        isCheckingRef.current = false;
      }
    },
    [targetUserId, blockStatus.isBlocked],
  );

  // Effet principal
  useEffect(() => {
    mountedRef.current = true;

    if (targetUserId !== lastTargetRef.current) {
      lastTargetRef.current = targetUserId;
      errorCountRef.current = 0; // Reset erreurs au changement d'utilisateur
      checkBlockStatus(true);
    }

    const handleBlockChange = () => {
      // Petit délai pour laisser le temps au backend de traiter
      setTimeout(() => checkBlockStatus(true), 300);
    };

    window.addEventListener("block-status-changed", handleBlockChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("block-status-changed", handleBlockChange);
    };
  }, [targetUserId, checkBlockStatus]);

  return {
    isBlocked,
    blockStatus,
    loading,
    error,
    refresh: () => checkBlockStatus(true),
  };
}
