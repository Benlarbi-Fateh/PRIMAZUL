"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Hash,
  LayoutGrid,
  FolderPlus,
  Loader2,
  Sparkles,
  TrendingUp,
  Grid3X3,
  X,
} from "lucide-react";

export default function ProjectSidebar({
  conversationId,
  isOpen,
  toggleSidebar,
}) {
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    projects,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    deleteProject,
    stats,
  } = useTasks();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      const result = await createProject({ name: newProjectName.trim() });
      if (result.success) {
        setNewProjectName("");
        setShowNewProjectModal(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-80 
    md:relative md:w-72 md:translate-x-0
    flex flex-col border-r-2 transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
    ${
      isDark 
        ? "bg-gradient-to-b from-slate-900 to-slate-950 border-blue-900/50" 
        : "bg-gradient-to-b from-blue-100/50 to-white border-blue-300"
    }
    shadow-2xl backdrop-blur-sm
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />

      <aside className={sidebarClasses}>
        {/* Header avec dégradé bleu */}
        <div className="p-6 pb-4 shrink-0 border-b border-inherit">
          <button
            onClick={() => router.push(`/chat/${conversationId}`)}
            className={`mb-6 flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
              isDark
                ? "text-blue-300 hover:text-white hover:bg-blue-900/30"
                : "text-blue-700 hover:text-blue-900 hover:bg-blue-200"
            }`}
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-bold">Retour au chat</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-md opacity-60" />
                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white shadow-xl shadow-blue-600/30">
                  <Grid3X3 size={22} strokeWidth={2} />
                </div>
              </div>
              <div>
                <h1
                  className={`font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent ${
                    isDark ? "" : ""
                  }`}
                >
                  Workspace
                </h1>
                <p
                  className={`text-xs font-bold tracking-wider ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  GESTION DE PROJETS
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className={`p-2.5 rounded-xl transition-all duration-300 active:scale-95 ${
                isDark
                  ? "bg-gradient-to-br from-blue-800 to-blue-900 text-blue-300 hover:from-blue-700 hover:to-blue-800 border border-blue-700/50"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30"
              }`}
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Liste des projets */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
          <div className="px-3 mb-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-widest ${
                isDark ? "text-blue-400" : "text-blue-700/90"
              }`}>
                VOS PROJETS ({projects.length})
              </span>
              {projects.length > 0 && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-200 text-blue-800"
                }`}>
                  {stats.total} tâches
                </span>
              )}
            </div>
          </div>

          {projects.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-3xl mx-2 mb-4 transition-all duration-300 ${
                isDark
                  ? "border-blue-800/50 hover:border-blue-700 bg-blue-900/20"
                  : "border-blue-400 hover:border-blue-500 bg-gradient-to-b from-blue-50 to-white"
              }`}
            >
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isDark 
                  ? "bg-gradient-to-br from-blue-900/40 to-blue-800/40" 
                  : "bg-gradient-to-br from-blue-200 to-blue-300"
              }`}>
                <FolderPlus size={28} className={isDark ? "text-blue-400" : "text-blue-700"} />
              </div>
              <p className={`text-sm font-bold mb-2 ${
                isDark ? "text-blue-300" : "text-blue-900"
              }`}>
                Aucun projet actif
              </p>
              <p className={`text-xs mb-4 px-6 ${
                isDark ? "text-blue-400/70" : "text-blue-700/80"
              }`}>
                Créez votre premier projet pour organiser vos tâches
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-blue-700 to-blue-800 text-blue-100 hover:from-blue-600 hover:to-blue-700 border border-blue-600"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30"
                }`}
              >
                Créer un projet
              </button>
            </div>
          ) : (
            <div className="space-y-2 px-1">
              {projects.map((project) => {
                const isActive = currentProjectId === project._id;
                return (
                  <div key={project._id} className="group relative">
                    <button
                      onClick={() => {
                        setCurrentProjectId(project._id);
                        if (window.innerWidth < 768) toggleSidebar();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 overflow-hidden relative ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/30"
                          : isDark
                            ? "bg-blue-900/20 hover:bg-blue-800/30 text-blue-300 hover:text-white"
                            : "bg-gradient-to-b from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 text-blue-900 hover:text-blue-950 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {/* Effet de brillance au survol */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      
                      <div className={`relative p-2 rounded-lg ${
                        isActive
                          ? "bg-white/20"
                          : isDark
                            ? "bg-blue-800/30"
                            : "bg-blue-200"
                      }`}>
                        <Hash
                          size={18}
                          className={
                            isActive
                              ? "text-white"
                              : isDark
                                ? "text-blue-400"
                                : "text-blue-700"
                          }
                          strokeWidth={2}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">{project.name}</span>
                          {project.taskCount > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                              isActive
                                ? "bg-white/20"
                                : isDark
                                  ? "bg-blue-800 text-blue-300"
                                  : "bg-blue-200 text-blue-800"
                            }`}>
                              {project.taskCount} tâche{project.taskCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bouton Supprimer */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Supprimer ce projet et toutes ses tâches ?"))
                            deleteProject(project._id);
                        }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                          isActive
                            ? "text-white/80 hover:text-white hover:bg-white/20"
                            : isDark
                              ? "text-blue-400/60 hover:text-red-400 hover:bg-red-900/20"
                              : "text-blue-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer Stats avec design premium */}
        <div className="p-4 border-t border-inherit shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
          
          <div className={`relative p-4 rounded-2xl backdrop-blur-sm border ${
            isDark
              ? "bg-blue-900/30 border-blue-800/50"
              : "bg-gradient-to-b from-white to-blue-50/80 border-blue-300 shadow-lg"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  isDark ? "bg-blue-800/30" : "bg-blue-200"
                }`}>
                  <TrendingUp size={18} className={isDark ? "text-blue-400" : "text-blue-700"} />
                </div>
                <span className={`text-sm font-bold ${
                  isDark ? "text-blue-300" : "text-blue-900"
                }`}>
                  Progression globale
                </span>
              </div>
              <span className={`text-2xl font-black ${
                isDark ? "text-blue-400" : "bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent"
              }`}>
                {stats.progress}%
              </span>
            </div>
            
            {/* Barre de progression élégante */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className={isDark ? "text-blue-400/70" : "text-blue-700/80"}>Complétion</span>
                <span className={isDark ? "text-blue-300" : "text-blue-900"}>
                  {stats.done} / {stats.total}
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isDark ? "bg-blue-800/50" : "bg-blue-200"
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/30"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
            
            {/* Stats détaillées */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className={`p-3 rounded-xl ${
                isDark ? "bg-blue-900/20" : "bg-gradient-to-b from-blue-100 to-blue-200"
              }`}>
                <div className={`text-2xl font-black mb-1 ${
                  isDark ? "text-blue-400" : "text-blue-800"
                }`}>
                  {stats.done}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-blue-400/70" : "text-blue-700"
                }`}>
                  Terminées
                </div>
              </div>
              <div className={`p-3 rounded-xl ${
                isDark ? "bg-blue-900/20" : "bg-gradient-to-b from-blue-100 to-blue-200"
              }`}>
                <div className={`text-2xl font-black mb-1 ${
                  isDark ? "text-cyan-400" : "text-blue-900"
                }`}>
                  {stats.total - stats.done}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-cyan-400/70" : "text-blue-800"
                }`}>
                  En cours
                </div>
              </div>
            </div>
            
            <Sparkles className="absolute -bottom-3 -right-3 text-blue-500/10 dark:text-blue-400/10 w-20 h-20 rotate-12" />
          </div>
        </div>
      </aside>

      {/* Modal Création Projet amélioré */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => !creating && setShowNewProjectModal(false)}
          />
          
          <div 
            className={`relative w-full max-w-md p-8 rounded-3xl animate-in zoom-in-95 duration-300 ${
              isDark
                ? "bg-gradient-to-b from-blue-900/80 to-blue-950/90 border border-blue-800 shadow-2xl shadow-blue-900/30"
                : "bg-gradient-to-b from-white to-blue-50/80 border-2 border-blue-300 shadow-2xl shadow-blue-600/20"
            }`}
          >
            <button
              onClick={() => !creating && setShowNewProjectModal(false)}
              className={`absolute right-6 top-6 p-2 rounded-xl transition-colors ${
                isDark
                  ? "text-blue-400 hover:text-blue-300 hover:bg-blue-800/50"
                  : "text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              }`}
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-2">
              <div className={`inline-flex p-3 rounded-2xl mb-4 ${
                isDark ? "bg-blue-800/30" : "bg-gradient-to-br from-blue-200 to-blue-300"
              }`}>
                <FolderPlus size={28} className={isDark ? "text-blue-400" : "text-blue-700"} />
              </div>
              <h2 className={`text-2xl font-black mb-2 ${
                isDark ? "text-white" : "bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent"
              }`}>
                Nouveau Projet
              </h2>
              <p className={`text-sm ${
                isDark ? "text-blue-400/70" : "text-blue-700/80"
              }`}>
                Nommez votre projet pour commencer à organiser vos tâches
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? "text-blue-300" : "text-blue-800"
                }`}>
                  Nom du projet
                </label>
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  placeholder="Ex: Refonte Application Mobile"
                  className={`w-full px-4 py-4 rounded-xl outline-none transition-all font-bold text-lg ${
                    isDark
                      ? "bg-blue-900/50 border-2 border-blue-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-blue-400/50"
                      : "bg-white border-2 border-blue-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 text-blue-900 placeholder-blue-500/60"
                  }`}
                  disabled={creating}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => !creating && setShowNewProjectModal(false)}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                    isDark
                      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-800/50"
                      : "text-blue-700 hover:text-blue-900 hover:bg-blue-200"
                  }`}
                  disabled={creating}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creating}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    !newProjectName.trim() || creating
                      ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40"
                  }`}
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Créer le projet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)'};
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(59, 130, 246, 0.6)' : 'rgba(37, 99, 235, 0.7)'};
        }
      `}</style>
    </>
  );
}