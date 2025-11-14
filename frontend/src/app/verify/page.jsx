'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Récupérer l'email depuis localStorage
    const storedEmail = localStorage.getItem('verificationEmail');
    console.log('Email récupéré du localStorage:', storedEmail);
    
    if (storedEmail && storedEmail !== 'undefined' && storedEmail !== 'null') {
      setEmail(storedEmail);
      setIsReady(true);
    } else {
      alert('Aucun email trouvé. Veuillez vous réinscrire.');
      window.location.href = '/register';
    }
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode([...newCode, ...Array(6 - newCode.length).fill('')]);
      const lastIndex = Math.min(pastedData.length - 1, 5);
      setTimeout(() => {
        const lastInput = document.getElementById(`code-${lastIndex}`);
        if (lastInput) lastInput.focus();
      }, 0);
    }
  };

  const handleVerify = () => {
    setError('');

    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code');
      return;
    }

    if (!email || email === 'undefined') {
      setError('Email invalide. Veuillez vous réinscrire.');
      return;
    }

    setLoading(true);
    console.log('Envoi de la vérification pour:', email, 'avec code:', codeString);

    fetch('http://localhost:5000/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: codeString })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Réponse vérification:', data);
      if (data.success) {
        setSuccess(true);
        localStorage.removeItem('verificationEmail');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.message || 'Code incorrect');
        setCode(['', '', '', '', '', '']);
        const firstInput = document.getElementById('code-0');
        if (firstInput) firstInput.focus();
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleResendCode = () => {
    if (!email || email === 'undefined') {
      setError('Email invalide. Veuillez vous réinscrire.');
      return;
    }

    setError('');
    setLoading(true);
    console.log('Renvoi du code pour:', email);

    fetch('http://localhost:5000/api/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Réponse renvoi:', data);
      if (data.success) {
        alert(' Un nouveau code a été envoyé à votre email');
        setCode(['', '', '', '', '', '']);
        const firstInput = document.getElementById('code-0');
        if (firstInput) firstInput.focus();
      } else {
        setError(data.message);
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    })
    .finally(() => {
      setLoading(false);
    });
  };


  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Compte créé avec succès ! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Votre compte a été vérifié.<br />
            Redirection vers la connexion...
          </p>
          <Loader className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <button
          onClick={() => window.location.href = '/register'}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Retour à l&apos;inscription</span>
        </button>

        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Vérifiez votre email
          </h2>
          <p className="text-gray-600">
            Un code à 6 chiffres a été envoyé à<br />
            <strong className="text-indigo-600">{email}</strong>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Entrez le code de vérification
          </label>
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition outline-none"
                autoComplete="off"
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            💡 Vous pouvez coller le code directement
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Vérification...
            </>
          ) : (
            'Vérifier le code'
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Vous n&apos;avez pas reçu le code ?
          </p>
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium disabled:opacity-50 transition"
          >
            Renvoyer le code
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800 text-center leading-relaxed">
            ⏱️ Le code expire dans <strong>15 minutes</strong><br />
            📧 Vérifiez aussi votre dossier spam/courrier indésirable
          </p>
        </div>
      </div>
    </div>
  );
}