// app/profile/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

// Composants
import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileStats from "@/components/Profile/ProfileStats";
import ProfileDetails from "@/components/Profile/ProfileDetails";
import ProfileEditModal from "@/components/Profile/ProfileEditModal";
import EmailChangeModal from "@/components/Profile/EmailChangeModal";
import PhotoUploadModal from "@/components/Profile/PhotoUploadModal";
import ProfileSkeleton from "@/components/Profile/ProfileSkeleton";

import { ArrowLeft, Settings, Shield, Bell } from "lucide-react";

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isDark } = useTheme();
  const router = useRouter();
  const {
    user,
    isLoading,
    isUpdating,
    isUploadingPhoto,
    emailChangeStep,
    pendingEmail,
    refreshProfile,
    updateUserProfile,
    uploadPhoto,
    requestEmailChangeOTP,
    confirmEmailChangeOTP,
    cancelEmailChange,
  } = useProfile();

  const [activeTab, setActiveTab] = useState("profile"); // profile | security | preferences
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Styles
  const styles = {
    page: isDark
      ? "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"
      : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
    card: isDark
      ? "bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/20"
      : "bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-xl shadow-slate-200/50",
    text: {
      primary: isDark ? "text-white" : "text-slate-900",
      secondary: isDark ? "text-slate-400" : "text-slate-600",
      muted: isDark ? "text-slate-500" : "text-slate-400",
    },
    button: {
      primary:
        "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25",
      secondary: isDark
        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200",
      ghost: isDark
        ? "hover:bg-slate-800/50 text-slate-400 hover:text-white"
        : "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    },
    tab: {
      active: isDark
        ? "bg-blue-600/20 text-blue-400 border-blue-500"
        : "bg-blue-50 text-blue-600 border-blue-500",
      inactive: isDark
        ? "text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent",
    },
  };

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  if (!isMounted) {
    setIsMounted(true);
    return null;
  }

  if (!isMounted) return null;

  if (isLoading || !user) {
    return <ProfileSkeleton isDark={isDark} />;
  }

  const tabs = [];

  return (
    <div className={`min-h-screen ${styles.page}`}>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${isDark ? "bg-blue-500/10" : "bg-blue-400/20"}`}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? "bg-cyan-500/10" : "bg-cyan-400/20"}`}
        />
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ===== NAVIGATION ===== */}
          <nav className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all border ${styles.button.secondary}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>

            <div
              className="flex items-center gap-2 p-1 rounded-xl border bg-opacity-50 backdrop-blur-sm"
              style={{
                background: isDark
                  ? "rgba(30, 41, 59, 0.5)"
                  : "rgba(255, 255, 255, 0.5)",
                borderColor: isDark
                  ? "rgba(71, 85, 105, 0.5)"
                  : "rgba(203, 213, 225, 0.5)",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? styles.tab.active
                      : styles.tab.inactive
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* ===== CONTENT ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ===== SIDEBAR - PROFILE HEADER ===== */}
            <div className="lg:col-span-1">
              <ProfileHeader
                user={user}
                isDark={isDark}
                styles={styles}
                isUploadingPhoto={isUploadingPhoto}
                onEditPhoto={() => setShowPhotoModal(true)}
                onEditProfile={() => setShowEditModal(true)}
              />
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="lg:col-span-2">
              {activeTab === "profile" && (
                <ProfileDetails
                  user={user}
                  isDark={isDark}
                  styles={styles}
                  onEditProfile={() => setShowEditModal(true)}
                  onEditEmail={() => setShowEmailModal(true)}
                />
              )}

              {activeTab === "security" && (
                <SecuritySection
                  user={user}
                  isDark={isDark}
                  styles={styles}
                  onChangeEmail={() => setShowEmailModal(true)}
                />
              )}

              {activeTab === "preferences" && (
                <PreferencesSection
                  user={user}
                  isDark={isDark}
                  styles={styles}
                  onUpdate={updateUserProfile}
                  isUpdating={isUpdating}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {showEditModal && (
        <ProfileEditModal
          user={user}
          isDark={isDark}
          isUpdating={isUpdating}
          onClose={() => setShowEditModal(false)}
          onSave={updateUserProfile}
        />
      )}

      {showEmailModal && (
        <EmailChangeModal
          user={user}
          isDark={isDark}
          isUpdating={isUpdating}
          emailChangeStep={emailChangeStep}
          pendingEmail={pendingEmail}
          onClose={() => {
            setShowEmailModal(false);
            cancelEmailChange();
          }}
          onRequestChange={requestEmailChangeOTP}
          onConfirmChange={confirmEmailChangeOTP}
          onCancel={cancelEmailChange}
        />
      )}

      {showPhotoModal && (
        <PhotoUploadModal
          user={user}
          isDark={isDark}
          isUploading={isUploadingPhoto}
          onClose={() => setShowPhotoModal(false)}
          onUpload={uploadPhoto}
        />
      )}
    </div>
  );
}

// ===== SECURITY SECTION =====
function SecuritySection({ user, isDark, styles, onChangeEmail }) {
  const router = useRouter();

  return (
    <div className={`rounded-2xl border overflow-hidden ${styles.card}`}>
      <div
        className={`p-5 border-b ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/50 bg-slate-50/50"}`}
      >
        <h2
          className={`text-lg font-bold flex items-center gap-2 ${styles.text.primary}`}
        >
          <Shield className="w-5 h-5 text-blue-500" />
          Sécurité du compte
        </h2>
        <p className={`text-sm mt-1 ${styles.text.secondary}`}>
          Gérez la sécurité de votre compte
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Email */}
        <div
          className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styles.text.primary}`}>
                Adresse email
              </h3>
              <p className={`text-sm ${styles.text.secondary}`}>{user.email}</p>
            </div>
            <button
              onClick={onChangeEmail}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${styles.button.primary}`}
            >
              Modifier
            </button>
          </div>
        </div>

        {/* Mot de passe */}
        <div
          className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styles.text.primary}`}>
                Mot de passe
              </h3>
              <p className={`text-sm ${styles.text.secondary}`}>
                Dernière modification: il y a 30 jours
              </p>
            </div>
            <button
              onClick={() => router.push("/settings/security")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${styles.button.secondary}`}
            >
              Modifier
            </button>
          </div>
        </div>

        {/* 2FA */}
        <div
          className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styles.text.primary}`}>
                Double authentification
              </h3>
              <p className={`text-sm ${styles.text.secondary}`}>
                {user.isVerified ? "✅ Activée" : "❌ Désactivée"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.isVerified
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {user.isVerified ? "Sécurisé" : "À activer"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PREFERENCES SECTION =====
function PreferencesSection({ user, isDark, styles, onUpdate, isUpdating }) {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
  });

  return (
    <div className={`rounded-2xl border overflow-hidden ${styles.card}`}>
      <div
        className={`p-5 border-b ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/50 bg-slate-50/50"}`}
      >
        <h2
          className={`text-lg font-bold flex items-center gap-2 ${styles.text.primary}`}
        >
          <Bell className="w-5 h-5 text-blue-500" />
          Préférences
        </h2>
        <p className={`text-sm mt-1 ${styles.text.secondary}`}>
          Gérez vos préférences de notification
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Email Notifications */}
        <div
          className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styles.text.primary}`}>
                Notifications par email
              </h3>
              <p className={`text-sm ${styles.text.secondary}`}>
                Recevez des mises à jour par email
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div
          className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styles.text.primary}`}>
                Notifications push
              </h3>
              <p className={`text-sm ${styles.text.secondary}`}>
                Recevez des notifications instantanées
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.pushNotifications}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  pushNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Marketing Emails */}
        <div
          className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styles.text.primary}`}>
                Emails marketing
              </h3>
              <p className={`text-sm ${styles.text.secondary}`}>
                Recevez nos offres et actualités
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  marketingEmails: e.target.checked,
                })
              }
              className="w-5 h-5 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
