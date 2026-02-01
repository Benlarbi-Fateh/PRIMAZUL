"use client";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import TaskCard from "./TaskCard";

const columnConfig = {
  todo: {
    title: "À faire",
    color: "blue",
    dotColor: "bg-blue-500",
    bgLight: "bg-gradient-to-b from-blue-50 to-blue-100/50",
    bgDark: "bg-gradient-to-b from-blue-950/30 to-blue-950/10",
    borderLight: "border-blue-200",
    borderDark: "border-blue-900/30",
    headerLight: "bg-blue-200/70 border-blue-300",
    headerDark: "bg-blue-900/50 border-blue-800/50",
  },
  inProgress: {
    title: "En cours",
    color: "amber",
    dotColor: "bg-amber-500",
    bgLight: "bg-gradient-to-b from-amber-50 to-amber-100/50",
    bgDark: "bg-gradient-to-b from-amber-950/30 to-amber-950/10",
    borderLight: "border-amber-200",
    borderDark: "border-amber-900/30",
    headerLight: "bg-amber-200/70 border-amber-300",
    headerDark: "bg-amber-900/50 border-amber-800/50",
  },
  done: {
    title: "Terminées",
    color: "emerald",
    dotColor: "bg-emerald-500",
    bgLight: "bg-gradient-to-b from-emerald-50 to-emerald-100/50",
    bgDark: "bg-gradient-to-b from-emerald-950/30 to-emerald-950/10",
    borderLight: "border-emerald-200",
    borderDark: "border-emerald-900/30",
    headerLight: "bg-emerald-200/70 border-emerald-300",
    headerDark: "bg-emerald-900/50 border-emerald-800/50",
  },
};

export default function TaskColumn({ id, title, tasks, onTaskClick, color }) {
  const { isDark } = useTheme();
  const config = columnConfig[id] || { dotColor: "bg-slate-500" };

  // Utiliser les couleurs du config au lieu des valeurs fixes
  const columnBg = isDark
    ? config.bgDark || "bg-slate-900/50"
    : config.bgLight || "bg-slate-50";

  const columnBorder = isDark
    ? config.borderDark || "border-slate-800"
    : config.borderLight || "border-slate-200";

  const headerBg = isDark
    ? config.headerDark || "border-slate-800"
    : config.headerLight || "border-slate-200";

  const emptyBg = isDark
    ? "border-slate-700 text-slate-500"
    : "border-slate-300 text-slate-400";

  // ✅ Compter les tâches urgentes et en retard
  const urgentCount = tasks.filter(
    (task) => task.priority === "high" && task.status !== "done",
  ).length;

  const overdueCount = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  return (
    <div
      className={`
        flex flex-col h-full w-full rounded-xl sm:rounded-2xl border-2 overflow-hidden
        ${columnBg}
        ${columnBorder}
      `}
    >
      {/* Header - Responsive avec badges */}
      <div
        className={`flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0 ${headerBg}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <span
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${config.dotColor}`}
          />
          <h3
            className={`font-bold text-xs sm:text-sm uppercase tracking-wide ${
              isDark ? "text-slate-200" : "text-slate-700"
            }`}
          >
            {/* Mobile: titre court, Desktop: titre complet */}
            <span className="hidden sm:inline">{title}</span>
            <span className="sm:hidden">
              {id === "todo"
                ? "À faire"
                : id === "inProgress"
                  ? "En cours"
                  : "Faites"}
            </span>
          </h3>
        </div>

        {/* Badges et compteur */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Badge URGENT */}
          {urgentCount > 0 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase bg-red-600 text-white shadow-sm">
              {urgentCount} Urgent{urgentCount > 1 ? "s" : ""}
            </span>
          )}

          {/* Badge EN RETARD */}
          {overdueCount > 0 && (
            <span
              className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase shadow-sm ${
                isDark
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {overdueCount} Retard
            </span>
          )}

          {/* Compteur total */}
          <span
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
              isDark
                ? "bg-slate-800 text-slate-300"
                : "bg-white/80 text-slate-600"
            }`}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Zone droppable avec scroll - ✅ CORRIGÉ */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-h-0
              ${snapshot.isDraggingOver ? "bg-blue-500/5 ring-2 ring-blue-500/50 ring-inset" : ""}
            `}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
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

            {/* État vide - Responsive */}
            {tasks.length === 0 && (
              <div
                className={`
                  flex items-center justify-center 
                  py-8 sm:py-12
                  border-2 border-dashed rounded-lg sm:rounded-xl
                  ${emptyBg}
                `}
              >
                <p className="text-xs sm:text-sm font-medium text-center px-4">
                  {/* Mobile: texte court, Desktop: texte complet */}
                  <span className="hidden sm:inline">
                    Déposez une tâche ici
                  </span>
                  <span className="sm:hidden">Vide</span>
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
