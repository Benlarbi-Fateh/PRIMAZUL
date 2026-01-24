"use client";

import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import {
  Check,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

const priorityConfig = {
  urgent: {
    label: "Urgent",
    emoji: "🔴",
    bgLight: "bg-rose-50 text-rose-700 border-rose-100",
    bgDark: "bg-rose-900/30 text-rose-300 border-rose-800",
  },
  normal: {
    label: "Normal",
    emoji: "🔵",
    bgLight: "bg-blue-50 text-blue-700 border-blue-100",
    bgDark: "bg-blue-900/30 text-blue-300 border-blue-800",
  },
  low: {
    label: "Faible",
    emoji: "🟢",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bgDark: "bg-emerald-900/30 text-emerald-300 border-emerald-800",
  },
};

export default function TaskCard({ task, onClick, isDragging }) {
  const { isDark } = useTheme();
  const { changeTaskStatus, deleteTask } = useTasks();

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  const priority = priorityConfig[task.priority] || priorityConfig.normal;

  // Styles
  const cardBg = isDark
    ? `bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600 ${
        isDragging ? "shadow-2xl ring-2 ring-blue-500" : ""
      }`
    : `bg-white border-slate-200 hover:shadow-lg hover:border-slate-300 ${
        isDragging ? "shadow-2xl ring-2 ring-blue-500" : ""
      }`;

  const overdueBg = isDark
    ? "!bg-rose-900/20 !border-rose-700/50"
    : "!bg-rose-50 !border-rose-200";

  const handleStatusToggle = (e) => {
    e.stopPropagation();
    const nextStatus = {
      todo: "inProgress",
      inProgress: "done",
      done: "todo",
    };
    changeTaskStatus(task._id, nextStatus[task.status]);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm("Supprimer cette tâche ?")) {
      deleteTask(task._id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative p-4 rounded-xl border cursor-pointer
        transition-all duration-200
        ${cardBg}
        ${task.status === "done" ? "opacity-60" : ""}
        ${isOverdue ? overdueBg : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleStatusToggle}
          className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0
            flex items-center justify-center transition-all
            ${
              task.status === "done"
                ? "bg-emerald-500 border-emerald-500"
                : isDark
                  ? "border-slate-600 hover:border-blue-500 hover:bg-blue-500/20"
                  : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
            }
          `}
        >
          {task.status === "done" && (
            <Check size={12} className="text-white" strokeWidth={3} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`
              font-medium text-sm leading-snug
              ${task.status === "done" ? "line-through" : ""}
              ${isDark ? "text-slate-200" : "text-slate-800"}
            `}
          >
            {task.title}
          </h4>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Priorité */}
            {task.priority === "urgent" && (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                  text-[10px] font-bold border
                  ${isDark ? priority.bgDark : priority.bgLight}
                `}
              >
                {priority.emoji} {priority.label}
              </span>
            )}

            {/* Date d'échéance */}
            {task.dueDate && (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                  text-[10px] font-medium
                  ${
                    isOverdue
                      ? isDark
                        ? "bg-rose-900/50 text-rose-300"
                        : "bg-rose-100 text-rose-600"
                      : isDark
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                  }
                `}
              >
                <Clock size={10} />
                {new Date(task.dueDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}

            {/* Commentaires */}
            {task.comments?.length > 0 && (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                  text-[10px] font-medium
                  ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}
                `}
              >
                <MessageSquare size={10} />
                {task.comments.length}
              </span>
            )}

            {/* Sous-tâches */}
            {task.subtasks?.length > 0 && (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                  text-[10px] font-medium
                  ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}
                `}
              >
                <CheckCircle2 size={10} />
                {task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length}
              </span>
            )}
          </div>

          {/* Assignés */}
          {task.assignees?.length > 0 && (
            <div className="flex -space-x-1.5 mt-3">
              {task.assignees.slice(0, 4).map((assignee, idx) => (
                <div
                  key={assignee._id || idx}
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    text-[9px] font-bold
                    ${
                      isDark
                        ? "bg-slate-700 border-slate-800 text-slate-300"
                        : "bg-slate-200 border-white text-slate-600"
                    }
                  `}
                  title={assignee.name}
                >
                  {(assignee.name || "?")[0].toUpperCase()}
                </div>
              ))}
              {task.assignees.length > 4 && (
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    text-[9px] font-bold
                    ${
                      isDark
                        ? "bg-slate-700 border-slate-800 text-slate-300"
                        : "bg-slate-200 border-white text-slate-600"
                    }
                  `}
                >
                  +{task.assignees.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleDelete}
          className={`
            p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
            ${
              isDark
                ? "hover:bg-slate-700 text-slate-500 hover:text-rose-400"
                : "hover:bg-slate-100 text-slate-400 hover:text-rose-500"
            }
          `}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
