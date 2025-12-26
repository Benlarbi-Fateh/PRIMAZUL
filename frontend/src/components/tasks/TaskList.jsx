"use client";

export default function TaskList({ list, onDeleteTask }) {
  if (!list) return null;

  return (
    <div className="w-full">
      {/* Titre de la liste */}
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        {list.title}
      </h3>

      {/* Liste des tâches */}
      <div className="flex flex-col gap-3 w-full">
        {list.tasks.length === 0 ? (
          <div className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
            Aucune tâche
          </div>
        ) : (
          list.tasks.map((task) => (
            <div
              key={task._id}
              className="w-full px-4 py-3 bg-white rounded-xl flex justify-between items-center border border-slate-200 shadow-sm"
            >
              <span className="text-slate-800">{task.text}</span>

              <button
                onClick={() => onDeleteTask(list._id, task._id)}
                className="text-red-500 font-bold hover:scale-110 transition"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
