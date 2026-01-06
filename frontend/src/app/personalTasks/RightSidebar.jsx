"use client";

import { useState, useRef, useEffect } from "react";
import {
  GraduationCap,
  Briefcase,
  ShoppingCart,
  Film,
  Dumbbell,
  Menu,
  X,
} from "lucide-react";

const categories = [
  { id: "school", icon: GraduationCap, label: "École" },
  { id: "work", icon: Briefcase, label: "Travail" },
  { id: "shopping", icon: ShoppingCart, label: "Courses" },
  { id: "movies", icon: Film, label: "Films" },
  { id: "sports", icon: Dumbbell, label: "Sports" },
];

export default function RightSidebar({ active, onSelect }) {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      {/* Bouton hamburger en haut à droite */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Overlay semi-transparent */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar compacte */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-16 right-4
          w-20 bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700
          p-3 flex flex-col items-center gap-4
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1rem)] opacity-0"}
          z-40
        `}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => setOpen(false)}
          className="self-end mb-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Boutons catégories */}
        {categories.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              onSelect(id);
              setOpen(false);
            }}
            title={label}
            className={`
              w-12 h-12 flex items-center justify-center rounded-lg transition-all
              ${
                active === id
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                  : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
              }
            `}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </>
  );
}