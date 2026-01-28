// components/Tasks/TaskBoard.jsx
"use client";

import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import TaskColumn from "./TaskColumn";
import TaskFilters from "./TaskFilters";
import TaskDetailModal from "./TaskDetailModal";
import { Menu, LayoutList, Kanban, FolderPlus } from "lucide-react";

export default function TaskBoard({ toggleSidebar }) {
  const { isDark } = useTheme();
  const { tasksByStatus, changeTaskStatus, currentProject, currentProjectId } =
    useTasks();
  const [viewMode, setViewMode] = useState("board");
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

  const containerBg = isDark ? "bg-slate-950" : "bg-slate-50";
  const headerText = isDark ? "text-white" : "text-slate-900";

  // Si aucun projet sélectionné
  if (!currentProjectId) {
    return (
      <div
        className={`flex items-center justify-center h-full w-full ${containerBg}`}
      >
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FolderPlus size={40} className="text-blue-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${headerText}`}>
            Aucun projet sélectionné
          </h2>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">
            Veuillez sélectionner ou créer un projet dans le menu de gauche pour
            commencer.
          </p>
          <button
            onClick={toggleSidebar}
            className="md:hidden px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
          >
            Ouvrir le menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full w-full ${containerBg} overflow-hidden`}
    >
      {/* HEADER MOBILE & DESKTOP */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu
              size={24}
              className={isDark ? "text-white" : "text-slate-700"}
            />
          </button>

          <div>
            <h1 className={`text-lg font-bold ${headerText}`}>
              {currentProject ? currentProject.name : "Chargement..."}
            </h1>
            <p className="text-xs text-slate-500">Espace de collaboration</p>
          </div>
        </div>

        {/* View Switcher */}
        <div
          className={`flex p-1 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
        >
          <button
            onClick={() => setViewMode("board")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "board" ? "bg-white shadow text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Kanban size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutList size={18} />
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <TaskFilters onNewTask={() => setShowNewTaskModal(true)} />

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {viewMode === "board" ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col md:flex-row gap-4 h-full min-w-full md:min-w-0">
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
        ) : (
          <div className="max-w-4xl mx-auto space-y-2 overflow-y-auto h-full pr-2">
            <div className="text-center text-slate-500 py-10">
              Vue liste bientôt disponible...
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showNewTaskModal && (
        <TaskDetailModal
          isNew
          projectId={currentProjectId} // ✅ IMPORTANT : On passe l'ID du projet actif
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
