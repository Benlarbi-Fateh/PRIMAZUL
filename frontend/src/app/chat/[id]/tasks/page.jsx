"use client";

import { useParams, useRouter } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { TaskProvider, useTasks } from "@/context/TaskContext";

// Composants
import ProjectSidebar from "@/components/Tasks/ProjectSidebarClient";
import TaskBoard from "@/components/Tasks/TaskBoard";
import { Loader2, Folder, Plus, ChevronRight } from "lucide-react";

function TasksPageContent() {
  const { id: conversationId } = useParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  const {
    loading,
    error,
    currentProjectId,
    setCurrentProjectId,
    projects,
    currentProject,
    stats,
  } = useTasks();

  // Styles
  const pageBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-slate-50 via-white to-blue-50";

  const cardBg = isDark
    ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg";

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  // État de chargement
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${pageBg}`}>
        <div className="text-center">
          <Loader2
            className={`w-10 h-10 animate-spin mx-auto ${
              isDark ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <p className={`mt-4 ${textMuted}`}>Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${pageBg}`}>
        <div className="text-center">
          <p className="text-rose-500 font-medium">{error}</p>
          <button
            onClick={() => router.push(`/chat/${conversationId}`)}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white"
          >
            Retour 
          </button>
        </div>
      </div>
    );
  }
// Vue "Tous les projets" (cards)
if (currentProjectId === "all") {
  return (
    <div className={`flex-1 overflow-y-auto ${pageBg}`}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-6 pb-4 sm:pb-6`}>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1
            className={`text-xl sm:text-2xl lg:text-3xl font-bold ${textPrimary}`}
          >
            📁 Tous les projets
          </h1>
          <p
            className={`mt-1 sm:mt-2 text-sm sm:text-base ${textMuted}`}
          >
            {projects.length} projet{projects.length !== 1 ? "s" : ""} •{" "}
            {stats.total} tâche{stats.total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grille de projets */}
        {projects.length === 0 ? (
          <div
            className={`text-center py-12 sm:py-20 rounded-2xl sm:rounded-3xl border-2 border-dashed ${
              isDark ? "border-slate-700" : "border-slate-300"
            }`}
          >
            <Folder
              size={40}
              className={`mx-auto mb-4 ${
                isDark ? "text-slate-600" : "text-slate-400"
              }`}
            />
            <h2
              className={`text-lg sm:text-xl font-bold mb-2 ${textPrimary}`}
            >
              Aucun projet
            </h2>
            <p className={`text-sm sm:text-base ${textMuted}`}>
              Créez votre premier projet pour organiser vos tâches
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => setCurrentProjectId(project._id)}
                className={`group p-4 sm:p-6 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${cardBg}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                      isDark ? "bg-blue-500/20" : "bg-blue-100"
                    }`}
                  >
                    <Folder
                      size={20}
                      className={isDark ? "text-blue-400" : "text-blue-600"}
                    />
                  </div>
                </div>

                <h3
                  className={`text-base sm:text-lg font-bold mt-3 sm:mt-4 ${textPrimary}`}
                >
                  {project.name}
                </h3>

                <div
                  className={`flex items-center gap-2 mt-2 sm:mt-3 text-xs sm:text-sm ${textMuted}`}
                >
                  <span>{project.taskCount || 0} tâches</span>
                  <ChevronRight
                    size={16}
                    className="opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


  // Vue Kanban (projet sélectionné)
  return <TaskBoard />;
}

export default function TasksPage() {
  const { id: conversationId } = useParams();

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* MainSidebar global */}
      {/* Provider des tâches */}
      <TaskProvider conversationId={conversationId}>
        {/* Sidebar des projets */}
        <ProjectSidebar conversationId={conversationId} />

        {/* Contenu principal */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <TasksPageContent />
        </main>
      </TaskProvider>
    </div>
  );
}
