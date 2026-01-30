"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import TaskColumn from "./TaskColumn";
import TaskFilters from "./TaskFilters";
import TaskDetailModal from "./TaskDetailModal";
import { Menu, FolderOpen, Hash, Circle, Clock, CheckCircle2 } from "lucide-react";

export default function TaskBoard() {
  const { isDark } = useTheme();
  const {
    tasksByStatus,
    stats,
    changeTaskStatus,
    currentProjectId,
    participants,
    projects,
    setIsMobileSidebarOpen,
  } = useTasks();

  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [activeTab, setActiveTab] = useState("todo"); // État pour les onglets mobile/tablette

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

  return (
    <div className={`flex flex-col h-full ${containerBg}`}>
      {/* Header Projet - BLEU VIBRANT */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b bg-blue-600 border-blue-700">
        {/* Menu hamburger - visible sur mobile/tablette uniquement */}
        <button
          onClick={() => {
            console.log("Ouvrir sidebar mobile");
          }}
          className="lg:hidden p-2 rounded-lg transition-all hover:bg-blue-700 text-white"
        >
          <Menu size={20} />
        </button>

        {/* Icône et nom du projet */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {currentProjectId === "all" ? (
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-700">
              <FolderOpen size={18} className="text-white sm:w-5 sm:h-5" />
            </div>
          ) : (
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-700">
              <Hash size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate text-white">
              {projectName}
            </h1>
            <p className="text-[10px] sm:text-xs text-blue-100">
              {stats.total} tâche{stats.total !== 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        {/* Badge de progression */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-700 border-blue-800 border">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white">{stats.progress}%</span>
        </div>
      </div>

      {/* Filtres */}
      <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />

      {/* Onglets Mobile/Tablette - Cachés sur XL */}
      <div
        className={`xl:hidden flex gap-2 p-3 border-b ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/50 border-slate-200"
        }`}
      >
        <button
          onClick={() => setActiveTab("todo")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all ${
            activeTab === "todo"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg"
              : isDark
              ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
        >
          <Circle size={16} />
          <span className="text-xs font-bold">À faire</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              activeTab === "todo"
                ? "bg-white/20"
                : isDark
                ? "bg-slate-700"
                : "bg-slate-200"
            }`}
          >
            {stats.todo}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("inProgress")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all ${
            activeTab === "inProgress"
              ? "bg-amber-600 text-white border-amber-500 shadow-lg"
              : isDark
              ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
        >
          <Clock size={16} />
          <span className="text-xs font-bold">En cours</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              activeTab === "inProgress"
                ? "bg-white/20"
                : isDark
                ? "bg-slate-700"
                : "bg-slate-200"
            }`}
          >
            {stats.inProgress}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("done")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all ${
            activeTab === "done"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-lg"
              : isDark
              ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold">Terminées</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              activeTab === "done"
                ? "bg-white/20"
                : isDark
                ? "bg-slate-700"
                : "bg-slate-200"
            }`}
          >
            {stats.done}
          </span>
        </button>
      </div>
{/* Board Kanban */}
<div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
  <DragDropContext onDragEnd={handleDragEnd}>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4 h-full">
      {/* Sur mobile/tablette, affiche seulement la colonne active */}
      {/* Sur XL, affiche les 3 colonnes */}
      <div className={`flex flex-col h-full ${activeTab === "todo" ? "block" : "hidden xl:block"}`}>
        <TaskColumn
          id="todo"
          title="À faire"
          tasks={tasksByStatus.todo}
          onTaskClick={setSelectedTask}
          color="blue"
        />
      </div>

      <div className={`flex flex-col h-full ${activeTab === "inProgress" ? "block" : "hidden xl:block"}`}>
        <TaskColumn
          id="inProgress"
          title="En cours"
          tasks={tasksByStatus.inProgress}
          onTaskClick={setSelectedTask}
          color="amber"
        />
      </div>

      <div className={`flex flex-col h-full ${activeTab === "done" ? "block" : "hidden xl:block"}`}>
        <TaskColumn
          id="done"
          title="Terminées"
          tasks={tasksByStatus.done}
          onTaskClick={setSelectedTask}
          color="emerald"
        />
      </div>
    </div>
  </DragDropContext>
</div>


      {/* Barre de progression */}
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

              <div className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-blue-600 text-white shadow-sm">
                {stats.progress}%
              </div>
            </div>

            {/* Barre de progression */}
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

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-8 mt-1">
              <StatBadge label="À faire" count={stats.todo} color="blue" isDark={isDark} />
              <StatBadge label="En cours" count={stats.inProgress} color="amber" isDark={isDark} />
              <StatBadge label="Terminées" count={stats.done} color="emerald" isDark={isDark} />
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
function StatBadge({ label, count, color, isDark }) {
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
        <span className="hidden sm:inline">{label} </span>
        {count}
      </span>
    </div>
  );
}
