"use client";

import TaskList from "@/components/tasks/TaskList";
import { useState } from "react";

const CATEGORY_LABELS = {
  school: "École",
  work: "Travail",
  shopping: "Courses",
  movies: "Films",
  sports: "Sports",
};

export default function CategoryPanel({
  category,
  lists,
  onAddTask,
  onDeleteTask,
  onDeleteCategory,
  onCreateList,
}) {
  const title = CATEGORY_LABELS[category];
  const [newTaskText, setNewTaskText] = useState("");

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await onAddTask(newTaskText);
    setNewTaskText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddTask();
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 border border-slate-200 p-6">
      
      {/* Bloc titre + bouton X */}
      <div className="w-full px-4 py-2 mb-6 bg-slate-50 rounded-xl flex justify-between items-center shadow-sm hover:bg-slate-100 transition">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {onDeleteCategory && (
          <button
            onClick={onDeleteCategory}
            className="text-red-500 hover:text-red-700 font-bold"
            title="Supprimer la catégorie"
          >
            ✕
          </button>
        )}
      </div>

      {/* Input nouvelle tâche */}
      <input
        type="text"
        placeholder="Écrire une tâche..."
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        onKeyDown={handleKeyPress}
        className="w-full px-4 py-2 mb-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {/* Listes de tâches */}
      <div className="grid gap-5 md:grid-cols-2">
        {lists.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Aucune tâche dans cette catégorie
          </p>
        ) : (
          lists.map((list) => (
            <TaskList
              key={list._id}
              list={list}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
