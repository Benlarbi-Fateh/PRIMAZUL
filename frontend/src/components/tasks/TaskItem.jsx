import { useState } from "react";
import api from "@/lib/api";

export default function TaskItem({ task, refresh }) {
  const [notes, setNotes] = useState(task.notes || "");

  const toggle = async () => {
    await api.put(`/tasks/${task._id}`, {
      completed: !task.completed,
    });
    refresh();
  };

  const remove = async () => {
    await api.delete(`/tasks/${task._id}`);
    refresh();
  };

  const saveNotes = async () => {
    await api.put(`/tasks/${task._id}`, {
      notes,
    });
    refresh();
  };

  return (
    <div className="flex flex-col gap-2 border p-2 rounded">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={toggle}
            className="accent-blue-500"
          />
          <span className={task.completed ? "line-through text-gray-400" : ""}>
            {task.text}
          </span>
        </div>
        <button onClick={remove} className="text-red-400 hover:text-red-600">
          ✕
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes} // sauvegarde automatiquement quand on quitte le champ
        placeholder="Ajoute tes notes ici..."
        className="w-full border rounded p-1 text-sm"
      />
    </div>
  );
}
