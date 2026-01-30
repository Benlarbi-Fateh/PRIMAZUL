"use client";
import { useTheme } from "@/hooks/useTheme";
import { useTasks } from "@/context/TaskContext";
import { Search, Filter, SortAsc, Plus, Calendar, X } from "lucide-react";
import { useState } from "react";

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

  const [showFilters, setShowFilters] = useState(false);

  const containerBg = isDark
    ? "bg-slate-900/80 border-slate-800"
    : "bg-white border-slate-200";

  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  const selectBg = isDark
    ? "bg-slate-800 border-slate-700 text-slate-200"
    : "bg-slate-50 border-slate-200 text-slate-700";

  const hasActiveFilters = statusFilter !== "all" || sortOption !== "createdAt_desc";

  return (
    <div className={`p-3 sm:p-4 border-b ${containerBg}`}>
      {/* Ligne principale - toujours visible */}
      <div className="flex gap-2 sm:gap-3 items-center">
        {/* Recherche - Responsive */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-sm ${inputBg}`}
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                isDark
                  ? "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              }`}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile: Bouton toggle filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all relative ${selectBg}`}
        >
          <Filter size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Desktop: Filtres inline */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          {/* Filtre par statut */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${selectBg}`}>
            <Filter size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium cursor-pointer pr-1"
            >
              <option value="all">Tous</option>
              <option value="todo">À faire</option>
              <option value="inProgress">En cours</option>
              <option value="done">Terminées</option>
            </select>
          </div>

          {/* Tri */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${selectBg}`}>
            <SortAsc size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium cursor-pointer pr-1"
            >
              <option value="createdAt_desc">Récentes</option>
              <option value="createdAt_asc">Anciennes</option>
              <option value="dueDate_asc">Échéance</option>
              <option value="priority_desc">Priorité</option>
              <option value="title_asc">A-Z</option>
            </select>
          </div>
        </div>

        {/* Bouton Nouvelle tâche - Responsive */}
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/25 whitespace-nowrap text-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle tâche</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {/* Mobile: Filtres dépliables */}
      {showFilters && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-700/50 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
          {/* Filtre par statut */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${selectBg}`}>
            <Filter size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium cursor-pointer flex-1"
            >
              <option value="all">Tous les statuts</option>
              <option value="todo">À faire</option>
              <option value="inProgress">En cours</option>
              <option value="done">Terminées</option>
            </select>
          </div>

          {/* Tri */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${selectBg}`}>
            <SortAsc size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium cursor-pointer flex-1"
            >
              <option value="createdAt_desc">Plus récentes</option>
              <option value="createdAt_asc">Plus anciennes</option>
              <option value="dueDate_asc">Échéance proche</option>
              <option value="priority_desc">Priorité haute</option>
              <option value="title_asc">Alphabétique</option>
            </select>
          </div>

          {/* Bouton réinitialiser les filtres */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setSortOption("createdAt_desc");
              }}
              className={`text-xs font-medium py-2 rounded-lg transition-colors ${
                isDark
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}