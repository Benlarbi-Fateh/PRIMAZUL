// components/Tasks/ProjectSidebar.jsx
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
  X,
  LayoutGrid,
  FolderPlus,
  Loader2,
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
      } else {
        alert(result.error || "Erreur lors de la création");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  // Styles
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:relative md:translate-x-0 md:w-64
    ${isDark ? "bg-slate-900 border-r border-slate-800" : "bg-white border-r border-slate-200"}
    flex flex-col
  `;

  const activeItemClass = isDark
    ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-500"
    : "bg-blue-50 text-blue-600 border-l-4 border-blue-500";

  const modalBg = isDark
    ? "bg-slate-900 border border-slate-700"
    : "bg-white border border-slate-200";
  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-slate-50 border-slate-200 text-slate-900";

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Header Sidebar */}
        <div className="p-5 flex items-center justify-between border-b border-inherit shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <LayoutGrid size={20} />
            </div>
            <h1
              className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Projets
            </h1>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-slate-800 text-blue-400"
                : "hover:bg-blue-50 text-blue-600"
            }`}
            title="Nouveau projet"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Bouton Retour Chat */}
        <div className="p-4 shrink-0">
          <button
            onClick={() => router.push(`/chat/${conversationId}`)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowLeft size={16} /> Retour au chat
          </button>
        </div>

        {/* Liste des Projets */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 py-2 custom-scrollbar">
          <div className="mb-2 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Vos Projets ({projects.length})</span>
          </div>

          {projects.length === 0 && (
            <div className="px-4 py-8 text-center border-2 border-dashed border-slate-200/50 rounded-xl mx-2">
              <FolderPlus className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500 mb-3">Aucun projet</p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-200 transition"
              >
                Créer le premier
              </button>
            </div>
          )}

          {projects.map((project) => (
            <div key={project._id} className="group relative">
              <button
                onClick={() => {
                  setCurrentProjectId(project._id);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all pr-8 ${
                  currentProjectId === project._id
                    ? activeItemClass
                    : isDark
                      ? "text-slate-400 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Hash size={16} className="opacity-50" />
                <span className="truncate">{project.name}</span>
                {project.taskCount > 0 && (
                  <span className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-500">
                    {project.taskCount}
                  </span>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(
                      `Supprimer le projet "${project.name}" et toutes ses tâches ?`,
                    )
                  ) {
                    deleteProject(project._id);
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition-all z-10"
                title="Supprimer le projet"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-inherit shrink-0 bg-opacity-50">
          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-blue-50 border-blue-100"}`}
          >
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-medium text-slate-500">Progression</p>
              <span
                className={`text-xl font-bold ${isDark ? "text-white" : "text-blue-900"}`}
              >
                {stats.progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-right">
              {stats.done} / {stats.total} tâches terminées
            </p>
          </div>
        </div>
      </aside>

      {/* --- MODALE CRÉATION PROJET --- */}
      {showNewProjectModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !creating && setShowNewProjectModal(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${modalBg} transform transition-all scale-100`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}
                >
                  <FolderPlus
                    size={24}
                    className={isDark ? "text-blue-400" : "text-blue-600"}
                  />
                </div>
                <div>
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Nouveau projet
                  </h2>
                  <p className="text-xs text-slate-500">
                    Créez un espace pour vos tâches
                  </p>
                </div>
              </div>
              <button
                onClick={() => !creating && setShowNewProjectModal(false)}
                className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block ml-1">
                  Nom du projet
                </label>
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                  placeholder="Ex: Refonte Site Web..."
                  disabled={creating}
                  className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-colors font-medium ${inputBg} focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  disabled={creating}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition-colors ${
                    isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creating}
                  className="flex-1 py-3.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Créer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
