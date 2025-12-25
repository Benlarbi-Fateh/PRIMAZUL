"use client";

import { useState } from "react";
import api from "@/lib/api";
import { X } from "lucide-react";

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
    await api.put(`/tasks/${task._id}`, { notes });
    refresh();
  };

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Checkbox + text */}
      <label className="flex items-center gap-3 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={toggle}
          className="w-4 h-4 rounded-full accent-blue-600"
        />

        <span
          className={`text-sm ${
            task.completed
              ? "line-through text-slate-400"
              : "text-slate-200"
          }`}
        >
          {task.text}
        </span>
      </label>

      {/* Delete */}
      <X
        onClick={remove}
        className="text-slate-400 hover:text-red-500 cursor-pointer"
        size={16}
      />
    </div>
  );
}
