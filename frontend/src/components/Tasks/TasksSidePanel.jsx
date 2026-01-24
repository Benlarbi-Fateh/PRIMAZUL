"use client";

import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import {
  X,
  Plus,
  Clock,
  Maximize2,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  ChevronDown,
  Users,
  FolderOpen,
  Search,
} from "lucide-react";

export default function TasksSidePanel({
  isOpen,
  onClose,
  conversationId,
  conversation,
  conversations = [], // Liste de toutes les conversations
  onGoToFullTasks,
  onSelectConversation, // Callback pour changer de conversation
}) {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const dropdownRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // État pour le sélecteur de projets
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProjectSelector(false);
        setProjectSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrer les conversations (seulement les groupes)
  const groupConversations = conversations.filter((c) => c.isGroup);

  const filteredConversations = groupConversations.filter((c) =>
    c.groupName?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Charger les tâches
  const fetchTasks = useCallback(async () => {
    if (!conversationId || !isOpen) return;

    setLoading(true);
    try {
      const res = await api.get(`/conversations/${conversationId}/tasks`);
      setTasks(res.data?.tasks || []);
    } catch (err) {
      console.error("Erreur chargement tâches:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, isOpen]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Statistiques
  const stats = {
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "inProgress").length,
    done: tasks.filter((t) => t.status === "done").length,
    total: tasks.length,
    progress:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === "done").length / tasks.length) *
              100
          )
        : 0,
  };

  // Changer de projet
  const handleSelectProject = (conv) => {
    if (conv._id !== conversationId && onSelectConversation) {
      onSelectConversation(conv);
    }
    setShowProjectSelector(false);
    setProjectSearch("");
  };

  // Actions
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setAddingTask(true);
    try {
      const res = await api.post(`/conversations/${conversationId}/tasks`, {
        title: newTaskTitle.trim(),
        status: "todo",
        priority: "normal",
      });

      if (res.data?.task) {
        setTasks((prev) => [res.data.task, ...prev]);
        setNewTaskTitle("");
        setShowAddTask(false);
      }
    } catch (err) {
      console.error("Erreur ajout tâche:", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleStatus = async (taskId, currentStatus) => {
    const nextStatus = { todo: "inProgress", inProgress: "done", done: "todo" };
    try {
      const res = await api.post(`/tasks/${taskId}/status`, {
        status: nextStatus[currentStatus],
      });
      if (res.data?.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
      }
    } catch (err) {
      console.error("Erreur changement statut:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // Styles
  const panelBg = isDark
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-900 to-indigo-900"
    : "bg-gradient-to-r from-blue-600 to-indigo-600";
  const cardBg = isDark
    ? "bg-slate-800/50 border-slate-700"
    : "bg-white border-slate-200";
  const dropdownBg = isDark ? "bg-slate-800" : "bg-white";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay mobile */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed lg:relative right-0 top-0 h-full w-full max-w-md
          border-l shadow-2xl z-50 flex flex-col
          ${panelBg}
        `}
      >
        {/* Header */}
        <div className={`${headerBg} p-4 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} />
              <div>
                <h2 className="font-bold text-lg">Tâches</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onGoToFullTasks}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Vue complète"
              >
                <Maximize2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sélecteur de projet */}
          <div className="relative mb-4" ref={dropdownRef}>
            <button
              onClick={() => setShowProjectSelector(!showProjectSelector)}
              className={`
                w-full flex items-center justify-between gap-2 px-3 py-2.5
                rounded-xl transition-all
                ${
                  showProjectSelector
                    ? "bg-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }
              `}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  {conversation?.groupPhoto ? (
                    <img
                      src={conversation.groupPhoto}
                      alt=""
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <Users size={16} />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm truncate">
                    {conversation?.groupName || "Sélectionner un projet"}
                  </p>
                  <p className="text-xs text-white/60">
                    {conversation?.members?.length || 0} membres
                  </p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform ${
                  showProjectSelector ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown des projets */}
            {showProjectSelector && (
              <div
                className={`
                  absolute top-full left-0 right-0 mt-2
                  rounded-xl shadow-2xl border overflow-hidden z-50
                  ${dropdownBg}
                  ${isDark ? "border-slate-700" : "border-slate-200"}
                `}
              >
                {/* Recherche */}
                <div className="p-2 border-b border-inherit">
                  <div className="relative">
                    <Search
                      size={16}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Rechercher un projet..."
                      autoFocus
                      className={`
                        w-full pl-9 pr-3 py-2 text-sm rounded-lg
                        outline-none transition-colors
                        ${
                          isDark
                            ? "bg-slate-700 text-white placeholder-slate-400"
                            : "bg-slate-100 text-slate-900 placeholder-slate-500"
                        }
                      `}
                    />
                  </div>
                </div>

                {/* Liste des projets */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div
                      className={`p-4 text-center text-sm ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <FolderOpen size={24} className="mx-auto mb-2 opacity-50" />
                      Aucun projet trouvé
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const isActive = conv._id === conversationId;
                      const taskCount = conv.tasksCount || 0;

                      return (
                        <button
                          key={conv._id}
                          onClick={() => handleSelectProject(conv)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5
                            text-left transition-colors
                            ${
                              isActive
                                ? isDark
                                  ? "bg-blue-600/20 text-blue-400"
                                  : "bg-blue-50 text-blue-600"
                                : isDark
                                ? "hover:bg-slate-700 text-slate-200"
                                : "hover:bg-slate-50 text-slate-700"
                            }
                          `}
                        >
                          <div
                            className={`
                              w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                              ${
                                isActive
                                  ? "bg-blue-500/20"
                                  : isDark
                                  ? "bg-slate-700"
                                  : "bg-slate-100"
                              }
                            `}
                          >
                            {conv.groupPhoto ? (
                              <img
                                src={conv.groupPhoto}
                                alt=""
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              <Users
                                size={16}
                                className={
                                  isActive
                                    ? "text-blue-500"
                                    : isDark
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {conv.groupName}
                            </p>
                            <p
                              className={`text-xs ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {conv.members?.length || 0} membres
                              {taskCount > 0 && ` • ${taskCount} tâches`}
                            </p>
                          </div>

                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer avec compteur */}
                <div
                  className={`
                    px-3 py-2 text-xs border-t
                    ${
                      isDark
                        ? "border-slate-700 text-slate-400 bg-slate-800/50"
                        : "border-slate-200 text-slate-500 bg-slate-50"
                    }
                  `}
                >
                  {groupConversations.length} projet
                  {groupConversations.length > 1 ? "s" : ""} disponible
                  {groupConversations.length > 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Progression</span>
              <span className="font-bold">{stats.progress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            {/* Mini stats */}
            <div className="flex justify-between text-xs text-white/60 pt-1">
              <span>{stats.todo} à faire</span>
              <span>{stats.inProgress} en cours</span>
              <span>{stats.done} terminées</span>
            </div>
          </div>
        </div>

        {/* Liste des tâches */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : tasks.length === 0 ? (
            <div
              className={`text-center py-12 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <CheckCircle2 size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucune tâche</p>
              <p className="text-xs mt-1 opacity-70">
                Créez votre première tâche ci-dessous
              </p>
            </div>
          ) : (
            tasks.slice(0, 10).map((task) => (
              <div
                key={task._id}
                className={`group p-3 rounded-xl border transition-all hover:shadow-md ${cardBg}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(task._id, task.status)}
                    className="mt-0.5 transition-transform hover:scale-110"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : task.status === "inProgress" ? (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    ) : (
                      <Circle
                        size={18}
                        className={isDark ? "text-slate-500" : "text-slate-400"}
                      />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        task.status === "done" ? "line-through opacity-60" : ""
                      } ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      {task.title}
                    </p>

                    {task.dueDate && (
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <Clock size={10} />
                        {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark
                        ? "hover:bg-slate-700 text-slate-500 hover:text-rose-400"
                        : "hover:bg-slate-100 text-slate-400 hover:text-rose-500"
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          {tasks.length > 10 && (
            <button
              onClick={onGoToFullTasks}
              className={`w-full py-2 text-sm font-medium rounded-xl transition-colors ${
                isDark
                  ? "bg-slate-800 text-blue-400 hover:bg-slate-700"
                  : "bg-slate-100 text-blue-600 hover:bg-slate-200"
              }`}
            >
              Voir toutes les tâches ({tasks.length})
            </button>
          )}
        </div>

        {/* Ajouter une tâche */}
        <div
          className={`p-4 border-t ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          {showAddTask ? (
            <div className="space-y-3">
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                  if (e.key === "Escape") setShowAddTask(false);
                }}
                placeholder="Titre de la tâche..."
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                    : "bg-white border-slate-200 text-slate-900 focus:border-blue-500"
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddTask(false)}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                    isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || addingTask}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {addingTask ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Ajouter"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddTask(true)}
              className={`w-full py-3 rounded-xl border-2 border-dashed font-medium flex items-center justify-center gap-2 transition-colors ${
                isDark
                  ? "border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                  : "border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Plus size={18} />
              Ajouter une tâche
            </button>
          )}
        </div>
      </div>
    </>
  );
}