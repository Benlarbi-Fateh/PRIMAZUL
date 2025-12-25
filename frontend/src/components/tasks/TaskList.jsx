"use client";

import TaskItem from "./TaskItem";

export default function TaskList({ list, onDeleteTask }) {
  if (!list) return null;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-bold text-lg mb-4">{list.title}</h3>
      
      <div className="flex flex-col gap-3">
        {list.tasks.length === 0 ? (
  <div className="w-full px-4 py-2 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 min-h-[48px]">
    <p className="text-gray-500">Aucune tâche</p>
  </div>
) : (
  list.tasks.map((task) => (
    <div
      key={task._id}
      className="w-full px-4 py-2 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-200"
    >
      <span className="text-slate-800">{task.text}</span>
      <button
        onClick={() => onDeleteTask(list._id, task._id)}
        className="text-red-500 font-bold ml-2"
      >
        X
      </button>
    </div>
  ))
)}

      </div>
    </div>
  );
}
