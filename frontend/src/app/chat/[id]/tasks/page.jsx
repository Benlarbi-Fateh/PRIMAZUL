"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Calendar, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TasksPage() {
  const { id: conversationId } = useParams();
  const router = useRouter();

  /* ================= STATES ================= */
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState("");


  const [currentProjectId, setCurrentProjectId] = useState("all");
  const [newProjectName, setNewProjectName] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortOption, setSortOption] = useState("none");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState("");

  /* ================= FETCH TASKS ================= */
  const fetchTasks = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await api.get(`/conversations/${conversationId}/tasks`);
      setTasks(Array.isArray(res.data?.tasks) ? res.data.tasks : []);
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
  }, [fetchTasks, fetchProjects]);

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

  /* ================= ADD TASK ================= */
  const addTask = async () => {
    if (!newTitle.trim() || adding) return;
    setAdding(true);
    try {
      const payload = {
        title: newTitle.trim(),
        projectId: currentProjectId !== "all" ? currentProjectId : undefined,
        status: "todo",
      };
      if (newDueDate) payload.dueDate = newDueDate;

      const res = await api.post(`/conversations/${conversationId}/tasks`, payload);

      if (res.data?.task) {
        setTasks((prev) => [...prev, res.data.task]);
        setNewTitle("");
        setNewDueDate("");
      }
    } catch (err) {
      console.error("ADD TASK ERROR:", err);
    } finally {
      setAdding(false);
    }
  };

  /* ================= UPDATE TASK ================= */
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      if (res.data?.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
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
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
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
      const res = await api.patch(`/tasks/${selectedTask._id}`, {
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate,
      });
      if (res.data?.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === selectedTask._id ? res.data.task : t))
        );
      }
      setSelectedTask(null);
    } catch (err) {
      console.error("UPDATE TASK DETAILS ERROR:", err);
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    try {
      const res = await api.post(`/tasks/${selectedTask._id}/comments`, { text: commentText });
      if (res.data?.comment) {
        setSelectedTask({
          ...selectedTask,
          comments: [...(selectedTask.comments || []), res.data.comment],
        });
        setTasks((prev) =>
          prev.map((t) =>
            t._id === selectedTask._id
              ? { ...t, comments: [...(t.comments || []), res.data.comment] }
              : t
          )
        );
        setCommentText("");
      }
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
      case "important":
        result = result.filter((t) => t.important === true);
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

  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex bg-white">
      {/* SIDEBAR */}
      <aside className="w-64 border-r p-4 hidden md:flex flex-col gap-3">
        <h2 className="font-semibold">Projets</h2>
        <button
          onClick={() => setCurrentProjectId("all")}
          className={`p-2 rounded text-left ${
            currentProjectId === "all" ? "bg-black text-white" : "hover:bg-gray-100"
          }`}
        >
          Tous les projets
        </button>
        {projects.map((p) => (
          <div key={p._id} className="flex justify-between items-center">
            <button
              onClick={() => setCurrentProjectId(p._id)}
              className={`p-2 rounded text-left flex-1 ${
                currentProjectId === p._id ? "bg-black text-white" : "hover:bg-gray-100"
              }`}
            >
              {p.name}
            </button>
            <button onClick={() => deleteProject(p._id)} className="p-2">
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        ))}
        <div className="mt-auto space-y-2">
          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Nouveau projet"
            className="border p-2 rounded w-full"
          />
          <button onClick={addProject} className="w-full bg-black text-white p-2 rounded">
            + Ajouter projet
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4 max-w-7xl mx-auto">
          <button
  onClick={() => {
    if (currentProjectId !== "all") {
      setCurrentProjectId("all");
    } else {
      router.push(`/chat/${conversationId}`);
    }
  }}
>
  <ArrowLeft />
</button>

          <h1 className="text-xl font-bold transition-all duration-200">
          {currentProjectId === "all"
          ? "📁 Tous les projets"
          : `📌 Projet : ${currentProject?.name || "Projet"}`}
        </h1>

        </div>

        {/* ================= BARRE SUPÉRIEURE ================= */}
    {currentProjectId === "all" ? (
      /* 🔍 RECHERCHE DE PROJETS */
        <div className="flex gap-2 max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-2 border p-2 rounded flex-1">
        <Search size={16} className="text-gray-400" />
        <input
        value={projectSearch}
        onChange={(e) => setProjectSearch(e.target.value)}
        placeholder="Rechercher un projet…"
        className="flex-1 outline-none"
        />
       </div>
      </div>
    ) : (
  /* 🔍 RECHERCHE + ➕ AJOUT DE TÂCHE */
  <>
    <div className="flex flex-wrap gap-2 max-w-7xl mx-auto mb-4">
      <div className="flex items-center gap-2 border p-2 rounded flex-1">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une tâche…"
          className="flex-1 outline-none"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="all">Toutes</option>
        <option value="todo">À faire</option>
        <option value="inProgress">En cours</option>
        <option value="done">Terminées</option>
      </select>

      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="none">Trier</option>
        <option value="date_recent">📅 Récentes</option>
        <option value="date_oldest">📅 Anciennes</option>
        <option value="important">⭐ Importantes</option>
        <option value="due_today">⏰ Aujourd’hui</option>
        <option value="due_overdue">⚠️ En retard</option>
        <option value="due_upcoming">➡️ À venir</option>
      </select>
    </div>

    {/* ➕ AJOUT TÂCHE */}
    <div className="flex gap-2 max-w-7xl mx-auto mb-4">
      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Nouvelle tâche…"
        className="border p-2 rounded flex-1"
      />
      <div className="flex items-center gap-2">
        <Calendar size={16} />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={addTask}
          disabled={!newTitle.trim()}
          className="bg-black text-white p-2 rounded"
        >
          <Plus />
        </button>
      </div>
    </div>
  </>
)}
     {/* ================= CONTENU CENTRAL ================= */}
{currentProjectId === "all" ? (
  projects.length === 0 ? (
    /* CAS 1 : Aucun projet */
    <div className="flex flex-col items-center justify-center text-center mt-20 text-gray-600">
      <h2 className="text-xl font-semibold mb-2">
        🚀 Créez votre premier projet Primazul
      </h2>
      <p className="mb-4">
        Organisez vos tâches et collaborez avec vos amis en toute simplicité.
      </p>
      <button
        onClick={() =>
          document
            .querySelector("input[placeholder='Nouveau projet']")
            ?.focus()
        }
        className="bg-black text-white px-4 py-2 rounded"
      >
        + Créer un projet
      </button>
    </div>
  ) : (
    /* CAS 2 : Projets récents */
    <div className="max-w-7xl mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-4">📁 Projets récents</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProjects.slice(0, 6).map((project) => (
          <button
            key={project._id}
            onClick={() => setCurrentProjectId(project._id)}
            className="border rounded p-4 text-left hover:shadow transition"
          >
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Voir les tâches →
            </p>
          </button>
        ))}
      </div>
    </div>
  )
) : (
  <DragDropContext onDragEnd={onDragEnd}>
    <div className="flex gap-4 max-w-7xl mx-auto">
      {Object.entries(columns).map(([colId, col]) => (
        <Droppable key={colId} droppableId={colId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-2 border rounded min-h-[400px] transition-colors duration-200 ${
                snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <h2 className="font-semibold mb-2 flex justify-between items-center">
                {col.title}
                <span className="text-sm text-gray-500">
                  {col.tasks.length}
                </span>
              </h2>

              {col.tasks.map((task, index) => (
                <Draggable
                  key={task._id}
                  draggableId={task._id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-2 mb-2 bg-white rounded shadow transition-colors duration-200 ${
                        snapshot.isDragging ? "bg-blue-100" : ""
                      }`}
                    >
                      <TaskItem
                        task={task}
                        deleteTask={deleteTask}
                        updateDueDate={updateDueDate}
                        updateTaskStatus={updateTaskStatus}
                        onOpen={setSelectedTask}
                      />
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  </DragDropContext>
)}


       {/* POP-UP DÉTAILS TÂCHE */}
{selectedTask && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-lg rounded p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Détails de la tâche</h2>
        <button onClick={() => setSelectedTask(null)}>✖</button>
      </div>

      {/* Titre */}
      <label className="font-semibold">Titre</label>
      <input
        value={selectedTask.title}
        onChange={(e) =>
          setSelectedTask({ ...selectedTask, title: e.target.value })
        }
        className="border p-2 w-full rounded"
      />

      {/* Description */}
      <label className="font-semibold">Description</label>
      <textarea
        value={selectedTask.description}
        onChange={(e) =>
          setSelectedTask({ ...selectedTask, description: e.target.value })
        }
        placeholder="Description..."
        className="border p-2 w-full rounded"
      />

      {/* Priorité */}
      <label className="font-semibold">Priorité</label>
      <select
        value={selectedTask.priority}
        onChange={(e) =>
          setSelectedTask({ ...selectedTask, priority: e.target.value })
        }
        className="border p-2 rounded w-full"
      >
        <option value="low">🟢 Faible</option>
        <option value="normal">🟡 Normal</option>
        <option value="urgent">🔴 Urgent</option>
      </select>

      {/* Date limite */}
      <label className="font-semibold">Date limite</label>
      <div
        className={`flex items-center gap-2 ${
          selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date()
            ? "text-red-600 font-bold"
            : ""
        }`}
      >
        ⏰
        <input
          type="date"
          value={selectedTask.dueDate?.split("T")[0] || ""}
          onChange={(e) =>
            setSelectedTask({ ...selectedTask, dueDate: e.target.value })
          }
          className="border p-2 rounded"
        />
      </div>

      {/* Commentaires */}
      <label className="font-semibold">Commentaires</label>
      <div>
        {selectedTask.comments?.map((c) => (
          <div key={c._id} className="text-sm border-b py-1">{c.text}</div>
        ))}

        <div className="flex gap-2 mt-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="border p-2 w-full rounded"
          />
          <button
            onClick={addComment}
            className="bg-black text-white p-2 rounded"
          >
            +
          </button>
        </div>
      </div>

      <button
        className="bg-black text-white px-4 py-2 rounded w-full"
        onClick={updateTaskDetails}
      >
        Fermer & Sauvegarder
      </button>
    </div>
  </div>
)}
      </main>
    </div>
  );
}

/* ================= TASK ITEM ================= */
function TaskItem({ task, deleteTask, updateDueDate, updateTaskStatus, onOpen }) {
  let textStyle = "";
  if (task.status === "done") textStyle = "line-through text-gray-400";
  else if (task.status === "inProgress") textStyle = "italic text-yellow-700";

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  return (
    <div
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => onOpen(task)}
    >
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={(e) => {
          e.stopPropagation();
          if (task.status === "todo") updateTaskStatus(task._id, "inProgress");
          else if (task.status === "inProgress") updateTaskStatus(task._id, "done");
          else updateTaskStatus(task._id, "todo");
        }}
      />
      <span className={`flex-1 ${textStyle}`}>{task.title}</span>

      <span className={`text-xs ${isOverdue ? "text-red-600 font-bold" : "text-gray-500"}`}>
        {task.dueDate ? task.dueDate.split("T")[0] : ""}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task._id);
        }}
      >
        <Trash2 size={16} className="text-red-500" />
      </button>
    </div>
  );
}
