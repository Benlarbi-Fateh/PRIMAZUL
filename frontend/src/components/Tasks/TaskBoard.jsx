"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import TaskColumn from "./TaskColumn";
import TaskFilters from "./TaskFilters";
import TaskDetailModal from "./TaskDetailModal";
import { Menu, FolderOpen, Hash } from "lucide-react";

export default function TaskBoard() {
  const { isDark } = useTheme();
  const {
    tasksByStatus,
    stats,
    changeTaskStatus,
    currentProjectId,
    participants,
    projects,
    setIsMobileSidebarOpen, // À ajouter dans votre contexte si pas déjà présent
  } = useTasks();

  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Trouver le projet courant
  const currentProject = projects?.find((p) => p._id === currentProjectId);
  const projectName =
    currentProjectId === "all" ? "Toutes les tâches" : currentProject?.name || "Projet";

  // Drag & Drop handler
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    await changeTaskStatus(draggableId, newStatus);
  };

  // Styles
  const containerBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-slate-50 via-white to-blue-50";

  const headerBg = isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200";

  return (
    <div className={`flex flex-col h-full ${containerBg}`}>
      {/* Header Projet - NOUVEAU */}
      <div
        className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b backdrop-blur-sm ${headerBg}`}
      >
        {/* Menu hamburger - visible sur mobile/tablette uniquement */}
        <button
          onClick={() => {
            // Logique pour ouvrir la sidebar mobile
            // Si vous avez un état pour ça dans le contexte:
            // setIsMobileSidebarOpen(true)
            console.log("Ouvrir sidebar mobile");
          }}
          className={`lg:hidden p-2 rounded-lg transition-all ${
            isDark
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
        >
          <Menu size={20} />
        </button>

        {/* Icône et nom du projet */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {currentProjectId === "all" ? (
            <div
              className={`p-2 sm:p-2.5 rounded-xl ${
                isDark ? "bg-blue-500/20" : "bg-blue-100"
              }`}
            >
              <FolderOpen
                size={18}
                className={`${isDark ? "text-blue-400" : "text-blue-600"} sm:w-5 sm:h-5`}
              />
            </div>
          ) : (
            <div
              className={`p-2 sm:p-2.5 rounded-xl ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <Hash
                size={16}
                className={`${isDark ? "text-slate-400" : "text-slate-600"} sm:w-[18px] sm:h-[18px]`}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1
              className={`text-base sm:text-lg font-bold truncate ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {projectName}
            </h1>
            <p
              className={`text-[10px] sm:text-xs ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {stats.total} tâche{stats.total !== 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        {/* Badge de progression */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
          } border`}
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span
            className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            {stats.progress}%
          </span>
        </div>
      </div>

      {/* Filtres */}
      <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />

      {/* Board Kanban - Scroll vertical sur mobile/tablet, grid sur desktop */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* 
            Mobile/Tablet: Colonnes empilées verticalement avec scroll
            Desktop XL: Grid 3 colonnes sans scroll
          */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4 xl:h-full">
            <TaskColumn
              id="todo"
              title="À faire"
              tasks={tasksByStatus.todo}
              onTaskClick={setSelectedTask}
              color="blue"
            />
            <TaskColumn
              id="inProgress"
              title="En cours"
              tasks={tasksByStatus.inProgress}
              onTaskClick={setSelectedTask}
              color="amber"
            />
            <TaskColumn
              id="done"
              title="Terminées"
              tasks={tasksByStatus.done}
              onTaskClick={setSelectedTask}
              color="emerald"
            />
          </div>
        </DragDropContext>
      </div>

      {/* Barre de progression - Responsive */}
      <div
        className={`p-3 sm:p-4 border-t ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-2">
            {/* Header compact */}
            <div className="flex justify-between items-center">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <h3
                  className={`text-xs sm:text-[13px] font-black tracking-tight ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Progression
                </h3>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  ({stats.done}/{stats.total})
                </span>
              </div>

              <div
                className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-blue-600 text-white shadow-sm`}
              >
                {stats.progress}%
              </div>
            </div>

            {/* Barre de progression Multicolore */}
            <div
              className={`relative h-1.5 sm:h-2 w-full rounded-full overflow-hidden ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <div
                className={`h-full transition-all duration-1000 ease-out rounded-full relative ${
                  stats.progress < 30
                    ? "bg-blue-500"
                    : stats.progress < 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${stats.progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
              </div>
            </div>

            {/* Stats Badges - Responsive Layout */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-8 mt-1">
              <StatBadge label="À faire" count={stats.todo} color="blue" isDark={isDark} />

              <StatBadge
                label="En cours"
                count={stats.inProgress}
                color="amber"
                isDark={isDark}
              />

              <StatBadge
                label="Terminées"
                count={stats.done}
                color="emerald"
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewTaskModal && (
        <TaskDetailModal
          isNew
          projectId={currentProjectId !== "all" ? currentProjectId : null}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

// Composant StatBadge responsive
function StatBadge({ label, count, color, isDark, pulse }) {
  const colors = {
    blue: isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700",
    amber: isDark
      ? "bg-amber-900/50 text-amber-300"
      : "bg-amber-100 text-amber-700",
    emerald: isDark
      ? "bg-emerald-900/50 text-emerald-300"
      : "bg-emerald-100 text-emerald-700",
    rose: isDark ? "bg-rose-900/50 text-rose-300" : "bg-rose-100 text-rose-700",
  };

  const dotColors = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
      <span
        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {/* Mobile: chiffre seul, Desktop: label + chiffre */}
        <span className="hidden sm:inline">{label} </span>
        {count}
      </span>
    </div>
  );
}