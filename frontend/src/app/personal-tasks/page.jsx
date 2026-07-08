"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Trash2,
  X,
  Flag,
  AlignLeft,
  ChevronDown,
  Sparkles,
  ListTodo,
  CalendarDays,
  Timer,
  Sun,
  Moon,
  MoreHorizontal,
  Edit3,
  Copy,
  Archive,
  Bell,
  Tag,
  Inbox,
  FolderOpen,
  TrendingUp,
  Zap,
  Target,
  Coffee,
  Briefcase,
  Home,
  Heart,
  BookOpen,
  ShoppingCart,
  Plane,
  Music,
  Gamepad2,
  Dumbbell,
  Menu,
} from "lucide-react";

// ✅ Import du hook useTheme global
import { useTheme } from "@/hooks/useTheme";

// =================== CONSTANTES ===================
const PRIORITIES = [
  { value: "low", label: "Basse", icon: "🌱", color: "emerald" },
  { value: "normal", label: "Normale", icon: "🔵", color: "blue" },
  { value: "high", label: "Haute", icon: "🔥", color: "orange" },
  { value: "urgent", label: "Urgente", icon: "⚡", color: "red" },
];

const QUICK_DATES = [
  { label: "Aujourd'hui", icon: "☀️", getValue: () => new Date() },
  {
    label: "Demain",
    icon: "🌅",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: "Cette semaine",
    icon: "📅",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    },
  },
  {
    label: "Ce mois",
    icon: "🗓️",
    getValue: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    },
  },
];

const LIST_ICONS = [
  { icon: "📋", label: "Liste" },
  { icon: "🏠", label: "Maison" },
  { icon: "💼", label: "Travail" },
  { icon: "🎯", label: "Objectifs" },
  { icon: "💡", label: "Idées" },
  { icon: "🛒", label: "Courses" },
  { icon: "✈️", label: "Voyage" },
  { icon: "📚", label: "Études" },
  { icon: "💪", label: "Sport" },
  { icon: "🎮", label: "Loisirs" },
  { icon: "❤️", label: "Personnel" },
  { icon: "🎵", label: "Musique" },
];

