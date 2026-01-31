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
  Sparkles,
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

  // Configuration Mobile avec couleurs vives
  const mobileSections = [
    {
      id: "todo",
      label: "À Faire",
      count: tasksByStatus.todo.length,
      icon: Circle,
      lightGradient: "from-blue-500 to-blue-600",
      darkGradient: "from-blue-600 to-blue-700",
    },
    {
      id: "inProgress",
      label: "En Cours",
      count: tasksByStatus.inProgress.length,
      icon: Clock,
      lightGradient: "from-orange-500 to-amber-600",
      darkGradient: "from-orange-600 to-amber-700",
    },
    {
      id: "done",
      label: "Terminées",
      count: tasksByStatus.done.length,
      icon: CheckCircle2,
      lightGradient: "from-emerald-500 to-teal-600",
      darkGradient: "from-emerald-600 to-teal-700",
    },
  ];

  // État vide
  if (!currentProjectId) {
    return (
      <div
        className={`
          flex flex-col items-center justify-center h-full p-8 text-center
          ${
            isDark
              ? "bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950"
              : "bg-gradient-to-br from-blue-100 via-white to-blue-50"
          }
        `}
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full blur-2xl opacity-40 animate-pulse" />
          <div className="relative w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 ring-4 ring-white/20">
            <FolderPlus className="w-14 h-14 text-white" strokeWidth={2} />
          </div>
        </div>
        <h2
          className={`
            text-2xl font-black mb-3
            ${isDark ? "text-blue-100" : "text-slate-900"}
          `}
        >
          Aucun projet sélectionné
        </h2>
        <p
          className={`
            text-sm mb-6 max-w-sm
            ${isDark ? "text-blue-400" : "text-slate-600"}
          `}
        >
          Sélectionnez un projet dans la barre latérale pour commencer à gérer
          vos tâches
        </p>
        <button
          onClick={toggleSidebar}
          className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-black shadow-2xl shadow-blue-600/40 hover:shadow-blue-600/60 transition-all active:scale-95 flex items-center gap-2"
        >
          <Sparkles
            size={20}
            className="group-hover:rotate-12 transition-transform"
          />
          Choisir un projet
        </button>
      </div>
    );
  }

  return (
    <div
      className={`
        flex flex-col h-full w-full transition-colors duration-300
        ${
          isDark
            ? "bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950"
            : "bg-gradient-to-br from-blue-50 via-white to-blue-100/50"
        }
      `}
    >
      {/* HEADER */}
      <header
        className={`
          px-4 sm:px-6 py-4 flex items-center justify-between shrink-0
          border-b-2 backdrop-blur-sm
          ${
            isDark
              ? "bg-gradient-to-r from-blue-950/80 to-blue-900/80 border-blue-800/60"
              : "bg-gradient-to-r from-blue-50/80 to-white/80 border-blue-200 shadow-sm"
          }
        `}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className={`
              md:hidden p-2.5 -ml-2 rounded-xl transition-all active:scale-95
              ${
                isDark
                  ? "text-white hover:bg-blue-800/50"
                  : "text-blue-900 hover:bg-blue-100"
              }
            `}
          >
            <Menu size={24} strokeWidth={2} />
          </button>
          <div>
            <h1
              className={`
                text-lg sm:text-xl font-black leading-tight
                ${isDark ? "text-blue-100" : "text-blue-900"}
              `}
            >
              {currentProject?.name || "Sélectionner un projet"}
            </h1>
            <p
              className={`
                text-[10px] sm:text-xs font-black uppercase tracking-widest
                ${isDark ? "text-blue-400" : "text-blue-600"}
              `}
            >
              Workspace
            </p>
          </div>
        </div>

        {/* ACTIONS HEADER */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-black shadow-xl shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Nouvelle tâche</span>
          </button>

          {/* Switcher Vue */}
          <div
            className={`
              hidden md:flex p-1 rounded-xl backdrop-blur-sm
              ${
                isDark
                  ? "bg-blue-900/40 ring-1 ring-blue-800/50"
                  : "bg-blue-100 ring-1 ring-blue-200"
              }
            `}
          >
            <button
              onClick={() => setViewMode("board")}
              className={`
                p-2.5 rounded-lg transition-all
                ${
                  viewMode === "board"
                    ? isDark
                      ? "bg-blue-800 shadow-lg text-blue-200 ring-1 ring-blue-700"
                      : "bg-white shadow-md text-blue-600 ring-1 ring-blue-300"
                    : isDark
                      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-800/50"
                      : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                }
              `}
            >
              <Kanban size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`
                p-2.5 rounded-lg transition-all
                ${
                  viewMode === "list"
                    ? isDark
                      ? "bg-blue-800 shadow-lg text-blue-200 ring-1 ring-blue-700"
                      : "bg-white shadow-md text-blue-600 ring-1 ring-blue-300"
                    : isDark
                      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-800/50"
                      : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                }
              `}
            >
              <LayoutList size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* FILTRES */}
      <div className="shrink-0 z-10">
        <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />
      </div>

      {/* VUE MOBILE (Cartes) */}
      <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3">
        {mobileSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveMobileColumn(section.id)}
              className={`
                w-full p-5 rounded-2xl flex items-center justify-between
                transition-all active:scale-[0.98] shadow-xl
                bg-gradient-to-r ${
                  isDark ? section.darkGradient : section.lightGradient
                }
                text-white border-2 border-white/20
              `}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
                  <Icon size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-black">{section.label}</h3>
                  <p className="text-sm font-bold text-white/80">
                    {section.count} tâche{section.count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm font-black text-base ring-2 ring-white/30">
                {section.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* POPUP MOBILE */}
      {activeMobileColumn && (
        <div
          className={`
            fixed inset-0 z-50 flex flex-col md:hidden
            animate-in slide-in-from-right duration-300
            ${
              isDark
                ? "bg-gradient-to-br from-blue-950 to-blue-900"
                : "bg-gradient-to-br from-blue-50 to-white"
            }
          `}
        >
          <div
            className={`
              px-4 py-4 border-b-2 flex items-center gap-3 backdrop-blur-sm
              ${
                isDark
                  ? "border-blue-800/60 bg-blue-950/80"
                  : "border-blue-200 bg-white/80"
              }
            `}
          >
            <button
              onClick={() => setActiveMobileColumn(null)}
              className={`
                p-2.5 -ml-2 rounded-xl transition-all active:scale-95
                ${
                  isDark
                    ? "hover:bg-blue-800/50 text-white"
                    : "hover:bg-blue-100 text-blue-900"
                }
              `}
            >
              <ArrowLeft size={24} strokeWidth={2} />
            </button>
            <h2
              className={`
                text-lg font-black
                ${isDark ? "text-white" : "text-blue-900"}
              `}
            >
              {mobileSections.find((s) => s.id === activeMobileColumn)?.label}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tasksByStatus[activeMobileColumn].map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => setSelectedTask(task)}
                isMobileView={true}
              />
            ))}
          </div>
          {/* FAB */}
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full text-white shadow-2xl shadow-blue-600/50 flex items-center justify-center active:scale-90 transition-all ring-4 ring-white/20"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* VUE DESKTOP (Kanban) */}
      <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-hidden p-6 gap-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full gap-6 w-full min-w-full">
            <div className="w-[350px] lg:w-[380px] shrink-0 h-full">
              <TaskColumn
                id="todo"
                title="À faire"
                tasks={tasksByStatus.todo}
                onTaskClick={setSelectedTask}
              />
            </div>
            <div className="w-[350px] lg:w-[380px] shrink-0 h-full">
              <TaskColumn
                id="inProgress"
                title="En cours"
                tasks={tasksByStatus.inProgress}
                onTaskClick={setSelectedTask}
              />
            </div>
            <div className="w-[350px] lg:w-[380px] shrink-0 h-full">
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

      <style jsx global>{`
        /* Fix pour le drag and drop - carte au dessus de tout */
        .react-beautiful-dnd-dragging {
          z-index: 9999 !important;
        }

        /* Désactiver toutes les transitions pendant le drag pour suivre la souris */
        .react-beautiful-dnd-dragging * {
          transition: none !important;
        }

        /* Amélioration du curseur pendant le drag */
        .react-beautiful-dnd-drag-handle {
          cursor: grab !important;
        }

        .react-beautiful-dnd-drag-handle:active {
          cursor: grabbing !important;
        }
      `}</style>
    </div>
  );
}
