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
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordOtp, verifyChangePassword } from "@/lib/api";

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
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
    darkMode: false,
    language: "fr",
    privacy: "public",
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-300 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-4 md:p-8">
      {/* Flèche retour */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6h   z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 hover:border-blue-400 hover:scale-110 transition-all"
      >
        <ArrowLeft className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
      </button>

      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-blue-100">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {user.name || user.email?.split("@")[0]}
            </h1>
            <p className="text-sm text-blue-600">
              @{user.username || "utilisateur"}
            </p>
          </div>
        </div>

        {/* Sections en grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profil */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Profil</h2>
            </div>
            <Link href="/profile" className="text-blue-600 hover:underline">
              → Modifier le profil
            </Link>
          </section>

          {/* Notifications */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-semibold text-slate-800">
                Notifications
              </h2>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={userData.notifications}
                onChange={(e) =>
                  setUserData({ ...userData, notifications: e.target.checked })
                }
              />
              <span>Activer les notifications</span>
            </label>
          </section>

          {/* Apparence */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-slate-800">
                Apparence
              </h2>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={userData.darkMode}
                onChange={(e) =>
                  setUserData({ ...userData, darkMode: e.target.checked })
                }
              />
              <span>Mode sombre</span>
            </label>
          </section>

          {/* Langue */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-800">Langue</h2>
            </div>
            <select
              value={userData.language}
              onChange={(e) =>
                setUserData({ ...userData, language: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </section>

          {/* Contacts bloqués */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl font-semibold text-slate-800">
                Contacts bloqués
              </h2>
            </div>
            <Link href="/settings/blocked">
              <div className="text-rose-600 hover:underline cursor-pointer">
                → Gérer la liste des utilisateurs bloqués
              </div>
            </Link>
          </section>

          {/* Confidentialité */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-800">
                Confidentialité
              </h2>
            </div>
            <select
              value={userData.privacy}
              onChange={(e) =>
                setUserData({ ...userData, privacy: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Profil public</option>
              <option value="private">Profil privé</option>
              <option value="restricted">Limité</option>
            </select>
          </section>

          {/* Sécurité : changement de mot de passe */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-800">
                Changer le mot de passe
              </h2>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl font-semibold shadow-md transition transform hover:scale-[1.02]"
            >
              Modifier le mot de passe
            </button>
          </section>
        </div>

        {/* Déconnexion */}
        {/* Déconnexion (bouton fixe) */}
        <button
          onClick={handleLogout}
          className="fixed bottom-5 right-6 z-40 flex items-center gap-2 px-6 py-4 bg-white text-red-600 border border-red-100 shadow-lg hover:bg-red-50 rounded-full transition"
        >
          <LogOut className="w-4 h-4" />
          Déconnecter
        </button>
      </div>

      {/* Popup changement mot de passe */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl w-96 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">
              🔑 Changer le mot de passe
            </h2>

            {step === 1 && (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Ancien mot de passe"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="password"
                  placeholder="Confirmer nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <button
                  onClick={startChangePassword}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:scale-105 transition"
                >
                  {loading ? "Envoi..." : "Modifier"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Code OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <button
                  onClick={confirmChangePassword}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:scale-105 transition"
                >
                  {loading ? "Vérification..." : "Confirmer"}
                </button>
              </div>
            )}

            {message && <p className="mt-3 text-sm">{message}</p>}
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
