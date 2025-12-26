"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import RightSidebar from "./RightSidebar";
import CategoryPanel from "./CategoryPanel";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import { useCallback } from "react";
import { useRouter } from "next/navigation"; // déjà Next.js 13+


export default function TasksPage() {
  const [listsByCategory, setListsByCategory] = useState({});
  const [activeCategories, setActiveCategories] = useState(() => {
  if (typeof window === "undefined") return ["school"];
  const saved = localStorage.getItem("activeCategories");
  return saved ? JSON.parse(saved) : ["school"];
});

const router = useRouter();
  // === Fetch listes + tâches pour une catégorie ===
const fetchListsAndTasks = useCallback(async (cat) => {
  try {
    let res = await api.get(`/task-lists?category=${cat}`);

    if (res.data.length === 0) {
      const newList = await api.post("/task-lists", {
        title: cat,
        category: cat,
      });
      res = { data: [newList.data] };
    }

    const listsWithTasks = await Promise.all(
      res.data.map(async (list) => {
        const tasksRes = await api.get(`/tasks/list/${list._id}`);
        return { ...list, tasks: tasksRes.data };
      })
    );

    setListsByCategory((prev) => ({
      ...prev,
      [cat]: listsWithTasks,
    }));
  } catch (err) {
    console.error("Erreur fetch listes:", err);
  }
}, []);


  // === Chargement initial (APRES refresh) ===
useEffect(() => {
  activeCategories.forEach((cat) => {
    if (!listsByCategory[cat]) {
      fetchListsAndTasks(cat);
    }
  });
}, [activeCategories, listsByCategory, fetchListsAndTasks]);

  // === Sauvegarde des catégories actives ===
  useEffect(() => {
    localStorage.setItem(
      "activeCategories",
      JSON.stringify(activeCategories)
    );
  }, [activeCategories]);

  // === Ouvrir une catégorie ===
  const handleOpenCategory = (cat) => {
    if (!activeCategories.includes(cat)) {
      setActiveCategories((prev) => [...prev, cat]);
      fetchListsAndTasks(cat);
    }
  };

  // === Ajouter une tâche ===
  const handleAddTask = async (category, text) => {
    if (!text.trim()) return;

    const lists = listsByCategory[category];
    if (!lists || lists.length === 0) return;

    const listId = lists[0]._id;

    try {
      const res = await api.post("/tasks", { text, listId });

      setListsByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((list) =>
          list._id === listId
            ? { ...list, tasks: [...list.tasks, res.data] }
            : list
        ),
      }));
    } catch (err) {
      console.error("Erreur ajout tâche:", err);
    }
  };

  // === Supprimer une tâche ===
  const handleDeleteTask = async (category, listId, taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);

      setListsByCategory((prev) => ({
        ...prev,
        [category]: prev[category].map((list) =>
          list._id === listId
            ? {
                ...list,
                tasks: list.tasks.filter((t) => t._id !== taskId),
              }
            : list
        ),
      }));
    } catch (err) {
      console.error("Erreur suppression tâche:", err);
    }
  };

  // === Créer une nouvelle liste ===
  const handleCreateList = async (category, title) => {
    if (!title.trim()) return;

    try {
      const res = await api.post("/task-lists", { title, category });

      setListsByCategory((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), res.data],
      }));

      if (!activeCategories.includes(category)) {
        setActiveCategories((prev) => [...prev, category]);
      }
    } catch (err) {
      console.error("Erreur création liste:", err);
    }
  };

  // === Supprimer une catégorie active ===
  const handleDeleteCategory = (cat) => {
    setActiveCategories((prev) => prev.filter((c) => c !== cat));
  };

  return (
    <div className="min-h-screen bg-slate-100 relative p-6 md:p-10">
            {/* Bouton retour */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md z-50"
      >
        ← 
      </button>
      <MainSidebar />

      <h1 className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 mb-14">
        Listes de tâches illimitées
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        {activeCategories.map((cat) => {
  if (!listsByCategory[cat]) {
    return (
      <div key={cat} className="text-center text-gray-500">
        Chargement...
      </div>
    );
  }

  return (
    <CategoryPanel
      key={cat}
      category={cat}
      lists={listsByCategory[cat]}
      onAddTask={(text) => handleAddTask(cat, text)}
      onCreateList={(title) => handleCreateList(cat, title)}
      onDeleteTask={(listId, taskId) =>
        handleDeleteTask(cat, listId, taskId)
      }
      onDeleteCategory={() => handleDeleteCategory(cat)}
    />
  );
})}

      </div>

      <RightSidebar
        active={activeCategories[activeCategories.length - 1]}
        onSelect={handleOpenCategory}
      />
      
    </div>

  );
  
}
