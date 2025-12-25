"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import RightSidebar from "./RightSidebar";
import CategoryPanel from "./CategoryPanel";
import MainSidebar from "@/components/Layout/MainSidebar.client";

const CATEGORIES = ["school", "work", "shopping", "movies", "sports"];

export default function TasksPage() {
  const [listsByCategory, setListsByCategory] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);

  // === Initialisation des catégories depuis localStorage ou valeur par défaut ===
  useEffect(() => {
    const saved = localStorage.getItem("activeCategories");
    if (saved) setActiveCategories(JSON.parse(saved));
    else setActiveCategories(["school"]);
  }, []);

  // === Sauvegarder activeCategories dans localStorage à chaque changement ===
  useEffect(() => {
    localStorage.setItem("activeCategories", JSON.stringify(activeCategories));
  }, [activeCategories]);

  // === Fetch listes + tâches pour une catégorie ===
  const fetchListsAndTasks = async (cat) => {
    try {
      let res = await api.get(`/task-lists?category=${cat}`);

      if (res.data.length === 0) {
        const newList = await api.post("/task-lists", { title: cat, category: cat });
        res = { data: [newList.data] };
      }

      const listsWithTasks = await Promise.all(
        res.data.map(async (list) => {
          const tasksRes = await api.get(`/tasks/list/${list._id}`);
          return { ...list, tasks: tasksRes.data };
        })
      );

      setListsByCategory((prev) => ({ ...prev, [cat]: listsWithTasks }));
    } catch (err) {
      console.error("Erreur fetch listes:", err);
    }
  };

  // === Fetch initial uniquement pour les catégories actives ===
  useEffect(() => {
    activeCategories.forEach((cat) => fetchListsAndTasks(cat));
  }, [activeCategories]);

  // === Ouvrir une catégorie depuis la sidebar ===
  const handleOpenCategory = (cat) => {
    if (!activeCategories.includes(cat)) setActiveCategories([...activeCategories, cat]);
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
            ? { ...list, tasks: list.tasks.filter((t) => t._id !== taskId) }
            : list
        ),
      }));
    } catch (err) {
      console.error("Erreur suppression tâche:", err);
    }
  };

  // === Ajouter une nouvelle liste visible immédiatement ===
  const handleCreateList = async (category, title) => {
    if (!title.trim()) return;
    try {
      const res = await api.post("/task-lists", { title, category });
      setListsByCategory((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), res.data],
      }));

      if (!activeCategories.includes(category)) {
        setActiveCategories([...activeCategories, category]);
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
      <MainSidebar />

      <h1 className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 mb-14">
        Listes de tâches illimitées
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        {activeCategories.map((cat) => (
          <CategoryPanel
            key={cat}
            category={cat}
            lists={listsByCategory[cat] || []}
            onAddTask={(text) => handleAddTask(cat, text)}
            onCreateList={(title) => handleCreateList(cat, title)}
            onDeleteTask={(listId, taskId) => handleDeleteTask(cat, listId, taskId)}
            onDeleteCategory={() => handleDeleteCategory(cat)}
          />
        ))}
      </div>

      <RightSidebar
        active={activeCategories[activeCategories.length - 1]}
        onSelect={handleOpenCategory}
      />
    </div>
  );
}
