"use client";

import { useState, useContext, useEffect } from "react";
import { AuthContext } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Users,
  Shield,
  Bell,
  Settings,
  Edit3,
  Check,
  Clock,
  ArrowLeft,
  Save,
  X,
  Star,
  Award,
  TrendingUp,
  Eye,
  Download,
  Calendar,
  Zap,
  Heart,
} from "lucide-react";
import VerifyCode from "@/components/Auth/VerifyCode";

import { requestEmailChange, confirmEmailChange } from "@/lib/api"; // doit pointer vers le fichier exact
// Composant ActivityIcon séparé
const ActivityIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

export default function ProfilePage() {
  const { user, updateProfile, setUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [profilePicture, setProfilePicture] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔹 Vérification email
  const [showVerify, setShowVerify] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

  // Styles basés sur le thème (mêmes couleurs que sidebar)
  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-b from-blue-50 to-indigo-100";

  const cardBg = isDark
    ? "bg-gradient-to-b from-blue-900/90 via-blue-900/80 to-blue-900/90 border-blue-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    : "bg-white border-blue-100 shadow-lg";

  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 border-blue-800"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-blue-200";

  const textPrimary = isDark ? "text-blue-50" : "text-slate-800";
  const textSecondary = isDark ? "text-blue-200" : "text-slate-600";
  const textMuted = isDark ? "text-blue-300" : "text-slate-500";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20";

  const statCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-blue-50 border-blue-200";

  const detailCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-slate-50 border-slate-200";

  const activityCardBg = isDark
    ? "bg-blue-800/70 border-blue-700"
    : "bg-white border-slate-200";

  const profileHeaderBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-r from-blue-600 to-indigo-600";

  const profileRing = isDark
    ? "ring-blue-700/50"
    : "ring-white/50";

  const cameraButton = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-200 border-blue-600"
    : "bg-white hover:bg-blue-50 text-blue-600 border-blue-200";

  const quickActionBg = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-200 border-blue-700"
    : "bg-blue-50 hover:bg-blue-100 text-slate-700 border-blue-200";

  const tabBg = isDark
    ? "hover:bg-blue-800 hover:text-blue-100 text-blue-300"
    : "hover:bg-blue-50 hover:text-slate-800 text-slate-600";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700 text-blue-100 placeholder-blue-400 focus:ring-cyan-500"
    : "bg-white border-slate-300 text-slate-800 placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500";

  const contentHeaderBg = isDark
    ? "bg-blue-900/50 border-blue-800"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";

  // Données simulées
  const userStats = {
    streak: 12
  };

  const recentActivity = [
    { id: 1, action: "a partagé un clip", time: "2 min", icon: Zap },
    { id: 2, action: "a rejoint un groupe", time: "1 h", icon: Users },
    { id: 3, action: "a aimé un message", time: "3 h", icon: Heart },
    { id: 4, action: "a créé un clip", time: "5 h", icon: Zap },
  ];

  // Fix hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      });
      setProfilePicture(user.profilePicture || "");
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image valide");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erreur upload image:", error);
      setError("Erreur lors de l'upload de l'image");
      setIsLoading(false);
    }
  };


const handleChangeEmail = async (newEmail) => {
  try {
    await requestEmailChange(newEmail); // ⚡ frontend appelle le backend

    setTempEmail(newEmail); // mémoriser temporairement
    setShowVerify(true);    // afficher le composant VerifyCode
  } catch (error) {
    console.error("ERREUR API:", error.response?.data || error.message);
    alert(
      error.response?.data?.error || "Erreur lors de l’envoi du code"
    );
  }
};

const handleVerify = async (code) => {
  try {
    const result = await confirmEmailChange(code); // ⚡ backend confirme OTP
    setUser({ ...user, email: result.data.email }); // <- result.data.email
    setShowVerify(false);
    setIsEditing(false);
    alert("Adresse email mise à jour !");
  } catch (error) {
    alert(error.response?.data?.error || "Code incorrect ou expiré");
  }
};




const handleResend = async () => {
  try {
    console.log("Simulé : renvoi code pour", tempEmail);
    alert(`Code renvoyé à ${tempEmail}`);
  } catch (error) {
    alert("Erreur lors de l’envoi du code");
  }
};



