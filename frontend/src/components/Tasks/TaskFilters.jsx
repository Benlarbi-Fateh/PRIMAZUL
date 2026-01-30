"use client";

import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import { Search, Filter, SortAsc, Plus } from "lucide-react";

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

  const baseInputClass =
    "appearance-none outline-none transition-all rounded-xl text-sm font-medium";

  // Style Blanc Pur & Bordure légère
  const lightClass =
    "bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 shadow-sm";
  const darkClass =
    "bg-slate-900 border border-slate-800 text-white focus:border-blue-500";

  return (
    <div className="p-4 flex flex-col sm:flex-row gap-3 items-center bg-slate-50 dark:bg-slate-950/50">
      {/* Recherche */}
      <div className="relative flex-1 w-full sm:w-auto">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          className={`w-full pl-10 pr-4 py-3 ${isDark ? darkClass : lightClass}`}
        />
      </div>

      <div className="flex w-full sm:w-auto gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        {/* Filtre */}
        <div className="relative shrink-0">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`pl-9 pr-8 py-3 cursor-pointer ${baseInputClass} ${isDark ? darkClass : lightClass}`}
          >
            <option value="all">Tout</option>
            <option value="todo">À faire</option>
            <option value="inProgress">En cours</option>
            <option value="done">Terminées</option>
          </select>
        </div>

        {/* Tri */}
        <div className="relative shrink-0">
          <SortAsc
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className={`pl-9 pr-8 py-3 cursor-pointer ${baseInputClass} ${isDark ? darkClass : lightClass}`}
          >
            <option value="createdAt_desc">Récents</option>
            <option value="priority_desc">Priorité</option>
            <option value="dueDate_asc">Date</option>
          </select>
        </div>

        {/* Bouton Mobile "Nouveau" */}
        <button
          onClick={onNewTask}
          className="sm:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shrink-0 shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
