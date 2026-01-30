// components/Tasks/ProjectSidebar.jsx

"use client";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthProvider";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FolderOpen,
  Hash,
  X,
  FolderPlus,
  LayoutGrid,
  Loader2,
  Menu,
} from "lucide-react";

export default function ProjectSidebar({ conversationId, onClose }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    projects,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    deleteProject,
    stats,
    loading,
  } = useTasks();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  // ✅ Force re-render when theme changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [isDark]);

  // ✅ Close mobile sidebar when project is selected
  const handleProjectSelect = (projectId) => {
    setCurrentProjectId(projectId);
    setIsMobileOpen(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || creating) return;

    setCreating(true);
    try {
      const result = await createProject({ name: newProjectName.trim() });
      if (result.success) {
        setNewProjectName("");
        setShowNewProjectModal(false);
      } else {
        alert(result.error || "Erreur lors de la création");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (!confirm(`Supprimer "${projectName}" et toutes ses tâches ?`)) return;

    setDeleting(projectId);
    try {
      await deleteProject(projectId);
    } finally {
      setDeleting(null);
    }
  };

  // =================== STYLES DYNAMIQUES ===================
  const sidebarBg = isDark
    ? "bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-slate-800"
    : "bg-gradient-to-b from-white via-slate-50 to-white border-slate-200";

  const headerBorder = isDark ? "border-slate-800" : "border-slate-200";

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600";
  const textMuted = isDark ? "text-slate-500" : "text-slate-400";

  const itemBase = isDark
    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  const itemActive = isDark
    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
    : "bg-blue-50 text-blue-600 border border-blue-200";

  const buttonHover = isDark
    ? "hover:bg-blue-500/20 text-blue-400"
    : "hover:bg-blue-50 text-blue-600";

  const deleteButton = isDark
    ? "hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
    : "hover:bg-rose-50 text-slate-400 hover:text-rose-500";

  const modalBg = isDark
    ? "bg-slate-900 border border-slate-700"
    : "bg-white border border-slate-200";

  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500";

  const buttonSecondary = isDark
    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200";

  const iconContainerBg = isDark
    ? "bg-gradient-to-br from-blue-600 to-indigo-700"
    : "bg-gradient-to-br from-blue-500 to-indigo-600";

  const emptyStateBg = isDark ? "text-slate-600" : "text-slate-400";

  return (
    <>
      {/* ===== BOUTON TOGGLE MOBILE (visible uniquement sur mobile) ===== */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={`fixed top-4 left-4 z-50 lg:hidden p-3 rounded-xl shadow-lg transition-all active:scale-95 ${
          isDark
            ? "bg-slate-800 text-white border border-slate-700"
            : "bg-white text-slate-900 border border-slate-200"
        }`}
      >
        <Menu size={20} />
      </button>

      {/* ===== OVERLAY MOBILE (ferme la sidebar au clic) ===== */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          ${sidebarBg}
          
          /* Mobile: sidebar en overlay avec animation slide */
          fixed lg:relative
          top-0 left-0
          h-screen
          w-72 sm:w-80 lg:w-64
          
          /* Animation slide sur mobile */
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          
          /* Z-index */
          z-50 lg:z-auto
          
          /* Layout */
          flex flex-col
          border-r
          flex-shrink-0
        `}
      >
        {/* ===== HEADER ===== */}
        <div className={`p-4 sm:p-5 border-b ${headerBorder}`}>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <button
              onClick={() => {
                router.push(`/chat/${conversationId}`);
                setIsMobileOpen(false);
              }}
              className={`group flex items-center gap-2 text-sm font-bold transition-all ${
                isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ArrowLeft
                size={18}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span className="hidden sm:inline">Retour</span>
            </button>

            <button
              onClick={() => setShowNewProjectModal(true)}
              className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-90 hover:scale-110 ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              title="Nouveau projet"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg ${iconContainerBg}`}
            >
              <LayoutGrid className="text-white" size={20} />
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold ${textPrimary}`}>
                Projets
              </h1>
              <p className={`text-xs ${textMuted}`}>
  {projects.length} projet{projects.length !== 1 ? "s" : ""} au total
</p>
            </div>
          </div>
        </div>

        {/* ===== NAVIGATION ===== */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Vue globale */}
          <button
            onClick={() => handleProjectSelect("all")}
            className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
              currentProjectId === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : itemBase
            }`}
          >
            <FolderOpen size={18} />
            <span className="font-medium">Tout les projets</span>
          </button>

          {/* Séparateur */}
          <div className="py-3 sm:py-4">
            <p
              className={`px-3 sm:px-4 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
            >
              Projets ({projects.length})
            </p>
          </div>

          {/* Liste des projets */}
          {loading ? (
  /* Loader plus élégant avec un petit texte */
  <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
    <div className="relative">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-80" />
      <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-blue-500/20" />
    </div>
    <p className={`mt-4 text-xs font-medium tracking-wide opacity-50 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
      Chargement de vos projets...
    </p>
  </div>
) : projects.length === 0 ? (
  /* État vide type "Carte" pour remplir l'espace proprement */
  <div className="px-4 py-8">
    <div className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all ${
      isDark 
        ? "bg-slate-900/20 border-slate-800" 
        : "bg-blue-50/30 border-blue-100"
    }`}>
      <div className={`p-4 rounded-full mb-4 ${isDark ? "bg-slate-800" : "bg-white shadow-sm"}`}>
        <FolderOpen size={32} className={isDark ? "text-slate-500" : "text-blue-400"} />
      </div>
      
      <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
        Aucun projet actif
      </h3>
      <p className={`text-xs text-center max-w-[200px] leading-relaxed mb-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        Commencez à organiser vos tâches.
      </p>

      <button
        onClick={() => setShowNewProjectModal(true)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
          isDark 
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20" 
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
        }`}
      >
        <Plus size={16} />
        Nouveau projet
      </button>
    </div>
  </div>

          ) : (
            projects.map((project) => {
              const isActive = currentProjectId === project._id;
              const isDeleting = deleting === project._id;

              return (
                <div
                  key={project._id}
                  className={`group flex items-center gap-1 ${
                    isActive ? `rounded-xl ${itemActive}` : ""
                  }`}
                >
                  <button
                    onClick={() => handleProjectSelect(project._id)}
                    disabled={isDeleting}
                    className={`flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                      isActive ? "" : itemBase
                    } ${isDeleting ? "opacity-50" : ""}`}
                  >
                    <Hash size={16} />
                    <span className="font-medium truncate flex-1 text-left">
                      {project.name}
                    </span>
                    {project.taskCount > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {project.taskCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={(e) =>
                      handleDeleteProject(project._id, project.name, e)
                    }
                    disabled={isDeleting}
                    className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${deleteButton}`}
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </nav>

        {/* ===== USER FOOTER ===== */}
        <div
          className={`p-3 sm:p-4 mt-auto border-t ${headerBorder} bg-opacity-50 backdrop-blur-sm`}
        >
          <div
            className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl transition-all ${
              isDark
                ? "bg-slate-800/40 border border-slate-700/50"
                : "bg-slate-50 border border-slate-100"
            }`}
          >
            {/* Avatar avec halo de statut */}
            <div className="relative">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shadow-inner transition-transform active:scale-95 ${
                  isDark
                    ? "bg-blue-600 text-white shadow-blue-900/20"
                    : "bg-slate-900 text-white"
                }`}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              {/* Petit point vert de statut */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-black uppercase tracking-wider truncate ${
                  isDark ? "text-slate-200" : "text-slate-900"
                }`}
              >
                {user?.name || "Utilisateur"}
              </p>
              <p
                className={`text-[10px] font-medium truncate ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Connecté
              </p>
            </div>
          </div>
        </div>
      </aside>

     {/* ===== MODAL NOUVEAU PROJET ===== */}
{showNewProjectModal && (
  <div
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
    onClick={() => !creating && setShowNewProjectModal(false)}
  >
    <div
      className={`w-full max-w-md rounded-[2rem] p-6 sm:p-8 shadow-2xl transition-all scale-in-center ${
        isDark ? "bg-[#1e293b] border border-slate-700" : "bg-white border border-slate-100"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header : Élégant et aéré */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${
            isDark ? "bg-blue-500/10" : "bg-blue-50"
          }`}>
            <FolderPlus
              size={24}
              strokeWidth={1.5}
              className={isDark ? "text-blue-400" : "text-blue-600"}
            />
          </div>
          <div>
            <h2 className={`text-lg font-medium tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Nouveau projet
            </h2>
            <p className={`text-[11px] font-normal opacity-60 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Créez un nouvel espace de travail
            </p>
          </div>
        </div>
        
        <button
          onClick={() => !creating && setShowNewProjectModal(false)}
          className={`p-2 rounded-full transition-all ${
            isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-50 text-slate-400"
          }`}
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Input : Style minimaliste */}
      <div className="space-y-6">
        <div className="space-y-2">
          <input
            autoFocus
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            placeholder="Nom du projet..."
            disabled={creating}
            className={`w-full px-5 py-4 rounded-2xl border transition-all outline-none text-sm font-normal ${
              isDark 
                ? "bg-slate-800/50 border-slate-700 focus:border-blue-500 text-white placeholder:text-slate-600" 
                : "bg-slate-50 border-slate-200 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
            }`}
          />
        </div>

        {/* Actions : Boutons équilibrés */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewProjectModal(false)}
            disabled={creating}
            className={`flex-1 py-3.5 rounded-2xl text-[13px] font-medium transition-all ${
              isDark 
                ? "text-slate-400 hover:bg-slate-800 hover:text-white" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Annuler
          </button>
          
          <button
            onClick={handleCreateProject}
            disabled={!newProjectName.trim() || creating}
            className={`flex-1 py-3.5 rounded-2xl text-[13px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 ${
              isDark 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
            }`}
          >
            {creating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Créer le projet"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)} </>
  );
}