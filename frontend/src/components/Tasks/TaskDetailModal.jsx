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
          assignees: formData.assignees.length
            ? formData.assignees
            : [user._id],
        });
      } else {
        await updateTask(task._id, formData);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // ✅ Fonction centralisée pour supprimer
  const handleDelete = async () => {
    if (confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
      await deleteTask(task._id);
      onClose();
    }
  };

  // Styles Inputs
  const inputClass = `w-full px-4 py-3 rounded-xl outline-none transition-all ${
    isDark
      ? "bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
      : "bg-white text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/5 placeholder:text-slate-400"
  }`;

  const labelClass =
    "text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
        relative w-full max-w-2xl bg-white dark:bg-slate-900 
        rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col 
        max-h-[95vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-10 fade-in
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isNew
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800"
              }`}
            >
              <Layout size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isNew ? "Nouvelle tâche" : "Détails"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ AJOUT ICI : Bouton Supprimer pour MOBILE (Visible uniquement sur sm et moins) */}
            {!isNew && (
              <button
                onClick={handleDelete}
                className="sm:hidden p-2 rounded-full text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 transition-colors"
                title="Supprimer la tâche"
              >
                <Trash2 size={20} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Titre */}
          <div>
            <input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Titre de la tâche..."
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-slate-300 text-slate-900 dark:text-white"
            />
          </div>

          {/* Grid options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                <Tag size={14} /> Priorité
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {["low", "normal", "urgent"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                      formData.priority === p
                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-white"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <Calendar size={14} /> Échéance
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Assignés */}
          <div>
            <label className={labelClass}>
              <User size={14} /> Assigné à
            </label>
            <div className="flex flex-wrap gap-2">
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <img
                      src={p.profilePicture || "/default-avatar.png"}
                      className="w-5 h-5 rounded-full bg-slate-200"
                    />
                    {p.name}
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              <AlignLeft size={14} /> Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ajouter des détails..."
              className={inputClass}
            />
          </div>

          {/* Chat Section */}
          {!isNew && (
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm mb-4 text-slate-500">
                Commentaires
              </h3>
              <div className="space-y-4 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                {task.comments?.length === 0 && (
                  <p className="text-xs text-slate-400 text-center">
                    Aucun commentaire
                  </p>
                )}
                {task.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {(c.author?.name || "?")[0]}
                    </div>
                    <div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm ring-1 ring-slate-100 dark:ring-0">
                        <p className="font-bold text-xs opacity-70 mb-1">
                          {c.author?.name}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                          {c.text}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 ml-2">
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && addComment(task._id, commentText)
                  }
                  placeholder="Écrire un message..."
                  className={`${inputClass} pr-12`}
                />
                <button
                  onClick={() => addComment(task._id, commentText)}
                  className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center rounded-b-3xl shrink-0">
          {!isNew && (
            // ✅ CORRECTION : Visible uniquement sur Desktop (hidden sm:block) pour éviter les doublons avec le header
            <button
              onClick={handleDelete}
              className="hidden sm:flex items-center gap-2 text-rose-500 px-3 py-2 hover:bg-rose-50 rounded-xl transition-colors font-medium text-sm"
            >
              <Trash2 size={18} />
              <span className="hidden lg:inline">Supprimer</span>
            </button>
          )}

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
