"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/splash"); // ➜ Lancement du Splash Screen
  }, [router]);

  return null;
}
