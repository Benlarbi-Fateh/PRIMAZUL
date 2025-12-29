"use client";
import { useState } from "react";
import TaskItem from "@/components/taches/TacheItem"; // On utilise directement l'item
import {
  Plus,
  Clock as ClockIcon,
  X,
  GraduationCap,
  Briefcase,
  ShoppingCart,
  Film,
  Dumbbell,
  LayoutGrid,
} from "lucide-react";

// Styles
const CATEGORY_STYLES = {
  school: {
    icon: GraduationCap,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  work: {
    icon: Briefcase,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  shopping: {
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  movies: {
    icon: Film,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  sports: {
    icon: Dumbbell,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  default: {
    icon: LayoutGrid,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-100",
  },
};

const CATEGORY_LABELS = {
  school: "École",
  work: "Travail",
  shopping: "Courses",
  movies: "Films",
  sports: "Sports",
};

export default function CategoryPanel({
  category,
  tasks,
  onAddTask,
  onDeleteTask,
  onClosePanel,
}) {
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState("medium");

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
  const Icon = style.icon;
  const label = CATEGORY_LABELS[category] || category;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    let startTime = null;
    if (time) {
      const [h, m] = time.split(":");
      startTime = new Date();
      startTime.setHours(h, m, 0, 0);
    }

    onAddTask({
      text,
      priority,
      startTime: startTime ? startTime.toISOString() : null,
    });
    setText("");
    setTime("");
  };

  // Tri chronologique
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  return (
    <div
      className={`rounded-[2rem] shadow-lg border p-6 hover:shadow-xl transition-all duration-300 group relative ${style.bg} ${style.border}`}
    >
      {/* BOUTON FERMER (Supprimer le panneau) */}
      <button
        onClick={onClosePanel}
        className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-red-500 hover:text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
        title="Fermer cette catégorie"
      >
        <X size={16} />
      </button>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm ${style.color}`}
        >
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{label}</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {tasks.length} Tâches
          </p>
        </div>
      </div>

      {/* FORMULAIRE D'AJOUT COMPACT */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-white border border-transparent focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
            placeholder="Ajouter..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
          </button>
        </div>

        {text && (
          <div className="flex gap-2 mt-2 animate-fade-in-down">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-white rounded-lg px-2 py-1 text-xs border-none shadow-sm"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-white rounded-lg px-2 py-1 text-xs border-none shadow-sm"
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Urgent</option>
            </select>
          </div>
        )}
      </form>

      {/* LISTE CHRONOLOGIQUE */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <p className="text-center text-slate-400 text-xs italic py-4">
            Rien à faire ici ! 🎉
          </p>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onDelete={() => onDeleteTask(task._id)}
              onUpdate={() => window.location.reload()} // Simple refresh pour l'exemple
            />
          ))
        )}
      </div>
    </div>
  );
}
