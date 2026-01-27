"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Clock,
  ArrowLeft,
  MessageCircle,
  Mail,
  Calendar,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Styles basés sur le thème
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
  
  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20";

  const statCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-blue-50 border-blue-200";

  const detailCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-slate-50 border-slate-200";

  const profileHeaderBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-r from-blue-600 to-indigo-600";

  const quickActionBg = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-200 border-blue-700"
    : "bg-blue-50 hover:bg-blue-100 text-slate-700 border-blue-200";

  const contentHeaderBg = isDark
    ? "bg-blue-900/50 border-blue-800"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";

  // Fix hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !user) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 mx-auto ${isDark ? "border-blue-800/50 border-t-cyan-400" : "border-blue-600/20 border-t-blue-600"}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className={`w-6 h-6 animate-pulse ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
            </div>
          </div>
          <p className={`mt-6 font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>
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
                Informations personnelles
              </p>
            </div>
            
            {/* Élément invisible pour équilibrer le flexbox du header */}
            <div className="w-[100px] hidden sm:block"></div>
          </div>

          {/* ===== CONTENU ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            
            {/* ===== SIDEBAR ===== */}
            <aside className="h-fit">
              <div className={`rounded-2xl shadow-lg border overflow-hidden ${cardBg}`}>
                <div className={`p-4 text-center ${profileHeaderBg}`}>
                  <div className="relative mx-auto w-24 h-24 rounded-xl overflow-hidden ring-4 ring-white/20 shadow-lg mb-3">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500">
                        <User className="text-white w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-white truncate px-2">
                    {user.name}
                  </h2>
                  <p className="text-sm text-blue-200 truncate px-2">
                    {user.email}
                  </p>
                </div>

                <div className={`rounded-xl p-4 m-4 mt-0 border ${statCardBg} space-y-4`}>
                  {/* Header */}
                  <h3 className={`flex items-center text-sm font-bold ${isDark ? "text-blue-200" : "text-slate-800"}`}>
                    <Clock className={`w-4 h-4 mr-2 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
                    Statut et activité
                  </h3>

                  {/* Statut en ligne */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className={`font-semibold ${isDark ? "text-green-400" : "text-green-600"}`}>
                        En ligne
                      </span>
                    </div>
                  </div>

                  {/* Membre depuis */}
                  <div className="flex justify-between text-sm items-center pt-2 border-t border-blue-500/20">
                    <span className={`flex items-center gap-2 ${isDark ? "text-blue-300" : "text-slate-600"}`}>
                      <Calendar className="w-3 h-3" />
                      Inscrit le :
                    </span>
                    <span className={`font-medium ${isDark ? "text-blue-100" : "text-slate-800"}`}>
                      {new Date(user.createdAt || Date.now()).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                {/* Bouton Conversations */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => router.push("/")}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${quickActionBg}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mes conversations
                  </button>
                </div>
              </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className={`rounded-2xl shadow-lg border ${cardBg} h-fit`}>
              <div className={`p-5 border-b ${contentHeaderBg}`}>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}>
                  <User className="w-5 h-5 opacity-70" />
                  Détails du compte
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom Complet */}
                    <div className={`p-4 rounded-xl border ${detailCardBg}`}>
                      <label className={`text-xs uppercase tracking-wider font-semibold mb-2 block ${isDark ? "text-blue-300" : "text-blue-500"}`}>
                        Nom complet
                      </label>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-blue-900/50" : "bg-blue-100"}`}>
                            <User className={`w-4 h-4 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
                        </div>
                        <p className={`font-semibold text-lg ${textPrimary}`}>
                            {user.name || "Non renseigné"}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className={`p-4 rounded-xl border ${detailCardBg}`}>
                      <label className={`text-xs uppercase tracking-wider font-semibold mb-2 block ${isDark ? "text-blue-300" : "text-blue-500"}`}>
                        Adresse Email
                      </label>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-blue-900/50" : "bg-blue-100"}`}>
                            <Mail className={`w-4 h-4 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
                        </div>
                        <p className={`font-semibold text-lg truncate ${textPrimary}`}>
                            {user.email || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                </div>

                {/* BIO */}
                <div className={`p-5 rounded-xl border ${detailCardBg}`}>
                  <label className={`text-xs uppercase tracking-wider font-semibold mb-3 block ${isDark ? "text-blue-300" : "text-blue-500"}`}>
                    Biographie
                  </label>
                  <div className={`p-4 rounded-lg ${isDark ? "bg-blue-950/30" : "bg-white/50"}`}>
                    <p className={`text-base leading-relaxed ${user.bio ? textPrimary : "italic opacity-60"}`}>
                        {user.bio || "Aucune biographie renseignée pour le moment."}
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}