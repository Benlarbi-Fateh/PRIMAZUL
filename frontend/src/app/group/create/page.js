"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { searchUsers, createGroup } from "@/lib/api";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Image from "next/image";
import {
  Users,
  Search,
  X,
  ArrowLeft,
  Check,
  Sparkles,
  UserPlus,
  Image as ImageIcon,
  AlertCircle,
  Briefcase,
  MessageSquare,
} from "lucide-react";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  // ✅ NOUVEAU : Type de groupe (chat ou work)
  const [groupType, setGroupType] = useState("chat");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

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
    ? "bg-blue-800 border-blue-700 focus:ring-cyan-500 focus:border-cyan-400 text-blue-100"
    : "bg-white border-blue-200 focus:ring-blue-300 focus:border-blue-400 text-blue-900";

  const errorBg = isDark
    ? "bg-red-900/30 border-red-800"
    : "bg-red-50 border-red-200";

  const errorText = isDark ? "text-red-300" : "text-red-700";

  const searchResultBg = isDark
    ? "hover:bg-blue-800/50 border-blue-800"
    : "hover:bg-blue-50 border-blue-200";

  const searchResultSelectedBg = isDark
    ? "bg-gradient-to-r from-blue-800 to-cyan-800 border-cyan-500"
    : "bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-500";

  // Calcul du nombre total de participants
  const totalParticipants = selectedUsers.length + 1;

  // Recherche d'utilisateurs
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await searchUsers(searchQuery);
        const results = response.data.users || [];

        const filtered = results.filter((u) => u._id !== (user._id || user.id));
        setSearchResults(filtered);
      } catch (error) {
        console.error("❌ Erreur recherche:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, user]);

  const toggleUserSelection = (selectedUser) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === selectedUser._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== selectedUser._id);
      }
      return [...prev, selectedUser];
    });
    setError("");
  };

  const handleCreateGroup = async () => {
    setError("");

    if (!groupName.trim()) {
      setError("Veuillez entrer un nom de groupe");
      return;
    }

    if (selectedUsers.length < 1) {
      // Minimum 1 autre personne (2 total)
      setError("Vous devez sélectionner au moins 1 personne");
      return;
    }

    try {
      setCreating(true);

      const participantIds = selectedUsers.map((u) => u._id);

      // ✅ Envoi du type de groupe
      const response = await createGroup({
        groupName: groupName.trim(),
        participantIds: participantIds,
        groupType: groupType,
      });

      if (response.data.success) {
        router.push(`/chat/${response.data.group._id}`);
      }
    } catch (error) {
      console.error("❌ Erreur création groupe:", error);
      const errorMessage =
        error.response?.data?.error || "Erreur lors de la création du groupe";
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen ${pageBg} relative overflow-hidden flex flex-col items-center justify-center p-4`}
      >
        {/* Container Principal */}
        <div
          className={`w-full max-w-lg ${cardBg} rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]`}
        >
          {/* HEADER */}
          <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center gap-4">
            <button
              onClick={() => (step === 1 ? router.back() : setStep(1))}
              className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm ${backButtonBg}`}
            >
              <ArrowLeft className={`w-5 h-5 ${backButtonText}`} />
            </button>

            <div className="flex-1">
              <h1 className={`text-xl font-bold ${textPrimary}`}>
                {step === 1 ? "Nouveau groupe" : "Ajouter des participants"}
              </h1>
              <p className={`text-xs ${textSecondary}`}>
                {step === 1
                  ? "Définissez le nom et le type"
                  : `${selectedUsers.length} sélectionné(s)`}
              </p>
            </div>
          </div>

          {/* MESSAGE ERREUR */}
          {error && (
            <div
              className={`mx-6 mt-6 p-4 rounded-2xl border-2 flex items-center gap-3 animate-shake ${errorBg}`}
            >
              <AlertCircle
                className={`w-5 h-5 ${
                  isDark ? "text-red-400" : "text-red-500"
                }`}
              />
              <p className={`text-sm font-medium ${errorText}`}>{error}</p>
            </div>
          )}

          {/* ÉTAPE 1 : Configuration */}
          {step === 1 && (
            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
              {/* Nom du groupe */}
              <div>
                <label
                  className={`block text-sm font-bold mb-2 ml-1 ${textSecondary}`}
                >
                  Nom du groupe
                </label>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                      isDark ? "text-blue-400" : "text-blue-500"
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Projet PFE, Famille..."
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 focus:ring-4 outline-none font-medium transition-all ${inputBg}`}
                    maxLength={30}
                    autoFocus
                  />
                </div>
              </div>

              {/* Type de groupe */}
              <div>
                <label
                  className={`block text-sm font-bold mb-3 ml-1 ${textSecondary}`}
                >
                  Type d&lsquo;espace
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option Chat */}
                  <button
                    onClick={() => setGroupType("chat")}
                    className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${
                      groupType === "chat"
                        ? "border-blue-500 bg-blue-500/10 shadow-lg scale-[1.02]"
                        : `border-transparent ${
                            isDark
                              ? "bg-slate-800 hover:bg-slate-700"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl ${
                        groupType === "chat"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}
                    >
                      <MessageSquare size={24} />
                    </div>
                    <span
                      className={`font-bold ${
                        groupType === "chat" ? "text-blue-500" : textSecondary
                      }`}
                    >
                      Discussion
                    </span>
                    {groupType === "chat" && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </button>

                  {/* Option Travail */}
                  <button
                    onClick={() => setGroupType("work")}
                    className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${
                      groupType === "work"
                        ? "border-purple-500 bg-purple-500/10 shadow-lg scale-[1.02]"
                        : `border-transparent ${
                            isDark
                              ? "bg-slate-800 hover:bg-slate-700"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl ${
                        groupType === "work"
                          ? "bg-purple-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}
                    >
                      <Briefcase size={24} />
                    </div>
                    <span
                      className={`font-bold ${
                        groupType === "work" ? "text-purple-500" : textSecondary
                      }`}
                    >
                      Projet
                    </span>
                    {groupType === "work" && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                    )}
                  </button>
                </div>

                <p className={`text-xs mt-3 text-center ${textMuted}`}>
                  {groupType === "work"
                    ? "✨ Inclut un tableau de tâches Kanban et des outils de collaboration."
                    : "💬 Idéal pour les échanges rapides et les discussions informelles."}
                </p>
              </div>

              <div className="flex-1" />

              <button
                onClick={() => setStep(2)}
                disabled={!groupName.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none shadow-xl ${buttonStyle}`}
              >
                Suivant
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : Participants */}
          {step === 2 && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Barre de recherche */}
              <div className="p-6 pb-2">
                <div className="relative group">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${
                      isDark ? "text-blue-400" : "text-blue-500"
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher des participants..."
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 focus:ring-4 outline-none font-medium transition-all ${inputBg}`}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-1 hover:bg-black/10 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des résultats */}
              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 scrollbar-thin">
                {loading ? (
                  <div className="text-center py-10 opacity-60">
                    Recherche...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => {
                    const isSelected = selectedUsers.some(
                      (su) => su._id === u._id
                    );
                    return (
                      <button
                        key={u._id}
                        onClick={() => toggleUserSelection(u)}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${
                          isSelected
                            ? searchResultSelectedBg
                            : `${searchResultBg} border-transparent`
                        }`}
                      >
                        <div className="relative">
                          <Image
                            src={
                              u.profilePicture ||
                              `https://ui-avatars.com/api/?name=${u.name}&background=random`
                            }
                            alt={u.name}
                            width={48}
                            height={48}
                            className="rounded-xl object-cover"
                            unoptimized
                          />
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check
                                size={12}
                                className="text-white"
                                strokeWidth={4}
                              />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className={`font-bold ${textPrimary}`}>{u.name}</p>
                          <p className={`text-xs ${textMuted}`}>{u.email}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-10 opacity-50">
                    {searchQuery.length < 2
                      ? "Commencez à taper..."
                      : "Aucun utilisateur trouvé"}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-opacity-50">
                {/* Avatars sélectionnés */}
                {selectedUsers.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {selectedUsers.map((u) => (
                      <div
                        key={u._id}
                        className="relative shrink-0 animate-scale-in"
                      >
                        <Image
                          src={
                            u.profilePicture ||
                            `https://ui-avatars.com/api/?name=${u.name}`
                          }
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-blue-500"
                          alt=""
                        />
                        <button
                          onClick={() => toggleUserSelection(u)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleCreateGroup}
                  disabled={creating || selectedUsers.length === 0}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${buttonStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {creating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Créer le groupe ({selectedUsers.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
