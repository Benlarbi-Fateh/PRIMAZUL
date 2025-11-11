"use client";
import { useState } from 'react';
import api from '../../lib/api';
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const router = useRouter();

  // 1️⃣ Envoi du code par email
  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      setShowCodeInput(true); // Affiche le champ code
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Erreur serveur');
    }
  };

  // 2️⃣ Vérification du code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/verify-code', { email, code });
      setMessage(res.data.message);
      // Redirige vers la page nouveau mot de passe
      router.push(`/reset-password?email=${email}`);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Code invalide');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Trouver votre compte</h2>
      <form onSubmit={showCodeInput ? handleVerifyCode : handleSendCode}>
        <label>Email :</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Entrez votre email"
          required
          style={{ width: '100%', marginBottom: '10px' }}
        />

        {showCodeInput && (
          <>
            <label>Code reçu :</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code reçu par email"
              required
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </>
        )}

        <button type="submit">{showCodeInput ? 'Continuer' : 'Envoyer le code'}</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
