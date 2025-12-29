"use client";
import { useEffect, useState, useCallback, useContext } from "react";
import api from "@/lib/api";
import { AuthContext } from "@/context/AuthProvider";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Calendar as CalIcon } from "lucide-react";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import RightSidebar from "./RightSidebar";
import CategoryPanel from "./CategoryPanel";

export default function TasksPage() {
  const { user } = useContext(AuthContext);

  // Structure: { "school": [Task1, Task2], "work": [Task3] }
  const [tasksByCategory, setTasksByCategory] = useState({});
  const [todayTasks, setTodayTasks] = useState([]);
  const [activeCategories, setActiveCategories] = useState(["school", "work"]);

  // Récupérer le planning global
  const fetchTodayPlanning = useCallback(async () => {
    try {
      const res = await api.get("/tache/today");
      setTodayTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Récupérer les tâches d'une catégorie
  // Note: On suppose ici que votre backend a une route pour filtrer les tâches par tag/catégorie
  // Si ce n'est pas le cas, on utilise l'ancienne méthode via "liste" mais on l'aplatit.
  const fetchCategoryTasks = useCallback(async (cat) => {
    try {
      // 1. On récupère la liste associée à la catégorie
      let res = await api.get(`/tache-list?category=${cat}`);
      if (res.data.length === 0) {
        const newList = await api.post("/tache-list", {
          title: cat,
          category: cat,
        });
        res = { data: [newList.data] };
      }

      const listId = res.data[0]._id; // On prend la première liste comme conteneur principal

      // 2. On récupère les tâches de cette liste
      const tasksRes = await api.get(`/tache/list/${listId}`);

      setTasksByCategory((prev) => ({
        ...prev,
        [cat]: { listId: listId, tasks: tasksRes.data }, // On stocke l'ID de liste pour les ajouts
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodayPlanning();
      activeCategories.forEach((cat) => fetchCategoryTasks(cat));
    }
  }, [user, activeCategories, fetchCategoryTasks, fetchTodayPlanning]);

  const handleAddTask = async (category, data) => {
    const listId = tasksByCategory[category]?.listId;
    if (!listId) return;

    try {
      await api.post("/tache", { ...data, listId });
      fetchCategoryTasks(category);
      fetchTodayPlanning();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId, category) => {
    try {
      await api.delete(`/tache/${taskId}`);
      fetchCategoryTasks(category);
      fetchTodayPlanning();
    } catch (err) {
      console.error(err);
    }
  };

  // Supprimer une catégorie de l'affichage
  const closeCategory = (catToRemove) => {
    setActiveCategories((prev) => prev.filter((c) => c !== catToRemove));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <MainSidebar />
      <main className="flex-1 p-6 lg:p-12 ml-16 md:ml-20 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900">Ma Journée</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-2">
            <CalIcon size={18} className="text-indigo-500" />
            {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </p>
        </header>

        {/* SECTION AGENDA */}
        <section className="mb-12 bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
          {/* ... (votre code agenda existant) ... */}
          <div className="flex items-center gap-3 mb-6">
            <Clock className="animate-pulse" />
            <h2 className="text-2xl font-bold">Mon Planning</h2>
          </div>
          <div className="space-y-4">
            {todayTasks.map((t) => (
              <div
                key={t._id}
                className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex gap-4 items-center"
              >
                <span className="font-mono font-bold text-lg">
                  {t.startTime
                    ? format(new Date(t.startTime), "HH:mm")
                    : "--:--"}
                </span>
                <span className="font-medium text-lg">{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* GRILLE DES CATÉGORIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {activeCategories.map(
            (cat) =>
              tasksByCategory[cat] && (
                <CategoryPanel
                  key={cat}
                  category={cat}
                  tasks={tasksByCategory[cat].tasks} // On passe directement le tableau de tâches
                  onAddTask={(data) => handleAddTask(cat, data)}
                  onDeleteTask={(taskId) => handleDeleteTask(taskId, cat)}
                  onClosePanel={() => closeCategory(cat)} // ✅ Fonction de fermeture
                />
              )
          )}
        </div>
      </main>

      <RightSidebar
        active={null}
        onSelect={(cat) =>
          setActiveCategories((p) => [...new Set([...p, cat])])
        }
      />
    </div>
  );
}
