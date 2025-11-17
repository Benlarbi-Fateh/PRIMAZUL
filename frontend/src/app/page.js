"use client";
import { useState } from "react";
import api from "../lib/api";

export default function HomePage() {
  const [message, setMessage] = useState("");

  const testBackend = async () => {
    try {
      const res = await api.get("/ping");
      setMessage(res.data.message);
    } catch (err) {
      console.error("Erreur de connexion au backend :", err);
      setMessage("Échec de la connexion ");
    }
  };

  return (
    <main style={{ textAlign: "center", marginTop: "50px" }}>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <button onClick={testBackend}>Tester la connexion</button>
      <p>{message}</p>
    </main>
  );
}
