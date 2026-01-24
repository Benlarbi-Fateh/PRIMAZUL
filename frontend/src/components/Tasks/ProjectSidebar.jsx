// components/Tasks/ProjectSidebar.jsx

"use client";

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

  // ✅ Force re-render when theme changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [isDark]);

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
      <aside
        className={`w-64 h-screen flex flex-col border-r flex-shrink-0 transition-colors duration-200 ${sidebarBg}`}
      >
        {/* Header */}
        <div className={`p-5 border-b ${headerBorder}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/chat/${conversationId}`)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${textSecondary} hover:${textPrimary}`}
            >
              <ArrowLeft size={16} />
              Retour
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className={`p-2 rounded-xl transition-all ${buttonHover}`}
              title="Nouveau projet"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${iconContainerBg}`}
            >
              <LayoutGrid className="text-white" size={20} />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${textPrimary}`}>Projets</h1>
              <p className={`text-xs ${textMuted}`}>
                {stats.total} tâche{stats.total !== 1 ? "s" : ""} au total
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Vue globale */}
          <button
            onClick={() => setCurrentProjectId("all")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentProjectId === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : itemBase
            }`}
          >
            <FolderOpen size={18} />
            <span className="font-medium">Toutes les tâches</span>
          </button>

          {/* Séparateur */}
          <div className="py-4">
            <p
              className={`px-4 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
            >
              Projets ({projects.length})
            </p>
          </div>

          {/* Liste des projets */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className={`w-6 h-6 animate-spin ${textMuted}`} />
            </div>
          ) : projects.length === 0 ? (
            <div className={`text-center py-8 ${emptyStateBg}`}>
              <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun projet</p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className={`mt-3 text-xs font-medium ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Créer un projet
              </button>
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
                    onClick={() => setCurrentProjectId(project._id)}
                    disabled={isDeleting}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
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
      </aside>

      {/* Modal nouveau projet */}
      {showNewProjectModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !creating && setShowNewProjectModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl ${modalBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    isDark ? "bg-blue-500/20" : "bg-blue-100"
                  }`}
                >
                  <FolderPlus
                    size={20}
                    className={isDark ? "text-blue-400" : "text-blue-600"}
                  />
                </div>
                <h2 className={`text-lg font-bold ${textPrimary}`}>
                  Nouveau projet
                </h2>
              </div>
              <button
                onClick={() => !creating && setShowNewProjectModal(false)}
                disabled={creating}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              placeholder="Nom du projet..."
              disabled={creating}
              className={`w-full px-4 py-3 rounded-xl border outline-none mb-6 transition-colors ${inputBg}`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewProjectModal(false)}
                disabled={creating}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${buttonSecondary}`}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creating}
                className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
