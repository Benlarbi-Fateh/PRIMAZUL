"use client";

import { useState, useRef, useEffect } from "react";
import {
  GraduationCap,
  Briefcase,
  ShoppingCart,
  Film,
  Dumbbell,
  Plus,
  X,
} from "lucide-react";

const categories = [
  { id: "sports", icon: Dumbbell, label: "Sports", color: "bg-orange-500" },
  { id: "movies", icon: Film, label: "Films", color: "bg-red-500" },
  {
    id: "shopping",
    icon: ShoppingCart,
    label: "Courses",
    color: "bg-green-500",
  },
  { id: "work", icon: Briefcase, label: "Travail", color: "bg-purple-500" },
  { id: "school", icon: GraduationCap, label: "École", color: "bg-blue-500" },
];

export default function RightSidebar({ onSelect }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (open && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4"
      ref={menuRef}
    >
      {/* Overlay sombre pour focus (optionnel, supprimez si vous préférez sans) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Menu dépliant */}
      <div
        className={`flex flex-col gap-3 transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelect(cat.id);
                setOpen(false);
              }}
              className="flex items-center justify-end gap-3 group"
              style={{ transitionDelay: `${index * 50}ms` }} // Effet cascade
            >
              <span className="bg-white text-slate-700 px-3 py-1 rounded-lg shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                {cat.label}
              </span>
              <div
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform transform hover:scale-110 active:scale-95 ${cat.color}`}
              >
                <Icon size={20} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bouton Principal (FAB) */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105 active:scale-95
          ${open ? "bg-slate-800 rotate-45" : "bg-indigo-600 rotate-0"}
        `}
      >
        <Plus size={32} />
      </button>
    </div>
  );
}