// -----------------------------
// 🔹 Sauvegarde du profil
// -----------------------------
const handleSave = async () => {
  setIsLoading(true);
  setError("");
  setSuccess("");

  try {
    // Changement d’email
    if (formData.email !== user.email) {
      const newEmail = formData.email.trim();
      if (!newEmail) {
        setError("Email invalide");
        setIsLoading(false);
        return;
      }
      await handleChangeEmail(newEmail);
      setIsLoading(false);
      return;
    }

    // Mise à jour normale
    const dataToUpdate = {
      name: formData.name,
      phone: formData.phone,
      location: formData.location,
      bio: formData.bio,
      profilePicture,
    };

    // Appel API réel (updateProfile existe dans ton api.js)
    const result = await updateProfile(dataToUpdate);

    setSuccess("✅ Profil mis à jour avec succès !");
    setIsEditing(false);
  } catch (error) {
    console.error(error);
    setError("Erreur lors de la mise à jour");
  } finally {
    setIsLoading(false);
  }
};
  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      });
      setProfilePicture(user.profilePicture || "");
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };



 // -----------------------------
  // 🔹 Vérification du code reçu
  // -----------------------------
 
  // -----------------------------------------
  // 🔹 MODE VÉRIFICATION EMAIL
  // -----------------------------------------
  if (showVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <VerifyCode
          email={tempEmail}
          type="email-change"
          onVerify={handleVerify}
          onResend={handleResend}
          onBack={() => setShowVerify(false)}
        />
      </div>
    );
  }
  if (!isMounted || !user) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 mx-auto ${
              isDark ? 'border-blue-800/50 border-t-cyan-400' : 'border-blue-600/20 border-t-blue-600'
            }`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className={`w-6 h-6 animate-pulse ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`} />
            </div>
          </div>
          <p className={`mt-6 font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }
 return (
  <div className={`min-h-screen ${pageBg}`}>
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* ===== HEADER ===== */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl shadow-lg border ${headerBg}`}>
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${buttonStyle}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="text-center">
            <h1 className={`text-xl font-bold ${textPrimary}`}>Mon Profil</h1>
            <p className={`text-sm ${textSecondary}`}>
              Gérez vos informations personnelles
            </p>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md ${buttonStyle}`}
              >
                <Edit3 className="w-4 h-4 inline mr-1" />
                Modifier
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-xl ${
                    isDark
                      ? "bg-blue-800 text-blue-200"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Annuler
                </button>

                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-xl text-white shadow-md ${
                    isDark
                      ? "bg-linear-to-r from-emerald-600 to-cyan-600"
                      : "bg-linear-to-r from-green-600 to-cyan-500"
                  }`}
                >
                  {isLoading ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ===== ALERTES ===== */}
        {(error || success) && (
          <div className={`p-3 rounded-xl text-sm border ${
            error
              ? isDark
                ? "bg-red-900/30 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
              : isDark
              ? "bg-green-900/30 border-green-800 text-green-300"
              : "bg-green-50 border-green-200 text-green-700"
          }`}>
            {error || success}
          </div>
        )}

        {/* ===== CONTENU ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ===== SIDEBAR ===== */}
          <aside className=" h-fit">
            <div className={`rounded-2xl shadow-lg border overflow-hidden ${cardBg}`}>
              <div className={`p-4 text-center ${profileHeaderBg}`}>
                <div className="relative mx-auto w-20 h-20 rounded-xl overflow-hidden ring-4 shadow-lg">
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500">
                      <User className="text-white w-8 h-8" />
                    </div>
                  )}

                  {isEditing && (
                    <label className={`absolute bottom-1 right-1 p-1 rounded-lg cursor-pointer ${cameraButton}`}>
                      <Camera className="w-3 h-3" />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                    </label>
                  )}
                </div>

                <h2 className="mt-3 font-bold text-white truncate">
                  {formData.name}
                </h2>
                <p className="text-sm text-blue-100 truncate">
                  {formData.email}
                </p>
              </div>
               <div className={`rounded-xl p-4 border ${statCardBg} space-y-4`}>
  {/* Header */}
  <h3 className={`flex items-center text-sm font-bold ${
    isDark ? 'text-blue-200' : 'text-slate-800'
  }`}>
    <Clock className={`w-4 h-4 mr-2 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
    Statut et activité
  </h3>

  {/* Statut en ligne */}
  <div className="flex items-center justify-between">
    <div className="flex items-center ">
      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
      <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
        En ligne
      </span>
    </div>
    <span className="text-sm font-medium text-cyan-500">Statut</span>
  </div>

  {/* Membre depuis */}
  <div className="flex justify-between text-sm">
    <span className={isDark ? 'text-blue-300' : 'text-slate-600'}>Membre depuis :</span>
    <span className={`font-medium ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
      {new Date(user.createdAt || Date.now()).toLocaleDateString("fr-FR")}
    </span>
  </div>
</div>

              {/* Conversations */}
          <div className="p-4 pt-3">
            <button
             onClick={() => router.push("/")}
           className={`w-full flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all ${quickActionBg}`}
           >
            <MessageCircle className="w-4 h-4" />
             Conversations
          </button>


      </div>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className={`rounded-2xl shadow-lg border ${cardBg}`}>
            <div className={`p-4 border-b ${contentHeaderBg}`}>
              <h2 className={`font-bold ${textPrimary}`}>
                Informations personnelles
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Champ générique */}
              {[
                { label: "Nom complet", name: "name", type: "text" },
                { label: "Adresse email", name: "email", type: "email" },
              ].map((field) => (
                <div key={field.name} className={`p-4 rounded-xl border ${detailCardBg}`}>
                  <label className="text-sm font-medium mb-1 block">
                    {field.label}
                  </label>
                  {isEditing ? (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg ${inputBg}`}
                    />
                  ) : (
                    <p className={`font-semibold ${textPrimary}`}>
                      {formData[field.name]}
                    </p>
                  )}
                </div>
              ))}

              {/* BIO */}
              <div className={`p-4 rounded-xl border ${detailCardBg}`}>
                <label className="text-sm font-medium mb-1 block">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${inputBg}`}
                  />
                ) : (
                  <p className="text-sm opacity-80">
                    {formData.bio || "Aucune bio renseignée"}
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
);

}