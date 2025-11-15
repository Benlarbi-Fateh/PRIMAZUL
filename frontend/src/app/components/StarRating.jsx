"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function StarRating({ userId }) {
  const [rating, setRating] = useState(0);      // note que l’utilisateur va donner
  const [average, setAverage] = useState(0);    // moyenne actuelle
  const [votes, setVotes] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://localhost:5000";

  // Récupérer la moyenne et le nombre de votes
  const fetchAverage = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/rating/average`);
      setAverage(res.data.average || 0); // laisser le décimal
      setVotes(res.data.votes || 0);
    } catch (err) {
      console.error("Erreur get average:", err);
      setMessage("Impossible de charger la moyenne.");
    }
  };

  useEffect(() => {
    fetchAverage();
  }, []);

  const handleValidate = async () => {
    if (rating === 0) return;
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${BACKEND}/api/rating`, { userId, stars: rating });
      setMessage("✅ Votre évaluation a été enregistrée !");
      setRating(0); // réinitialiser le choix de l'utilisateur
      fetchAverage(); // rafraîchir la moyenne
    } catch (error) {
      console.error("Erreur lors de l’enregistrement :", error);
      if (error.response) {
        setMessage(`❌ Erreur serveur : ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setMessage("❌ Aucune réponse du backend.");
      } else {
        setMessage("❌ Une erreur est survenue côté client.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // Fonction pour afficher les étoiles selon la moyenne
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= average) {
        stars.push(<span key={i} style={{ color: "gold", fontSize: 30, marginRight: 6 }}>★</span>);
      } else if (i - average < 1) {
        stars.push(<span key={i} style={{ color: "goldenrod", fontSize: 30, marginRight: 6 }}>★</span>);
      } else {
        stars.push(<span key={i} style={{ color: "gray", fontSize: 30, marginRight: 6 }}>★</span>);
      }
    }
    return stars;
  };

  return (
    <div style={{ marginTop: 20, textAlign: "center" }}>
      <h3 style={{ marginBottom: 10 }}>Évaluez l’application :</h3>

      <div style={{ marginBottom: 15 }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <span
            key={v}
            style={{
              cursor: "pointer",
              color: v <= rating ? "gold" : "gray",
              fontSize: 30,
              marginRight: 6,
            }}
            onClick={() => setRating(v)}
          >
            ★
          </span>
        ))}
      </div>

      <button
        onClick={handleValidate}
        disabled={rating === 0 || loading}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          backgroundColor: rating === 0 ? "#ccc" : "#0070f3",
          color: "white",
          cursor: rating === 0 ? "not-allowed" : "pointer",
          fontSize: 16,
          marginBottom: 15,
        }}
      >
        {loading ? "Enregistrement..." : "Valider"}
      </button>

      {message && <p style={{ color: message.startsWith("✅") ? "green" : "red", marginBottom: 15 }}>{message}</p>}

      <div>
        {renderStars()}
        <p style={{ marginTop: 10 }}>
          Moyenne : {average.toFixed(1)} ⭐ ({votes} votes)
        </p>
      </div>
    </div>
  );
}
