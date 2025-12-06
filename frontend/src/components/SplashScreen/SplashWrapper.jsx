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
  const timer = setTimeout(() => {
    const token =
      typeof window !== "undefined" &&
      (localStorage.getItem("token") ||
       localStorage.getItem("authToken") ||
       localStorage.getItem("user") ||
       sessionStorage.getItem("token"));

    if (token) router.replace("/");
    else router.replace("/login");

    setShowSplash(false);
  }, duration);

  return () => clearTimeout(timer);
}, [router, duration]); // ✅ on ajoute router et duration

  // Tant que splash visible, on affiche uniquement SplashScreen
  if (showSplash) return <SplashScreen />;

  // Après splash : on rend le contenu normal (ClientLayout + children)
  return <>{children}</>;
}
