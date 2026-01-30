// app/profile/components/EmailChangeModal.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmailChangeModal({
  user,
  isDark,
  isUpdating,
  emailChangeStep,
  pendingEmail,
  onClose,
  onRequestChange,
  onConfirmChange,
  onCancel,
}) {
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [emailError, setEmailError] = useState("");
  const inputRefs = useRef([]);

  // Focus sur le premier input OTP
  useEffect(() => {
    if (emailChangeStep === "verifying" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [emailChangeStep]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    if (!newEmail.trim()) {
      setEmailError("Veuillez entrer un email");
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError("Format d'email invalide");
      return;
    }

    if (newEmail === user.email) {
      setEmailError("Ce email est identique à l'actuel");
      return;
    }

    try {
      await onRequestChange(newEmail);
    } catch (error) {
      // Erreur gérée dans le hook
    }
  };

  const handleOtpChange = (index, value) => {
    // Accepter seulement les chiffres
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus sur le prochain input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Retour arrière
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otpCode];
      pastedData.split("").forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtpCode(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length !== 6) return;

    try {
      await onConfirmChange(code);
    } catch (error) {
      setOtpCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const inputStyle = `w-full p-3.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500/50 ${
    isDark
      ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
            isDark ? "bg-slate-900" : "bg-white"
          }`}
        >
          {/* Header */}
          <div
            className={`p-5 border-b ${
              isDark
                ? "border-slate-800 bg-slate-800/50"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {emailChangeStep === "verifying" && (
                  <button
                    onClick={onCancel}
                    className={`p-2 rounded-lg transition-all ${
                      isDark ? "hover:bg-slate-700" : "hover:bg-slate-200"
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {emailChangeStep === "verifying"
                      ? "Vérification"
                      : "Modifier l'email"}
                  </h2>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {emailChangeStep === "verifying"
                      ? "Entrez le code reçu"
                      : "Une vérification sera nécessaire"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {emailChangeStep === "verifying" ? (
                /* ===== OTP VERIFICATION STEP ===== */
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Success Icon */}
                  <div className="flex justify-center mb-6">
                    <div
                      className={`p-4 rounded-2xl ${
                        isDark ? "bg-green-500/20" : "bg-green-100"
                      }`}
                    >
                      <Mail className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                      Un code à 6 chiffres a été envoyé à
                    </p>
                    <p
                      className={`font-semibold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {pendingEmail}
                    </p>
                  </div>

                  {/* OTP Inputs */}
                  <form onSubmit={handleOtpSubmit}>
                    <div className="flex justify-center gap-2 mb-6">
                      {otpCode.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:ring-2 focus:ring-blue-500/50 ${
                            isDark
                              ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                              : "bg-white border-slate-200 text-slate-900 focus:border-blue-500"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating || otpCode.join("").length !== 6}
                      className="w-full py-3.5 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Confirmer le changement
                        </>
                      )}
                    </button>
                  </form>

                  <p
                    className={`text-center text-sm mt-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Code valide pendant 10 minutes
                  </p>
                </motion.div>
              ) : (
                /* ===== EMAIL INPUT STEP ===== */
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Current Email */}
                  <div
                    className={`p-4 rounded-xl mb-5 ${
                      isDark
                        ? "bg-slate-800/50 border border-slate-700"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <label
                      className={`text-xs uppercase tracking-wider font-semibold ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Email actuel
                    </label>
                    <p
                      className={`font-medium mt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {user.email}
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit}>
                    <div className="mb-5">
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDark ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Nouvel email
                      </label>
                      <div className="relative">
                        <Mail
                          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => {
                            setNewEmail(e.target.value);
                            setEmailError("");
                          }}
                          className={`${inputStyle} pl-12 ${emailError ? "border-red-500" : ""}`}
                          placeholder="nouveau@email.com"
                        />
                      </div>
                      {emailError && (
                        <p className="text-red-500 text-sm mt-2">
                          {emailError}
                        </p>
                      )}
                    </div>

                    {/* Info box */}
                    <div
                      className={`p-4 rounded-xl mb-5 ${
                        isDark
                          ? "bg-blue-500/10 border border-blue-500/30"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}
                      >
                        ℹ️ Un code de vérification sera envoyé à votre nouvelle
                        adresse email pour confirmer le changement.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full py-3.5 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Envoi du code...
                        </>
                      ) : (
                        <>
                          Envoyer le code de vérification
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
