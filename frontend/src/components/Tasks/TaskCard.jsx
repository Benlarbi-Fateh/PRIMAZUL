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
  Zap,
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
    e.stopPropagation();
    changeTaskStatus(task._id, newStatus);
    setShowMoveMenu(false);
  };

  // Options de déplacement avec couleurs vives
  const statusOptions = [
    {
      id: "todo",
      label: "À Faire",
      lightGradient: "from-blue-500 to-blue-600",
      darkGradient: "from-blue-600 to-blue-700",
      lightBg: "from-blue-50 to-blue-100",
      darkBg: "from-blue-950 to-blue-900",
    },
    {
      id: "inProgress",
      label: "En Cours",
      lightGradient: "from-orange-500 to-amber-600",
      darkGradient: "from-orange-600 to-amber-700",
      lightBg: "from-orange-50 to-amber-100",
      darkBg: "from-blue-950 to-blue-900",
    },
    {
      id: "done",
      label: "Terminé",
      lightGradient: "from-emerald-500 to-teal-600",
      darkGradient: "from-emerald-600 to-teal-700",
      lightBg: "from-emerald-50 to-teal-100",
      darkBg: "from-blue-950 to-blue-900",
    },
  ].filter((s) => s.id !== task.status);

  // Badges de priorité avec couleurs vives
  const priorityBadges = {
    urgent: {
      light: "from-red-500 to-rose-600 text-white ring-2 ring-red-300",
      dark: "from-red-600 to-rose-700 text-white ring-2 ring-red-700/50",
      icon: Zap,
    },
    high: {
      light: "from-orange-500 to-amber-600 text-white ring-2 ring-orange-300",
      dark: "from-orange-600 to-amber-700 text-white ring-2 ring-orange-700/50",
    },
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`
          relative p-4 rounded-2xl cursor-pointer select-none group
          transition-all duration-200
          ${isDragging ? 'overflow-visible' : 'overflow-hidden'}
          ${
            isDragging
              ? isDark
                ? "shadow-2xl ring-4 ring-blue-500/50 !z-[9999] bg-gradient-to-br from-blue-950 to-blue-900 border-2 border-blue-500/50"
                : "shadow-2xl ring-4 ring-blue-400/50 !z-[9999] bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400/50"
              : isMobileView
                ? isDark
                  ? "bg-gradient-to-br from-blue-950/90 to-blue-900/80 border-2 border-blue-800/60 shadow-lg active:scale-[0.97]"
                  : "bg-gradient-to-br from-white to-blue-50/80 border-2 border-blue-200 shadow-lg active:scale-[0.97]"
                : isDark
                  ? "bg-gradient-to-br from-blue-950/90 to-blue-900/80 border-2 border-blue-800/60 shadow-xl hover:shadow-2xl hover:border-blue-700 hover:-translate-y-2 hover:scale-[1.02]"
                  : "bg-gradient-to-br from-white to-blue-50/80 border-2 border-blue-200 shadow-xl hover:shadow-2xl hover:border-blue-400 hover:-translate-y-2 hover:scale-[1.02]"
          }
          ${task.status === "done" ? "opacity-60" : ""}
        `}
        style={isDragging ? { zIndex: 9999 } : {}}
      >
        {/* Effet de brillance au survol - DÉSACTIVÉ pendant le drag */}
        {!isDragging && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        )}

        {/* Header: Priorité + Retard */}
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex gap-2 flex-wrap">
            {task.priority !== "normal" && (
              <span
                className={`
                  text-[10px] font-black px-3 py-1 rounded-full uppercase
                  bg-gradient-to-r flex items-center gap-1
                  backdrop-blur-sm shadow-lg
                  ${
                    isDark
                      ? priorityBadges[task.priority]?.dark || priorityBadges.high.dark
                      : priorityBadges[task.priority]?.light || priorityBadges.high.light
                  }
                `}
              >
                {task.priority === "urgent" && <Zap size={10} className="animate-pulse" />}
                {task.priority}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center gap-1 backdrop-blur-sm shadow-lg animate-pulse ring-2 ring-red-500/30">
                <Clock size={10} /> Retard
              </span>
            )}
          </div>
        </div>

        {/* Titre */}
        <h4
          className={`
            text-sm font-bold leading-snug mb-4 relative z-10
            ${
              task.status === "done"
                ? isDark
                  ? "line-through text-blue-400/40"
                  : "line-through text-slate-400"
                : isDark
                  ? "text-blue-50"
                  : "text-slate-900"
            }
          `}
        >
          {task.title}
        </h4>

        {/* Footer */}
        <div
          className={`
            flex items-center justify-between pt-3 border-t-2 relative z-10
            ${isDark ? "border-blue-800/40" : "border-blue-200/60"}
          `}
        >
          <div
            className={`flex items-center gap-3 ${
              isDark ? "text-blue-400" : "text-blue-600"
            }`}
          >
            {task.dueDate && (
              <div
                className={`
                  flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg
                  backdrop-blur-sm transition-all
                  ${
                    isOverdue
                      ? "bg-red-500/20 text-red-600 ring-1 ring-red-500/30"
                      : isDark
                        ? "bg-blue-900/40 text-blue-300 ring-1 ring-blue-700/30"
                        : "bg-blue-100/80 text-blue-700 ring-1 ring-blue-300/50"
                  }
                `}
              >
                <Clock size={12} strokeWidth={2.5} />
                {new Date(task.dueDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            )}
            {task.comments?.length > 0 && (
              <div
                className={`
                  flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg
                  backdrop-blur-sm transition-all
                  ${
                    isDark
                      ? "bg-blue-900/40 text-blue-300 ring-1 ring-blue-700/30"
                      : "bg-blue-100/80 text-blue-700 ring-1 ring-blue-300/50"
                  }
                `}
              >
                <MessageSquare size={12} strokeWidth={2.5} /> {task.comments.length}
              </div>
            )}
          </div>

          {/* BOUTON DÉPLACER (MOBILE) */}
          {isMobileView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(true);
              }}
              className={`
                px-3 py-2 rounded-xl text-white text-xs font-black flex items-center gap-1.5
                active:scale-95 transition-all shadow-lg backdrop-blur-sm
                bg-gradient-to-r ${
                  isDark
                    ? "from-blue-700 to-blue-800 ring-1 ring-blue-600/50"
                    : "from-blue-500 to-blue-600 ring-1 ring-blue-400/50"
                }
              `}
            >
              <ArrowRightLeft size={12} strokeWidth={2.5} />
              Déplacer
            </button>
          )}

          {/* Avatars (Desktop) */}
          {!isMobileView && task.assignees?.length > 0 && (
            <div className="flex -space-x-2.5">
              {task.assignees.slice(0, 3).map((u, i) => (
                <div
                  key={i}
                  className={`
                    w-7 h-7 rounded-full border-3 bg-gradient-to-br from-blue-400 to-blue-600
                    flex items-center justify-center text-[9px] text-white font-black
                    overflow-hidden transition-transform hover:scale-110 hover:z-10
                    ${isDark ? "border-blue-900" : "border-white"}
                    ring-2 ring-blue-500/20
                  `}
                >
                  {u.profilePicture ? (
                    <img
                      src={u.profilePicture}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    u.name[0]?.toUpperCase()
                  )}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div
                  className={`
                    w-7 h-7 rounded-full border-3 flex items-center justify-center
                    text-[9px] font-black transition-transform hover:scale-110
                    ${
                      isDark
                        ? "bg-blue-800 text-blue-300 border-blue-900"
                        : "bg-blue-200 text-blue-700 border-white"
                    }
                    ring-2 ring-blue-500/20
                  `}
                >
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MENU DE DÉPLACEMENT MOBILE */}
      {showMoveMenu && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(false);
            }}
          />

          <div
            className={`
              relative w-full max-w-sm rounded-3xl shadow-2xl p-2 border-2
              scale-100 animate-in zoom-in-95 duration-300
              ${
                isDark
                  ? "bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800/60"
                  : "bg-gradient-to-br from-white to-blue-50 border-blue-300"
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Popup */}
            <div
              className={`
                flex items-center justify-between px-5 py-4 border-b-2 mb-2
                ${isDark ? "border-blue-800/60" : "border-blue-200"}
              `}
            >
              <h3
                className={`
                  text-base font-black flex items-center gap-2
                  ${isDark ? "text-blue-100" : "text-blue-900"}
                `}
              >
                <ArrowRightLeft size={18} />
                Déplacer vers...
              </h3>
              <button
                onClick={() => setShowMoveMenu(false)}
                className={`
                  p-2 rounded-xl transition-all hover:scale-110 active:scale-95
                  ${
                    isDark
                      ? "bg-blue-900/50 text-blue-300 hover:bg-blue-800"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }
                `}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Liste des options */}
            <div className="p-2 space-y-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={(e) => handleMobileMove(e, opt.id)}
                  className={`
                    w-full flex items-center justify-between px-5 py-4 rounded-2xl
                    transition-all text-left group border-2 overflow-hidden relative
                    hover:scale-[1.02] active:scale-[0.98]
                    ${
                      isDark
                        ? `bg-gradient-to-r ${opt.darkBg} border-blue-800/60 hover:border-blue-700`
                        : `bg-gradient-to-r ${opt.lightBg} border-blue-300 hover:border-blue-400 shadow-md hover:shadow-lg`
                    }
                  `}
                >
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div
                      className={`
                        w-3 h-3 rounded-full shadow-lg
                        bg-gradient-to-br ${isDark ? opt.darkGradient : opt.lightGradient}
                        ring-2 ${isDark ? "ring-blue-900" : "ring-white"}
                      `}
                    />
                    <span
                      className={`
                        text-base font-black
                        ${
                          isDark
                            ? "text-blue-100 group-hover:text-white"
                            : "text-blue-900 group-hover:text-blue-950"
                        }
                      `}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <ChevronRight
                    size={20}
                    strokeWidth={2.5}
                    className={`
                      transition-all relative z-10 group-hover:translate-x-1
                      ${
                        isDark
                          ? "text-blue-400 group-hover:text-blue-300"
                          : "text-blue-500 group-hover:text-blue-700"
                      }
                    `}
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