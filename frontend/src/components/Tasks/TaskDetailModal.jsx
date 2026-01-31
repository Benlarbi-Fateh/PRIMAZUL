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
  const [comments, setComments] = useState(task?.comments || []);

  // Ajoute cet état juste au dessus des autres useEffect
  const [refreshKey, setRefreshKey] = useState(0);

  // Ce timer va "nettoyer" le statut récent automatiquement
  useEffect(() => {
    if (comments.length > 0) {
      const timer = setTimeout(() => {
        setRefreshKey((prev) => prev + 1); // Force le recalcul de l'affichage
      }, 10500); // Un tout petit peu plus que 10s

      return () => clearTimeout(timer);
    }
  }, [comments]);

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

  useEffect(() => {
    if (task?.comments) {
      setComments(task.comments);
    }
  }, [task]);

  // Force le rafraîchissement pour effacer l'état "Nouveau" après 10s
  useEffect(() => {
    if (comments.length > 0) {
      const timer = setTimeout(() => {
        // On déclenche un re-render vide pour recalculer "isJustAdded"
        setHasChanges((prev) => prev);
      }, 10100); // 10.1s pour être sûr de dépasser le seuil
      return () => clearTimeout(timer);
    }
  }, [comments]);

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

    const newComment = {
      _id: Date.now(), // id temporaire
      text: commentText.trim(),
      author: {
        _id: user._id,
        name: user.name,
      },
      createdAt: new Date().toISOString(),
    };

    // 🔥 affichage immédiat
    setComments((prev) => [...prev, newComment]);
    setCommentText("");

    // sync backend
    await addComment(task._id, newComment.text);
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
              <Type size={12} /> Titre de la mission
            </label>
            <input
              autoFocus
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Nommer la tâche..."
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all font-semibold ${inputBg}`}
            />
          </div>

          {/* Ligne : Priorité & Échéance */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priorité - Style compact avec couleurs dynamiques */}
            <div className="space-y-2">
              <label className={labelStyle}>
                <AlertCircle size={12} /> Priorité
              </label>
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {priorityOptions.map((opt) => {
                  const isActive = formData.priority === opt.value;

                  // Définition des couleurs dynamiques
                  const activeColors = {
                    low: "text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-700 shadow-sm",
                    normal:
                      "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-sm",
                    urgent:
                      "text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-700 shadow-sm",
                  };

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, priority: opt.value }))
                      }
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-200 ${
                        isActive
                          ? activeColors[opt.value]
                          : "text-slate-400 hover:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2">
              <label className={labelStyle}>
                <Calendar size={12} /> Échéance
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dueDate: e.target.value }))
                }
                className={`w-full px-4 py-2 rounded-xl border outline-none transition-all cursor-pointer text-sm font-medium ${inputBg}`}
              />
            </div>
          </div>

          {/* Collaborateurs */}
          <div>
            <label className={labelStyle}>
              <Users size={12} /> Collaborateurs
            </label>
            <div
              className={`flex flex-wrap gap-1.5 p-3 rounded-xl border ${
                isDark
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              {participants.map((p) => {
                const isSelected = formData.assignees.includes(p._id);
                return (
                  <button
                    key={p._id}
                    onClick={() => toggleAssignee(p._id)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-bold ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                        : isDark
                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                        isSelected ? "bg-white/20" : "bg-slate-400 text-white"
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
              placeholder="Détails de la tâche..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none text-sm ${inputBg}`}
            />
          </div>

          {/* Commentaires (uniquement en mode édition) */}
          {!isNew && task && (
            <div
              className={`pt-4 border-t ${
                isDark ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <label className={labelStyle}>
                <MessageSquare size={12} /> Discussion
              </label>

              {/* Liste des commentaires */}
              <div className="space-y-4 max-h-52 overflow-y-auto mb-4 pr-1 scrollbar-thin scroll-smooth">
                {comments.map((comment) => {
                  const isJustAdded =
                    new Date() - new Date(comment.createdAt) < 10000;

                  return (
                    <div
                      key={`${comment._id}-${refreshKey}`}
                      className={`flex gap-3 ${
                        isJustAdded
                          ? "animate-in fade-in slide-in-from-bottom-3 duration-500"
                          : ""
                      }`}
                    >
                      {/* Avatar - Cercle bleu supprimé */}
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all duration-700 ${
                          isDark
                            ? "bg-slate-800 text-slate-400"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {(comment.author?.name || "?")[0].toUpperCase()}
                      </div>

                      {/* Bulle - Maintenant en flex-1 pour prendre toute la largeur disponible */}
                      <div
                        className={`flex-1 p-3 rounded-2xl border transition-all duration-1000 ${
                          isJustAdded
                            ? "bg-blue-500/10 border-blue-500/50 shadow-sm"
                            : isDark
                              ? "bg-slate-800/50 border-slate-700"
                              : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p
                            className={`text-[11px] font-extrabold tracking-tight ${
                              isJustAdded ? "text-blue-500" : textMuted
                            }`}
                          >
                            {comment.author?.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {isJustAdded && (
                              <span className="text-[8px] font-black text-blue-500 animate-pulse tracking-tighter">
                                RÉCENT
                              </span>
                            )}
                            <span
                              className={`text-[9px] opacity-40 font-medium ${textMuted}`}
                            >
                              {new Date(comment.createdAt).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </div>

                        <p className={`text-sm leading-relaxed ${textPrimary}`}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
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

        {/* Footer - Responsive corrigé */}
        <div
          className={`p-4 sm:p-6 border-t flex flex-col sm:flex-row justify-between gap-3 ${
            isDark
              ? "border-slate-800 bg-slate-900/50"
              : "border-slate-100 bg-slate-50/50"
          }`}
        >
          {!isNew && (
            <button
              onClick={handleDelete}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? "text-rose-400 hover:bg-rose-500/20"
                  : "text-rose-500 hover:bg-rose-50"
              }`}
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}

          <div
            className={`flex gap-2 sm:gap-3 ${isNew ? "ml-auto w-full sm:w-auto" : "w-full sm:w-auto"}`}
          >
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all ${
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
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
            >
              {saving ? "..." : isNew ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
