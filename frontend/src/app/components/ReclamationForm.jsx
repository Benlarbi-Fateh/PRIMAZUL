"use client";
import { useState } from "react";
import axios from "axios";

export default function ReclamationForm() {
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Limite le message à 100 mots
  const handleChange = (e) => {
    const words = e.target.value.trim().split(/\s+/);
    if (words.length <= 100) {
      setMessage(e.target.value);
      setError("");
    } else {
      setError("Le message ne doit pas dépasser 100 mots.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checked) {
      setError("Vous devez accepter les conditions avant d'envoyer votre message.");
      return;
    }

    if (!message.trim()) {
      setError("Le message ne peut pas être vide.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/reclamation", { message });
      setSuccess("Réclamation envoyée avec succès !");
      setMessage("");
      setChecked(false);
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Envoyer une réclamation</h3>
      <div style={{ marginBottom: "10px" }}>
        <textarea
          value={message}
          onChange={handleChange}
          disabled={!checked} // ✨ désactive tant que checkbox non cochée
          placeholder="Écrivez votre message (max 100 mots)..."
          style={{ width: "100%", height: "120px", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />{" "}
          J’ai lu et j’accepte les conditions : écrire sainement en anglais ou français et max 100 mots
        </label>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>} {/* ✨ affiche le succès */}

      <button
        type="submit"
        style={{
          backgroundColor: "#0057D9",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Envoyer
      </button>
    </form>
  );
}