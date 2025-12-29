"use client";
import { format } from "date-fns";
import { Trash2, Clock, CheckCircle2, Circle } from "lucide-react";
import api from "@/lib/api";

export default function TaskItem({ task, onDelete, onUpdate }) {
  const toggleComplete = async () => {
    try {
      await api.put(`/tache/${task._id}`, { completed: !task.completed });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // ✅ Empêche le clic de se propager
    if (confirm("Supprimer cette tâche ?")) {
      onDelete(task._id);
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case "high":
        return "bg-red-100 text-red-600";
      case "medium":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  return (
    <div
      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
        task.completed
          ? "bg-slate-50 border-slate-100 opacity-60"
          : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100"
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={toggleComplete}
          className="transition-transform active:scale-90 flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2
              className="text-emerald-500 fill-emerald-50"
              size={24}
            />
          ) : (
            <Circle
              className="text-slate-300 group-hover:text-indigo-500 transition-colors"
              size={24}
            />
          )}
        </button>

        <div className="flex flex-col min-w-0">
          <span
            className={`font-semibold truncate transition-all ${
              task.completed ? "text-slate-400 line-through" : "text-slate-800"
            }`}
          >
            {task.text}
          </span>

          <div className="flex items-center gap-2 mt-1">
            {task.startTime && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-slate-100 px-1.5 py-0.5 rounded">
                <Clock size={10} /> {format(new Date(task.startTime), "HH:mm")}
              </span>
            )}
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${getPriorityColor()}`}
            >
              {task.priority}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ BOUTON SUPPRESSION CORRIGÉ */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        title="Supprimer"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
