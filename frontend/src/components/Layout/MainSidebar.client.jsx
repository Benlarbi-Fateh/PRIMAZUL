"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, Users, Settings, LogOut } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function MainSidebar() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sidebarClass =
    "fixed left-0 top-0 h-relative w-16 flex flex-col items-center py-4 shadow-lg static border-r " +
    (isDark ? "bg-slate-950 border-slate-800" : "bg-blue-700 border-blue-700");

  const menuButtonClass =
    "p-3 rounded-xl group-hover:scale-105 transition " +
    (isDark
      ? "group-hover:bg-slate-800 text-slate-200"
      : "group-hover:bg-blue-500 text-white/80");

  const logoutButtonClass =
    "p-3 rounded-xl transition " +
    (isDark
      ? "text-rose-400 hover:bg-rose-500/10"
      : "text-red-500 hover:bg-red-100");

  if (!user) return null;

  const menuItems = [
    {
      label: "Discussions",
      icon: <MessageCircle className="w-6 h-6" />,
      href: "/",
    },
    {
      label: "groupe",
      icon: <Users className="w-6 h-6" />,
      href: "/chat/[user.id]",
    },
    {
      label: "Paramètres",
      icon: <Settings className="w-6 h-6" />,
      href: "/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className={sidebarClass}>
      {/* Menu */}
      <nav className="flex-1 flex flex-col items-center gap-8 mt-4">
        {menuItems.map((item, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center"
            >
              <div className={menuButtonClass}>{item.icon}</div>
            </button>
            <span
              className={
                "absolute left-20 top-1/2 -translate-y-1/2 text-sm font-medium py-1.5 px-3 rounded-lg shadow-lg opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap " +
                (isDark
                  ? "bg-slate-900 text-slate-100"
                  : "bg-blue-600 text-white")
              }
            >
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="relative group mt-auto mb-4">
        <button
          onClick={handleLogout}
          className={logoutButtonClass}
        >
          <LogOut className="w-6 h-6" />
        </button>
        <span
          className={
            "absolute left-20 top-1/2 -translate-y-1/2 text-sm font-medium py-1.5 px-3 rounded-lg shadow-lg opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap " +
            (isDark
              ? "bg-rose-600 text-white"
              : "bg-red-500 text-white")
          }
        >
          Déconnexion
        </span>
      </div>
    </aside>
  );
}