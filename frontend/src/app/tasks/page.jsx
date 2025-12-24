"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import TaskList from "@/components/tasks/TaskList";

export default function TasksPage() {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await api.get("/task-lists");
      setLists(res.data);
    } catch (error) {
      console.error("Erreur chargement listes", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-6">
      <h1 className="text-3xl font-bold text-white text-center mb-10">
        Listes de tâches
      </h1>

      <div className="flex flex-wrap gap-6 justify-center">
        {lists.map((list) => (
          <TaskList key={list._id} list={list} />
        ))}
      </div>
    </div>
  );
}
