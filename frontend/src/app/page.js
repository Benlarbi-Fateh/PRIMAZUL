"use client";

import { useState, useEffect } from "react";
import Splash from "../components/splash/splash";

export default function RootPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Si connecté → /home
      if (localStorage.getItem("token")) {
        window.location.href = "/home";
      } else {
        window.location.href = "/login";
      }
    }, 2500); // Splash 2.5s

    return () => clearTimeout(timer);
  }, []);

  return showSplash ? <Splash /> : null;
}

