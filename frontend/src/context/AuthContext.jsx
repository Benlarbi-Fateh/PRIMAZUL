'use client';

<<<<<<< HEAD
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Exemple : récupérer le user depuis localStorage
    const user = localStorage.getItem('user');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
=======
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
>>>>>>> d7b2651abdf5ff4b9b346ac8afc789f56540d4fd
