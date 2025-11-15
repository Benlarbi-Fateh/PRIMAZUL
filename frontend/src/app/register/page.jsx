"use client";
import "../globals.css";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/user/register", form);
      router.push("/profile");
      /*localStorage.setItem("user", JSON.stringify(form));*/

    } catch (err) {
      setError(err.response?.data?.message || "Erreur d'inscription");
    }
  };

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <h2 className="form-title">Créer un compte</h2>

        <div className="form-group">
          <label className="form-label">Nom d'utilisateur</label>
          <input
            className="form-input"
            type="text"
            placeholder="Votre nom complet"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Adresse e-mail</label>
          <input
            className="form-input"
            type="email"
            placeholder="exemple@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input
            className="form-input"
            type="password"
            placeholder="Minimum 8 caractères"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input
            className="form-input"
            type="text"
            placeholder="ex: 06 12 34 56 78"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
        </div>

        <button type="submit" className="form-btn">S'inscrire</button>

        {error && <div className="form-error">{error}</div>}
      </form>
    </div>
  );
}
