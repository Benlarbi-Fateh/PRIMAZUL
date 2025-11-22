'use client';

import { createContext, useState, useEffect } from "react";
import api from "../lib/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Fonction pour mettre à jour le user globalement
  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  // Charger le profil au démarrage
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
