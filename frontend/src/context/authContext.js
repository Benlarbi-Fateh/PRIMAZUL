// Ce fichier permet de gérer l’état global de la session utilisateur
// Permet à toute ton application d’accéder à user, login() et logout()
// Sauvegarde le token et les infos utilisateur dans le localStorage pour maintenir la session

"use client"; //indique à Next.js que ce fichier s’exécute dans le navigateur.

//Sans cette ligne, Next essaie de l’exécuter côté serveur → ce qui provoque ton erreur

import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  //  Vérifier si l'utilisateur est déjà connecté (token dans le localStorage)
  //  Vérifier si l'utilisateur est déjà connecté (token dans le localStorage)
  useEffect(() => {
    //  Exécuter seulement côté client
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        //  On évite le setState direct au montage
        setTimeout(() => {
          setUser(JSON.parse(userData));
        }, 0);
      }
    }
  }, []);

  //  Fonction de connexion (sauvegarde token et infos user )
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  //  Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour accéder facilement au contexte
export const useAuth = () => React.useContext(AuthContext);
