"use client";

import { useState, useContext } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import { AuthContext } from "@/context/AuthProvider";
import {
  X,
  Calendar,
  User,
  AlignLeft,
  Send,
  Trash2,
  Check,
  Layout,
  Tag,
  Zap,
  MessageSquare,
} from "lucide-react";

export default function TaskDetailModal({ task, isNew, projectId, onClose }) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const { participants, createTask, updateTask, deleteTask, addComment } =
    useTasks();

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "normal",
    status: task?.status || "todo",
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
    assignees: task?.assignees?.map((a) => a._id || a) || [],
    projectId: projectId || task?.projectId,
  });

  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        await createTask({
          ...formData,
          assignees: formData.assignees.length ? formData.assignees : [user._id],
        });
      } else {
        await updateTask(task._id, formData);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
      await deleteTask(task._id);
      onClose();
    }
  };

  const inputClass = `
    w-full px-4 py-3.5 rounded-xl outline-none transition-all font-medium
    ${
      isDark
        ? "bg-blue-950/50 border-2 border-blue-800/60 text-white placeholder:text-blue-400/50 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/30"
        : "bg-white border-2 border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-sm"
    }
  `;

  const labelClass = `
    text-xs font-black uppercase tracking-widest mb-2.5 flex items-center gap-2
    ${isDark ? "text-blue-300" : "text-blue-700"}
  `;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
          relative w-full max-w-3xl rounded-t-3xl sm:rounded-3xl
          shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]
          animate-in slide-in-from-bottom-10 sm:zoom-in-95 fade-in duration-300
          ${
            isDark
              ? "bg-gradient-to-br from-blue-950 to-blue-900 ring-2 ring-blue-800/60"
              : "bg-gradient-to-br from-white to-blue-50/50 ring-2 ring-blue-200"
          }
        `}
      >
        {/* Header */}
        <div
          className={`
            flex items-center justify-between p-5 sm:p-6 border-b-2 shrink-0
            ${isDark ? "border-blue-800/60" : "border-blue-200"}
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                p-2.5 rounded-xl ring-2
                ${
                  isNew
                    ? isDark
                      ? "bg-blue-900/60 text-blue-300 ring-blue-700/50"
                      : "bg-blue-100 text-blue-600 ring-blue-300"
                    : isDark
                      ? "bg-blue-900/60 text-blue-300 ring-blue-700/50"
                      : "bg-slate-100 text-slate-600 ring-slate-300"
                }
              `}
            >
              <Layout size={22} strokeWidth={2} />
            </div>
            <h2
              className={`
                text-xl sm:text-2xl font-black
                ${isDark ? "text-blue-100" : "text-slate-900"}
              `}
            >
              {isNew ? "Nouvelle tâche" : "Modifier la tâche"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Supprimer Mobile */}
            {!isNew && (
              <button
                onClick={handleDelete}
                className={`
                  sm:hidden p-2.5 rounded-xl transition-all active:scale-95
                  ${
                    isDark
                      ? "text-rose-400 bg-rose-900/30 hover:bg-rose-900/50 ring-1 ring-rose-700/50"
                      : "text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-300"
                  }
                `}
              >
                <Trash2 size={20} strokeWidth={2} />
              </button>
            )}

            <button
              onClick={onClose}
              className={`
                p-2.5 rounded-xl transition-all active:scale-95
                ${
                  isDark
                    ? "text-blue-400 hover:bg-blue-900/50 hover:text-blue-300"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                }
              `}
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 sm:space-y-8">
          {/* Titre */}
          <div>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de la tâche..."
              className={`
                w-full text-2xl sm:text-3xl font-black bg-transparent
                border-none outline-none
                ${
                  isDark
                    ? "placeholder:text-blue-400/30 text-blue-50"
                    : "placeholder:text-slate-300 text-slate-900"
                }
              `}
            />
          </div>

          {/* Grid Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Priorité */}
            <div>
              <label className={labelClass}>
                <Tag size={14} strokeWidth={2.5} /> Priorité
              </label>
              <div
                className={`
                  flex p-1.5 rounded-xl backdrop-blur-sm
                  ${
                    isDark
                      ? "bg-blue-950/60 ring-1 ring-blue-800/50"
                      : "bg-slate-100 ring-1 ring-slate-200"
                  }
                `}
              >
                {[
                  { value: "low", label: "Basse", icon: null },
                  { value: "normal", label: "Normale", icon: null },
                  { value: "urgent", label: "Urgente", icon: Zap },
                ].map((p) => {
                  const PriorityIcon = p.icon;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      className={`
                        flex-1 py-2.5 text-xs font-black uppercase rounded-lg
                        transition-all flex items-center justify-center gap-1.5
                        ${
                          formData.priority === p.value
                            ? isDark
                              ? "bg-blue-900/80 shadow-lg text-blue-100 ring-1 ring-blue-700"
                              : "bg-white shadow-md text-blue-700 ring-1 ring-blue-300"
                            : isDark
                              ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/40"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >
                      {PriorityIcon && <PriorityIcon size={12} strokeWidth={2.5} />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Échéance */}
            <div>
              <label className={labelClass}>
                <Calendar size={14} strokeWidth={2.5} /> Échéance
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Assignés */}
          <div>
            <label className={labelClass}>
              <User size={14} strokeWidth={2.5} /> Assigné à
            </label>
            <div className="flex flex-wrap gap-2.5">
              {participants.map((p) => {
                const isSelected = formData.assignees.includes(p._id);
                return (
                  <button
                    key={p._id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        assignees: isSelected
                          ? prev.assignees.filter((id) => id !== p._id)
                          : [...prev.assignees, p._id],
                      }))
                    }
                    className={`
                      flex items-center gap-2 px-3.5 py-2 rounded-xl
                      border-2 transition-all text-xs font-bold
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white shadow-lg ring-2 ring-blue-500/30"
                          : isDark
                            ? "bg-blue-950/40 border-blue-800/60 hover:border-blue-700 text-blue-200"
                            : "bg-white border-slate-200 hover:border-blue-400 text-slate-600"
                      }
                    `}
                  >
                    <img
                      src={p.profilePicture || "/default-avatar.png"}
                      alt={p.name}
                      className="w-5 h-5 rounded-full ring-1 ring-white/50"
                    />
                    {p.name}
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              <AlignLeft size={14} strokeWidth={2.5} /> Description
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ajouter des détails..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Commentaires */}
          {!isNew && (
            <div
              className={`
                rounded-2xl p-5 border-2
                ${
                  isDark
                    ? "bg-blue-950/30 border-blue-800/60"
                    : "bg-blue-50/50 border-blue-200"
                }
              `}
            >
              <h3
                className={`
                  font-black text-sm mb-4 flex items-center gap-2
                  ${isDark ? "text-blue-300" : "text-blue-700"}
                `}
              >
                <MessageSquare size={16} strokeWidth={2.5} />
                Commentaires ({task.comments?.length || 0})
              </h3>
              <div className="space-y-4 mb-4 max-h-56 overflow-y-auto">
                {task.comments?.length === 0 && (
                  <p
                    className={`
                      text-xs text-center py-6
                      ${isDark ? "text-blue-400/50" : "text-slate-400"}
                    `}
                  >
                    Aucun commentaire pour le moment
                  </p>
                )}
                {task.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-black text-xs text-white shrink-0 ring-2 ring-white/30">
                      {(c.author?.name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`
                          p-3.5 rounded-2xl rounded-tl-none
                          ${
                            isDark
                              ? "bg-blue-900/40 border border-blue-800/40"
                              : "bg-white border border-blue-200 shadow-sm"
                          }
                        `}
                      >
                        <p
                          className={`
                            font-bold text-xs mb-1
                            ${isDark ? "text-blue-300" : "text-blue-700"}
                          `}
                        >
                          {c.author?.name}
                        </p>
                        <p className={isDark ? "text-blue-100" : "text-slate-700"}>
                          {c.text}
                        </p>
                      </div>
                      <p
                        className={`
                          text-[10px] mt-1.5 ml-3
                          ${isDark ? "text-blue-400/50" : "text-slate-400"}
                        `}
                      >
                        {new Date(c.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentText.trim()) {
                      addComment(task._id, commentText);
                      setCommentText("");
                    }
                  }}
                  placeholder="Écrire un commentaire..."
                  className={`${inputClass} pr-12`}
                />
                <button
                  onClick={() => {
                    if (commentText.trim()) {
                      addComment(task._id, commentText);
                      setCommentText("");
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 shadow-lg"
                >
                  <Send size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`
            p-4 sm:p-5 border-t-2 flex justify-between items-center
            rounded-b-3xl shrink-0
            ${
              isDark
                ? "border-blue-800/60 bg-blue-950/50"
                : "border-blue-200 bg-slate-50"
            }
          `}
        >
          {!isNew && (
            <button
              onClick={handleDelete}
              className={`
                hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl
                transition-all font-bold text-sm active:scale-95
                ${
                  isDark
                    ? "text-rose-400 hover:bg-rose-900/30 ring-1 ring-rose-700/30"
                    : "text-rose-600 hover:bg-rose-50 ring-1 ring-rose-300"
                }
              `}
            >
              <Trash2 size={18} strokeWidth={2} />
              <span className="hidden lg:inline">Supprimer</span>
            </button>
          )}

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`
                flex-1 sm:flex-none px-6 py-3 rounded-xl font-black
                transition-all active:scale-95
                ${
                  isDark
                    ? "text-blue-300 hover:bg-blue-900/40"
                    : "text-slate-500 hover:bg-slate-100"
                }
              `}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-black bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}