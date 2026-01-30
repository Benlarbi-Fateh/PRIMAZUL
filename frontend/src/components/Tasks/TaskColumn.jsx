"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import TaskCard from "./TaskCard";

const columnConfig = {
  todo: { title: "À faire", color: "bg-blue-500" },
  inProgress: { title: "En cours", color: "bg-amber-500" },
  done: { title: "Terminées", color: "bg-emerald-500" },
};

export default function TaskColumn({ id, title, tasks, onTaskClick }) {
  const { isDark } = useTheme();
  const config = columnConfig[id];

  return (
    <div
      className={`flex flex-col h-full max-h-full rounded-2xl transition-colors ${
        isDark
          ? "bg-slate-900/40 border border-slate-800"
          : "bg-slate-50/50 border border-slate-200/50" // Très léger en mode clair
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${config.color} ring-4 ring-opacity-20 ${config.color.replace("bg-", "ring-")}`}
          />
          <h3
            className={`font-bold text-sm uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {title}
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            isDark
              ? "bg-slate-800 text-slate-400"
              : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200"
          }`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Zone Drop */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
                flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar
                transition-colors duration-200 rounded-b-2xl
                ${snapshot.isDraggingOver ? (isDark ? "bg-slate-800/50" : "bg-blue-50/50") : ""}
            `}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ ...provided.draggableProps.style }}
                    className="group"
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
                className={`h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-sm font-medium ${
                  isDark
                    ? "border-slate-800 text-slate-600"
                    : "border-slate-200 text-slate-400 bg-white/40"
                }`}
              >
                Vide
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
