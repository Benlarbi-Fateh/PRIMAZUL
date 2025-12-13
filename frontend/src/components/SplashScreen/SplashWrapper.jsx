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
    const timer = setTimeout(() => setShowSplash(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    // redirection après le splash
    if (!showSplash) {
      const token =
        typeof window !== "undefined" &&
        (localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("user") ||
          sessionStorage.getItem("token"));

      if (token) router.replace("/home"); // page d’accueil
      else router.replace("/login");
    }
  }, [showSplash, router]);

  // Tant que splash actif, on n’affiche rien d’autre
  if (showSplash) return <SplashScreen />;

  // Après splash, on affiche le contenu sous Providers
  return <>{children}</>;
}