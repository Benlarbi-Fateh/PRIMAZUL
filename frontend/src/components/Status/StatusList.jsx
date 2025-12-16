"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/hooks/useTheme";

export default function StatusList() {
  const { isDark } = useTheme();
  const [statusGroups, setStatusGroups] = useState([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const { data } = await api.get("/status");
        // Grouper les statuts par utilisateur
        const grouped = data.reduce((acc, status) => {
          const uid = status.user._id;
          if (!acc[uid]) {
            acc[uid] = { user: status.user, items: [] };
          }
          acc[uid].items.push(status);
          return acc;
        }, {});
        setStatusGroups(Object.values(grouped));
      } catch (e) {
        console.error("Erreur chargement statuts", e);
      }
    };
    fetchStatuses();
  }, []);

  const textColor = isDark ? "text-slate-300" : "text-slate-600";
  const ringColor = isDark ? "border-slate-900" : "border-white";

  return (
    <div
      className={`flex gap-4 overflow-x-auto p-4 scrollbar-hide border-b ${
        isDark
          ? "border-slate-800 bg-slate-900/50"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      {/* Bouton Ajouter */}
      <div className="flex flex-col items-center gap-1 cursor-pointer min-w-[64px] group">
        <div
          className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
            isDark
              ? "border-slate-700 bg-slate-800 group-hover:bg-slate-700"
              : "border-slate-300 bg-white group-hover:bg-slate-100"
          }`}
        >
          <Plus className={isDark ? "text-slate-400" : "text-slate-500"} />
        </div>
        <span className={`text-xs font-medium ${textColor}`}>Ajouter</span>
      </div>

      {/* Liste des amis ayant un statut */}
      {statusGroups.map((group) => (
        <div
          key={group.user._id}
          className="flex flex-col items-center gap-1 cursor-pointer min-w-[64px] group"
        >
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-purple-600 group-hover:scale-105 transition-transform">
            <div
              className={`w-full h-full rounded-full border-2 ${ringColor} overflow-hidden`}
            >
              <Image
                src={
                  group.user.profilePicture ||
                  `https://ui-avatars.com/api/?name=${group.user.name}`
                }
                alt={group.user.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span
            className={`text-xs font-medium truncate w-16 text-center ${textColor}`}
          >
            {group.user.name.split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  );
}
