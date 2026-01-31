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

  const inputBaseClass =
    "appearance-none outline-none transition-all rounded-xl text-sm font-bold";

  const inputLightClass =
    "bg-white/90 backdrop-blur-sm border-2 border-blue-300 text-blue-900 placeholder:text-blue-500/60 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 shadow-md focus:shadow-xl";

  const inputDarkClass =
    "bg-blue-950/60 backdrop-blur-sm border-2 border-blue-800/60 text-blue-100 placeholder:text-blue-400/50 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/30 shadow-lg";

  return (
    <div
      className={`
        px-4 py-4 flex flex-col sm:flex-row gap-3 items-center
        border-b-2 backdrop-blur-sm
        ${
          isDark
            ? "bg-gradient-to-r from-blue-950/60 to-blue-900/50 border-blue-800/60"
            : "bg-gradient-to-r from-blue-100/60 to-white/80 border-blue-200"
        }
      `}
    >
      {/* Recherche */}
      <div className="relative flex-1 w-full sm:w-auto group">
        <Search
          size={18}
          strokeWidth={2.5}
          className={`
            absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors
            ${
              isDark
                ? "text-blue-400 group-focus-within:text-blue-300"
                : "text-blue-600 group-focus-within:text-blue-700"
            }
          `}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une tâche..."
          className={`
            w-full pl-11 pr-4 py-3.5
            ${inputBaseClass}
            ${isDark ? inputDarkClass : inputLightClass}
          `}
        />
      </div>

      <div className="flex w-full sm:w-auto gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        {/* Filtre Status */}
        <div className="relative shrink-0 group">
          <Filter
            size={16}
            strokeWidth={2.5}
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
              ${
                isDark
                  ? "text-blue-400 group-focus-within:text-blue-300"
                  : "text-blue-600 group-focus-within:text-blue-700"
              }
            `}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`
              pl-9 pr-10 py-3.5 cursor-pointer
              ${inputBaseClass}
              ${isDark ? inputDarkClass : inputLightClass}
            `}
          >
            <option value="all">Tout</option>
            <option value="todo">À faire</option>
            <option value="inProgress">En cours</option>
            <option value="done">Terminées</option>
          </select>
        </div>

        {/* Tri */}
        <div className="relative shrink-0 group">
          <SortAsc
            size={16}
            strokeWidth={2.5}
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
              ${
                isDark
                  ? "text-blue-400 group-focus-within:text-blue-300"
                  : "text-blue-600 group-focus-within:text-blue-700"
              }
            `}
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className={`
              pl-9 pr-10 py-3.5 cursor-pointer
              ${inputBaseClass}
              ${isDark ? inputDarkClass : inputLightClass}
            `}
          >
            <option value="createdAt_desc">Récents</option>
            <option value="priority_desc">Priorité</option>
            <option value="dueDate_asc">Date</option>
          </select>
        </div>

        {/* Bouton Mobile */}
        <button
          onClick={onNewTask}
          className={`
            sm:hidden flex items-center justify-center w-12 h-12 rounded-xl
            transition-all active:scale-95 shadow-xl
            bg-gradient-to-br from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            text-white ring-2 ring-blue-500/30
          `}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
