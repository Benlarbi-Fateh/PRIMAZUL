"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import TaskColumn from "./TaskColumn";
import TaskFilters from "./TaskFilters";
import TaskDetailModal from "./TaskDetailModal";
import { Plus, TrendingUp } from "lucide-react";

export default function TaskBoard() {
  const { isDark } = useTheme();
  const {
    tasksByStatus,
    stats,
    changeTaskStatus,
    currentProjectId,
    participants,
  } = useTasks();

  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

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

  const progressBarBg = isDark
    ? "bg-slate-800/50 border-slate-700"
    : "bg-white border-slate-200";

  return (
    <div className={`flex flex-col h-full ${containerBg}`}>
      {/* Filtres */}
      <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />

      {/* Board Kanban */}
      <div className="flex-1 overflow-hidden p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
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

      {/* Barre de progression */}
      <div className={`p-4 border-t ${progressBarBg}`}>
        <div className="flex items-center gap-6">
          {/* Cercle de progression */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className={isDark ? "text-slate-700" : "text-slate-200"}
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 - (150.8 * stats.progress) / 100}
                  strokeLinecap="round"
                  className="text-blue-600 transition-all duration-700"
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs font-black ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {stats.progress}%
              </span>
            </div>
            <div>
              <p
                className={`text-sm font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Progression
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {stats.done} sur {stats.total} tâches
              </p>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="flex-1 flex items-center justify-center gap-6">
            <StatBadge
              label="À faire"
              count={stats.todo}
              color="blue"
              isDark={isDark}
            />
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
            {stats.overdue > 0 && (
              <StatBadge
                label="En retard"
                count={stats.overdue}
                color="rose"
                isDark={isDark}
                pulse
              />
            )}
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
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

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
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${colors[color]}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${dotColors[color]} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      {label}: {count}
    </div>
  );
}
