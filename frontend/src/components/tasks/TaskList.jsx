"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import TaskItem from "./TaskItem";

export default function TaskList({ list }) {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const res = await api.get(`/tasks/${list._id}`);
    setTasks(res.data);
  };

  const addTask = async () => {
    if (!text) return;
    await api.post("/tasks", {
      text,
      listId: list._id,
    });
    setText("");
    fetchTasks();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 w-80">
      <h2 className="font-semibold text-lg mb-4">{list.title}</h2>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task._id} task={task} refresh={fetchTasks} />
        ))}
      </div>

      <div className="flex mt-4 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nouvelle tâche"
          className="border rounded-lg px-2 py-1 w-full"
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-3 rounded-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
