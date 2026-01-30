"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import {
  Clock,
  MessageSquare,
  ArrowRightLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function TaskCard({ task, onClick, isDragging, isMobileView }) {
  const { isDark } = useTheme();
  const { changeTaskStatus } = useTasks();
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  // Gestion du déplacement mobile
  const handleMobileMove = (e, newStatus) => {
    e.stopPropagation(); // Empêche le clic de traverser
    changeTaskStatus(task._id, newStatus);
    setShowMoveMenu(false);
  };

  // Options de déplacement (exclure le statut actuel)
  const statusOptions = [
    {
      id: "todo",
      label: "À Faire",
      color: "bg-blue-500",
      iconColor: "text-blue-500",
    },
    {
      id: "inProgress",
      label: "En Cours",
      color: "bg-amber-500",
      iconColor: "text-amber-500",
    },
    {
      id: "done",
      label: "Terminé",
      color: "bg-emerald-500",
      iconColor: "text-emerald-500",
    },
  ].filter((s) => s.id !== task.status);

  return (
    <>
      <div
        onClick={onClick}
        className={`
                relative p-4 rounded-xl cursor-pointer select-none group
                transition-all duration-200
                bg-white dark:bg-slate-900
                ${
                  isDragging
                    ? "shadow-2xl ring-2 ring-blue-600 rotate-2 z-50"
                    : isMobileView
                      ? "border border-slate-200 shadow-sm active:scale-[0.98]"
                      : "border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-200 hover:-translate-y-1"
                }
                ${isDark ? "border-slate-800 dark:shadow-none" : ""}
                ${task.status === "done" ? "opacity-70" : ""}
            `}
      >
        {/* Header: Priorité + Retard */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2">
            {task.priority !== "normal" && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  task.priority === "urgent"
                    ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {task.priority}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                <Clock size={10} /> Retard
              </span>
            )}
          </div>
        </div>

        {/* Titre : Noir profond en mode clair */}
        <h4
          className={`text-sm font-bold leading-snug mb-4 ${
            task.status === "done"
              ? "line-through text-slate-400"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {task.title}
        </h4>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${isOverdue ? "text-red-500" : ""}`}
              >
                <Clock size={12} />
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            )}
            {task.comments?.length > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                <MessageSquare size={12} /> {task.comments.length}
              </div>
            )}
          </div>

          {/* --- BOUTON DÉPLACER (MOBILE SEULEMENT) --- */}
          {isMobileView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-300 active:bg-blue-100 transition-colors"
            >
              Déplacer <ArrowRightLeft size={12} />
            </button>
          )}

          {/* Avatars (Desktop) */}
          {!isMobileView && task.assignees?.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 3).map((u, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 flex items-center justify-center text-[8px] overflow-hidden"
                >
                  {u.profilePicture ? (
                    <img
                      src={u.profilePicture}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    u.name[0]
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
            MENU DE DÉPLACEMENT CENTRÉ (MODAL / POPUP)
           ========================================================= */}
      {showMoveMenu && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* 1. Backdrop Flou (Clic pour fermer) */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(false);
            }}
          />

          {/* 2. La Boîte Popup Centrée */}
          <div
            className="relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-2 border border-slate-100 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique DANS la boîte
          >
            {/* Header Popup */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Déplacer vers...
              </h3>
              <button
                onClick={() => setShowMoveMenu(false)}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Liste des options */}
            <div className="p-2 space-y-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={(e) => handleMobileMove(e, opt.id)}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    {/* Indicateur visuel rond */}
                    <div
                      className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900 ${opt.color}`}
                    />
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      {opt.label}
                    </span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-blue-600 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
