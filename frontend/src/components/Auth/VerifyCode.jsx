"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Mail,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Sparkles,
} from "lucide-react";

export default function VerifyCode({
  email,
  userId,
  type = "registration",
  onVerify,
  onResend,
  onBack,
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (
      newCode.every((digit) => digit !== "") &&
      newCode.join("").length === 6
    ) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      setError("");
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeString) => {
    setLoading(true);
    setError("");

    try {
      await onVerify(codeString || code.join(""));
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.error || "Code incorrect");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError("");

    try {
      await onResend();
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError(error.response?.data?.error || "Erreur lors du renvoi");
    } finally {
      setLoading(false);
    }
  };

  const title =
    type === "registration"
      ? "Vérifiez votre email"
      : "Vérification de sécurité";

  const subtitle =
    type === "registration"
      ? "Nous avons envoyé un code de vérification"
      : "Code de sécurité envoyé";

  // ✅ Écran de succès
  if (success) {
    return (
      <div className="text-center space-y-6 py-4 sm:py-8">
        {/* Icône de succès */}
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-2xl shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Vérification réussie !
          </h2>
          <p className="text-slate-400 text-sm sm:text-base flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Redirection en cours...
          </p>
        </div>

        {/* Loader */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-3 border-slate-600 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl"></div>
          <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/25">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm sm:text-base">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>{subtitle}</span>
          </div>
          <p className="text-cyan-400 text-xs sm:text-sm font-medium px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl inline-block">
            {email}
          </p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl text-red-400 text-sm flex items-center justify-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>{error}</span>
        </div>
      )}

      {/* Code Input */}
      <div className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className={`
                w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 
                text-center text-xl sm:text-2xl font-bold 
                bg-slate-700/50 border-2 rounded-xl sm:rounded-2xl 
                text-white transition-all duration-300 
                outline-none focus:ring-2 focus:ring-cyan-500/50 
                ${
                  digit
                    ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                    : "border-slate-600 hover:border-slate-500"
                } 
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Info expiration */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-300">
              Expire dans{" "}
              <span className="font-bold text-amber-400">10 minutes</span>
            </p>
          </div>

          {/* Renvoyer le code */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400">Code non reçu ?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className={`
                text-sm font-semibold transition-all duration-300 
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                ${
                  resendCooldown > 0 || loading
                    ? "text-slate-500 cursor-not-allowed"
                    : "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                }
              `}
            >
              <RotateCcw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {resendCooldown > 0
                ? `Renvoyer (${resendCooldown}s)`
                : "Renvoyer le code"}
            </button>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button
        onClick={onBack}
        disabled={loading}
        className="
          w-full py-3 sm:py-4 
          bg-slate-700/50 border border-slate-600 
          rounded-xl sm:rounded-2xl 
          text-slate-300 font-medium 
          hover:bg-slate-600/50 hover:border-slate-500 hover:text-white
          transition-all duration-300 
          flex items-center justify-center gap-2 
          disabled:opacity-50 disabled:cursor-not-allowed
          text-sm sm:text-base
        "
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        Retour à la connexion
      </button>

      {/* Info sécurité */}
      <div className="p-3 sm:p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-cyan-300">
              Vérification sécurisée
            </p>
            <p className="text-xs text-cyan-400/70 mt-1">
              Ce code à usage unique protège votre compte contre les accès non
              autorisés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
