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

  // Classes de base pour la sidebar
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-80 
    md:relative md:w-72 md:translate-x-0
    flex flex-col border-r shadow-2xl md:shadow-none transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
    ${
      isDark
        ? "bg-slate-900/95 border-slate-800"
        : "bg-white/80 backdrop-blur-xl border-slate-200/60"
    }
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="p-6 pb-4 shrink-0">
          <button
            onClick={() => router.push(`/chat/${conversationId}`)}
            className={`mb-6 flex items-center gap-2 text-sm font-semibold transition-colors ${
              isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ArrowLeft size={18} /> Retour au chat
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Workspace</h1>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Projets
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className={`p-2 rounded-xl transition-all active:scale-95 ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-blue-400"
                  : "bg-white hover:bg-blue-50 text-blue-600 shadow-sm ring-1 ring-slate-200"
              }`}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Liste des projets */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          <div className="px-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vos Projets ({projects.length})
          </div>

          {projects.length === 0 && (
            <div
              className={`flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-2xl mx-2 ${
                isDark ? "border-slate-800" : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-slate-400 bg-slate-100 dark:bg-slate-800">
                <FolderPlus size={20} />
              </div>
              <p className="text-sm font-medium mb-2 text-slate-500">
                Aucun projet
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Créer le premier
              </button>
            </div>
          )}

          {projects.map((project) => {
            const isActive = currentProjectId === project._id;
            return (
              <div key={project._id} className="group relative">
                <button
                  onClick={() => {
                    setCurrentProjectId(project._id);
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 pr-10 ${
                    isActive
                      ? "bg-white text-blue-700 shadow-[0_2px_12px_-3px_rgba(59,130,246,0.15)] ring-1 ring-black/5 dark:bg-blue-600 dark:text-white dark:ring-0"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  <Hash
                    size={18}
                    className={
                      isActive
                        ? "text-blue-500 dark:text-blue-200"
                        : "opacity-40"
                    }
                  />
                  <span className="truncate">{project.name}</span>
                  {project.taskCount > 0 && (
                    <span
                      className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500 dark:text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {project.taskCount}
                    </span>
                  )}
                </button>

                {/* 
                   ✅ CORRECTION BOUTON SUPPRIMER : 
                   - Mobile : Toujours visible (opacity-100)
                   - Desktop : Visible seulement au hover (md:opacity-0 md:group-hover:opacity-100)
                */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Supprimer ce projet ?"))
                      deleteProject(project._id);
                  }}
                  className={`
                     absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-20
                     opacity-100 md:opacity-0 md:group-hover:opacity-100
                     ${
                       isActive
                         ? "text-blue-400 md:text-blue-300 md:hover:text-white md:hover:bg-blue-700"
                         : "text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                     }
                  `}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </nav>

        {/* Footer Stats */}
        <div className="p-4 border-t border-inherit shrink-0">
          <div
            className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-white shadow-lg shadow-blue-500/5 ring-1 ring-black/5"
            }`}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Progression
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                <span>{stats.done} terminées</span>
                <span>{stats.total} total</span>
              </div>
            </div>
            <Sparkles className="absolute -bottom-2 -right-2 text-blue-500/5 w-24 h-24 rotate-12" />
          </div>
        </div>
      </aside>

      {/* Modal Création Projet */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm dark:bg-slate-900/60"
            onClick={() => setShowNewProjectModal(false)}
          />
          <div
            className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl scale-100 transition-all ${
              isDark
                ? "bg-slate-900 border border-slate-800"
                : "bg-white ring-1 ring-black/5"
            }`}
          >
            <h2 className="text-xl font-bold mb-1">Nouveau projet</h2>
            <p className="text-sm text-slate-500 mb-6">
              Créez un espace pour collaborer.
            </p>

            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Ex: Refonte Site Web..."
              className={`w-full px-4 py-3 rounded-xl outline-none mb-4 transition-all font-medium ${
                isDark
                  ? "bg-slate-800 border border-slate-700 focus:border-blue-500"
                  : "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 placeholder:text-slate-400"
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creating}
                className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex justify-center items-center"
              >
                {creating ? <Loader2 className="animate-spin" /> : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
