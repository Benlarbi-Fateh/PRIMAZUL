"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Calendar, Search, User, Users,Filter, Zap,ArrowDown ,Minus ,AlertCircle ,SortAsc, Send, MessageSquare,Type,AlignLeft ,LayoutGrid,FolderOpen,MoreHorizontal, Check, ChevronRight, Hash, CheckCircle2,X,FolderPlus, Clock, Folder,} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthProvider";

/* ================= MAIN PAGE ================= */
export default function TasksPage() {
  const { id: conversationId } = useParams();
  const router = useRouter();
const { user } = useContext(AuthContext);

  /* ================= STATES ================= */
  const [tasks, setTasks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState("");

  const [currentProjectId, setCurrentProjectId] = useState("all");
  const [newProjectName, setNewProjectName] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority]=useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("none");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
const [taskDraft, setTaskDraft] = useState(null);
  const [commentText, setCommentText] = useState("");

 const openTaskForEdit = (task) => {
  // ✅ Normaliser responsible
  const responsibleId =
    typeof task.responsible === "object"
      ? task.responsible?._id
      : task.responsible || "";

  // ✅ Normaliser assignees - TOUJOURS des IDs purs
  const assigneesIds = (task.assignees || []).map(a => {
    if (typeof a === "object" && a._id) return a._id;
    return a;
  });

  console.log("🔍 Tâche ouverte :", {
    responsible: responsibleId,
    assignees: assigneesIds
  });

  setSelectedTask({
    ...task,
    responsible: responsibleId,
    assignees: assigneesIds, // ✅ Tableau d'IDs purs
  });
};

const enrichTaskWithNames = (task, participants) => {
  const responsibleId =
    typeof task.responsible === "object" ? task.responsible._id : task.responsible;

  // Nom du responsable
  const responsibleName =
    participants.find(p => p._id === responsibleId)?.name || "";

  // Noms des assignés
  const assigneesNames = (task.assignees || [])
    .map(a => {
      const id = typeof a === "object" ? a._id : a;
      return participants.find(p => p._id === id)?.name;
    })
    .filter(Boolean);

  return {
    ...task,
    responsible: responsibleId || "",
    responsibleName,
    assigneesNames,
  };
};

 /* ================= FETCH participants ================= */
  const fetchParticipants = useCallback(async () => {
  if (!conversationId) return;
  try {
    const res = await api.get(`/conversations/${conversationId}`);
    setParticipants(res.data?.conversation?.participants || []);
  } catch (err) {
    console.error("FETCH PARTICIPANTS ERROR:", err);
  }
}, [conversationId]);
  /* ================= FETCH TASKS ================= */
const fetchTasks = useCallback(async () => {
  if (!conversationId) return;
  setLoading(true);

  try {
    // Récupérer les participants
    const participantsRes = await api.get(`/conversations/${conversationId}`);
    const participantsList = participantsRes.data?.conversation?.participants || [];
    setParticipants(participantsList);

    // Récupérer les tâches
    const res = await api.get(`/conversations/${conversationId}/tasks`);
    const tasksData = Array.isArray(res.data?.tasks) ? res.data.tasks : [];

    // Enrichir tâches + commentaires
    const tasksWithNames = tasksData.map(task =>
      enrichTaskWithNames(task, participantsList)
    );

    setTasks(tasksWithNames);

  } catch (err) {
    console.error("FETCH TASKS ERROR:", err);
    setTasks([]);
  } finally {
    setLoading(false);
  }
}, [conversationId]);

  /* ================= FETCH PROJECTS ================= */
  const fetchProjects = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/conversations/${conversationId}/projects`);
      setProjects(res.data?.projects || []);
    } catch (err) {
      console.error("FETCH PROJECTS ERROR:", err);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchParticipants();
  }, [fetchTasks, fetchProjects,fetchParticipants]);

  /* ================= ADD PROJECT ================= */
  const addProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await api.post(`/conversations/${conversationId}/projects`, {
        name: newProjectName.trim(),
      });
      if (res.data?.project) {
        setProjects((prev) => [...prev, res.data.project]);
        setNewProjectName("");
      }
    } catch (err) {
      console.error("ADD PROJECT ERROR:", err);
    }
  };

  /* ================= DELETE PROJECT ================= */
  const deleteProject = async (projectId) => {
    if (!confirm("Supprimer ce projet ? Toutes les tâches associées seront également supprimées.")) return;
    try {
      await api.delete(`/conversations/${conversationId}/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p._id !== projectId));
      if (currentProjectId === projectId) setCurrentProjectId("all");
      setTasks(prev => prev.filter(t => (t.projectId?._id || t.projectId) !== projectId));
    } catch (err) {
      console.error("DELETE PROJECT ERROR:", err);
    }
  };


  /* ================= UPDATE TASK ================= */
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      if (res.data?.task) {
  const enrichedTask = enrichTaskWithNames(res.data.task, participants);
  setTasks((prev) =>
    prev.map((t) => (t._id === enrichedTask._id ? enrichedTask : t))
  );
}
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
    }
  };

  const updateDueDate = async (taskId, date) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { dueDate: date });
      if (res.data?.task) {
  const enrichedTask = enrichTaskWithNames(res.data.task, participants);
  setTasks((prev) =>
    prev.map((t) => (t._id === enrichedTask._id ? enrichedTask : t))
  );
}
    } catch (err) {
      console.error("UPDATE DATE ERROR:", err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  };
  
const updateTaskDetails = async () => {
  if (!selectedTask) return;
  try {
  
const cleanAssignees = (selectedTask.assignees || []).map(a => {
      if (typeof a === "object" && a._id) return a._id;
      return a;
    });

const uniqueAssignees = [...new Set(cleanAssignees)];

 
    if (selectedTask.isNew) {
      // 🟢 MODE CRÉATION
      const res = await api.post(
        `/conversations/${conversationId}/tasks`,
        {
          title: selectedTask.title,
          description: selectedTask.description || "", 
          priority: selectedTask.priority || "normal", 
          dueDate: selectedTask.dueDate,
          status: selectedTask.status || "todo",
          projectId: selectedTask.projectId || null,
          assignees: uniqueAssignees,
          responsible: selectedTask.responsible || null, 
        }
      );

      if (res.data?.task) {
        const enriched = enrichTaskWithNames(res.data.task, participants);
        setTasks(prev => [...prev, enriched]);
        setSelectedTask(null); 
      }
    } else {
      // 🟡 MODE MODIFICATION
      const res = await api.patch(`/tasks/${selectedTask._id}`, {
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate,
        assignees: uniqueAssignees,
        responsible: selectedTask.responsible, 
      });

      if (res.data?.task) {
        const enriched = enrichTaskWithNames(res.data.task, participants);
        setTasks(prev =>
          prev.map(t => t._id === enriched._id ? enriched : t)
        );
        setSelectedTask(null); 
      }
    }
  } catch (err) {
    console.error("SAVE TASK ERROR:", err);
    alert("❌ Erreur : " + (err.response?.data?.message || err.message));
  }
};
const addComment = async () => {
  if (!commentText.trim() || !selectedTask?._id) return;

  try {
    const res = await api.post(
      `/tasks/${selectedTask._id}/comments`,
      { text: commentText.trim() }
    );

    const newComment = res.data.comment; // 🔥 déjà peuplé (author.name)

    // Mise à jour du task sélectionné
    const updatedTask = {
      ...selectedTask,
      comments: [...(selectedTask.comments || []), newComment],
    };

    setSelectedTask(updatedTask);

    // Mise à jour globale des tâches
    setTasks(prev =>
      prev.map(t => (t._id === updatedTask._id ? updatedTask : t))
    );

    setCommentText("");
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
  }
};

  /* ================= FILTER & SORT ================= */
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    const today = new Date().toISOString().split("T")[0];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);

    if (currentProjectId !== "all") {
      result = result.filter(
        (t) =>
          t.projectId &&
          (t.projectId._id || t.projectId) === currentProjectId
      );
    }

    switch (sortOption) {
      case "date_recent":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "date_oldest":
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "due_today":
        result = result.filter((t) => t.dueDate?.split("T")[0] === today);
        break;
      case "due_overdue":
        result = result.filter(
          (t) => t.dueDate && t.dueDate.split("T")[0] < today
        );
        break;
      case "due_upcoming":
        result = result.filter((t) => t.dueDate?.split("T")[0] > today);
        break;
    }

    return result;
  }, [tasks, search, statusFilter, sortOption, currentProjectId]);

  const columns = {
    todo: { title: "À faire", tasks: filteredTasks.filter((t) => t.status === "todo") },
    inProgress: { title: "En cours", tasks: filteredTasks.filter((t) => t.status === "inProgress") },
    done: { title: "Terminées", tasks: filteredTasks.filter((t) => t.status === "done") },
  };

  const currentProject = useMemo(() => {
    if (currentProjectId === "all") return null;
    return projects.find((p) => p._id === currentProjectId);
  }, [currentProjectId, projects]);

  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  /* ================= DRAG & DROP ================= */
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId !== source.droppableId) {
      updateTaskStatus(draggableId, destination.droppableId);
    }
  };
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("");
}

  /* ================= UI ================= */
  return (
    <div className="flex flex-col md:flex-row bg-blue-50 min-h-screen overflow-hidden">
      {/* ================= MOBILE HEADER ================= */}
<header className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 bg-gradient-to-r from-[#0f172a] to-[#1e1b4b] border-b border-white/10 flex items-center px-4">
  <button
    onClick={() => setSidebarOpen(true)}
    className="p-2 rounded-xl bg-white/10 text-white"
  >
    <LayoutGrid size={20} />
  </button>

  <div className="ml-4">
    <h1 className="text-sm font-black text-white leading-none">
      Primazul
    </h1>
    <span className="text-[9px] text-blue-400 uppercase tracking-widest">
      Workspace
    </span>
  </div>
</header>
   {/* SIDEBAR */}
     {/* OVERLAY MOBILE */}
{sidebarOpen && (
  <div
    onClick={() => setSidebarOpen(false)}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
  />
)}

<aside
  className={`
    fixed top-0 left-0 h-screen w-64
    flex flex-col
    bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#1e1b4b]
    text-slate-300
    border-r border-blue-900/30
    shadow-[10px_0_30px_-15px_rgba(0,0,0,0.5)]
    z-50
    transform transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
>
  
  {/* ===== HEADER ===== */}
  <div className="flex items-center justify-between px-6 py-8 border-b border-white/5">
    <div className="flex items-center gap-3 group cursor-default">
      <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
        <LayoutGrid size={20} />
      </div>
      <div>
        <h2 className="font-black text-xl text-white leading-none">
          Primazul
        </h2>
        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
          Workspace
        </span>
      </div>
    </div>

    {/* CLOSE (MOBILE) */}
    <button
      onClick={() => setSidebarOpen(false)}
      className="md:hidden text-slate-400 hover:text-white"
    >
      <X size={20} />
    </button>

    {/* ADD PROJECT (DESKTOP) */}
    <button
      onClick={() => setShowProjectModal(true)}
      className="hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition border border-blue-500/20"
    >
      <Plus size={18} strokeWidth={3} />
    </button>
  </div>

  {/* ===== CONTENT ===== */}
  <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
    
    <button
      onClick={() => {
        setCurrentProjectId("all");
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
        currentProjectId === "all"
          ? "bg-blue-600 text-white shadow-xl"
          : "hover:bg-white/5 text-slate-400 hover:text-white"
      }`}
    >
      <FolderOpen size={18} />
      <span className="text-sm font-bold">Vue Globale</span>
    </button>

    <div className="pt-8 pb-3 px-4">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/70">
        Missions
      </p>
    </div>

    <div className="space-y-1">
      {projects.map((p) => {
        const isActive = currentProjectId === p._id;
        return (
          <div key={p._id} className="group flex items-center gap-1 px-1">
            <button
              onClick={() => {
                setCurrentProjectId(p._id);
                setSidebarOpen(false);
              }}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                isActive
                  ? "bg-blue-900/40 text-blue-100 border border-blue-500/30"
                  : "hover:bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Hash size={16} />
              <span className="truncate text-sm font-medium">
                {p.name}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer ${p.name} ?`)) deleteProject(p._id);
              }}
              className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  </nav>

  {/* ===== FOOTER ===== */}
  <div className="p-4 border-t border-white/5 bg-black/20">
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white">
          {user?.name ? getInitials(user.name) : "U"}
        </div>
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
      </div>

      <div className="min-w-0">
        <span className="text-xs font-black text-white truncate">
          {user?.name || "Primazul User"}
        </span>
        <span className="text-[9px] text-blue-400 uppercase">
          Connecté(e)
        </span>
      </div>
    </div>
  </div>
</aside>

          {/* MODAL AJOUT PROJET */}
    {showProjectModal && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all">
        {/* Conteneur de la Modale */}
        <div className="bg-white rounded-[28px] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <FolderPlus size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Nouveau projet
                </h2>
                <p className="text-xs text-slate-500 font-medium">Organisez vos prochaines tâches</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowProjectModal(false);
                setNewProjectName("");
              }} 
              className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* INPUT SECTION */}
          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                Nom du projet
              </label>
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    addProject().then(() => setShowProjectModal(false));
                  }
                }}
                placeholder="Ex: Refonte Site Web 2024"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={() => {
                setShowProjectModal(false);
                setNewProjectName("");
              }}
              className="px-6 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                await addProject();
                setShowProjectModal(false);
                setNewProjectName("");
              }}
              disabled={!newProjectName.trim()}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-600/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={18} strokeWidth={3} />
              Créer le projet
            </button>
          </div>

        </div>
      </div>
    )}
  {/* MAIN */}
     <main className="flex-1 bg-slate-50 md:ml-64 flex flex-col h-screen overflow-hidden relative">
  
  {/* 1. HEADER FIXE (Aucun scroll ici) */}
  <header className="flex-none w-full bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50 z-40">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Bouton Retour */}
        <button
          onClick={() => {
            if (currentProjectId !== "all") setCurrentProjectId("all");
            else router.push(`/chat/${conversationId}`);
          }}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Titres */}
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">
            {currentProjectId === "all"
              ? "📁 Tous les projets"
              : `📌 Projet : ${currentProject?.name || "Projet"}`}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-1">
            {currentProjectId === "all" ? "Vue d'ensemble" : "Espace de travail"}
          </p>
        </div>
      </div>
    </div>
  </header>

  {/* 2. ZONE DE CONTENU DYNAMIQUE (Seule cette partie peut scroller) */}
  <div className="flex-1 overflow-y-auto no-scrollbar">
    <div className="h-full px-4 md:px-6 py-6">
      
      {currentProjectId === "all" ? (
        /* --- VUE PROJETS --- */
        projects.length === 0 ? (
          <div className="max-w-4xl mx-auto group flex flex-col items-center justify-center text-center py-20 px-8 bg-gradient-to-b from-white to-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200/80 mt-10 transition-all">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-blue-600/5 text-blue-600 rounded-[24px] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500">
                <Folder size={38} strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <Plus size={16} strokeWidth={3} />
              </div>
            </div>
            <div className="max-w-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Lancez votre aventure <span className="text-blue-600">PRIMAZUL</span>
              </h2>
              <p className="text-slate-500 font-medium text-sm mb-10">
                Créez un projet pour commencer à organiser vos tâches.
              </p>
            </div>
            <button
              onClick={() => setShowProjectModal(true)}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"
            >
              <Plus size={20} strokeWidth={3} />
              <span>Créer mon premier projet</span>
            </button>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-300"></span>
              Projets récents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredProjects.map((project) => (
                <div
                  key={project._id}
                  className="group relative border border-slate-200 rounded-[24px] p-6 bg-white hover:border-blue-400 hover:shadow-xl transition-all flex justify-between items-start cursor-pointer shadow-sm"
                  onClick={() => setCurrentProjectId(project._id)}
                >
                  <div className="text-left flex-1">
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-lg flex items-center justify-center mb-4 transition-colors">
                      <Folder size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-blue-500 font-medium">
                      Voir les tâches <ChevronRight size={12} strokeWidth={3} />
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm(`Supprimer ${project.name} ?`)) deleteProject(project._id);
                    }}
                    className="p-2 text-slate-300 hover:text-white hover:bg-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* --- VUE KANBAN (BOARD) --- */
        /* Note: Le TasksBoard doit gérer son propre scroll horizontal interne */
        <TasksBoard
          columns={columns}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDueDate={newDueDate}
          setNewDueDate={setNewDueDate}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          updateDueDate={updateDueDate}
          updateTaskStatus={updateTaskStatus}
          deleteTask={deleteTask}
          onDragEnd={onDragEnd}
          setSelectedTask={setSelectedTask}
          currentProjectId={currentProjectId}
          participants={participants}
          openTaskForEdit={openTaskForEdit}
        />
      )}
    </div>
  </div>

  {/* 3. MODALE DE DÉTAIL (En dehors du flux de scroll) */}
  <TaskDetailPopup
    task={selectedTask}
    setTask={setSelectedTask}
    updateTaskDetails={updateTaskDetails}
    addComment={addComment}
    commentText={commentText}
    setCommentText={setCommentText}
    participants={participants} 
    onCancelNewTask={async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    }}
  />
</main></div> );};

/* ================= TASKS BOARD ================= */
function TasksBoard({
  columns,
  newTitle,
  setNewTitle,
  newDueDate,
  setNewDueDate,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  updateDueDate,
  updateTaskStatus,
  deleteTask,
  onDragEnd,
  setSelectedTask,
  currentProjectId,
  participants,
  openTaskForEdit,
}) {
  const handleQuickAdd = () => {
    if (!participants.length) return;

    setSelectedTask({
      title: newTitle || "",
      description: "",
      priority: "normal",
      dueDate: newDueDate || "",
      status: "todo",
      projectId: currentProjectId !== "all" ? currentProjectId : null,
      assignees: [participants[0]._id],
      responsible: participants[0]._id,
      isNew: true,
    });

    setNewTitle("");
    setNewDueDate("");
  };

  // --- LOGIQUE DE PROGRESSION ---
  const totalTasks = columns.todo.tasks.length + columns.inProgress.tasks.length + columns.done.tasks.length;
  const doneTasks = columns.done.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden space-y-4">
      
      {/* 1. TOOLBAR (Fixe) */}
      <div className="flex-none bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 items-center justify-between mx-1">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une mission..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border">
            <Filter size={14} className="ml-2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-medium py-1.5 pr-8 outline-none"
            >
              <option value="all">Tous</option>
              <option value="todo">À faire</option>
              <option value="inProgress">En cours</option>
              <option value="done">Terminées</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border">
            <SortAsc size={14} className="ml-2 text-slate-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-sm font-medium py-1.5 pr-8 outline-none"
            >
              <option value="none">Trier</option>
              <option value="date_recent">📅 Récentes</option>
              <option value="date_oldest">📅 Anciennes</option>
              <option value="due_today">⏰ Aujourd&apos;hui</option>
              <option value="due_overdue">⚠️ En retard</option>
              <option value="due_upcoming">➡️ À venir</option>
            </select>
          </div>
        </div>

        {/* QUICK ADD */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nouvelle tâche..."
            className="flex-1 xl:w-64 px-4 py-2 border border-slate-200 rounded-lg"
          />
          <div className="flex items-center gap-2 border rounded-xl px-3 py-1 bg-white">
            <label className="text-[9px] uppercase text-slate-400">Échéance</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent"
            />
          </div>
          <button
            onClick={handleQuickAdd}
            className="bg-blue-900 hover:bg-blue-800 text-white p-2.5 rounded-lg shadow transition active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 2. KANBAN BOARD (Zone scrollable) */}
      <div className="flex-1 overflow-hidden px-1">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full h-full">
            {Object.entries(columns).map(([colId, col]) => (
              <Droppable key={colId} droppableId={colId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl p-4 transition-all duration-300 flex flex-col h-full max-h-[calc(100vh-320px)]
                      ${snapshot.isDraggingOver
                        ? "bg-blue-50 ring-2 ring-blue-200"
                        : "bg-slate-50 border border-slate-200"}
                    `}
                  >
                    {/* Header de colonne fixe */}
                    <div className="flex justify-between items-center mb-5 flex-none">
                      <h2 className="font-bold uppercase text-sm flex items-center gap-2 text-slate-700">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          colId === "done" ? "bg-green-500" : colId === "inProgress" ? "bg-amber-500" : "bg-blue-500"
                        }`} />
                        {col.title}
                      </h2>
                      <span className="text-xs font-bold bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-500">
                        {col.tasks.length}
                      </span>
                    </div>

                    {/* Liste des tâches scrollable */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
                      {col.tasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? "z-50" : ""}
                            >
                              <TaskItem
                                task={task}
                                deleteTask={deleteTask}
                                updateTaskStatus={updateTaskStatus}
                                onOpen={openTaskForEdit}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.tasks.length === 0 && (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 text-center text-xs text-slate-400 font-medium">
                          Déposer une tâche ici
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* 3. BARRE DE PROGRESSION GLOBALE (Bas de page fixe) */}
      <div className="flex-none bg-white border border-slate-200 p-5 rounded-2xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] mx-1">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Cercle Score */}
          <div className="flex items-center gap-4 flex-none">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={150.8} 
                  strokeDashoffset={150.8 - (150.8 * progressPercent) / 100} 
                  strokeLinecap="round"
                  className="text-blue-600 transition-all duration-700 ease-in-out" 
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900">
                {progressPercent}%
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Progression globale</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {doneTasks} sur {totalTasks} tâches
              </p>
            </div>
          </div>

          {/* Barre linéaire et détails */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Todo: {columns.todo.tasks.length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/> In Progress: {columns.inProgress.tasks.length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Done: {columns.done.tasks.length}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ================= TASK ITEM PROFESSIONAL VERSION ================= */
function TaskItem({ task, deleteTask, updateTaskStatus, onOpen }) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  // Palette de couleurs métier plus sobre
  const statusConfig = {
    done: { 
      text: "text-slate-400 line-through", 
      icon: "bg-emerald-500",
      border: "border-slate-200" 
    },
    inProgress: { 
      text: "text-slate-700 font-semibold", 
      icon: "bg-amber-500",
      border: "border-amber-200/50" 
    },
    todo: { 
      text: "text-slate-800 font-semibold", 
      icon: "bg-slate-300",
      border: "border-slate-200" 
    },
  };

  const currentStyle = statusConfig[task.status] || statusConfig.todo;

  const handleStatusChange = (e) => {
    e.stopPropagation();
    const nextStatus = { todo: "inProgress", inProgress: "done", done: "todo" };
    updateTaskStatus(task._id, nextStatus[task.status] || "todo");
  };

  return (
    <div
      className="group flex flex-col md:flex-row md:items-start gap-4 cursor-pointer p-4 rounded-xl border border-slate-200 hover:bg-blue-100/70 hover:ring-2 hover:ring-blue-300/60 hover:shadow-lg
 hover:border-blue-400 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-200 mb-3"
      onClick={() => onOpen(task)}
    >
      {/* 1. Indicateur de Statut Personnalisé */}
      <div className="flex items-start pt-1">
        <button
          onClick={handleStatusChange}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            task.status === "done" 
              ? "bg-emerald-500 border-emerald-500" 
              : "bg-white border-slate-300 hover:border-blue-500"
          }`}
        >
          {task.status === "done" && <Check size={12} className="text-white" strokeWidth={4} />}
        </button>
      </div>

      {/* 2. Corps de la Tâche */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Titre : Lisibilité maximale */}
        <h3 className={`text-sm md:text-[15px] leading-snug tracking-tight ${currentStyle.text}`}>
          {task.title}
        </h3>

        {/* Méta-données : Collaborateurs */}
        <div className="flex items-center gap-4">
          {task.responsibleName && (
            <div className="flex items-center gap-2 group/user">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                {task.responsibleName[0]}
              </div>
              <span className="text-xs text-slate-500 font-medium group-hover/user:text-blue-600 transition-colors">
                {task.responsibleName}
              </span>
            </div>
          )}

          {/* Séparateur discret */}
          {task.assigneesNames?.length > 1 && <div className="w-px h-3 bg-slate-200" />}

          {/* Stack d'avatars épurée pour les co-assignés */}
          <div className="flex -space-x-1.5">
            {task.assigneesNames
              ?.filter((name) => name !== task.responsibleName)
              .map((name, index) => (
                <div
                  key={index}
                  title={name}
                  className="w-6 h-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[9px] font-bold text-slate-400"
                >
                  {name[0]}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 3. Section Latérale : Badges et Actions */}
      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 flex-shrink-0 self-stretch md:self-start">
        
        <div className="flex items-center md:flex-col gap-2">
          {/* Priorité : Style minimaliste mais impactant */}
          {task.priority === "urgent" && (
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Urgent</span>
            </div>
          )}

          {/* Échéance : Focus sur la clarté */}
          {task.dueDate && (
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md ${
              isOverdue ? "text-rose-600 bg-rose-50" : "text-slate-500 bg-slate-50"
            }`}>
              <Clock size={12} />
              <span>{new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}
        </div>

        {/* Action : Discrétion */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Archiver cette mission ?")) deleteTask(task._id);
          }}
          className="md:mt-auto p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
/* ================= TASK DETAIL POPUP ================= */
function TaskDetailPopup({
  task,
  setTask,
  updateTaskDetails,
  commentText,
  setCommentText,
  addComment,
  participants,
  onCancelNewTask,
}) {
  if (!task) return null;

  const isCreationMode = task.isNew === true;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  const priorityColors = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
    normal: "bg-blue-50 text-blue-700 border-blue-100",
    urgent: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const isValid = task.title?.trim() && task.priority && task.dueDate;
  
  const handleSave = async () => {
    if (!isValid) return;
    await updateTaskDetails();
  };

  return (
    // Fond d'écran assombri (Overlay)
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      
      {/* Conteneur Principal */}
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="font-black text-2xl text-slate-900 tracking-tight">
              {isCreationMode ? "✨ Créer une mission" : "✏️ Détails de la mission"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${priorityColors[task.priority] || "bg-slate-100"}`}>
                {task.priority || "normal"}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 animate-pulse">
                  <AlertCircle size={10} /> EN RETARD
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setTask(null)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* BODY - Fond blanc pur pour le contenu principal */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-white custom-scrollbar">
          
          {/* CHAMP TITRE */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <Type size={14} /> Titre de la mission
            </label>
            <input
              value={task.title || ""}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full text-xl font-bold text-slate-800 placeholder:text-slate-200 border-none p-0 focus:ring-0 outline-none bg-transparent"
              placeholder="Ex: Rédaction du rapport..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* RESPONSABLE */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <User size={14} /> Responsable
              </label>
              <select
                value={task.responsible || ""}
                onChange={(e) => {
                  const id = e.target.value;
                  setTask(prev => ({
                    ...prev,
                    responsible: id,
                    assignees: id && !prev.assignees?.includes(id) ? [...(prev.assignees || []), id] : prev.assignees
                  }));
                }}
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer"
              >
                <option value="">Non assigné</option>
                {participants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            {/* DATE LIMITE */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <Calendar size={14} /> Échéance
              </label>
              <input
                type="date"
                value={task.dueDate?.split("T")[0] || ""}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
                className={`w-full border-none rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 transition-all cursor-pointer ${
                  isOverdue ? "bg-rose-50 text-rose-600 ring-rose-200" : "bg-slate-50 text-slate-700 ring-blue-600/20"
                }`}
              />
            </div>
          </div>

          {/* ÉQUIPE ASSIGNÉE */}
          <div className="space-y-3">
  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
    <Users size={14} /> Collaborateurs
  </label>
  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[24px]">
    {participants.map((p) => {
      // ✅ Vérifier si l'ID est dans assignees (comparer IDs, pas objets)
      const isSelected = (task.assignees || []).some(a => {
        const id = typeof a === "object" ? a._id : a;
        return id === p._id;
      });

      return (
        <button
          key={p._id}
          onClick={() => {
            let newAssignees;
            
            if (isSelected) {
              // Retirer : filtrer par ID
              newAssignees = (task.assignees || []).filter(a => {
                const id = typeof a === "object" ? a._id : a;
                return id !== p._id;
              });
            } else {
              // Ajouter : ajouter l'ID pur
              newAssignees = [...(task.assignees || []), p._id];
            }

            // ✅ Nettoyer les doublons
            const uniqueIds = [...new Set(newAssignees.map(a => 
              typeof a === "object" ? a._id : a
            ))];

            console.log("🔄 Assignés mis à jour :", uniqueIds);

            setTask({
              ...task,
              assignees: uniqueIds,
              // Si on retire le responsable, le vider aussi
              responsible: task.responsible === p._id && isSelected 
                ? "" 
                : task.responsible
            });
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all text-xs font-bold ${
            isSelected 
              ? "bg-white border-blue-600 text-blue-600 shadow-sm" 
              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white ${
            isSelected ? "bg-blue-600" : "bg-slate-300"
          }`}>
            {p.name[0]}
          </div>
          {p.name}
        </button>
      );
    })}
  </div>
</div>

          {/* DESCRIPTION */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <AlignLeft size={14} /> Description
            </label>
            <textarea
              rows="3"
              value={task.description || ""}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              placeholder="Détails de la mission..."
              className="w-full bg-slate-50 border-none rounded-[24px] p-4 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all resize-none min-h-[100px]"
            />
          </div>

          {/* PRIORITÉ SELECT */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <AlertCircle size={14} /> Niveau de priorité
            </label>
            <select
              value={task.priority || "normal"}
              onChange={(e) => setTask({ ...task, priority: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer"
            >
              <option value="low">🟢 Faible</option>
              <option value="normal">🔵 Normal</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {/* DISCUSSION */}
<div className="pt-6 border-t border-slate-100 space-y-4">
  <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
    <MessageSquare size={14} /> Discussion
  </label>

  {/* Liste des commentaires */}
  <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
    {(task.comments || []).map((c) => {
      // Calculer les initiales
      const authorName = c.author?.name || "Utilisateur";
      const initials = authorName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2) // prendre max 2 initiales
        .map((w) => w[0].toUpperCase())
        .join("");

      return (
        <div key={c._id} className="flex gap-3 group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-blue-600 uppercase">
            {initials || "?"}
          </div>

          {/* Contenu commentaire */}
          <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">
              {authorName}
            </p>
            <p className="text-sm text-slate-700 font-medium">{c.text}</p>
            <span className="text-[9px] text-slate-400 mt-1 block">
              {new Date(c.createdAt).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      );
    })}
  </div>

  {/* Ajouter un commentaire */}
  <div className="relative group">
    <input
      value={commentText}
      onChange={(e) => setCommentText(e.target.value)}
      placeholder="Écrire un message..."
      className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-4 pr-12 text-sm font-medium outline-none focus:border-blue-600 transition-all"
    />
    <button
      onClick={addComment}
      disabled={!commentText?.trim()}
      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-20 transition-all shadow-lg shadow-blue-600/20"
    >
      <Send size={16} />
    </button>
  </div>
</div>
</div>

        {/* FOOTER - Fond gris très léger pour détacher les actions */}
        <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex justify-end items-center gap-4">
          <button
            onClick={() => {
              if (isCreationMode && task._id) onCancelNewTask(task._id);
              setTask(null);
            }}
            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!isValid}
            onClick={handleSave}
            className={`px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 ${
              isValid ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30" : "bg-slate-300 cursor-not-allowed shadow-none"
            }`}
          >
            {isCreationMode ? "Lancer la mission" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}