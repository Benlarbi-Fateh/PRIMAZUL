'use client'

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Shield, Lock, Eye, EyeOff, CheckCircle, RotateCcw, ArrowLeft, MessageCircle, Sparkles, Users, Mail } from 'lucide-react';

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
      <div className="min-h-screen flex">
        {/* Sidebar - Version Desktop */}
        <div className="hidden lg:flex lg:w-2/5 bg-linear-to-br from-blue-500 to-blue-700 p-8 flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PrimAzul</h1>
              <p className="text-blue-100 text-sm">Making distance disappear</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <CheckCircle className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Mot de passe réinitialisé</h3>
                <p className="text-blue-100 text-sm">Votre compte est sécurisé</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Sparkles className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Prêt à continuer</h3>
                <p className="text-blue-100 text-sm">Reconnectez-vous dès maintenant</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-sm">Redirection en cours</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-blue-50 to-gray-100">
          <div className="w-full max-w-md text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60 p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-green-400 to-green-600 rounded-2xl shadow-lg mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mot de passe réinitialisé !</h2>
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été modifié avec succès.
              </p>
              <p className="text-sm text-gray-500">Redirection vers la connexion...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ÉTAPE 2 : NOUVEAU MOT DE PASSE
  if (step === 2) {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar - Version Desktop */}
        <div className="hidden lg:flex lg:w-2/5 bg-linear-to-br from-blue-600 to-blue-800 p-8 flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PrimAzul</h1>
              <p className="text-blue-100 text-sm">Making distance disappear</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Lock className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Nouveau mot de passe</h3>
                <p className="text-blue-100 text-sm">Choisissez un mot de passe sécurisé</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Sécurité renforcée</h3>
                <p className="text-blue-100 text-sm">Protégez votre compte</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-sm">Sécurisez votre compte</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-blue-50 to-gray-100">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gray-900">PrimAzul</h1>
                  <p className="text-gray-600 text-sm">Making distance disappear</p>
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h2>
                <p className="text-gray-600">Choisissez un mot de passe sécurisé</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Force du mot de passe</span>
                        <span className={`font-medium ${
                          passwordStrength >= 75 ? 'text-green-500' :
                          passwordStrength >= 50 ? 'text-yellow-500' :
                          passwordStrength >= 25 ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {newPassword === confirmPassword ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-500">Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                  className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
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
      </div>
    );
  }

  // ÉTAPE 1 : CODE DE VÉRIFICATION
  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Version Desktop */}
      <div className="hidden lg:flex lg:w-2/5 bg-linear-to-br from-blue-600 to-blue-800 p-8 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">PrimAzul</h1>
            <p className="text-blue-100 text-sm">Making distance disappear</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Vérification requise</h3>
              <p className="text-blue-100 text-sm">Code de sécurité envoyé par email</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Mail className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Code de sécurité</h3>
              <p className="text-blue-100 text-sm">Entrez le code reçu à {email}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white/80 text-sm">Vérification en cours</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-blue-50 to-gray-100">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">PrimAzul</h1>
                <p className="text-gray-600 text-sm">Making distance disappear</p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
              <p className="text-gray-600">Code envoyé à {email}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
                  className={`w-14 h-16 text-center text-2xl font-bold bg-white border-2 rounded-xl text-gray-900 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    digit 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="text-center space-y-4 mb-6">
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

            <Link
              href="/login"
              className="w-full py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-200 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600 font-semibold">Chargement...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}