// Ce fichier permet de gérer l’état global de la session utilisateur
// Permet à toute ton application d’accéder à user, login() et logout()
// Sauvegarde le token et les infos utilisateur dans le localStorage pour maintenir la session

"use client"; //indique à Next.js que ce fichier s’exécute dans le navigateur.

//Sans cette ligne, Next essaie de l’exécuter côté serveur → ce qui provoque ton erreur

import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  //  Charger la session au démarrage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        setTimeout(() => {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }, 0);
      }
    }
  }, []);

  //  Connexion → stocker user + token
  const login = (userData, tokenValue) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(tokenValue); // On met bien le token dans le state
    setUser(userData);
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
