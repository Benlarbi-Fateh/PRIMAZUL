"use client";

import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import { Search, Filter, SortAsc, Plus, Calendar } from "lucide-react";

export default function TaskFilters({ onNewTask }) {
  const { isDark } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
  } = useTasks();

  const containerBg = isDark
    ? "bg-slate-900/80 border-slate-800"
    : "bg-white border-slate-200";

  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  const selectBg = isDark
    ? "bg-slate-800 border-slate-700 text-slate-200"
    : "bg-slate-50 border-slate-200 text-slate-700";

  return (
    <div
      className={`p-4 border-b ${containerBg} flex flex-wrap gap-3 items-center`}
    >
      {/* Recherche */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search
          size={18}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une tâche..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
        />
      </div>

      {/* Filtre par statut */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${selectBg}`}
      >
        <Filter
          size={16}
          className={isDark ? "text-slate-400" : "text-slate-500"}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-transparent outline-none text-sm font-medium cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="todo">À faire</option>
          <option value="inProgress">En cours</option>
          <option value="done">Terminées</option>
        </select>
      </div>

      {/* Tri */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${selectBg}`}
      >
        <SortAsc
          size={16}
          className={isDark ? "text-slate-400" : "text-slate-500"}
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="bg-transparent outline-none text-sm font-medium cursor-pointer"
        >
          <option value="createdAt_desc">Plus récentes</option>
          <option value="createdAt_asc">Plus anciennes</option>
          <option value="dueDate_asc">Échéance proche</option>
          <option value="priority_desc">Priorité haute</option>
          <option value="title_asc">Alphabétique</option>
        </select>
      </div>

      {/* Bouton Nouvelle tâche */}
      <button
        onClick={onNewTask}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/25"
      >
        <Plus size={18} />
        <span className="hidden sm:inline">Nouvelle tâche</span>
      </button>
    </div>
  );
}
