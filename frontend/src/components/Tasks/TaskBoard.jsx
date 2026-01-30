"use client";

import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import TaskColumn from "./TaskColumn";
import TaskFilters from "./TaskFilters";
import TaskDetailModal from "./TaskDetailModal";
import TaskCard from "./TaskCard";
import {
  Menu,
  LayoutList,
  Kanban,
  FolderPlus,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ArrowRightLeft,
} from "lucide-react";

export default function TaskBoard({ toggleSidebar }) {
  const { isDark } = useTheme();
  const { tasksByStatus, changeTaskStatus, currentProject, currentProjectId } =
    useTasks();

  // États Desktop
  const [viewMode, setViewMode] = useState("board");

  // États Mobile
  const [activeMobileColumn, setActiveMobileColumn] = useState(null); // 'todo', 'inProgress', 'done' ou null

  // États Communs
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Gestion du Drag & Drop Desktop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;
    await changeTaskStatus(draggableId, destination.droppableId);
  };

  // Configuration des colonnes pour le menu Mobile
  const mobileSections = [
    {
      id: "todo",
      label: "À Faire",
      count: tasksByStatus.todo.length,
      icon: Circle,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
    },
    {
      id: "inProgress",
      label: "En Cours",
      count: tasksByStatus.inProgress.length,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50 border-amber-100",
    },
    {
      id: "done",
      label: "Terminées",
      count: tasksByStatus.done.length,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50 border-emerald-100",
    },
  ];

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-900">
        <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <FolderPlus className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Aucun projet
        </h2>
        <button
          onClick={toggleSidebar}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
        >
          Choisir un projet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-950">
      {/* --- HEADER COMMUN --- */}
      <header
        className={`px-4 py-4 flex items-center justify-between shrink-0 border-b ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 -ml-2 text-slate-900 dark:text-white"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {currentProject.name}
            </h1>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
              Workspace
            </p>
          </div>
        </div>

        {/* Desktop View Switcher */}
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("board")}
            className={`p-2 rounded ${viewMode === "board" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
          >
            <Kanban size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
          >
            <LayoutList size={18} />
          </button>
        </div>
      </header>

      {/* --- FILTRES (Affichés partout pour l'instant) --- */}
      <div className="shrink-0 z-10">
        <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />
      </div>

      {/* =========================================================
          VUE MOBILE : MENU PRINCIPAL (3 GROS BOUTONS)
         ========================================================= */}
      <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
        {mobileSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveMobileColumn(section.id)}
              className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-transform active:scale-95 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white"
                  : `${section.bg} ${section.color.replace("text", "border")} bg-opacity-30 border-opacity-20`
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${isDark ? "bg-slate-800" : "bg-white shadow-sm"}`}
                >
                  <Icon size={24} className={section.color} />
                </div>
                <div className="text-left">
                  <h3
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {section.label}
                  </h3>
                  <p className="text-sm opacity-70">{section.count} tâches</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {section.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          VUE MOBILE : POPUP LISTE DES TÂCHES (Slide-over)
         ========================================================= */}
      {activeMobileColumn && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col md:hidden animate-in slide-in-from-right duration-200">
          {/* Header du Popup */}
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveMobileColumn(null)}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={24} className="text-slate-900 dark:text-white" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mobileSections.find((s) => s.id === activeMobileColumn)?.label}
            </h2>
          </div>

          {/* Liste des tâches Mobile */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
            {tasksByStatus[activeMobileColumn].length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <p>Aucune tâche dans cette section</p>
              </div>
            ) : (
              tasksByStatus[activeMobileColumn].map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                  isMobileView={true} // Active le mode mobile sur la carte
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VUE DESKTOP : KANBAN BOARD (Hidden on Mobile)
         ========================================================= */}
      <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full gap-6 w-full min-w-full">
            <div className="w-[350px] shrink-0 h-full">
              <TaskColumn
                id="todo"
                title="À faire"
                tasks={tasksByStatus.todo}
                onTaskClick={setSelectedTask}
              />
            </div>
            <div className="w-[350px] shrink-0 h-full">
              <TaskColumn
                id="inProgress"
                title="En cours"
                tasks={tasksByStatus.inProgress}
                onTaskClick={setSelectedTask}
              />
            </div>
            <div className="w-[350px] shrink-0 h-full">
              <TaskColumn
                id="done"
                title="Terminées"
                tasks={tasksByStatus.done}
                onTaskClick={setSelectedTask}
              />
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      {showNewTaskModal && (
        <TaskDetailModal
          isNew
          projectId={currentProjectId}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
