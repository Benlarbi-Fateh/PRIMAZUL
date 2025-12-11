"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Mail,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function VerifyCode({
  email,
  userId,
  type = "registration", // 'registration' ou 'login'
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

  // Thème global
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textStrong = isDark ? "text-slate-50" : "text-gray-900";
  const textMuted = isDark ? "text-slate-300" : "text-gray-600";

  const errorAlertClass =
    "p-4 rounded-xl text-sm flex items-center justify-center gap-3 border " +
    (isDark
      ? "bg-rose-950/60 border-rose-700 text-rose-200"
      : "bg-red-50 border-red-200 text-red-700");

  const codeInputBase =
    "w-14 h-16 text-center text-2xl font-bold rounded-xl transition-all duration-300 focus:outline-none border-2 ";
  const codeInputFilledExtra = isDark
    ? "border-sky-500 bg-sky-500/10 shadow-md"
    : "border-blue-500 bg-blue-50 shadow-md";
  const codeInputEmptyExtra = isDark
    ? "border-slate-600 hover:border-slate-400 bg-slate-900/80 text-slate-100"
    : "border-gray-300 hover:border-gray-400 bg-white text-gray-900";

  const backButtonClass =
    "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 border disabled:opacity-50 " +
    (isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-100 hover:bg-slate-800"
      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400");

  // Countdown pour le resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
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

    if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
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
    type === "registration" ? "Vérifiez votre email" : "Vérification de sécurité";

  const subtitle =
    type === "registration"
      ? `Nous avons envoyé un code de vérification à ${email}`
      : `Pour sécuriser votre connexion, entrez le code envoyé à ${email}`;

  // État succès
  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full shadow-2xl bg-gradient-to-br from-emerald-400 to-emerald-600">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${textStrong}`}>
            Vérification réussie !
          </h2>
          <p className={textMuted}>Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <Shield className="w-10 h-10 text-white" />
        </div>

        <div>
          <h2 className={`text-2xl font-bold mb-2 ${textStrong}`}>{title}</h2>
          <p className={`${textMuted} flex items-center justify-center gap-2`}>
            <Mail className="w-4 h-4" />
            {subtitle}
          </p>
        </div>
      </div>

      {/* Code Input */}
      <div className="space-y-6">
        {error && (
          <div className={errorAlertClass}>
            <div className="w-2 h-2 bg-current rounded-full" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-center gap-3">
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
              className={
                codeInputBase +
                (digit ? codeInputFilledExtra : codeInputEmptyExtra) +
                (loading ? " opacity-50 cursor-not-allowed" : "")
              }
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className={`text-sm ${textMuted}`}>
            Le code expire dans{" "}
            <span className={`font-bold ${textStrong}`}>10 minutes</span>
          </p>

          <div className="flex items-center justify-center gap-2">
            <span className={`text-sm ${textMuted}`}>Code non reçu ?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
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
        className={backButtonClass}
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </button>
    </div>
  );
}