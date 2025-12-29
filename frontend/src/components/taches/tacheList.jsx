"use client";
import TaskItem from "./TacheItem";
import api from "@/lib/api"; // Import nécessaire si vous voulez gérer la suppression ici

export default function TaskList({ list, onDeleteTask }) {
  if (!list) return null;

  // ✅ Wrapper pour gérer la suppression locale si besoin
  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tache/${taskId}`);
      if (onDeleteTask) onDeleteTask(); // Rafraîchir la liste parente
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 w-full">
        {list.tasks.length === 0 ? (
          <div className="w-full px-4 py-6 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs italic">
            Aucune tâche pour le moment
          </div>
        ) : (
          list.tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onDelete={handleDeleteTask} // ✅ On passe la fonction wrapper
              onUpdate={onDeleteTask} // Pour rafraîchir après modification
            />
          ))
        )}
      </div>
    </div>
  );
}
