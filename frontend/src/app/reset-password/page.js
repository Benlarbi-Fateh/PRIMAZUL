"use client";
import { useState } from 'react';
import api from '../../lib/api';
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email'); // récupère l'email depuis l'URL

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      return setMessage('Les mots de passe ne correspondent pas');
    }
    try {
      const res = await api.post('/auth/reset-password', { email, password });
      setMessage(res.data.message);
      router.push('/chat'); // redirige vers chat
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Erreur serveur');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Réinitialiser le mot de passe</h2>
      <form onSubmit={handleReset}>
        <label>Nouveau mot de passe :</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <label>Confirmez le mot de passe :</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button type="submit">Continuer</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
