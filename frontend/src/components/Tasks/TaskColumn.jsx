"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import TaskCard from "./TaskCard";

const columnConfig = {
  todo: {
    title: "À faire",
    color: "blue",
    dotColor: "bg-blue-500",
  },
  inProgress: {
    title: "En cours",
    color: "amber",
    dotColor: "bg-amber-500",
  },
  done: {
    title: "Terminées",
    color: "emerald",
    dotColor: "bg-emerald-500",
  },
};

export default function TaskColumn({ id, title, tasks, onTaskClick, color }) {
  const { isDark } = useTheme();
  const config = columnConfig[id] || { dotColor: "bg-slate-500" };

  const columnBg = isDark
    ? "bg-slate-900/50 border-slate-800"
    : "bg-slate-50 border-slate-200";

  const headerBg = isDark ? "border-slate-800" : "border-slate-200";

  const emptyBg = isDark
    ? "border-slate-700 text-slate-500"
    : "border-slate-300 text-slate-400";

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            flex flex-col rounded-2xl border transition-all
            ${columnBg}
            ${snapshot.isDraggingOver ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""}
          `}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between p-4 border-b ${headerBg}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
              <h3
                className={`font-bold text-sm uppercase tracking-wide ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}
              >
                {title}
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDark
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {tasks.length}
            </span>
          </div>

          {/* Liste des tâches */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)]">
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "z-50" : ""}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick(task)}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {tasks.length === 0 && (
              <div
                className={`
                  flex items-center justify-center py-12
                  border-2 border-dashed rounded-xl
                  ${emptyBg}
                `}
              >
                <p className="text-sm font-medium">Déposez une tâche ici</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}
