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
}) {
  const title = CATEGORY_LABELS[category];
  const [newTaskText, setNewTaskText] = useState("");

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await onAddTask(newTaskText);
    setNewTaskText("");
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 border border-slate-200 p-8 w-full">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {title}
        </h2>

        {onDeleteCategory && (
          <button
            onClick={onDeleteCategory}
            className="text-red-500 hover:text-red-700 font-bold text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Écrire une tâche..."
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        className="w-full px-4 py-3 mb-8 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
      />

      {/* Listes */}
      <div className="flex flex-col gap-5 w-full">
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
