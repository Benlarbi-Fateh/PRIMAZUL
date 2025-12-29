"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Calendar, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

/* ================= MAIN PAGE ================= */
export default function TasksPage() {
  const { id: conversationId } = useParams();
  const router = useRouter();

  /* ================= STATES ================= */
  const [tasks, setTasks] = useState([]);
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
      description: "", 
      priority: "normal",
      status: "todo",
      projectId: currentProjectId !== "all" ? currentProjectId : undefined,
    };
    if (newDueDate) payload.dueDate = newDueDate;

    const res = await api.post(`/conversations/${conversationId}/tasks`, payload);

    if (res.data?.task) {
      const createdTask = {
        ...res.data.task,
        isNew: true,
      };

      setTasks((prev) => [...prev, createdTask]);
      setSelectedTask(createdTask); // ouvre le popup directement pour compléter la description
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

  if (!selectedTask.title?.trim() || !selectedTask.priority || !selectedTask.dueDate ) {
    alert("Le titre, la priorité et la date limite sont obligatoires.");
    return;
  }

  try {
    let res;

    if (selectedTask.isNew) {
      res = await api.post(`/conversations/${conversationId}/tasks`, {
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate,
        status: selectedTask.status,
        projectId: selectedTask.projectId,
      });

      if (res.data?.task) {
        setTasks((prev) => [...prev, res.data.task]);
      }
    } else {
      res = await api.patch(`/tasks/${selectedTask._id}`, {
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
    }

    setSelectedTask(null);
  } catch (err) {
    console.error("SAVE TASK ERROR:", err);
  }
};

 const addComment = async () => {
  if (!commentText.trim() || !selectedTask) return;
  try {
    const res = await api.post(`/tasks/${selectedTask._id}/comments`, {
      text: commentText.trim(),
    });

    if (res.data?.comment) {
      // met à jour la tâche sélectionnée
      const updatedTask = {
        ...selectedTask,
        comments: [...(selectedTask.comments || []), res.data.comment],
      };
      setSelectedTask(updatedTask);

      // met à jour la liste globale des tâches
      setTasks((prev) =>
        prev.map((t) =>
          t._id === updatedTask._id ? updatedTask : t
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
    <div className="min-h-screen flex bg-blue-50">
      {/* SIDEBAR */}
      <aside
  className="fixed left-0 top-0 h-screen w-64
             hidden md:flex flex-col
             bg-blue-800 text-white
             border-r border-blue-700
             shadow-xl z-40"
>
  {/* ===== SIDEBAR HEADER ===== */}
  <div className="flex items-center justify-between px-4 py-4 border-b border-blue-700">
    <h2 className="font-semibold text-lg tracking-wide">
      Projets
    </h2>

    {/* Bouton ajouter projet */}
    <button
      onClick={() => setShowProjectModal(true)}
      title="Ajouter un nouveau projet"
      className="
        w-10 h-10 flex items-center justify-center
        rounded-full
        bg-blue-600 hover:bg-blue-500
        text-white text-xl font-bold
        shadow-md hover:shadow-lg
        transition-all duration-200
      "
    >
      +
    </button>
  </div>

  {/* ===== CONTENU SCROLLABLE ===== */}
  <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
    {/* Tous les projets */}
    <button
      onClick={() => setCurrentProjectId('all')}
      className={`w-full px-3 py-2 rounded-md text-left transition
        ${
          currentProjectId === 'all'
            ? 'bg-blue-600'
            : 'hover:bg-blue-700'
        }`}
    >
      📁 Tous les projets
    </button>

    {/* Liste des projets */}
    {projects.map((p) => (
      <div
        key={p._id}
        className="flex items-center gap-2 group"
      >
        <button
          onClick={() => setCurrentProjectId(p._id)}
          className={`flex-1 px-3 py-2 rounded-md text-left transition
            ${
              currentProjectId === p._id
                ? 'bg-blue-600'
                : 'hover:bg-blue-700'
            }`}
        >
          {p.name}
        </button>

        <button
          onClick={() => deleteProject(p._id)}
          className="
            p-2 rounded-md
            opacity-0 group-hover:opacity-100
            hover:bg-red-600
            transition
          "
          title="Supprimer le projet"
        >
          <Trash2 size={16} className="text-red-300" />
        </button>
      </div>
    ))}
  </div>
</aside>

          {showProjectModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4 shadow-lg">
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-blue-900">
          ➕ Nouveau projet
        </h2>
        <button
          onClick={() => setShowProjectModal(false)}
          className="text-gray-500 hover:text-black"
        >
          ✖
        </button>
      </div>

      <input
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
        placeholder="Nom du projet"
        className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowProjectModal(false)}
          className="px-4 py-2 rounded border"
        >
          Annuler
        </button>
        <button
          onClick={async () => {
            await addProject();
            setShowProjectModal(false);
          }}
          disabled={!newProjectName.trim()}
          className="px-4 py-2 rounded bg-blue-900 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>

    </div>
  </div>
)}

      {/* MAIN */}
      <main className="flex-1 p-6 bg-blue-50 md:ml-64">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4 max-w-7xl mx-auto">
          <button
            onClick={() => {
              if (currentProjectId !== "all") setCurrentProjectId("all");
              else router.push(`/chat/${conversationId}`);
            }}
            className="p-2 rounded-full bg-blue-900 text-white hover:bg-blue-700 transition"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-blue-900 transition-all duration-200">
            {currentProjectId === "all"
              ? "📁 Tous les projets"
              : `📌 Projet : ${currentProject?.name || "Projet"}`}
          </h1>
        </div>

        {/* CONTENT */}
        {currentProjectId === "all" ? (
          projects.length === 0 ? (
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
                className="bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                + Créer un projet
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto mt-6">
  <h2 className="text-lg font-semibold mb-4">📁 Projets récents</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {filteredProjects.slice(0, 6).map((project) => (
      <div
        key={project._id}
        className="border rounded-lg p-4 bg-white hover:shadow-lg transition flex justify-between items-start"
      >
        {/* Clic pour ouvrir le projet */}
        <button
          onClick={() => setCurrentProjectId(project._id)}
          className="text-left flex-1"
        >
          <h3 className="font-semibold text-blue-800">{project.name}</h3>
          <p className="text-sm text-gray-500 mt-1">Voir les tâches →</p>
        </button>

        {/* Bouton supprimer */}
        <button
          onClick={() => deleteProject(project._id)}
          className="p-2 hover:bg-red-600 rounded ml-2"
        >
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    ))}
  </div>
</div>

          )
        ) : (
          <TasksBoard
            columns={columns}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newDueDate={newDueDate}
            setNewDueDate={setNewDueDate}
            addTask={addTask}
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
          />
        )}

        {/* TASK DETAIL POPUP */}
        <TaskDetailPopup
  task={selectedTask}
  setTask={setSelectedTask}
  updateTaskDetails={updateTaskDetails}
  addComment={addComment}
  commentText={commentText}
  setCommentText={setCommentText}
  onCancelNewTask={async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }}
/>
      </main>
    </div>
  );
};

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
}) {
  return (
    <>
      {/* SEARCH + FILTER */}
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
          <option value="due_today">⏰ Aujourd’hui</option>
          <option value="due_overdue">⚠️ En retard</option>
          <option value="due_upcoming">➡️ À venir</option>
        </select>
      </div>

     {/* ADD TASK */}
<div className="flex gap-2 max-w-7xl mx-auto mb-4">
  {/* Titre optionnel (pré-remplissage) */}
  <input
    value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    placeholder="Titre de la tâche (optionnel)"
    className="border p-2 rounded flex-1"
    
  />

  <div className="flex items-center gap-2">
    {/* Date limite (info claire) */}
    <div className="flex items-center gap-1 text-gray-500 text-sm">
      <Calendar size={16} />
      <span>Date limite</span>
    </div>

    <input
      type="date"
      value={newDueDate}
      onChange={(e) => setNewDueDate(e.target.value)}
      className="border p-2 rounded"
    />

    {/* Bouton + : OUVRE LE POPUP, TOUJOURS */}
    <button
  onClick={() => {
    setSelectedTask({
      title: newTitle || "",
      description: "", 
      priority: "normal",
      dueDate: newDueDate || "",
      status: "todo",
      projectId:
        currentProjectId !== "all" ? currentProjectId : null,
      isNew: true,
    });

    // reset champs rapides
    setNewTitle("");
    setNewDueDate("");
  }}
  className="bg-blue-900 hover:bg-blue-700 text-white p-2 rounded"
  title="Créer une nouvelle tâche"
>
  <Plus />
</button>
  </div>
</div>

      {/* TASKS COLUMNS */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 max-w-7xl mx-auto">
          {Object.entries(columns).map(([colId, col]) => (
            <Droppable key={colId} droppableId={colId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-3 border rounded-lg min-h-[400px] shadow-md transition-colors duration-200 ${
                    snapshot.isDraggingOver ? "bg-blue-100" : "bg-white"
                  }`}
                >
                  <h2 className="font-semibold mb-2 flex justify-between items-center text-blue-800">
                    {col.title}
                    <span className="text-sm text-gray-500">{col.tasks.length}</span>
                  </h2>

                  {col.tasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 mb-3 bg-white rounded-lg shadow hover:shadow-lg transition-colors duration-200 cursor-pointer ${
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
    </>
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
      className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded transition"
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
        className="accent-blue-700"
      />
      <span className={`flex-1 ${textStyle} text-blue-900`}>{task.title}</span>
      {task.priority && (
        <span className={`px-2 py-0.5 rounded text-xs`}>
          {task.priority === "urgent" && <span>🔴</span>}
        </span>
      )}
      <span className={`text-xs ${isOverdue ? "text-red-600 font-bold" : "text-gray-500"}`}>
        {task.dueDate ? task.dueDate.split("T")[0] : ""}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task._id);
        }}
        className="hover:text-red-600 transition"
      >
        <Trash2 size={16} />
      </button>
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
  onCancelNewTask,
}) {
  if (!task) return null;

  const isCreationMode = task.isNew === true;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    normal: "bg-yellow-100 text-yellow-800",
    urgent: "bg-red-100 text-red-800",
  };
  const isValid =
  task.title?.trim() &&
  task.priority &&
  task.dueDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-lg p-6 space-y-4 shadow-lg">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-blue-900">
            {isCreationMode ? "✨ Nouvelle tâche" : "✏️ Modifier la tâche"}
          </h2>

          <button
            onClick={async () => {
              setTask(null);
            }}
            className="text-gray-500 hover:text-black"
          >
            ✖
          </button>
        </div>

        {/* PRIORITY */}
        <div className={`px-2 py-1 w-max rounded ${priorityColors[task.priority] || ""}`}>
          Priorité : {task.priority || "normal"}
        </div>

        {/* TITLE */}
        <label className="font-semibold">Titre</label>
        <input
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          className="border p-2 w-full rounded"
        />

        {/* DESCRIPTION */}
        <label className="font-semibold">Description</label>
<textarea
  value={task.description || ""}
  onChange={(e) => setTask({ ...task, description: e.target.value })}
  placeholder="Ajouter une description..."
  className="border p-2 w-full rounded"
/>
        {/* PRIORITY SELECT */}
        <label className="font-semibold">Priorité</label>
        <select
          value={task.priority || "normal"}
          onChange={(e) => setTask({ ...task, priority: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="low">🟢 Faible</option>
          <option value="normal">🟡 Normal</option>
          <option value="urgent">🔴 Urgent</option>
        </select>

        {/* DUE DATE */}
        <label className="font-semibold">Date limite</label>
        <div className={`flex items-center gap-2 ${isOverdue ? "text-red-600 font-bold" : ""}`}>
          ⏰
          <input
            type="date"
            value={task.dueDate?.split("T")[0] || ""}
            onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
            className="border p-2 rounded"
          />
        </div>

        {/* COMMENTS */}
        <label className="font-semibold">Commentaires</label>
        <div>
          {(task.comments || []).map((c) => (
            <div key={c._id} className="text-sm border-b py-1">
              {c.text}
            </div>
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
              className="bg-blue-900 hover:bg-blue-700 text-white p-2 rounded"
            >
              +
            </button>
          </div>
        </div>

        {/* SAVE */}
        <button
  disabled={!isValid}
  onClick={updateTaskDetails}
  className={`px-4 py-2 rounded w-full text-white transition ${
    isValid
      ? "bg-blue-900 hover:bg-blue-700"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  {isCreationMode ? "Créer & enregistrer" : "Enregistrer les modifications"}
</button>
      </div>
    </div>
  );
}