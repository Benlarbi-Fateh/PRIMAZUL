'use client';

import { createContext, useState, useEffect, useContext } from "react";
import api from "../lib/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(data);
      } catch (err) {
        console.error("Erreur fetch profile:", err);
      }
    };

    fetchProfile();
    setReady(true);
  }, []);

  // Empêche l’hydratation avec des valeurs différentes
  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
