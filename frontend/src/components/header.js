//le bouton de deconnexion; ce code va servir a afficher le bouton deconnexion
"use client";
import React from "react";
import { useAuth } from "../context/authContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#f0f0f0",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2>PrimAzul</h2>

      {user ? (
        <>
          <span style={{ marginRight: "10px" }}>Connecté ✅</span>
          <button
            onClick={logout}
            style={{
              backgroundColor: "#d9534f",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Se déconnecter
          </button>
        </>
      ) : (
        <span>Non connecté </span>
      )}
    </header>
  );
}
