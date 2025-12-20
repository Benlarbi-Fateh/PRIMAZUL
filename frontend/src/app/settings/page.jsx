"use client";

import { useState, useContext } from "react";
import {
  User,
  Bell,
  Shield,
  Globe,
  Lock,
  Moon,
  LogOut,
  ArrowLeft,
  Key,
  Settings as SettingsIcon,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordOtp, verifyChangePassword } from "@/lib/api";

// ✅ 1. IMPORTER LA SIDEBAR
import MainSidebar from "@/components/Layout/MainSidebar.client";

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    notifications: true,
    language: "fr",
    privacy: "public",
  });

  // Styles basés sur le thème
  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-br from-blue-50 via-white to-cyan-50";

  const cardBg = isDark
    ? "bg-blue-900/80 backdrop-blur-xl border-blue-800"
    : "bg-white/80 backdrop-blur-xl border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-400";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white shadow-2xl hover:shadow-blue-500/50";

  const backButtonBg = isDark
    ? "bg-blue-800 hover:bg-blue-700 border-blue-700"
    : "bg-white hover:bg-blue-50 border-blue-100 hover:border-blue-300";

  const backButtonText = isDark ? "text-cyan-400" : "text-blue-600";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700 focus:ring-cyan-500 focus:border-cyan-400"
    : "bg-white border-blue-200 focus:ring-blue-300 focus:border-blue-400";

  const inputText = isDark
    ? "text-blue-100 placeholder-blue-400"
    : "text-blue-900 placeholder-blue-400";

  const errorBg = isDark
    ? "bg-red-900/30 border-red-800"
    : "bg-red-50 border-red-200";

  const errorText = isDark ? "text-red-300" : "text-red-700";

  const successBg = isDark
    ? "bg-green-900/30 border-green-800"
    : "bg-green-50 border-green-200";

  const successText = isDark ? "text-green-300" : "text-green-700";

  const sectionIconBg = (color) => {
    const colors = {
      blue: isDark ? "bg-blue-700" : "bg-blue-100",
      purple: isDark ? "bg-purple-700" : "bg-purple-100",
      green: isDark ? "bg-green-700" : "bg-green-100",
      orange: isDark ? "bg-orange-700" : "bg-orange-100",
      pink: isDark ? "bg-pink-700" : "bg-pink-100",
      cyan: isDark ? "bg-cyan-700" : "bg-cyan-100",
    };
    return colors[color] || colors.blue;
  };

  const sectionIconText = (color) => {
    const colors = {
      blue: isDark ? "text-cyan-400" : "text-blue-600",
      purple: isDark ? "text-purple-400" : "text-purple-600",
      green: isDark ? "text-green-400" : "text-green-600",
      orange: isDark ? "text-orange-400" : "text-orange-600",
      pink: isDark ? "text-pink-400" : "text-pink-600",
      cyan: isDark ? "text-cyan-400" : "text-cyan-600",
    };
    return colors[color] || colors.blue;
  };

  // === Logique changement mot de passe ===
  const startChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return setMessage("❌ Remplissez tous les champs");
    }
    if (newPassword !== confirmPassword) {
      return setMessage("❌ Les nouveaux mots de passe ne correspondent pas");
    }
    if (oldPassword === newPassword) {
      return setMessage(
        "❌ Le nouveau mot de passe doit être différent de l'ancien"
      );
    }

    try {
      setLoading(true);
      await sendPasswordOtp({ oldPassword, newPassword });
      setMessage("✅ Code de vérification envoyé à votre email");
      setStep(2);
    } catch (error) {
      if (error.response?.status === 400) {
        setMessage("❌ Ancien mot de passe incorrect");
      } else {
        setMessage("❌ Erreur lors de l'envoi du code");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmChangePassword = async () => {
    if (!otp) {
      return setMessage("❌ Veuillez saisir le code de vérification");
    }
    try {
      setLoading(true);
      await verifyChangePassword({ code: otp, newPassword });
      setMessage("✅ Mot de passe changé avec succès");
      setTimeout(() => {
        setShowModal(false);
        setStep(1);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        setMessage("");
      }, 2000);
    } catch (error) {
      setMessage("❌ Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-blue-950"
            : "bg-linear-to-br from-blue-50 via-white to-cyan-50"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400/40 border-t-cyan-500" />
          <p
            className={`mt-4 text-sm ${
              isDark ? "text-blue-400" : "text-blue-500"
            }`}
          >
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  return (
    // ✅ 2. STRUCTURE FLEXBOX POUR LA SIDEBAR
    <div className={`flex h-screen ${pageBg}`}>
      <MainSidebar />

      {/* ✅ 3. CONTENEUR SCROLLABLE POUR LE CONTENU */}
      <div className="flex-1 overflow-y-auto relative w-full">
        {/* Background décoratif déplacé ici */}
        {!isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-4 sm:p-6 relative z-10">
          {/* Header moderne */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className={`p-3 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 shadow-md ${backButtonBg}`}
              >
                <ArrowLeft className={`w-6 h-6 ${backButtonText}`} />
              </button>

              <div className="flex-1">
                <h1
                  className={`text-3xl font-bold flex items-center gap-3 ${
                    isDark
                      ? "text-cyan-50"
                      : "text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      isDark
                        ? "bg-linear-to-br from-blue-700 to-cyan-700"
                        : "bg-linear-to-br from-purple-500 to-pink-500"
                    }`}
                  >
                    <SettingsIcon className="w-6 h-6 text-white" />
                  </div>
                  Paramètres
                </h1>
                <p
                  className={`mt-1 ml-1 flex items-center gap-2 ${textSecondary}`}
                >
                  <Sparkles className="w-4 h-4" />
                  Gérez votre compte et vos préférences
                </p>
              </div>
            </div>
          </div>

          {/* Carte: Profil utilisateur */}
          <div
            className={`rounded-3xl p-6 sm:p-8 shadow-xl border-2 mb-8 animate-slide-in-left hover:shadow-2xl transition-all ${cardBg}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div
                  className={`w-24 h-24 rounded-3xl overflow-hidden border-4 ${
                    isDark ? "border-cyan-500/50" : "border-blue-400/50"
                  } shadow-2xl`}
                >
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center ${
                        isDark
                          ? "bg-linear-to-br from-blue-600 to-cyan-600"
                          : "bg-linear-to-br from-blue-500 to-cyan-500"
                      }`}
                    >
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                <div
                  className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isDark
                      ? "border-blue-900 bg-cyan-500"
                      : "border-white bg-green-500"
                  } shadow-lg`}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                    isDark
                      ? "bg-blue-800 text-cyan-300"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  COMPTE VERIFIÉ
                </div>
                <h2 className="text-2xl font-bold mb-2 text-primary">
                  {user.name || user.email?.split("@")[0]}
                </h2>
                <p className={`mb-3 ${textSecondary}`}>{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDark
                        ? "bg-blue-800 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    Membre depuis 2024
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg ${buttonStyle}`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Modifier le profil
                </span>
              </button>
            </div>
          </div>

          {/* Grid des sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Section Profil */}

            {/* Section Notifications */}
            <div
              className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg(
                    "orange"
                  )}`}
                >
                  <Bell className={`w-6 h-6 ${sectionIconText("orange")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>
                    Notifications
                  </h3>
                  <p className={`text-sm ${textMuted}`}>
                    Contrôlez les alertes
                  </p>
                </div>
              </div>
              <label
                className={`flex items-center justify-between cursor-pointer ${textPrimary}`}
              >
                <span className="font-medium">Notifications actives</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={userData.notifications}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        notifications: e.target.checked,
                      })
                    }
                  />
                  <div
                    className={`block w-12 h-6 rounded-full transition-colors ${
                      userData.notifications
                        ? isDark
                          ? "bg-cyan-500"
                          : "bg-blue-500"
                        : isDark
                        ? "bg-blue-700"
                        : "bg-blue-200"
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      userData.notifications ? "transform translate-x-6" : ""
                    }`}
                  ></div>
                </div>
              </label>
            </div>

            {/* Section Apparence */}
            <div
              className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg(
                    "purple"
                  )}`}
                >
                  <Moon className={`w-6 h-6 ${sectionIconText("purple")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>
                    Apparence
                  </h3>
                  <p className={`text-sm ${textMuted}`}>Thème clair/sombre</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between ${
                  isDark
                    ? "bg-blue-800 hover:bg-blue-700 text-blue-100"
                    : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                }`}
              >
                <span>Mode {isDark ? "Sombre" : "Clair"}</span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? "bg-cyan-500" : "bg-blue-500"
                  }`}
                >
                  <Moon className="w-4 h-4 text-white" />
                </div>
              </button>
            </div>

            {/* Section Langue */}
            <div
              className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg(
                    "green"
                  )}`}
                >
                  <Globe className={`w-6 h-6 ${sectionIconText("green")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Langue</h3>
                  <p className={`text-sm ${textMuted}`}>
                    Langue de l&apos;interface
                  </p>
                </div>
              </div>
              <select
                value={userData.language}
                onChange={(e) =>
                  setUserData({ ...userData, language: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${inputBg} ${inputText}`}
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>

            {/* Section Confidentialité */}

            {/* Section Sécurité */}
            <div
              className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg(
                    "pink"
                  )}`}
                >
                  <Key className={`w-6 h-6 ${sectionIconText("pink")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>
                    Sécurité
                  </h3>
                  <p className={`text-sm ${textMuted}`}>
                    Protégez votre compte
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${buttonStyle}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Key className="w-4 h-4" />
                  Changer le mot de passe
                </span>
              </button>
            </div>
          </div>

          {/* Section Contacts bloqués */}
          <div
            className={`rounded-3xl p-6 shadow-xl border-2 mt-6 hover:shadow-2xl transition-all ${cardBg}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? "bg-red-900/40" : "bg-red-100"
                  }`}
                >
                  <Lock
                    className={`w-5 h-5 ${
                      isDark ? "text-red-400" : "text-red-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className={`font-bold ${textPrimary}`}>
                    Contacts bloqués
                  </h3>
                  <p className={`text-sm ${textMuted}`}>
                    Gérez vos restrictions
                  </p>
                </div>
              </div>
              <Link
                href="/settings/blocked"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isDark
                    ? "bg-red-800/40 hover:bg-red-800/60 text-red-300"
                    : "bg-red-100 hover:bg-red-200 text-red-700"
                }`}
              >
                Voir la liste
              </Link>
            </div>
          </div>

          {/* Bouton Déconnexion */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleLogout}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 ${
                isDark
                  ? "bg-linear-to-r from-red-800 to-pink-800 hover:from-red-700 hover:to-pink-700 text-red-100"
                  : "bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white"
              } shadow-2xl`}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </button>
          </div>

          {/* Info aide */}
          <p
            className={`text-center text-sm mt-8 flex items-center justify-center gap-2 ${textSecondary}`}
          >
            <Sparkles className="w-4 h-4" />
            Vos paramètres sont synchronisés sur tous vos appareils
          </p>
        </div>
      </div>

      {/* Modal changement mot de passe */}
      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isDark ? "bg-blue-950/70" : "bg-black/30"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl ${
              isDark
                ? "bg-blue-900 border-blue-800"
                : "bg-white border-blue-100"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={`text-sm font-bold ${textSecondary}`}>SÉCURITÉ</p>
                <h2 className={`text-xl font-bold mt-1 ${textPrimary}`}>
                  {step === 1 ? "Changer le mot de passe" : "Vérification"}
                </h2>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-cyan-700" : "bg-cyan-100"
                }`}
              >
                <Key
                  className={`w-5 h-5 ${
                    isDark ? "text-cyan-300" : "text-cyan-600"
                  }`}
                />
              </div>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-xl border-2 flex items-center gap-3 ${
                  message.includes("✅") ? successBg : errorBg
                }`}
              >
                {message.includes("✅") ? (
                  <Check
                    className={`w-5 h-5 ${
                      isDark ? "text-green-400" : "text-green-500"
                    }`}
                  />
                ) : (
                  <AlertCircle
                    className={`w-5 h-5 ${
                      isDark ? "text-red-400" : "text-red-500"
                    }`}
                  />
                )}
                <p
                  className={`text-sm font-medium ${
                    message.includes("✅") ? successText : errorText
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${textSecondary}`}
                  >
                    Ancien mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Entrez votre mot de passe actuel"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${inputBg} ${inputText}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${textSecondary}`}
                  >
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Créez un nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${inputBg} ${inputText}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${textSecondary}`}
                  >
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Répétez le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${inputBg} ${inputText}`}
                  />
                </div>
                <button
                  onClick={startChangePassword}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi du code...
                    </span>
                  ) : (
                    "Envoyer le code de vérification"
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${textSecondary}`}
                  >
                    Code de vérification
                  </label>
                  <input
                    type="text"
                    placeholder="Entrez le code reçu par email"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-center text-lg font-mono ${inputBg} ${inputText}`}
                    maxLength={6}
                  />
                  <p className={`text-xs mt-2 ${textMuted}`}>
                    Vérifiez votre boîte email pour le code de 6 chiffres
                  </p>
                </div>
                <button
                  onClick={confirmChangePassword}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Vérification...
                    </span>
                  ) : (
                    "Confirmer le changement"
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowModal(false);
                setStep(1);
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setOtp("");
                setMessage("");
              }}
              className={`w-full mt-4 text-center font-medium ${
                isDark
                  ? "text-blue-400 hover:text-cyan-300"
                  : "text-blue-600 hover:text-blue-800"
              }`}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
