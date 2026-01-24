"use client";

import { useState, useEffect, useContext } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import { AuthContext } from "@/context/AuthProvider";
import {
  X,
  Calendar,
  User,
  Users,
  AlertCircle,
  AlignLeft,
  MessageSquare,
  Send,
  Trash2,
  CheckCircle2,
  Plus,
  Type,
} from "lucide-react";

export default function TaskDetailModal({ task, isNew, projectId, onClose }) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const {
    participants,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    currentProjectId,
  } = useTasks();

  // État local du formulaire
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "normal",
    status: task?.status || "todo",
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
    assignees: task?.assignees?.map((a) => a._id || a) || [],
    projectId: projectId || task?.projectId?._id || task?.projectId || null,
  });

  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Détecter les changements
  useEffect(() => {
    if (!isNew && task) {
      const original = {
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        assignees: task.assignees?.map((a) => a._id || a) || [],
      };
      setHasChanges(
        JSON.stringify(formData) !==
          JSON.stringify({ ...formData, ...original }),
      );
    }
  }, [formData, task, isNew]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Le titre est requis");
      return;
    }

    setSaving(true);

    try {
      if (isNew) {
        const result = await createTask({
          ...formData,
          assignees:
            formData.assignees.length > 0 ? formData.assignees : [user._id],
        });
        if (result.success) {
          onClose();
        } else {
          alert(result.error);
        }
      } else {
        const result = await updateTask(task._id, formData);
        if (result.success) {
          onClose();
        } else {
          alert(result.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette tâche ?")) return;
    await deleteTask(task._id);
    onClose();
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(task._id, commentText.trim());
    setCommentText("");
  };

  const toggleAssignee = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId],
    }));
  };

  // Styles
  const overlayBg = "bg-black/60 backdrop-blur-sm";
  const modalBg = isDark
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  const headerBg = isDark ? "border-slate-800" : "border-slate-100";
  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const labelStyle = `text-[10px] font-bold uppercase tracking-widest ${textMuted} mb-2 flex items-center gap-2`;

  const priorityOptions = [
    { value: "low", label: "Faible", emoji: "🟢" },
    { value: "normal", label: "Normal", emoji: "🔵" },
    { value: "urgent", label: "Urgent", emoji: "🔴" },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBg}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${headerBg}`}
        >
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>
              {isNew ? "✨ Nouvelle tâche" : "📝 Modifier la tâche"}
            </h2>
            {!isNew && (
              <p className={`text-xs mt-1 ${textMuted}`}>
                Créée le {new Date(task.createdAt).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              isDark
                ? "hover:bg-slate-800 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className={labelStyle}>
              <Type size={12} /> Titre
            </label>
            <input
              autoFocus
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Titre de la tâche..."
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${inputBg}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priorité */}
            <div>
              <label className={labelStyle}>
                <AlertCircle size={12} /> Priorité
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setFormData((p) => ({ ...p, priority: opt.value }))
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
                      formData.priority === opt.value
                        ? "border-blue-500 bg-blue-500/10"
                        : isDark
                          ? "border-slate-700 hover:border-slate-600"
                          : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span className={`text-sm font-medium ${textPrimary}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date d'échéance */}
            <div>
              <label className={labelStyle}>
                <Calendar size={12} /> Échéance
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dueDate: e.target.value }))
                }
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all cursor-pointer ${inputBg}`}
              />
            </div>
          </div>

          {/* Assignés */}
          <div>
            <label className={labelStyle}>
              <Users size={12} /> Collaborateurs
            </label>
            <div
              className={`flex flex-wrap gap-2 p-4 rounded-2xl ${
                isDark ? "bg-slate-800/50" : "bg-slate-50"
              }`}
            >
              {participants.map((p) => {
                const isSelected = formData.assignees.includes(p._id);
                return (
                  <button
                    key={p._id}
                    onClick={() => toggleAssignee(p._id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all text-xs font-bold ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500 text-blue-600"
                        : isDark
                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                        isSelected ? "bg-blue-600" : "bg-slate-400"
                      }`}
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle}>
              <AlignLeft size={12} /> Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Ajouter des détails..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none ${inputBg}`}
            />
          </div>

          {/* Commentaires (uniquement en mode édition) */}
          {!isNew && task && (
            <div
              className={`pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}
            >
              <label className={labelStyle}>
                <MessageSquare size={12} /> Discussion
              </label>

              {/* Liste des commentaires */}
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {(task.comments || []).map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        isDark
                          ? "bg-blue-900/50 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {(comment.author?.name || "?")[0].toUpperCase()}
                    </div>
                    <div
                      className={`flex-1 p-3 rounded-xl ${
                        isDark ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p className={`text-xs font-bold ${textMuted}`}>
                        {comment.author?.name}
                      </p>
                      <p className={`text-sm mt-1 ${textPrimary}`}>
                        {comment.text}
                      </p>
                      <p className={`text-[10px] mt-2 ${textMuted}`}>
                        {new Date(comment.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ajouter un commentaire */}
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Écrire un message..."
                  className={`flex-1 px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t flex justify-between ${
            isDark
              ? "border-slate-800 bg-slate-900/50"
              : "border-slate-100 bg-slate-50/50"
          }`}
        >
          {!isNew && (
            <button
              onClick={handleDelete}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? "text-rose-400 hover:bg-rose-500/20"
                  : "text-rose-500 hover:bg-rose-50"
              }`}
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}

          <div className={`flex gap-3 ${isNew ? "ml-auto" : ""}`}>
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
            >
              {saving ? "..." : isNew ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
