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
  Plus,
} from "lucide-react";

export default function TaskBoard({ toggleSidebar }) {
  const { isDark } = useTheme();
  const { tasksByStatus, changeTaskStatus, currentProject, currentProjectId } =
    useTasks();

  const [viewMode, setViewMode] = useState("board");
  const [activeMobileColumn, setActiveMobileColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

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

  // Configuration Mobile (Style Blanc/Noir appliqué)
  const mobileSections = [
    {
      id: "todo",
      label: "À Faire",
      count: tasksByStatus.todo.length,
      icon: Circle,
      color: "text-blue-600",
      bg: "bg-white border-slate-200", // Blanc pur
    },
    {
      id: "inProgress",
      label: "En Cours",
      count: tasksByStatus.inProgress.length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-white border-slate-200", // Blanc pur
    },
    {
      id: "done",
      label: "Terminées",
      count: tasksByStatus.done.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-white border-slate-200", // Blanc pur
    },
  ];

  // État vide
  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-950">
        <div className="w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-blue-100 dark:border-slate-700">
          <FolderPlus className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Aucun projet sélectionné
        </h2>
        <button
          onClick={toggleSidebar}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors"
        >
          Choisir un projet
        </button>
      </div>
    );
  }

  return (
    // FOND BLANC PUR (bg-white)
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-950">
      {/* --- HEADER --- */}
      <header
        className={`px-6 py-4 flex items-center justify-between shrink-0 border-b ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-blue border-slate-200" // Fond blanc, bordure nette
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 -ml-2 text-slate-900 dark:text-white hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-1000 dark:text-blue-600 leading-tight">
              {currentProject.name}
            </h1>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
              Workspace
            </p>
          </div>
        </div>

        {/* ACTIONS HEADER (Desktop) */}
        <div className="flex items-center gap-3">
          {/* ✅ BOUTON CRÉER TÂCHE (Visible sur Desktop) */}
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Nouvelle tâche</span>
          </button>

          {/* Switcher Vue */}
          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("board")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "board"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Kanban size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutList size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* --- FILTRES --- */}
      <div className="shrink-0 z-10 bg-white dark:bg-slate-950">
        <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />
      </div>

      {/* --- VUE MOBILE (Cartes Dossiers) --- */}
      <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-950">
        {mobileSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveMobileColumn(section.id)}
              className={`w-full p-5 rounded-xl border flex items-center justify-between transition-transform active:scale-[0.98] ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 shadow-sm hover:border-blue-300" // Carte blanche propre
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-50 text-slate-900"}`}
                >
                  <Icon size={24} className={section.color} />
                </div>
                <div className="text-left">
                  <h3
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {section.label}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {section.count} tâches
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm">
                {section.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* --- POPUP MOBILE (Liste détaillée) --- */}
      {activeMobileColumn && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col md:hidden animate-in slide-in-from-right duration-300">
          <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950">
            {tasksByStatus[activeMobileColumn].map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => setSelectedTask(task)}
                isMobileView={true}
              />
            ))}
          </div>
          {/* Bouton Flottant (FAB) pour créer sur Mobile */}
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-xl shadow-blue-600/40 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      {/* --- VUE DESKTOP (Kanban) --- */}
      <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar bg-white dark:bg-slate-950">
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
