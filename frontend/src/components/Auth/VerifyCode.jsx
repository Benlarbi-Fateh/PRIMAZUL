'use client'

import { useState, useEffect, useRef } from 'react';
import { Shield, Mail, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';

export default function VerifyCode({ 
  email, 
  userId, 
  type = 'registration', // 'registration' ou 'login'
  onVerify, 
  onResend,
  onBack 
}) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef([]);

  // Countdown pour le resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Accepter seulement les chiffres
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Soumettre automatiquement si tous les champs sont remplis
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace : revenir au champ précédent
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Flèches gauche/droite
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Vérifier si c'est un code à 6 chiffres
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      inputRefs.current[5]?.focus();
      
      // Soumettre automatiquement
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeString) => {
    setLoading(true);
    setError('');

    try {
      await onVerify(codeString || code.join(''));
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Code incorrect');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      await onResend();
      setResendCooldown(60); // 60 secondes
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors du renvoi');
    } finally {
      setLoading(false);
    }
  };

  const title = type === 'registration' 
    ? 'Vérifiez votre email' 
    : 'Authentification à deux facteurs';
  
  const subtitle = type === 'registration'
    ? `Nous avons envoyé un code de vérification à ${email}`
    : `Pour sécuriser votre connexion, entrez le code envoyé à ${email}`;

  if (success) {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-green-400 to-green-600 rounded-full shadow-2xl animate-bounce-once">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Vérification réussie !</h2>
          <p className="text-blue-200">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-400 to-blue-600 rounded-2xl shadow-2xl">
          <Shield className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-blue-200 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {subtitle}
          </p>
        </div>
      </div>

      {/* Code Input */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center justify-center gap-3 animate-shake">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-center gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className={`w-14 h-16 text-center text-2xl font-bold bg-blue-900/30 border-2 rounded-2xl text-white transition-all duration-300 focus:outline-none focus:scale-110 ${
                digit 
                  ? 'border-blue-400 bg-blue-800/50 shadow-lg shadow-blue-500/25' 
                  : 'border-blue-700/50 hover:border-blue-500/50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-blue-200">
            Le code expire dans <span className="font-bold text-white">10 minutes</span>
          </p>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-blue-200">Code non reçu ?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-sm font-semibold text-white hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 underline underline-offset-4"
            >
              <RotateCcw className="w-4 h-4" />
              {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
            </button>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button
        onClick={onBack}
        disabled={loading}
        className="w-full py-3 bg-blue-900/30 border border-blue-700/50 rounded-2xl text-white font-medium hover:bg-blue-800/50 hover:border-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </button>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}