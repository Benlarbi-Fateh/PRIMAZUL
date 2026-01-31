// context/TaskContext.jsx

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
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentProjectId, setCurrentProjectId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("createdAt_desc");

  const mountedRef = useRef(true);
  const conversationIdRef = useRef(conversationId);

  // Mettre à jour la ref quand conversationId change
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // =================== FETCH DATA ===================

  const fetchTasks = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/conversations/${conversationId}/tasks`);
      if (mountedRef.current) {
        setTasks(res.data?.tasks || []);
      }
    } catch (err) {
      console.error("❌ Erreur fetch tâches:", err);
      if (mountedRef.current) {
        setError("Impossible de charger les tâches");
      }
    }
  }, [conversationId]);

  const fetchProjects = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/conversations/${conversationId}/projects`);
      if (mountedRef.current) {
        setProjects(res.data?.projects || []);
      }
    } catch (err) {
      console.error("❌ Erreur fetch projets:", err);
    }
  }, [conversationId]);

  const fetchParticipants = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      if (mountedRef.current) {
        setParticipants(res.data?.conversation?.participants || []);
      }
    } catch (err) {
      console.error("❌ Erreur fetch participants:", err);
    }
  }, [conversationId]);
  
const moveTask = useCallback((taskId, source, destination) => {
  setTasks(prev => {
    const updated = [...prev];

    const taskIndex = updated.findIndex(t => t._id === taskId);
    if (taskIndex === -1) return prev;

    const task = { ...updated[taskIndex] };
    updated.splice(taskIndex, 1);

    task.status = destination.droppableId;

    // 🔥 IMPORTANT : on insère selon destination.index
    const targetTasks = updated.filter(
      t => t.status === destination.droppableId
    );

    const targetIds = targetTasks.map(t => t._id);

    const insertBeforeId = targetIds[destination.index];
    if (!insertBeforeId) {
      updated.push(task);
    } else {
      const insertIndex = updated.findIndex(t => t._id === insertBeforeId);
      updated.splice(insertIndex, 0, task);
    }

    return updated;
  });
}, []);

  // Charger les données au montage
  useEffect(() => {
    mountedRef.current = true;

    const loadAll = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchTasks(), fetchProjects(), fetchParticipants()]);
      if (mountedRef.current) {
        setLoading(false);
      }
    };

    loadAll();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchTasks, fetchProjects, fetchParticipants]);

  // =================== SOCKET.IO ===================

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) {
      console.warn("⚠️ Socket non disponible pour les tâches");
      return;
    }

    // Rejoindre la room de la conversation
    console.log(`📥 [TaskContext] Rejoindre conversation:${conversationId}`);
    joinConversation(conversationId);

    // S'assurer que les écouteurs sont configurés
    setupTaskListeners();

    // =================== HANDLERS ===================

    const isForThisConversation = (task) => {
      if (!task) return false;
      const taskConvId = task.conversationId?._id || task.conversationId;
      return taskConvId?.toString() === conversationIdRef.current;
    };

    const handleTaskCreated = ({ task }) => {
      if (!mountedRef.current || !isForThisConversation(task)) return;
      console.log("📡 [TaskContext] task:created:", task._id);

      setTasks((prev) => {
        const exists = prev.some((t) => t._id === task._id);
        if (exists) {
          return prev.map((t) => (t._id === task._id ? task : t));
        }
        return [task, ...prev];
      });
    };

    const handleTaskUpdated = ({ task }) => {
      if (!mountedRef.current || !isForThisConversation(task)) return;
      console.log("📡 [TaskContext] task:updated:", task._id);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    const handleTaskStatusChanged = ({ task, oldStatus, newStatus }) => {
      if (!mountedRef.current || !isForThisConversation(task)) return;
      console.log(
        `📡 [TaskContext] task:statusChanged: ${oldStatus} → ${newStatus}`,
      );
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    const handleTaskDeleted = ({ taskId }) => {
      if (!mountedRef.current) return;
      console.log("📡 [TaskContext] task:deleted:", taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const handleTaskCommented = ({ taskId, task }) => {
      if (!mountedRef.current) return;
      if (task && isForThisConversation(task)) {
        console.log("📡 [TaskContext] task:commented:", taskId);
        setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      }
    };

    const handleProjectCreated = ({ project }) => {
      if (!mountedRef.current) return;
      const projConvId =
        project?.conversationId?._id || project?.conversationId;
      if (projConvId?.toString() !== conversationIdRef.current) return;

      console.log("📡 [TaskContext] project:created:", project._id);
      setProjects((prev) => {
        if (prev.some((p) => p._id === project._id)) return prev;
        return [...prev, project];
      });
    };

    const handleProjectDeleted = ({ projectId }) => {
      if (!mountedRef.current) return;
      console.log("📡 [TaskContext] project:deleted:", projectId);

      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setTasks((prev) =>
        prev.filter((t) => {
          const tProjectId = t.projectId?._id || t.projectId;
          return tProjectId !== projectId;
        }),
      );

      // Reset la vue si on était sur ce projet
      setCurrentProjectId((current) =>
        current === projectId ? "all" : current,
      );
    };

    // S'abonner aux événements
    const unsubCreated = onTaskCreated(handleTaskCreated);
    const unsubUpdated = onTaskUpdated(handleTaskUpdated);
    const unsubStatus = onTaskStatusChanged(handleTaskStatusChanged);
    const unsubDeleted = onTaskDeleted(handleTaskDeleted);
    const unsubCommented = onTaskCommented(handleTaskCommented);
    const unsubProjCreated = onProjectCreated(handleProjectCreated);
    const unsubProjDeleted = onProjectDeleted(handleProjectDeleted);

    // Cleanup
    return () => {
      console.log(`📤 [TaskContext] Quitter conversation:${conversationId}`);
      leaveConversation(conversationId);
      unsubCreated();
      unsubUpdated();
      unsubStatus();
      unsubDeleted();
      unsubCommented();
      unsubProjCreated();
      unsubProjDeleted();
    };
  }, [conversationId]);

  // =================== ACTIONS ===================

  const createTask = useCallback(
    async (taskData) => {
      try {
        const res = await api.post(
          `/conversations/${conversationId}/tasks`,
          taskData,
        );
        // Socket.io devrait mettre à jour automatiquement
        // Mais on ajoute aussi manuellement au cas où
        const newTask = res.data.task;
        if (newTask) {
          setTasks((prev) => {
            if (prev.some((t) => t._id === newTask._id)) return prev;
            return [newTask, ...prev];
          });
        }
        return { success: true, task: newTask };
      } catch (err) {
        console.error("❌ Erreur création:", err);
        return {
          success: false,
          error: err.response?.data?.message || "Erreur",
        };
      }
    },
    [conversationId],
  );

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, updates);
      const updatedTask = res.data.task;
      if (updatedTask) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? updatedTask : t)),
        );
      }
      return { success: true, task: updatedTask };
    } catch (err) {
      console.error("❌ Erreur mise à jour:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Erreur",
      };
    }
  }, []);

  const deleteTask = useCallback(
    async (taskId) => {
      // Suppression optimiste
      setTasks((prev) => prev.filter((t) => t._id !== taskId));

      try {
        await api.delete(`/tasks/${taskId}`);
        return { success: true };
      } catch (err) {
        console.error("❌ Erreur suppression:", err);
        // Rollback en cas d'erreur
        await fetchTasks();
        return {
          success: false,
          error: err.response?.data?.message || "Erreur",
        };
      }
    },
    [fetchTasks],
  );

  const changeTaskStatus = useCallback(
    async (taskId, newStatus) => {
      // Mise à jour optimiste
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
      );

      try {
        const res = await api.post(`/tasks/${taskId}/status`, {
          status: newStatus,
        });
        return { success: true, task: res.data.task };
      } catch (err) {
        console.error("❌ Erreur changement statut:", err);
        // Rollback
        await fetchTasks();
        return {
          success: false,
          error: err.response?.data?.message || "Erreur",
        };
      }
    },
    [fetchTasks],
  );

  const addComment = useCallback(async (taskId, text) => {
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { text });
      return { success: true, comment: res.data.comment };
    } catch (err) {
      console.error("❌ Erreur commentaire:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Erreur",
      };
    }
  }, []);

  const createProject = useCallback(
    async (projectData) => {
      try {
        const res = await api.post(
          `/conversations/${conversationId}/projects`,
          projectData,
        );
        const newProject = res.data.project;
        if (newProject) {
          setProjects((prev) => {
            if (prev.some((p) => p._id === newProject._id)) return prev;
            return [...prev, newProject];
          });
        }
        return { success: true, project: newProject };
      } catch (err) {
        console.error("❌ Erreur création projet:", err);
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
      // Suppression optimiste
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setTasks((prev) =>
        prev.filter((t) => {
          const tProjectId = t.projectId?._id || t.projectId;
          return tProjectId !== projectId;
        }),
      );

      if (currentProjectId === projectId) {
        setCurrentProjectId("all");
      }

      try {
        await api.delete(
          `/conversations/${conversationId}/projects/${projectId}`,
        );
        return { success: true };
      } catch (err) {
        console.error("❌ Erreur suppression projet:", err);
        // Rollback
        await fetchProjects();
        await fetchTasks();
        return {
          success: false,
          error: err.response?.data?.message || "Erreur",
        };
      }
    },
    [conversationId, currentProjectId, fetchProjects, fetchTasks],
  );

  // =================== DONNÉES DÉRIVÉES ===================

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (currentProjectId !== "all") {
      result = result.filter((t) => {
        const tProjectId = t.projectId?._id || t.projectId;
        return tProjectId === currentProjectId;
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }

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
          const order = { urgent: 3, normal: 2, low: 1 };
          comparison = (order[a.priority] || 0) - (order[b.priority] || 0);
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
    if (currentProjectId === "all") return null;
    return projects.find((p) => p._id === currentProjectId);
  }, [currentProjectId, projects]);

  // =================== CONTEXT VALUE ===================

  const value = useMemo(
    () => ({
      tasks,
      filteredTasks,
      tasksByStatus,
      projects,
      participants,
      stats,
      currentProject,
      loading,
      error,
      currentProjectId,
      statusFilter,
      searchQuery,
      sortOption,
      setCurrentProjectId,
      setStatusFilter,
      setSearchQuery,
      setSortOption,
      createTask,
      updateTask,
      deleteTask,
      changeTaskStatus,
      addComment,
      createProject,
      deleteProject,
      refreshTasks: fetchTasks,
      refreshProjects: fetchProjects,
    }),
    [
      tasks,
      filteredTasks,
      tasksByStatus,
      projects,
      participants,
      stats,
      currentProject,
      loading,
      error,
      currentProjectId,
      statusFilter,
      searchQuery,
      sortOption,
      createTask,
      updateTask,
      deleteTask,
      changeTaskStatus,
      addComment,
      createProject,
      deleteProject,
      fetchTasks,
      fetchProjects,
    ],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks doit être utilisé dans un TaskProvider");
  }
  return context;
}
