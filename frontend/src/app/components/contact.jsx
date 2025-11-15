"use client";
import { useState } from "react";
import axios from "axios";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleSend = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/contact", {
        name,
        email,
        message,
      });
      if (response.data.success) {
        alert("Message envoyé avec succès !");
        setName("");
        setEmail("");
        setMessage("");
        setAccepted(false);
      } else {
        alert("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    } catch (error) {
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Contactez-nous</h1>

      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md">
        <input
          type="text"
          placeholder="Votre nom"
          className="w-full p-2 mb-3 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!accepted}
        />

        <input
          type="email"
          placeholder="Votre email"
          className="w-full p-2 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!accepted}
        />

        <textarea
          placeholder="Votre message"
          className="w-full p-2 mb-3 border rounded h-32"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!accepted}
        />

        <label className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>J’accepte les conditions d’utilisation</span>
        </label>

        <button
          onClick={handleSend}
          disabled={!accepted || !name || !email || !message}
          className={`w-full p-2 rounded text-white ${
            !accepted || !name || !email || !message
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
