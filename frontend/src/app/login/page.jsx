"use client";
import "../globals.css"; // <-- chemin selon où tu as mis le fichier
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/user/login", form);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    }
  };

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        <h2 className="form-title">Connexion</h2>

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
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="form-btn">Se connecter</button>

        {error && <div className="form-error">{error}</div>}

        <div className="form-footer">
          Pas de compte ? <a href="/register">Créer un compte</a>
        </div>
      </form>
    </div>
  );
}
