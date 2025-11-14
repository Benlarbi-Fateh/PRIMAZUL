'use client'

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Shield, Lock, Eye, EyeOff, CheckCircle, RotateCcw, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const [step, setStep] = useState(1); // 1: Code, 2: Nouveau mot de passe, 3: Succès
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 6) strength += 25;
    if (newPassword.match(/[a-z]/) && newPassword.match(/[A-Z]/)) strength += 25;
    if (newPassword.match(/\d/)) strength += 25;
    if (newPassword.match(/[^a-zA-Z\d]/)) strength += 25;
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
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
      handleVerifyCode(pastedData);
    }
  };

  const handleVerifyCode = async (codeString) => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-reset-code', {
        email,
        code: codeString || code.join('')
      });
      
      setStep(2); // Passer à l'étape du nouveau mot de passe
    } catch (error) {
      setError(error.response?.data?.error || 'Code incorrect');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email,
        code: code.join(''),
        newPassword
      });
      
      setStep(3); // Succès
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors du renvoi');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-green-500';
    if (passwordStrength >= 50) return 'bg-yellow-500';
    if (passwordStrength >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Fort';
    if (passwordStrength >= 50) return 'Moyen';
    if (passwordStrength >= 25) return 'Faible';
    return 'Très faible';
  };

  // ÉTAPE 3 : SUCCÈS
  if (step === 3) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-green-400 to-green-600 rounded-full shadow-2xl animate-bounce-once">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Mot de passe réinitialisé ! 🎉</h2>
            <p className="text-blue-200 mb-6">
              Votre mot de passe a été modifié avec succès.
            </p>
            <p className="text-sm text-blue-300">Redirection vers la connexion...</p>
          </div>
        </div>
      </div>
    );
  }

  // ÉTAPE 2 : NOUVEAU MOT DE PASSE
  if (step === 2) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-400 to-blue-600 rounded-2xl shadow-2xl mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Nouveau mot de passe</h2>
            <p className="text-blue-200">Choisissez un mot de passe sécurisé</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center gap-3 animate-shake">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-blue-200 mb-3 ml-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-blue-900/30 border border-blue-700/50 rounded-2xl transition-all duration-300 group-hover:border-blue-400/50 group-focus-within:border-blue-400">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-transparent border-none outline-none text-white placeholder-blue-200/50 rounded-2xl"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-200">Force du mot de passe</span>
                      <span className={`font-medium ${
                        passwordStrength >= 75 ? 'text-green-400' :
                        passwordStrength >= 50 ? 'text-yellow-400' :
                        passwordStrength >= 25 ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-blue-800/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-blue-200 mb-3 ml-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-blue-900/30 border border-blue-700/50 rounded-2xl transition-all duration-300 group-hover:border-blue-400/50 group-focus-within:border-blue-400">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-transparent border-none outline-none text-white placeholder-blue-200/50 rounded-2xl"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Les mots de passe correspondent</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-red-400">Les mots de passe ne correspondent pas</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full group relative overflow-hidden bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-500 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Réinitialisation...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Réinitialiser le mot de passe
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ÉTAPE 1 : CODE DE VÉRIFICATION
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-400 to-blue-600 rounded-2xl shadow-2xl mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Vérifiez votre email</h2>
          <p className="text-blue-200">Code envoyé à {email}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
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

          <div className="text-center space-y-4 mb-6">
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

          <Link
            href="/login"
            className="w-full py-3 bg-blue-900/30 border border-blue-700/50 rounded-2xl text-white font-medium hover:bg-blue-800/50 hover:border-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la connexion
          </Link>
        </div>
      </div>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}