// =================== MAIN PAGE ===================
export default function PersonalTasksPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // États
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]); // ✅ État pour les tâches terminées
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [activeView, setActiveView] = useState("all");
  const [selectedListId, setSelectedListId] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false); // ✅ État pour le modal tâches terminées

  // Mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =================== FETCH DATA ===================
  const fetchLists = useCallback(async () => {
    try {
      const res = await api.get("/personal-tasks/lists");
      setLists(res.data.lists || []);
    } catch (err) {
      console.error("Erreur fetch listes:", err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      let endpoint = "/personal-tasks";
      const params = { completed: false }; // ✅ On récupère par défaut les tâches NON terminées

      switch (activeView) {
        case "today":
          endpoint = "/personal-tasks/today";
          break;
        case "upcoming":
          endpoint = "/personal-tasks/upcoming";
          break;
        case "starred":
          endpoint = "/personal-tasks/starred";
          break;
        case "overdue":
          endpoint = "/personal-tasks/overdue";
          break;
        default:
          if (selectedListId) params.listId = selectedListId;
      }

      const res = await api.get(endpoint, { params });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Erreur fetch tâches:", err);
    }
  }, [activeView, selectedListId]);

  // ✅ Fonction dédiée pour récupérer les tâches terminées
  const fetchCompletedTasks = useCallback(async () => {
    try {
      const res = await api.get("/personal-tasks", {
        params: {
          completed: true,
          listId: selectedListId || undefined, // Filtre optionnel par liste
        },
      });
      setCompletedTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Erreur fetch tâches terminées:", err);
    }
  }, [selectedListId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/personal-tasks/stats");
      setStats(res.data.stats || null);
    } catch (err) {
      console.error("Erreur fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLists(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchLists, fetchStats]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchTasks();
    });
  }, [fetchTasks]);

  // ✅ Charger les tâches terminées quand on ouvre le modal
  useEffect(() => {
    if (showCompletedModal) {
      queueMicrotask(() => {
        fetchCompletedTasks();
      });
    }
  }, [showCompletedModal, fetchCompletedTasks]);

  // =================== ACTIONS ===================
  const handleCreateList = async (data) => {
    try {
      const res = await api.post("/personal-tasks/lists", data);
      if (res.data.list) {
        setLists((prev) => [...prev, res.data.list]);
        setShowNewListModal(false);
      }
    } catch (err) {
      console.error("Erreur création liste:", err);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm("Supprimer cette liste et toutes ses tâches ?")) return;
    try {
      await api.delete(`/personal-tasks/lists/${listId}`);
      setLists((prev) => prev.filter((l) => l._id !== listId));
      if (selectedListId === listId) {
        setSelectedListId(null);
        setActiveView("all");
      }
      fetchStats();
    } catch (err) {
      console.error("Erreur suppression liste:", err);
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const res = await api.post("/personal-tasks", {
        ...taskData,
        listId: taskData.listId || selectedListId,
      });
      if (res.data.task) {
        setTasks((prev) => [res.data.task, ...prev]);
        fetchStats();
        fetchLists();
        setShowNewTaskModal(false);
      }
    } catch (err) {
      console.error("Erreur création tâche:", err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await api.patch(`/personal-tasks/${taskId}`, updates);
      if (res.data.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t)),
        );
        if (selectedTask?._id === taskId) setSelectedTask(res.data.task);
        fetchStats();
      }
    } catch (err) {
      console.error("Erreur mise à jour tâche:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/personal-tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setCompletedTasks((prev) => prev.filter((t) => t._id !== taskId)); // ✅ Mise à jour aussi pour les tâches terminées
      if (selectedTask?._id === taskId) setSelectedTask(null);
      fetchStats();
      fetchLists();
    } catch (err) {
      console.error("Erreur suppression tâche:", err);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await api.post(`/personal-tasks/${taskId}/complete`);
      if (res.data.task) {
        // ✅ On retire de la liste principale
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        // ✅ On ajoute potentiellement à la liste terminée si modal ouvert
        if (showCompletedModal) {
          setCompletedTasks((prev) => [res.data.task, ...prev]);
        }
        fetchStats();
        fetchLists();
      }
    } catch (err) {
      console.error("Erreur completion tâche:", err);
    }
  };

  const handleReopenTask = async (taskId) => {
    try {
      const res = await api.post(`/personal-tasks/${taskId}/reopen`);
      if (res.data.task) {
        // ✅ On ajoute à la liste principale
        setTasks((prev) => [res.data.task, ...prev]);
        // ✅ On retire de la liste terminée
        setCompletedTasks((prev) => prev.filter((t) => t._id !== taskId));

        fetchStats();
        fetchLists();
      }
    } catch (err) {
      console.error("Erreur réouverture tâche:", err);
    }
  };

  const handleToggleStar = async (taskId, isStarred) => {
    await handleUpdateTask(taskId, { isStarred: !isStarred });
  };

  const handleAddSubtask = async (taskId, text) => {
    try {
      const res = await api.post(`/personal-tasks/${taskId}/subtasks`, {
        text,
      });
      if (res.data.subtask && selectedTask?._id === taskId) {
        setSelectedTask((prev) => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), res.data.subtask],
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId, completed) => {
    try {
      await api.patch(`/personal-tasks/${taskId}/subtasks/${subtaskId}`, {
        completed,
      });
      if (selectedTask?._id === taskId) {
        setSelectedTask((prev) => ({
          ...prev,
          subtasks: prev.subtasks.map((st) =>
            st._id === subtaskId ? { ...st, completed } : st,
          ),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      await api.delete(`/personal-tasks/${taskId}/subtasks/${subtaskId}`);
      if (selectedTask?._id === taskId) {
        setSelectedTask((prev) => ({
          ...prev,
          subtasks: prev.subtasks.filter((st) => st._id !== subtaskId),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    return task.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getViewTitle = () => {
    switch (activeView) {
      case "today":
        return { icon: "☀️", title: "Aujourd'hui" };
      case "upcoming":
        return { icon: "📆", title: "À venir" };
      case "starred":
        return { icon: "⭐", title: "Favoris" };
      case "overdue":
        return { icon: "⚠️", title: "En retard" };
      default:
        if (selectedListId) {
          const list = lists.find((l) => l._id === selectedListId);
          return { icon: list?.icon || "📋", title: list?.title || "Liste" };
        }
        return { icon: "📥", title: "Toutes les tâches" };
    }
  };

  const styles = {
    page: isDark
      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      : "bg-gradient-to-br from-slate-50 via-white to-blue-50",
    sidebar: isDark
      ? "bg-slate-900/95 border-slate-800"
      : "bg-white/95 border-slate-200",
    card: isDark
      ? "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    cardActive: isDark
      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
      : "bg-blue-50 border-blue-200 text-blue-600",
    text: isDark ? "text-slate-100" : "text-slate-900",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    textSubtle: isDark ? "text-slate-500" : "text-slate-400",
    input: isDark
      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500",
    modal: isDark
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200",
    button: isDark
      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200",
    buttonPrimary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25",
    header: isDark
      ? "bg-slate-900/80 border-slate-800"
      : "bg-white/80 border-slate-200",
    statsCard: isDark
      ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20"
      : "bg-gradient-to-br from-blue-500 to-indigo-600",
    statsText: isDark ? "text-blue-300" : "text-white/80",
    statsProgress: isDark ? "bg-slate-700" : "bg-white/30",
    statsProgressBar: isDark ? "bg-blue-500" : "bg-white",
    iconContainer: isDark
      ? "bg-gradient-to-br from-blue-600 to-indigo-700"
      : "bg-gradient-to-br from-blue-500 to-indigo-600",
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${styles.page} flex`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full" />
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
            </div>
            <p className={styles.textMuted}>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  const viewInfo = getViewTitle();

  return (
    <div className={`min-h-screen ${styles.page} flex`}>
      <div className="flex-1 flex min-h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 ${styles.sidebar} border-r flex flex-col backdrop-blur-xl transform transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          {/* Header */}
          <div
            className={`p-5 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className={`flex items-center gap-2 ${styles.textMuted} hover:${styles.text} transition-colors`}
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Retour</span>
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-all ${styles.button}`}
                title={isDark ? "Mode clair" : "Mode sombre"}
              >
                {isDark ? (
                  <Sun size={18} className="text-yellow-400" />
                ) : (
                  <Moon size={18} className="text-slate-600" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <div
                className={`w-12 h-12 rounded-2xl ${styles.iconContainer} flex items-center justify-center shadow-lg shadow-blue-500/30`}
              >
                <ListTodo className="text-white" size={24} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${styles.text}`}>
                  Mes Tâches
                </h1>
                <p className={`text-xs ${styles.textMuted}`}>Restez organisé</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="p-4">
              <div className={`p-4 rounded-2xl ${styles.statsCard}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={16}
                      className={isDark ? "text-blue-400" : "text-white/80"}
                    />
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${styles.statsText}`}
                    >
                      Progression
                    </span>
                  </div>
                  <span className={`text-2xl font-black text-white`}>
                    {stats.completionRate}%
                  </span>
                </div>
                <div
                  className={`h-2 ${styles.statsProgress} rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full ${styles.statsProgressBar} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
                <div
                  className={`flex justify-between mt-3 text-xs ${isDark ? "text-slate-400" : "text-white/70"}`}
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {stats.completed} terminées
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {stats.pending} en cours
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Vues rapides */}
          <nav className="px-3">
            <p
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${styles.textSubtle}`}
            >
              Vues
            </p>
            {[
              {
                id: "all",
                icon: Inbox,
                label: "Inbox",
                gradient: "from-slate-500 to-slate-600",
              },
              {
                id: "today",
                icon: Sun,
                label: "Aujourd'hui",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                id: "upcoming",
                icon: CalendarDays,
                label: "À venir",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                id: "starred",
                icon: Star,
                label: "Favoris",
                gradient: "from-yellow-500 to-amber-500",
              },
              {
                id: "overdue",
                icon: AlertTriangle,
                label: "En retard",
                gradient: "from-red-500 to-rose-500",
                count: stats?.overdue,
              },
            ].map(({ id, icon: Icon, label, gradient, count }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveView(id);
                  setSelectedListId(null);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all mb-1 group ${activeView === id && !selectedListId ? styles.cardActive : `${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"} ${styles.textMuted}`}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                {count > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Listes */}
          <div className="flex-1 overflow-y-auto px-3 mt-4">
            <div className="flex items-center justify-between px-3 py-2">
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${styles.textSubtle}`}
              >
                Mes Listes
              </p>
              <button
                onClick={() => setShowNewListModal(true)}
                className={`p-1.5 rounded-lg ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-blue-400" : "hover:bg-blue-50 text-slate-400 hover:text-blue-500"} transition-all`}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {lists.length === 0 ? (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune liste</p>
                </div>
              ) : (
                lists.map((list) => (
                  <div
                    key={list._id}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${selectedListId === list._id ? styles.cardActive : `${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"} ${styles.textMuted}`}`}
                    onClick={() => {
                      setActiveView("list");
                      setSelectedListId(list._id);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{list.icon}</span>
                      <span className="font-medium text-sm truncate">
                        {list.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"}`}
                      >
                        {list.taskCount || 0}
                      </span>
                      {!list.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list._id);
                          }}
                          className={`p-1 opacity-0 group-hover:opacity-100 ${isDark ? "hover:bg-red-500/20 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"} rounded-lg transition-all`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`p-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
          >
            <button
              onClick={() => setShowNewTaskModal(true)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 ${styles.buttonPrimary} rounded-xl font-semibold transition-all active:scale-[0.98]`}
            >
              <Plus size={20} /> Nouvelle Tâche
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header
            className={`${styles.header} border-b backdrop-blur-xl sticky top-0 z-30`}
          >
            <div className="px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`lg:hidden p-2 rounded-xl border ${styles.button}`}
                >
                  <Menu size={20} />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl">{viewInfo.icon}</span>
                  <div className="min-w-0">
                    <h1
                      className={`text-xl lg:text-2xl font-bold ${styles.text} truncate`}
                    >
                      {viewInfo.title}
                    </h1>
                    <p className={`text-xs ${styles.textMuted}`}>
                      {filteredTasks.length} tâche
                      {filteredTasks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-3">
                  <div
                    className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border ${styles.input} transition-all`}
                  >
                    <Search size={18} className={styles.textMuted} />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`bg-transparent border-none outline-none text-sm w-32 lg:w-48 ${isDark ? "text-white" : "text-slate-900"}`}
                    />
                  </div>

                  {/* ✅ BOUTON MODAL TÂCHES TERMINÉES (Modifié pour mobile) */}
                  <button
                    onClick={() => setShowCompletedModal(true)}
                    className={`flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      isDark
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    }`}
                    title="Tâches terminées"
                  >
                    <CheckCircle2 size={18} />
                    {/* Texte masqué sur mobile, visible sur tablette/desktop */}
                    <span className="hidden sm:inline">
                      Terminées ({stats?.completed || 0})
                    </span>
                    {/* Compteur seul sur mobile */}
                    <span className="sm:hidden font-bold">
                      {stats?.completed || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowNewTaskModal(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 ${styles.buttonPrimary} rounded-xl font-semibold transition-all active:scale-[0.98]`}
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Nouvelle</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <EmptyState
                    isDark={isDark}
                    onAddTask={() => setShowNewTaskModal(true)}
                  />
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      isDark={isDark}
                      onComplete={() => handleCompleteTask(task._id)}
                      onReopen={() => handleReopenTask(task._id)}
                      onToggleStar={() =>
                        handleToggleStar(task._id, task.isStarred)
                      }
                      onDelete={() => handleDeleteTask(task._id)}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ✅ MODAL DES TÂCHES TERMINÉES */}
      {showCompletedModal && (
        <CompletedTasksModal
          isDark={isDark}
          onClose={() => setShowCompletedModal(false)}
          tasks={completedTasks}
          onReopen={handleReopenTask}
          onDelete={handleDeleteTask}
        />
      )}

      {showNewListModal && (
        <NewListModal
          isDark={isDark}
          onClose={() => setShowNewListModal(false)}
          onCreate={handleCreateList}
        />
      )}
      {showNewTaskModal && (
        <NewTaskModal
          isDark={isDark}
          lists={lists}
          defaultListId={selectedListId}
          onClose={() => setShowNewTaskModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {/* MODAL DETAILS RESTAURÉE */}
      {selectedTask && (
        <TaskDetailModal
          isDark={isDark}
          task={selectedTask}
          lists={lists}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => handleUpdateTask(selectedTask._id, updates)}
          onDelete={() => {
            handleDeleteTask(selectedTask._id);
            setSelectedTask(null);
          }}
          onAddSubtask={(text) => handleAddSubtask(selectedTask._id, text)}
          onToggleSubtask={(subtaskId, completed) =>
            handleToggleSubtask(selectedTask._id, subtaskId, completed)
          }
          onDeleteSubtask={(subtaskId) =>
            handleDeleteSubtask(selectedTask._id, subtaskId)
          }
        />
      )}
    </div>
  );
}

// =================== COMPONENTS ===================

function EmptyState({ isDark, onAddTask }) {
  return (
    <div className="text-center py-20">
      <div
        className={`w-24 h-24 mx-auto mb-6 rounded-3xl ${isDark ? "bg-slate-800" : "bg-gradient-to-br from-blue-100 to-indigo-100"} flex items-center justify-center`}
      >
        <Sparkles
          className={isDark ? "text-blue-400" : "text-blue-500"}
          size={40}
        />
      </div>
      <h3
        className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-800"}`}
      >
        Aucune tâche
      </h3>
      <p className={`mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Commencez par créer votre première tâche
      </p>
      <button
        onClick={onAddTask}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
      >
        <Plus size={20} />
        Créer une tâche
      </button>
    </div>
  );
}

function TaskCard({
  task,
  isDark,
  onComplete,
  onReopen,
  onToggleStar,
  onDelete,
  onClick,
}) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const priorityConfig = {
    urgent: {
      border: "border-l-red-500",
      bg: isDark ? "bg-red-500/10" : "bg-red-50",
      badge: "bg-red-500 text-white",
    },
    high: {
      border: "border-l-orange-500",
      bg: "",
      badge: isDark
        ? "bg-orange-500/20 text-orange-400"
        : "bg-orange-100 text-orange-600",
    },
    normal: { border: "border-l-blue-500", bg: "", badge: "" },
    low: {
      border: "border-l-emerald-500",
      bg: "",
      badge: isDark
        ? "bg-emerald-500/20 text-emerald-400"
        : "bg-emerald-100 text-emerald-600",
    },
  };

  const config = priorityConfig[task.priority] || priorityConfig.normal;

  const subtaskProgress =
    task.subtasks?.length > 0
      ? {
          completed: task.subtasks.filter((s) => s.completed).length,
          total: task.subtasks.length,
        }
      : null;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr =
      hours === 23 && minutes === 59
        ? null
        : `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    return { dateStr, timeStr };
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-4 p-4 lg:p-5 rounded-2xl border-l-4 border cursor-pointer transition-all duration-200 ${config.border} ${
        isDark
          ? `bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 ${config.bg}`
          : `bg-white border-slate-200 hover:shadow-lg hover:border-slate-300 ${config.bg}`
      } ${task.completed ? "opacity-60" : ""} ${isOverdue && !task.completed ? (isDark ? "!bg-red-500/10 !border-red-500/50" : "!bg-red-50 !border-red-200") : ""}`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          task.completed ? onReopen() : onComplete();
        }}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.completed
            ? "bg-emerald-500 border-emerald-500"
            : isDark
              ? "border-slate-600 hover:border-blue-500 hover:bg-blue-500/20"
              : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
        }`}
      >
        {task.completed && <CheckCircle2 size={14} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-semibold leading-snug ${task.completed ? "line-through" : ""} ${isDark ? (task.completed ? "text-slate-500" : "text-white") : task.completed ? "text-slate-400" : "text-slate-800"}`}
          >
            {task.title}
          </h3>

          {/* Priority Badge */}
          {(task.priority === "urgent" ||
            task.priority === "high" ||
            task.priority === "low") &&
            config.badge && (
              <span
                className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${config.badge}`}
              >
                {task.priority === "urgent"
                  ? "⚡ Urgent"
                  : task.priority === "high"
                    ? "🔥 Haute"
                    : "🌱 Basse"}
              </span>
            )}
        </div>

        {/* Description */}
        {task.description && (
          <p
            className={`text-sm mt-1 line-clamp-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {task.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {/* Liste */}
          {task.listId && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
            >
              <span>{task.listId.icon}</span>
              <span>{task.listId.title}</span>
            </span>
          )}

          {/* Date & Heure */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${
                isOverdue
                  ? "bg-red-500 text-white"
                  : isDark
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              <Calendar size={12} />
              {formatDateTime(task.dueDate).dateStr}
              {formatDateTime(task.dueDate).timeStr && (
                <>
                  <span className="opacity-50">•</span>
                  <Clock size={12} />
                  {formatDateTime(task.dueDate).timeStr}
                </>
              )}
            </span>
          )}

          {/* Sous-tâches */}
          {subtaskProgress && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
            >
              <CheckCircle2 size={12} />
              {subtaskProgress.completed}/{subtaskProgress.total}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className={`p-2 rounded-xl transition-all ${
            task.isStarred
              ? "text-yellow-500"
              : isDark
                ? "text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/20"
                : "text-slate-400 hover:text-yellow-500 hover:bg-yellow-50"
          }`}
        >
          <Star size={18} fill={task.isStarred ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Supprimer cette tâche ?")) onDelete();
          }}
          className={`p-2 rounded-xl transition-all ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-500/20" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

// =================== NEW LIST MODAL ===================
function NewListModal({ isDark, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("📋");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), icon: selectedIcon });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} border rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${isDark ? "bg-blue-500/20" : "bg-blue-100"} flex items-center justify-center`}
              >
                <FolderOpen
                  className={isDark ? "text-blue-400" : "text-blue-600"}
                  size={20}
                />
              </div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Nouvelle Liste
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Title Input */}
          <div className="mb-5">
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Nom de la liste
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Ma nouvelle liste..."
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Icon Selection */}
          <div className="mb-6">
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Icône
            </label>
            <div className="grid grid-cols-6 gap-2">
              {LIST_ICONS.map(({ icon }) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? isDark
                        ? "bg-blue-500/20 ring-2 ring-blue-500"
                        : "bg-blue-50 ring-2 ring-blue-500"
                      : isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold border ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== NEW TASK MODAL ===================
function NewTaskModal({ isDark, lists, defaultListId, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [listId, setListId] = useState(defaultListId || "");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;

    let finalDueDate = null;
    if (dueDate) {
      finalDueDate = dueTime
        ? `${dueDate}T${dueTime}:00`
        : `${dueDate}T23:59:00`;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      priority,
      listId: listId || null,
      dueDate: finalDueDate,
      isStarred,
    });
  };

  const handleQuickDate = (getValue) => {
    const date = getValue();
    setDueDate(date.toISOString().split("T")[0]);
  };

  const priorityStyles = {
    low: isDark
      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
      : "bg-emerald-50 border-emerald-200 text-emerald-600",
    normal: isDark
      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
      : "bg-blue-50 border-blue-200 text-blue-600",
    high: isDark
      ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
      : "bg-orange-50 border-orange-200 text-orange-600",
    urgent: isDark
      ? "bg-red-500/20 border-red-500/50 text-red-400"
      : "bg-red-50 border-red-200 text-red-600",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Nouvelle Tâche
              </h2>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Ajoutez les détails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Titre */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Titre *
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que devez-vous faire ?"
              className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-base font-medium ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Liste */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Liste
            </label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all appearance-none cursor-pointer ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
              }`}
            >
              <option value="">📥 Inbox</option>
              {lists.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.icon} {list.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priorité */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Priorité
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    priority === p.value
                      ? priorityStyles[p.value]
                      : isDark
                        ? "border-slate-700 hover:border-slate-600 text-slate-400"
                        : "border-slate-200 hover:border-slate-300 text-slate-500"
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-xs font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Heure */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Échéance
            </label>

            {/* Quick dates */}
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_DATES.map((qd) => (
                <button
                  key={qd.label}
                  onClick={() => handleQuickDate(qd.getValue)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      : "bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600"
                  }`}
                >
                  <span>{qd.icon}</span>
                  {qd.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                  }`}
                />
              </div>
              <div className="relative">
                <Clock
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Favoris */}
          <button
            onClick={() => setIsStarred(!isStarred)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              isStarred
                ? isDark
                  ? "bg-yellow-500/20 border-yellow-500/50"
                  : "bg-yellow-50 border-yellow-300"
                : isDark
                  ? "border-slate-700 hover:border-slate-600"
                  : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <Star
                size={20}
                className={
                  isStarred
                    ? "text-yellow-500 fill-yellow-500"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                }
              />
              <span
                className={`font-medium ${isStarred ? (isDark ? "text-yellow-400" : "text-yellow-700") : isDark ? "text-white" : "text-slate-900"}`}
              >
                Marquer comme favori
              </span>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isStarred
                  ? "bg-yellow-500 border-yellow-500"
                  : isDark
                    ? "border-slate-600"
                    : "border-slate-300"
              }`}
            >
              {isStarred && <CheckCircle2 size={14} className="text-white" />}
            </div>
          </button>

          {/* Options avancées */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 text-sm font-semibold ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
            {showAdvanced ? "Masquer les options" : "Plus d'options"}
          </button>

          {showAdvanced && (
            <div className="space-y-5 pt-2">
              {/* Description */}
              <div>
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 flex items-center gap-1.5`}
                >
                  <AlignLeft size={12} /> Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Ajouter des détails..."
                  className={`w-full px-4 py-3 rounded-xl border outline-none resize-none transition-all ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}
        >
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3.5 rounded-xl font-semibold border ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="flex-1 px-4 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              Créer la tâche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== TASK DETAIL MODAL ===================
function TaskDetailModal({
  isDark,
  task,
  lists,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "normal");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.split("T")[0] : "",
  );
  const [dueTime, setDueTime] = useState(
    task?.dueDate && task.dueDate.includes("T")
      ? task.dueDate.split("T")[1]?.slice(0, 5)
      : "",
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  if (!task) return null;

  const handleChange = (setter) => (value) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    let finalDueDate = null;
    if (dueDate) {
      finalDueDate = dueTime
        ? `${dueDate}T${dueTime}:00`
        : `${dueDate}T23:59:00`;
    }

    onUpdate({
      title,
      description,
      priority,
      dueDate: finalDueDate,
    });
    setHasChanges(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(newSubtask.trim());
    setNewSubtask("");
  };

  const priorityStyles = {
    low: isDark
      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
      : "bg-emerald-50 border-emerald-200 text-emerald-600",
    normal: isDark
      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
      : "bg-blue-50 border-blue-200 text-blue-600",
    high: isDark
      ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
      : "bg-orange-50 border-orange-200 text-orange-600",
    urgent: isDark
      ? "bg-red-500/20 border-red-500/50 text-red-400"
      : "bg-red-50 border-red-200 text-red-600",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                task.completed
                  ? "bg-emerald-500"
                  : isDark
                    ? "bg-blue-500/20"
                    : "bg-blue-100"
              }`}
            >
              {task.completed ? (
                <CheckCircle2 className="text-white" size={20} />
              ) : (
                <span className="text-xl">{task.listId?.icon || "📋"}</span>
              )}
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Détails de la tâche
              </h2>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Créée le {new Date(task.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Titre */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleChange(setTitle)(e.target.value)}
            className={`w-full text-2xl font-bold bg-transparent border-none outline-none ${isDark ? "text-white" : "text-slate-900"}`}
            placeholder="Titre..."
          />

          {/* Priorité */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Priorité
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleChange(setPriority)(p.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                    priority === p.value
                      ? priorityStyles[p.value]
                      : isDark
                        ? "border-slate-700 hover:border-slate-600 text-slate-400"
                        : "border-slate-200 hover:border-slate-300 text-slate-500"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-xs font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Heure */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Échéance
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleChange(setDueDate)(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                  }`}
                />
              </div>
              <div className="relative">
                <Clock
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => handleChange(setDueTime)(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => handleChange(setDescription)(e.target.value)}
              rows={3}
              placeholder="Ajouter une description..."
              className={`w-full px-4 py-3 rounded-xl border outline-none resize-none transition-all ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Sous-tâches */}
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} mb-2 block`}
            >
              Sous-tâches (
              {task.subtasks?.filter((s) => s.completed).length || 0}/
              {task.subtasks?.length || 0})
            </label>

            <div className="space-y-2 mb-3">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask._id}
                  className={`flex items-center gap-3 p-3 rounded-xl group ${isDark ? "bg-slate-800" : "bg-slate-50"}`}
                >
                  <button
                    onClick={() =>
                      onToggleSubtask(subtask._id, !subtask.completed)
                    }
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      subtask.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : isDark
                          ? "border-slate-600 hover:border-blue-500"
                          : "border-slate-300 hover:border-blue-500"
                    }`}
                  >
                    {subtask.completed && (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </button>
                  <span
                    className={`flex-1 ${subtask.completed ? "line-through" : ""} ${isDark ? (subtask.completed ? "text-slate-500" : "text-slate-200") : subtask.completed ? "text-slate-400" : "text-slate-700"}`}
                  >
                    {subtask.text}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask(subtask._id)}
                    className={`p-1 opacity-0 group-hover:opacity-100 ${isDark ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"} transition-all`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nouvelle sous-tâche..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                className={`flex-1 px-4 py-2.5 rounded-xl border outline-none transition-all ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                }`}
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className={`px-4 py-2.5 rounded-xl ${isDark ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : "bg-blue-100 text-blue-600 hover:bg-blue-200"} disabled:opacity-50 transition-all`}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"} flex justify-between`}
        >
          <button
            onClick={() => {
              if (confirm("Supprimer cette tâche ?")) onDelete();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"} transition-all`}
          >
            <Trash2 size={18} />
            Supprimer
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-semibold ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              Fermer
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
              >
                Enregistrer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== COMPLETED TASKS MODAL ===================
function CompletedTasksModal({ isDark, onClose, tasks, onReopen, onDelete }) {
  const [searchTerm, setSearchQuery] = useState("");

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} border rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${isDark ? "border-slate-800" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Tâches terminées
              </h2>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {tasks.length} tâches archivées
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div
          className={`px-6 py-3 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
          >
            <Search size={16} className="opacity-50" />
            <input
              type="text"
              placeholder="Rechercher une tâche terminée..."
              className="bg-transparent outline-none w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <Inbox size={40} className="mx-auto mb-2" />
              <p>Aucune tâche terminée trouvée</p>
            </div>
          ) : (
            filtered.map((task) => (
              <div
                key={task._id}
                className={`flex items-center justify-between p-4 rounded-xl border opacity-75 hover:opacity-100 transition-opacity ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onReopen(task._id)}
                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 hover:bg-emerald-600 transition"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <span
                    className={`line-through ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onReopen(task._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${isDark ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}
                  >
                    Rouvrir
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer définitivement ?"))
                        onDelete(task._id);
                    }}
                    className={`p-1.5 rounded-lg transition ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
