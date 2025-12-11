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
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordOtp, verifyChangePassword } from "@/lib/api";

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const {
    preferences,
    updatePreferences,
    MESSAGE_SOUNDS,
    CALL_SOUNDS,
    playMessageSound,
    playCallSound,
  } = useNotifications(); // ⬅️ nouveau

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
    darkMode: false,
    language: "fr",
    privacy: "public",
  });

  const pageBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50"
    : "bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100 text-slate-900";

  const haloBg = isDark
    ? "bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(79,70,229,0.3)_0,_transparent_55%)]"
    : "bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16)_0,_transparent_55%)]";

  const cardBase =
    "group relative overflow-hidden rounded-2xl px-5 py-5 transition-transform duration-200 backdrop-blur-xl " +
    (isDark
      ? "border border-slate-800 bg-slate-900/80 shadow-[0_18px_45px_rgba(15,23,42,0.6)] hover:-translate-y-1"
      : "border border-slate-200 bg-white/90 shadow-[0_14px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1");

  const inputBase =
    "w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 transition " +
    (isDark
      ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
      : "border-slate-300 bg-white text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-400");

  // ******* ICI : paramètre en pur JS ********
  const buttonPrimary = (gradient) =>
    "mt-1 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-70 " +
    (gradient === "blue"
      ? "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 shadow-sky-500/40"
      : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 shadow-emerald-500/40");

  const labelText = isDark ? "text-slate-200" : "text-slate-700";
  const smallMuted = isDark ? "text-slate-400" : "text-slate-500";

  const headerCard =
    "mt-6 flex flex-col gap-6 rounded-3xl px-5 py-5 md:flex-row md:items-center md:justify-between " +
    (isDark
      ? "border border-slate-800 bg-slate-900/90 shadow-[0_18px_60px_rgba(15,23,42,0.7)]"
      : "border border-slate-200 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.12)]");

  // === Logique changement mot de passe (inchangée) ===
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
      setMessage("✅ OTP envoyé à votre email");
      setStep(2);
    } catch (error) {
      if (error.response?.status === 400) {
        setMessage("❌ Ancien mot de passe incorrect");
      } else {
        setMessage("❌ Erreur lors de l'envoi de l'OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmChangePassword = async () => {
    if (!otp) {
      return setMessage("❌ Veuillez saisir le code OTP");
    }
    try {
      setLoading(true);
      await verifyChangePassword({ code: otp, newPassword });
      setMessage("✅ Mot de passe changé avec succès");
      setShowModal(false);
      setStep(1);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-400/40 border-t-sky-500" />
          <p className="mt-4 text-slate-500 text-sm">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-6 md:px-8 ${pageBg}`}
    >
      {/* halo décoratif */}
      <div
        className={`pointer-events-none absolute inset-0 -z-10 opacity-60 ${haloBg}`}
      />

      {/* Bouton retour */}
      <button
        onClick={() => router.back()}
        className={
          "fixed top-5 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border shadow-xl backdrop-blur-md hover:-translate-y-0.5 transition-all " +
          (isDark
            ? "bg-slate-900/90 border-slate-700 text-slate-100 hover:border-sky-400 hover:text-sky-400"
            : "bg-white/90 border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-500")
        }
      >
        <ArrowLeft className="w-6 h-6" strokeWidth={2.2} />
      </button>

      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* En‑tête utilisateur */}
        <header className={headerCard}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={
                  "h-20 w-20 overflow-hidden rounded-3xl ring-2 shadow-[0_10px_40px_rgba(56,189,248,0.6)] " +
                  (isDark ? "ring-sky-500/80" : "ring-sky-400/80 bg-slate-100")
                }
              >
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500">
                    <User className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <span
                className={
                  "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold shadow-md bg-emerald-500 text-white"
                }
              >
                ●
              </span>
            </div>

            <div>
              <p
                className={`mb-1 text-[11px] uppercase tracking-[0.22em] ${
                  isDark ? "text-sky-400/80" : "text-sky-600/80"
                }`}
              >
                Paramètres du compte
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold">
                {user.name || user.email?.split("@")[0]}
              </h1>
              <p className={`mt-1 text-xs ${smallMuted}`}>
                {user.username && <span>@{user.username}</span>}
                {!user.username && user.email && <span>{user.email}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            <span
              className={
                "rounded-full border px-3 py-1 text-xs font-medium " +
                (isDark
                  ? "border-slate-700 bg-slate-900/80 text-slate-200"
                  : "border-slate-200 bg-white text-slate-600")
              }
            >
              Espace personnel sécurisé
            </span>
            <p className={`max-w-xs text-xs md:text-right ${smallMuted}`}>
              Gérez vos informations, votre sécurité et vos préférences en un
              seul endroit.
            </p>
          </div>
        </header>

        {/* Sections */}
        <main className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Profil */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Profil</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Infos personnelles, photo, statut
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className={
                "inline-flex items-center gap-1 text-xs font-medium " +
                (isDark
                  ? "text-sky-400 hover:text-sky-300"
                  : "text-sky-600 hover:text-sky-500")
              }
            >
              <span>Ouvrir la page profil</span>
              <span aria-hidden>↗</span>
            </Link>
          </section>

          {/* Notifications */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Notifications</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Sons, alertes et interruptions
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Activer / suspendre */}
              <label
                className={`flex items-center justify-between gap-3 cursor-pointer ${labelText}`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">Activer les notifications</span>
                  <span className={`mt-0.5 text-[11px] ${smallMuted}`}>
                    Désactivez pour suspendre tous les sons et alertes.
                  </span>
                </div>

                <div
                  className={
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
                    (preferences.enabled ? "bg-amber-500" : "bg-slate-400/40")
                  }
                >
                  <span
                    className={
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform " +
                      (preferences.enabled ? "translate-x-5" : "translate-x-1")
                    }
                  />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={preferences.enabled}
                    onChange={(e) =>
                      updatePreferences({ enabled: e.target.checked })
                    }
                  />
                </div>
              </label>

              {/* 2. Son des messages */}
              <div>
                <label
                  className={`mb-1 block text-xs font-medium ${labelText}`}
                >
                  Son des messages
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={preferences.messageSoundId}
                    onChange={(e) =>
                      updatePreferences({ messageSoundId: e.target.value })
                    }
                    disabled={!preferences.enabled}
                    className={inputBase + " text-xs"}
                  >
                    {MESSAGE_SOUNDS.map((sound) => (
                      <option key={sound.id} value={sound.id}>
                        {sound.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={playMessageSound}
                    disabled={!preferences.enabled}
                    className={
                      "rounded-xl border px-3 py-2 text-[11px] font-medium transition " +
                      (isDark
                        ? "border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                        : "border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50")
                    }
                  >
                    Tester
                  </button>
                </div>
                <p className={`mt-1 text-[11px] ${smallMuted}`}>
                  Joué à chaque nouveau message reçu.
                </p>
              </div>

              {/* 3. Son des appels */}
              <div>
                <label
                  className={`mb-1 block text-xs font-medium ${labelText}`}
                >
                  Son des appels entrants
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={preferences.callSoundId}
                    onChange={(e) =>
                      updatePreferences({ callSoundId: e.target.value })
                    }
                    disabled={!preferences.enabled}
                    className={inputBase + " text-xs"}
                  >
                    {CALL_SOUNDS.map((sound) => (
                      <option key={sound.id} value={sound.id}>
                        {sound.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={playCallSound}
                    disabled={!preferences.enabled}
                    className={
                      "rounded-xl border px-3 py-2 text-[11px] font-medium transition " +
                      (isDark
                        ? "border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                        : "border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50")
                    }
                  >
                    Tester
                  </button>
                </div>
                <p className={`mt-1 text-[11px] ${smallMuted}`}>
                  Joué quand vous recevez un appel.
                </p>
              </div>
            </div>
          </section>

          {/* Apparence (switch clair/sombre pour CETTE page) */}
          {/* Apparence */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-500">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Apparence</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Bascule claire / sombre pour tout le site
                </p>
              </div>
            </div>

            <label
              className={`flex items-center gap-3 text-xs cursor-pointer ${labelText}`}
            >
              {/* Switch visuel */}
              <div
                className={
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
                  (isDark ? "bg-fuchsia-500/80" : "bg-slate-300")
                }
              >
                <span
                  className={
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform " +
                    (isDark ? "translate-x-5" : "translate-x-1")
                  }
                />
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isDark}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    // on garde ta state locale pour cohérence
                    setUserData((prev) => ({ ...prev, darkMode: checked }));
                    // on met à jour le thème GLOBAL
                    setTheme(checked ? "dark" : "light");
                  }}
                />
              </div>

              <span>{isDark ? "Mode sombre activé" : "Mode clair activé"}</span>
            </label>
          </section>

          {/* Langue */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Langue</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Langue de l&apos;interface
                </p>
              </div>
            </div>

            <select
              value={userData.language}
              onChange={(e) =>
                setUserData({ ...userData, language: e.target.value })
              }
              className={inputBase}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </section>

          {/* Contacts bloqués */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Contacts bloqués</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Gérez les utilisateurs que vous ne voulez plus voir
                </p>
              </div>
            </div>

            <Link href="/settings/blocked">
              <span
                className={
                  "inline-flex items-center gap-1 text-xs font-medium " +
                  (isDark
                    ? "text-rose-400 hover:text-rose-300"
                    : "text-rose-500 hover:text-rose-400")
                }
              >
                <span>Gérer la liste des utilisateurs bloqués</span>
                <span aria-hidden>→</span>
              </span>
            </Link>
          </section>

          {/* Confidentialité */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Confidentialité</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Contrôlez la visibilité de votre profil
                </p>
              </div>
            </div>

            <select
              value={userData.privacy}
              onChange={(e) =>
                setUserData({ ...userData, privacy: e.target.value })
              }
              className={inputBase}
            >
              <option value="public">Profil public</option>
              <option value="private">Profil privé</option>
              <option value="restricted">Limité</option>
            </select>
          </section>

          {/* Sécurité : changement de mot de passe */}
          <section className={cardBase}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Sécurité du compte</h2>
                <p className={`text-xs ${smallMuted}`}>
                  Mettez à jour régulièrement votre mot de passe
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className={
                "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:brightness-105 hover:-translate-y-[1px] " +
                "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400"
              }
            >
              Modifier le mot de passe
            </button>
          </section>
        </main>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className={
            "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold shadow-[0_14px_45px_rgba(248,113,113,0.45)] backdrop-blur-xl transition hover:-translate-y-[1px] " +
            (isDark
              ? "border border-rose-500/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 hover:text-white"
              : "border border-rose-400/40 bg-rose-50 text-rose-600 hover:bg-rose-100")
          }
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>

      {/* Popup changement mot de passe */}
      {showModal && (
        <div
          className={
            "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm " +
            (isDark ? "bg-slate-950/70" : "bg-black/30")
          }
        >
          <div
            className={
              "w-full max-w-md rounded-3xl border p-6 shadow-[0_22px_70px_rgba(15,23,42,0.4)] " +
              (isDark
                ? "border-slate-800 bg-slate-900/95 text-slate-100"
                : "border-slate-200 bg-white text-slate-900")
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p
                  className={
                    "text-[11px] uppercase tracking-[0.18em] " +
                    (isDark ? "text-sky-400/80" : "text-sky-600/80")
                  }
                >
                  Sécurité
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Changer le mot de passe
                </h2>
              </div>
              <div
                className={
                  "flex h-8 w-8 items-center justify-center rounded-full " +
                  (isDark
                    ? "bg-sky-500/15 text-sky-400"
                    : "bg-sky-100 text-sky-600")
                }
              >
                <Key className="h-4 w-4" />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Ancien mot de passe"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputBase}
                />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputBase}
                />
                <button
                  onClick={startChangePassword}
                  disabled={loading}
                  className={buttonPrimary("blue")}
                >
                  {loading ? "Envoi..." : "Envoyer le code par email"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Code OTP reçu par email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={inputBase}
                />
                <button
                  onClick={confirmChangePassword}
                  disabled={loading}
                  className={buttonPrimary("green")}
                >
                  {loading ? "Vérification..." : "Confirmer le changement"}
                </button>
              </div>
            )}

            {message && (
              <p className={`mt-4 text-xs ${smallMuted}`}>{message}</p>
            )}

            <button
              onClick={() => setShowModal(false)}
              className={
                "mt-4 text-xs font-medium " +
                (isDark
                  ? "text-slate-300 hover:text-slate-100"
                  : "text-slate-500 hover:text-slate-800")
              }
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
