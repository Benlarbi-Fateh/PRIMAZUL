//le bouton de deconnexion; ce code va servir a afficher le bouton deconnexion
"use client";
import React from "react";
import { useAuth } from "../context/authContext";
import { useRouter } from "next/navigation"; //pour la redirection vers login  ça permet de naviguer entre les pages
export default function LogoutButton() {
  const { user, logout } = useAuth();
  const router = useRouter(); //sert à créer une variable router qui te donne l’accès complet aux fonctions de navigation de Next.js.
  //
  const handleLogout = () => {
    logout(); // supprime le token + user du localStorage
    router.push("/login"); // redirige vers la page login
  };
  //

  // redirige vers la page login
  // Si l'utilisateur n'est pas connecté, on ne montre rien
  if (!user) return null;

  return (
    <button
      onClick={handleLogout}
      style={{
        backgroundColor: "#4f8bd9ff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      Se déconnecter
    </button>
  );
}
