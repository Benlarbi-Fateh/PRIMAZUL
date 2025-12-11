"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function getInitialTheme() {
  if (typeof window === "undefined") {
    // rendu serveur / pré‑rendu
    return "light";
  }

  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  // ⬅ initialisation directe depuis localStorage / media query
  const [theme, setThemeState] = useState(getInitialTheme);

  // Effet = synchronisation vers l'extérieur (DOM + localStorage)
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // ignore si localStorage indisponible
    }
  }, [theme]);

  const setTheme = (value) => {
    setThemeState(value === "dark" ? "dark" : "light");
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);