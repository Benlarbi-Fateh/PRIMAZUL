"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/components/SplashScreen/SplashScreen";

/**
 * SplashWrapper :
 * - affiche le SplashScreen pendant `duration` ms
 * - après timeout vérifie si user "connecté" (vérif. simple via localStorage)
 * - redirige vers /home si connecté sinon /login
 *
 * IMPORTANT : adapte la clé de token si tu utilises un autre nom (ex: "authToken", "user")
 */
export default function SplashWrapper({ children, duration = 3000 }) {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Affiche splash pendant 'duration'
    const timer = setTimeout(() => {
      // Checker token / authentification
      // On teste plusieurs clés courantes ; adapte si besoin.
      const token =
        typeof window !== "undefined" &&
        (localStorage.getItem("token") ||
         localStorage.getItem("authToken") ||
         localStorage.getItem("user") ||
         sessionStorage.getItem("token"));

      if (token) {
        // connecté → home
        router.replace("/");
      } else {
        // non connecté → login
        router.replace("/login");
      }

      // On masque le splash et on rend les enfants (même si on a navigué).
      setShowSplash(false);
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tant que splash visible, on affiche uniquement SplashScreen
  if (showSplash) return <SplashScreen />;

  // Après splash : on rend le contenu normal (ClientLayout + children)
  return <>{children}</>;
}
