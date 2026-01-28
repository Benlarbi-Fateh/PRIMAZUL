// frontend/src/context/TaskContext.jsx

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "@/lib/api";
import {
  getSocket,
  joinConversation,
  leaveConversation,
  onTaskCreated,
  onTaskUpdated,
  onTaskStatusChanged,
  onTaskDeleted,
  onTaskCommented,
  onProjectCreated,
  onProjectDeleted,
  setupTaskListeners,
} from "@/services/socket";

const TaskContext = createContext(null);

export function TaskProvider({ children, conversationId }) {
  // --- ÉTATS ---
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [participants, setParticipants] = useState([]);

  // États de chargement et d'erreur
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres et Tri
  // 🔴 IMPORTANT : On initialise à null pour forcer la sélection d'un projet plus tard
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("createdAt_desc");

  // Refs pour éviter les fuites de mémoire
  const mountedRef = useRef(true);
  const conversationIdRef = useRef(conversationId);

  // Mettre à jour la ref quand conversationId change
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // =================== FETCH DATA ===================

  const fetchAllData = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const [tasksRes, projectsRes, convRes] = await Promise.all([
        api.get(`/conversations/${conversationId}/tasks`),
        api.get(`/conversations/${conversationId}/projects`),
        api.get(`/conversations/${conversationId}`),
      ]);

      if (mountedRef.current) {
        setTasks(tasksRes.data?.tasks || []);
        const loadedProjects = projectsRes.data?.projects || [];
        setProjects(loadedProjects);
        setParticipants(convRes.data?.conversation?.participants || []);

        // ✅ SÉLECTION AUTOMATIQUE DU PREMIER PROJET SI AUCUN SÉLECTIONNÉ
        if (loadedProjects.length > 0 && !currentProjectId) {
          setCurrentProjectId(loadedProjects[0]._id);
        }
      }
    } catch (err) {
      console.error("❌ Erreur chargement TaskContext:", err);
      if (mountedRef.current) {
        setError("Impossible de charger les données du projet");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [conversationId, currentProjectId]);

  // Chargement initial
  useEffect(() => {
    mountedRef.current = true;
    fetchAllData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAllData]);

  // =================== SOCKET.IO OPTIMISÉ ===================

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) return;

    console.log(`📥 [TaskContext] Abonnement conversation:${conversationId}`);
    joinConversation(conversationId);
    setupTaskListeners();

    // Helper pour vérifier si l'événement concerne cette conv
    const isRelevant = (item) => {
      if (!item) return false;
      const cId = item.conversationId?._id || item.conversationId;
      return cId?.toString() === conversationIdRef.current;
    };

    // --- HANDLERS ---

    const handleTaskCreated = ({ task }) => {
      if (!isRelevant(task)) return;
      setTasks((prev) => {
        if (prev.some((t) => t._id === task._id)) return prev;
        return [task, ...prev];
      });
    };

    const handleTaskUpdated = ({ task }) => {
      if (!isRelevant(task)) return;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const handleProjectCreated = ({ project }) => {
      if (!isRelevant(project)) return;
      setProjects((prev) => {
        if (prev.some((p) => p._id === project._id)) return prev;
        // Si c'est le premier projet, on le sélectionne
        if (prev.length === 0) setCurrentProjectId(project._id);
        return [...prev, project];
      });
    };

    const handleProjectDeleted = ({ projectId }) => {
      setProjects((prev) => {
        const newProjects = prev.filter((p) => p._id !== projectId);
        // Si on supprime le projet courant, on bascule sur le premier dispo ou null
        if (currentProjectId === projectId) {
          setCurrentProjectId(
            newProjects.length > 0 ? newProjects[0]._id : null,
          );
        }
        return newProjects;
      });
      // Nettoyer les tâches liées
      setTasks((prev) =>
        prev.filter((t) => {
          const tPid = t.projectId?._id || t.projectId;
          return tPid !== projectId;
        }),
      );
    };

    // Abonnements
    const unsubCreates = onTaskCreated(handleTaskCreated);
    const unsubUpdates = onTaskUpdated(handleTaskUpdated);
    const unsubStatus = onTaskStatusChanged(({ task }) =>
      handleTaskUpdated({ task }),
    );
    const unsubDeletes = onTaskDeleted(handleTaskDeleted);
    const unsubComments = onTaskCommented(({ task }) =>
      handleTaskUpdated({ task }),
    );

    const unsubProjCreate = onProjectCreated(handleProjectCreated);
    const unsubProjDelete = onProjectDeleted(handleProjectDeleted);

    return () => {
      console.log(
        `📤 [TaskContext] Désabonnement conversation:${conversationId}`,
      );
      leaveConversation(conversationId);
      unsubCreates();
      unsubUpdates();
      unsubStatus();
      unsubDeletes();
      unsubComments();
      unsubProjCreate();
      unsubProjDelete();
    };
  }, [conversationId, currentProjectId]);

  // =================== ACTIONS CRUD ===================

  const createTask = useCallback(
    async (taskData) => {
      try {
        const res = await api.post(
          `/conversations/${conversationId}/tasks`,
          taskData,
        );
        const newTask = res.data.task;
        if (newTask) {
          setTasks((prev) => [newTask, ...prev]);
        }
        return { success: true, task: newTask };
      } catch (err) {
        console.error("❌ Erreur création tâche:", err);
        return {
          success: false,
          error: err.response?.data?.message || "Erreur",
        };
      }
    },
    [conversationId],
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t)),
      );
      try {
        const res = await api.patch(`/tasks/${taskId}`, updates);
        if (res.data.task) {
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? res.data.task : t)),
          );
        }
        return { success: true };
      } catch (err) {
        console.error("❌ Erreur mise à jour tâche:", err);
        fetchAllData();
        return { success: false, error: "Erreur mise à jour" };
      }
    },
    [fetchAllData],
  );

  const deleteTask = useCallback(
    async (taskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      try {
        await api.delete(`/tasks/${taskId}`);
        return { success: true };
      } catch (err) {
        console.error("❌ Erreur suppression tâche:", err);
        fetchAllData();
        return { success: false, error: "Erreur suppression" };
      }
    },
    [fetchAllData],
  );

  const changeTaskStatus = useCallback(
    async (taskId, newStatus) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
      );
      try {
        await api.post(`/tasks/${taskId}/status`, { status: newStatus });
        return { success: true };
      } catch (err) {
        console.error("❌ Erreur statut:", err);
        fetchAllData();
        return { success: false };
      }
    },
    [fetchAllData],
  );

  const addComment = useCallback(
    async (taskId, text) => {
      try {
        const res = await api.post(`/tasks/${taskId}/comments`, { text });
        if (res.data.task) {
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? res.data.task : t)),
          );
        } else {
          fetchAllData();
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: "Erreur commentaire" };
      }
    },
    [fetchAllData],
  );

  const createProject = useCallback(
    async (projectData) => {
      try {
        const res = await api.post(
          `/conversations/${conversationId}/projects`,
          projectData,
        );
        const newProject = res.data.project;
        if (newProject) {
          setProjects((prev) => [...prev, newProject]);
          // ✅ Sélectionner le nouveau projet automatiquement
          setCurrentProjectId(newProject._id);
        }
        return { success: true, project: newProject };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || "Erreur",
        };
      }
    },
    [conversationId],
  );

  const deleteProject = useCallback(
    async (projectId) => {
      // Optimistic delete
      setProjects((prev) => {
        const newProjects = prev.filter((p) => p._id !== projectId);
        // Si on supprime le projet courant, changer
        if (currentProjectId === projectId) {
          setCurrentProjectId(
            newProjects.length > 0 ? newProjects[0]._id : null,
          );
        }
        return newProjects;
      });

      setTasks((prev) =>
        prev.filter((t) => {
          const tPid = t.projectId?._id || t.projectId;
          return tPid !== projectId;
        }),
      );

      try {
        await api.delete(
          `/conversations/${conversationId}/projects/${projectId}`,
        );
        return { success: true };
      } catch (err) {
        fetchAllData();
        return { success: false, error: "Erreur suppression projet" };
      }
    },
    [conversationId, currentProjectId, fetchAllData],
  );

  // =================== CALCULS DÉRIVÉS (MEMOIZÉS) ===================

  const filteredTasks = useMemo(() => {
    // 🔴 Si pas de projet sélectionné, pas de tâches
    if (!currentProjectId) return [];

    let result = [...tasks];

    // ✅ Filtre STRICT par Projet
    result = result.filter((t) => {
      const tPid = t.projectId?._id || t.projectId;
      return tPid === currentProjectId;
    });

    // Filtre Statut
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }

    // Tri
    const [field, direction] = sortOption.split("_");
    result.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case "createdAt":
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case "priority":
          const order = { urgent: 3, high: 2, normal: 1, low: 0 };
          comparison = (order[a.priority] || 0) - (order[b.priority] || 0);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      return direction === "desc" ? -comparison : comparison;
    });

    return result;
  }, [tasks, currentProjectId, statusFilter, searchQuery, sortOption]);

  const tasksByStatus = useMemo(
    () => ({
      todo: filteredTasks.filter((t) => t.status === "todo"),
      inProgress: filteredTasks.filter((t) => t.status === "inProgress"),
      done: filteredTasks.filter((t) => t.status === "done"),
    }),
    [filteredTasks],
  );

  const stats = useMemo(() => {
    const todo = tasksByStatus.todo.length;
    const inProgress = tasksByStatus.inProgress.length;
    const done = tasksByStatus.done.length;
    const total = todo + inProgress + done;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    const overdue = filteredTasks.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
    ).length;

    return { todo, inProgress, done, total, progress, overdue };
  }, [tasksByStatus, filteredTasks]);

  const currentProject = useMemo(() => {
    if (!currentProjectId) return null;
    return projects.find((p) => p._id === currentProjectId);
  }, [currentProjectId, projects]);

  // =================== PROVIDER ===================

  const value = {
    tasks,
    filteredTasks,
    tasksByStatus,
    projects,
    participants,
    stats,
    currentProject,
    loading,
    error,

    // États filtres
    currentProjectId,
    statusFilter,
    searchQuery,
    sortOption,

    // Setters filtres
    setCurrentProjectId,
    setStatusFilter,
    setSearchQuery,
    setSortOption,

    // Actions
    createTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    addComment,
    createProject,
    deleteProject,
    refreshTasks: fetchAllData,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks doit être utilisé dans un TaskProvider");
  }
  return context;
}
