"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import TaskColumn from "./TaskColumn";
import TaskFilters from "./TaskFilters";
import TaskDetailModal from "./TaskDetailModal";
import { Menu, FolderOpen, Hash, Circle, Clock, CheckCircle2, ChevronRight, X } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("todo");
  const [showMobileTaskList, setShowMobileTaskList] = useState(false);
  const [taskForStatusChange, setTaskForStatusChange] = useState(null);

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

  // Mobile: Changer le statut d'une tâche
  const handleMobileStatusChange = async (taskId, newStatus) => {
    await changeTaskStatus(taskId, newStatus);
    setTaskForStatusChange(null);
  };

  // Mobile: Obtenir les options de statut disponibles
  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = [
      { id: "todo", label: "À faire", icon: Circle, color: "blue" },
      { id: "inProgress", label: "En cours", icon: Clock, color: "amber" },
      { id: "done", label: "Terminées", icon: CheckCircle2, color: "emerald" },
    ];
    return allStatuses.filter((s) => s.id !== currentStatus);
  };

  // Styles
  const containerBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-slate-50 via-white to-blue-50";

  return (
    <div className={`flex flex-col h-full ${containerBg}`}>
      {/* Header Projet - BLEU VIBRANT */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b bg-blue-600 border-blue-700">
        {/* Menu hamburger - Sans background, direct sur le bleu */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg transition-all hover:bg-blue-700/50 text-white"
        >
          <Menu size={20} />
        </button>

        {/* Icône et nom du projet - Hashtag caché en mobile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {currentProjectId === "all" ? (
            <div className="hidden sm:block p-2 sm:p-2.5 rounded-xl bg-blue-700">
              <FolderOpen size={18} className="text-white sm:w-5 sm:h-5" />
            </div>
          ) : (
            <div className="hidden sm:block p-2 sm:p-2.5 rounded-xl bg-blue-700">
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

      {/* MODE MOBILE/TABLETTE - Zones cliquables */}
      <div className="xl:hidden flex-1 flex flex-col min-h-0">
        {!showMobileTaskList ? (
          // Vue des 3 zones
          <div className="flex-1 flex flex-col gap-3 p-4">
            {/* Zone À faire */}
            <button
              onClick={() => {
                setActiveTab("todo");
                setShowMobileTaskList(true);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                isDark
                  ? "bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750"
                  : "bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600">
                  <Circle size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    À faire
                  </h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {stats.todo} tâche{stats.todo !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className={isDark ? "text-slate-400" : "text-slate-500"} />
            </button>

            {/* Zone En cours */}
            <button
              onClick={() => {
                setActiveTab("inProgress");
                setShowMobileTaskList(true);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                isDark
                  ? "bg-slate-800 border-slate-700 hover:border-amber-500 hover:bg-slate-750"
                  : "bg-white border-slate-200 hover:border-amber-500 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-600">
                  <Clock size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    En cours
                  </h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {stats.inProgress} tâche{stats.inProgress !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className={isDark ? "text-slate-400" : "text-slate-500"} />
            </button>

            {/* Zone Terminées */}
            <button
              onClick={() => {
                setActiveTab("done");
                setShowMobileTaskList(true);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                isDark
                  ? "bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-750"
                  : "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-600">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Terminées
                  </h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {stats.done} tâche{stats.done !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className={isDark ? "text-slate-400" : "text-slate-500"} />
            </button>
          </div>
        ) : (
          // Vue de la liste des tâches
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header de la liste */}
            <div
              className={`flex items-center gap-3 px-4 py-3 border-b ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <button
                onClick={() => setShowMobileTaskList(false)}
                className={`p-2 rounded-lg ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                <ChevronRight size={20} className={`${isDark ? "text-white" : "text-slate-900"} rotate-180`} />
              </button>
              <div className="flex items-center gap-2">
                {activeTab === "todo" && (
                  <>
                    <Circle size={18} className="text-blue-600" />
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      À faire
                    </h2>
                  </>
                )}
                {activeTab === "inProgress" && (
                  <>
                    <Clock size={18} className="text-amber-600" />
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      En cours
                    </h2>
                  </>
                )}
                {activeTab === "done" && (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      Terminées
                    </h2>
                  </>
                )}
              </div>
            </div>

            {/* Liste des tâches */}
            <div className="flex-1 overflow-y-auto p-4">
              <MobileTaskList
                tasks={tasksByStatus[activeTab]}
                onTaskClick={setSelectedTask}
                onCheckboxClick={setTaskForStatusChange}
                isDark={isDark}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODE DESKTOP - Board Kanban */}
      <div className="hidden xl:block flex-1 min-h-0 p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="h-full grid grid-cols-3 gap-4">
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

      {/* Modal de changement de statut */}
      {taskForStatusChange && (
        <StatusChangeModal
          task={taskForStatusChange}
          availableStatuses={getAvailableStatuses(taskForStatusChange.status)}
          onStatusChange={handleMobileStatusChange}
          onClose={() => setTaskForStatusChange(null)}
          isDark={isDark}
        />
      )}

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

// Composant Liste des tâches mobile
function MobileTaskList({ tasks, onTaskClick, onCheckboxClick, isDark }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          <p className="text-sm">Aucune tâche</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <div
          key={task._id}
          className={`flex items-center gap-3 p-3 rounded-lg border ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Checkbox pour changer le statut */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckboxClick(task);
            }}
            className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              task.status === "done"
                ? "bg-emerald-600 border-emerald-600"
                : isDark
                ? "border-slate-600 hover:border-blue-500"
                : "border-slate-300 hover:border-blue-500"
            }`}
          >
            {task.status === "done" && (
              <CheckCircle2 size={16} className="text-white" />
            )}
          </button>

          {/* Contenu de la tâche */}
          <button
            onClick={() => onTaskClick(task)}
            className="flex-1 text-left"
          >
            <h4
              className={`text-sm font-semibold ${
                task.status === "done"
                  ? isDark
                    ? "text-slate-500 line-through"
                    : "text-slate-400 line-through"
                  : isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p
                className={`text-xs mt-1 line-clamp-1 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {task.description}
              </p>
            )}
          </button>

          {/* Indicateur de priorité */}
          {task.priority && (
            <div
              className={`flex-shrink-0 w-2 h-2 rounded-full ${
                task.priority === "high"
                  ? "bg-red-500"
                  : task.priority === "medium"
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Modal de changement de statut
function StatusChangeModal({ task, availableStatuses, onStatusChange, onClose, isDark }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full sm:w-auto sm:min-w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Déplacer la tâche
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
            }`}
          >
            <X size={20} className={isDark ? "text-slate-400" : "text-slate-500"} />
          </button>
        </div>

        {/* Titre de la tâche */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {task.title}
          </p>
        </div>

        {/* Options de statut */}
        <div className="p-2">
          {availableStatuses.map((status) => {
            const Icon = status.icon;
            const colorClasses = {
              blue: "hover:bg-blue-50 text-blue-600",
              amber: "hover:bg-amber-50 text-amber-600",
              emerald: "hover:bg-emerald-50 text-emerald-600",
            };
            const darkColorClasses = {
              blue: "hover:bg-blue-950 text-blue-400",
              amber: "hover:bg-amber-950 text-amber-400",
              emerald: "hover:bg-emerald-950 text-emerald-400",
            };

            return (
              <button
                key={status.id}
                onClick={() => onStatusChange(task._id, status.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isDark
                    ? `${darkColorClasses[status.color]} hover:bg-slate-800`
                    : colorClasses[status.color]
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{status.label}</span>
              </button>
            );
          })}
        </div>
      </div>
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