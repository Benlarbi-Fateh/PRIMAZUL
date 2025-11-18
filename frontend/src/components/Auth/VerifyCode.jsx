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
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
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
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      inputRefs.current[5]?.focus();
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
      setResendCooldown(60);
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
    : 'Vérification de sécurité';
  
  const subtitle = type === 'registration'
    ? `Nous avons envoyé un code de vérification à ${email}`
    : `Pour sécuriser votre connexion, entrez le code envoyé à ${email}`;

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-green-400 to-green-600 rounded-full shadow-2xl">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérification réussie !</h2>
          <p className="text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
          <Shield className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {subtitle}
          </p>
        </div>
      </div>

      {/* Code Input */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
              className={`w-14 h-16 text-center text-2xl font-bold bg-white border-2 rounded-xl text-gray-900 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                digit 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Le code expire dans <span className="font-bold text-gray-900">10 minutes</span>
          </p>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600">Code non reçu ?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        className="w-full py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-200 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </button>
    </div>
  );
}