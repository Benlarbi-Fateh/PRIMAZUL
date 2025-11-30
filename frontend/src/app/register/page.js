"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import VerifyCode from "@/components/Auth/VerifyCode";
import UploadProfilePicture from "@/components/Auth/UploadProfilePicture";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  MessageCircle,
  Sparkles,
  Shield,
  ArrowLeft,
  LogIn,
  Users,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [showUploadPicture, setShowUploadPicture] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const { user, login: authLogin } = useContext(AuthContext);
  const router = useRouter();

  // === Thème global ===
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Fond global
  const pageBgStyle = {
    background: isDark
      ? "radial-gradient(circle_at_top,#1d4ed8 0,#020617 55%),radial-gradient(circle_at_bottom,#0f172a 0,#020617 55%)"
      : "linear-gradient(135deg,#eff6ff,#ffffff,#e5e7eb)",
  };

  const sidebarStyle = {
    background: isDark
      ? "linear-gradient(135deg,#1d4ed8,#020617)"
      : "linear-gradient(135deg,#2563eb,#1d4ed8)",
  };

  const contentBgStyle = {
    background: "transparent",
  };

  // Classes dépendantes du thème
  const textStrong = isDark ? "text-slate-50" : "text-gray-900";
  const textMuted = isDark ? "text-slate-400" : "text-gray-600";

  const mainCardClass =
    "backdrop-blur-xl rounded-3xl shadow-[0_22px_65px_rgba(15,23,42,0.6)] border p-4 sm:p-6 lg:p-8 " +
    (isDark
      ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-700 text-slate-50"
      : "bg-white/90 border-white/60 text-gray-900");

  const errorAlertClass =
    "mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm flex items-center gap-3 border " +
    (isDark
      ? "bg-rose-950/60 border-rose-700 text-rose-200"
      : "bg-red-50 border-red-200 text-red-700");

  const inputBase =
    "w-full rounded-xl sm:rounded-2xl outline-none transition-all text-sm sm:text-base py-3 sm:py-4 px-10 sm:px-12 border " +
    (isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      : "bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600");

  const sidebarCardClass =
    "flex items-center gap-4 p-4 rounded-2xl backdrop-blur-sm border " +
    (isDark ? "bg-white/5 border-white/15" : "bg-white/10 border-white/20");

  const mobileFeatureCard =
    "flex flex-col items-center p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-sm text-xs font-medium " +
    (isDark
      ? "bg-slate-900/80 text-slate-200"
      : "bg-white/60 text-gray-600");

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      if (response.data.requiresVerification) {
        setUserId(response.data.userId);
        setUserEmail(response.data.email);
        setUserName(formData.name.trim());
        setShowVerification(true);
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur lors de l'inscription";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    const response = await api.post("/auth/verify-registration", {
      userId,
      code,
    });
    if (response.data.success) {
      setShowVerification(false);
      setShowUploadPicture(true);
    }
  };

  const handleProfilePictureComplete = async (userData) => {
    try {
      const response = await api.post("/auth/finalize-registration", {
        userId,
      });

      if (response.data.token) {
        authLogin(response.data.token, {
          ...userData,
          profilePicture: response.data.user.profilePicture,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("❌ Erreur finalisation:", error);
      setError("Erreur lors de la connexion");
    }
  };

  const handleResendCode = async () => {
    await api.post("/auth/resend-code", { email: userEmail });
  };

  const handleBack = () => {
    setShowVerification(false);
    setShowUploadPicture(false);
    setUserId(null);
    setUserEmail("");
    setUserName("");
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${
        isDark ? "text-slate-50" : "text-gray-900"
      }`}
      style={pageBgStyle}
    >
      {/* Sidebar Desktop */}
      <div
        className="hidden lg:flex lg:w-2/5 p-8 flex-col justify-between relative overflow-hidden"
        style={sidebarStyle}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.15)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2)_0,_transparent_55%)] opacity-70" />

        {/* Logo */}
        <div className="flex flex-col items-center text-center relative z-10 mt-16">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md mb-3 border border-white/30 shadow-lg shadow-slate-900/40">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">
            PrimAzul
          </h1>
          <p className="text-blue-100 text-sm">Making distance disappear</p>
        </div>

        {/* Features */}
        <div className="space-y-5 relative z-10">
          <div className={sidebarCardClass}>
            <Users className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Groupes et contacts
              </h3>
              <p className="text-blue-100 text-sm">
                Créez et gérez vos conversations
              </p>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <Sparkles className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Partage multimédia
              </h3>
              <p className="text-blue-100 text-sm">
                Images, documents et messages vocaux
              </p>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Votre espace</h3>
              <p className="text-blue-100 text-sm">
                Connecté, sécurisé, rapide
              </p>
            </div>
          </div>
        </div>

        <div className="text-center relative z-10">
          <p className="text-white/80 text-sm">
            Commencez votre aventure
          </p>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8"
        style={contentBgStyle}
      >
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className={`text-xl sm:text-2xl font-semibold ${textStrong}`}>
                  PrimAzul
                </h1>
                <p className={`text-xs sm:text-sm ${textMuted}`}>
                  Making distance disappear
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className={mainCardClass}>
            {showUploadPicture ? (
              // Étape 3 : Upload photo
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleBack}
                    className={
                      "p-2 rounded-xl transition-all " +
                      (isDark
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-gray-600 hover:bg-blue-50")
                    }
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2
                    className={`text-xl sm:text-2xl font-semibold ${textStrong}`}
                  >
                    Personnalisation
                  </h2>
                </div>
                <UploadProfilePicture
                  userId={userId}
                  userName={userName}
                  onComplete={handleProfilePictureComplete}
                />
              </div>
            ) : showVerification ? (
              // Étape 2 : Vérification code
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleBack}
                    className={
                      "p-2 rounded-xl transition-all " +
                      (isDark
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-gray-600 hover:bg-blue-50")
                    }
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2
                    className={`text-xl sm:text-2xl font-semibold ${textStrong}`}
                  >
                    Vérification
                  </h2>
                </div>
                <VerifyCode
                  email={userEmail}
                  userId={userId}
                  type="register"
                  onVerify={handleVerifyCode}
                  onResend={handleResendCode}
                  onBack={handleBack}
                />
              </div>
            ) : (
              // Étape 1 : Formulaire d'inscription
              <>
                <div className="text-center mb-6 sm:mb-8">
                  <h2
                    className={`text-2xl sm:text-3xl font-semibold mb-2 ${textStrong}`}
                  >
                    Rejoignez-nous
                  </h2>
                  <p className={`text-sm sm:text-base ${textMuted}`}>
                    Créez votre compte PrimAzul
                  </p>
                </div>

                {error && (
                  <div className={errorAlertClass}>
                    <div className="w-2 h-2 bg-current rounded-full" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Nom */}
                  <div>
                    <label
                      className={
                        "block text-sm font-medium mb-2 " +
                        (isDark ? "text-slate-200" : "text-gray-700")
                      }
                    >
                      Nom d&apos;utilisateur
                    </label>
                    <div className="relative">
                      <User
                        className={
                          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 " +
                          (isDark ? "text-slate-500" : "text-gray-400")
                        }
                      />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputBase}
                        placeholder="Votre pseudo"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      className={
                        "block text-sm font-medium mb-2 " +
                        (isDark ? "text-slate-200" : "text-gray-700")
                      }
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className={
                          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 " +
                          (isDark ? "text-slate-500" : "text-gray-400")
                        }
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={inputBase}
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label
                      className={
                        "block text-sm font-medium mb-2 " +
                        (isDark ? "text-slate-200" : "text-gray-700")
                      }
                    >
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock
                        className={
                          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 " +
                          (isDark ? "text-slate-500" : "text-gray-400")
                        }
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={inputBase + " pr-10 sm:pr-12"}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={
                          "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 transition-colors " +
                          (isDark
                            ? "text-slate-400 hover:text-slate-200"
                            : "text-gray-400 hover:text-gray-600")
                        }
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div>
                    <label
                      className={
                        "block text-sm font-medium mb-2 " +
                        (isDark ? "text-slate-200" : "text-gray-700")
                      }
                    >
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock
                        className={
                          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 " +
                          (isDark ? "text-slate-500" : "text-gray-400")
                        }
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={inputBase + " pr-10 sm:pr-12"}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className={
                          "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 transition-colors " +
                          (isDark
                            ? "text-slate-400 hover:text-slate-200"
                            : "text-gray-400 hover:text-gray-600")
                        }
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bouton inscription */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:translate-y-[-1px] active:translate-y-[0px] shadow-lg shadow-blue-500/40 hover:shadow-blue-500/50 text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Création du compte...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Créer mon compte
                      </span>
                    )}
                  </button>
                </form>

                {/* Lien vers login */}
                <div className="mt-6 sm:mt-8 text-center">
                  <p className={`text-sm sm:text-base ${textMuted}`}>
                    Déjà un compte ?{" "}
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-500 transition-all shadow-md shadow-blue-500/40 hover:shadow-blue-500/60 transform hover:translate-y-[-1px]"
                    >
                      <LogIn className="w-4 h-4" />
                      Se connecter
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Mobile features */}
          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3 text-center">
            <div className={mobileFeatureCard}>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-blue-500" />
              <span>Groupes</span>
            </div>
            <div className={mobileFeatureCard}>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-blue-400" />
              <span>Multimédia</span>
            </div>
            <div className={mobileFeatureCard}>
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-green-500" />
              <span>Sécurisé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}