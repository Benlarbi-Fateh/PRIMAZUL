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

  const [currentProjectId, setCurrentProjectId] = useState("all");
  const [newProjectName, setNewProjectName] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortOption, setSortOption] = useState("none");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

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

      const res = await api.post(
        `/conversations/${conversationId}/tasks`,
        payload
      );

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
    in_progress: { title: "En cours", tasks: filteredTasks.filter((t) => t.status === "in_progress") },
    done: { title: "Terminées", tasks: filteredTasks.filter((t) => t.status === "done") },
  };

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
          <button onClick={() => router.push(`/chat/${conversationId}`)}>
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Tâches</h1>
        </div>

        {/* SEARCH + SORT + ADD TASK */}
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
            <option value="in_progress">En cours</option>
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

        {/* DRAG & DROP COLUMNS */}
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
                      {col.title} <span className="text-sm text-gray-500">{col.tasks.length}</span>
                    </h2>
                    {col.tasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
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
      </main>
    </div>
  );
}

/* ================= TASK ITEM ================= */
function TaskItem({ task, deleteTask, updateDueDate, updateTaskStatus }) {
  let textStyle = "";
  if (task.status === "done") textStyle = "line-through text-gray-400";
  else if (task.status === "in_progress") textStyle = "italic text-yellow-700";

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => {
          if (task.status === "todo") updateTaskStatus(task._id, "in_progress");
          else if (task.status === "in_progress") updateTaskStatus(task._id, "done");
          else if (task.status === "done") updateTaskStatus(task._id, "todo");
        }}
      />
      <span className={`flex-1 ${textStyle}`}>{task.title}</span>
      <input
        type="date"
        value={task.dueDate ? task.dueDate.split("T")[0] : ""}
        onChange={(e) => updateDueDate(task._id, e.target.value)}
        className="border p-1 rounded text-sm"
      />
      <button onClick={() => deleteTask(task._id)}>
        <Trash2 size={16} className="text-red-500" />
      </button>
    </div>
  );
}
