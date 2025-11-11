// frontend/pages/login.js
"use client";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import api from '../../lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
 console.log('Identifier:', identifier, 'Password:', password);
    try {
      const res = await api.post('/auth/login', { identifier, password });
      console.log('Identifier:', identifier, 'Password:', password);
      const { token, user } = res.data;

      // Stockage local du JWT
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setMessage('Connexion réussie ✅');
      router.push('/chat'); // redirige vers une page après login
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur de connexion';
      setMessage(msg);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Connexion</h2>
      <form onSubmit={handleLogin}>
        <label>Email ou téléphone :</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="ex: test@example.com"
          style={{ width: '100%', marginBottom: '10px' }}
        />

        <label>Mot de passe :</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          style={{ width: '100%', marginBottom: '10px' }}
        />

        <button type="submit">Se connecter</button>
        <p style={{ marginTop: '10px' }}>
   <Link href="/forgot-password" style={{ color: 'blue', textDecoration: 'underline' }}>
    Mot de passe oublié ?
  </Link>
  

</p>
      </form>
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
