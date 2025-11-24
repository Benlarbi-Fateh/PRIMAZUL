"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, Users, Settings, User, LogOut } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";


export default function MainSidebar() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    {
      label: "Discussions",
      icon: <MessageCircle className="w-6 h-6" />,
      href: "/",
    },
    {
      label: "groupe",
      icon: <Users className="w-6 h-6" />,
      href: "/groupe",
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
  if (!user) return null;


  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-blue-600 border-r border-blue-600 flex flex-col items-center py-4 shadow-lg relative">
      
      {/* Avatar utilisateur */}
      <div
      
  className="
    w-12 h-12 rounded-full 
    overflow-hidden cursor-pointer 
    ring-2 ring-blue-300 hover:ring-white 
    transition mb-6
  "


        onClick={() => router.push("/profile")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
       <img
  src={
    user?.profilePicture?.trim()
      ? user.profilePicture
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user?.name?.charAt(0).toUpperCase() || "U"
        )}&background=3b82f6&color=fff&bold=true`
  }
  alt="profile"
  className="w-full h-full object-cover"
/>

      </div>

      {/* Menu */}
      <nav className="flex-1 flex flex-col items-center gap-8 mt-4">
        {menuItems.map((item, index) => (
          <div key={index} className="relative group">
            <button
  onClick={() => router.push(item.href)}
  className="flex flex-col items-center text-white/80 hover:text-white"
>
  <div className="p-3 rounded-xl group-hover:bg-blue-500 transition">
                {item.icon}
              </div>
            </button>

            {/* LABEL QUI APPARAÎT AU HOVER */}
            <span
              className="
                absolute left-20 top-1/2 -translate-y-1/2 
                bg-blue-600 text-white text-sm font-medium 
                py-1.5 px-3 rounded-lg shadow-lg 
                opacity-0 translate-x-2 pointer-events-none
                group-hover:opacity-100 group-hover:translate-x-0 
                transition-all duration-200 whitespace-nowrap
              "
            >
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Bouton logout */}
      <div className="relative group mt-auto mb-4">
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl hover:bg-red-100 text-red-500 transition"
        >
          <LogOut className="w-6 h-6" />
        </button>

        <span
          className="
            absolute left-20 top-1/2 -translate-y-1/2 
            bg-red-500 text-white text-sm font-medium 
            py-1.5 px-3 rounded-lg shadow-lg 
            opacity-0 translate-x-2 pointer-events-none
            group-hover:opacity-100 group-hover:translate-x-0 
            transition-all duration-200 whitespace-nowrap
          "
        >
          Déconnexion
        </span>
      </div>
    </aside>
  );
}
