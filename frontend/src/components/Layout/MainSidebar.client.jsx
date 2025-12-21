"use client";

import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import {
  MessageCircle,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  CircleDashed,
} from "lucide-react";

export default function MainSidebar() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Même style que le ChatHeader
  const headerBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800";

  const sidebarBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 border-blue-800"
    : "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border-blue-800";

  const toggleButtonBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800";

  const buttonStyle = isDark
    ? "hover:bg-blue-800/50 text-blue-200"
    : "hover:bg-white/20 text-white";

  const menuItemStyle = isDark
    ? "hover:bg-blue-800/50 text-blue-200 hover:text-blue-50"
    : "hover:bg-white/20 text-white/80 hover:text-white";

  const logoutStyle = isDark
    ? "hover:bg-red-700/50 text-blue-200 hover:text-red-100"
    : "hover:bg-red-600 text-white/80 hover:text-white";

  const tooltipBg = isDark
    ? "bg-blue-900/90 backdrop-blur-sm text-blue-100 border-blue-800"
    : "bg-blue-800/90 backdrop-blur-sm text-white border-blue-700";

  const logoutTooltipBg = isDark
    ? "bg-red-800/90 backdrop-blur-sm text-red-100 border-red-800"
    : "bg-red-600/90 backdrop-blur-sm text-white border-red-700";

  const overlayBg = isDark ? "bg-black/60" : "bg-black/50";

  const menuItems = [
    {
      label: "Discussions",
      icon: MessageCircle,
      href: "/",
    },
    {
      label: "Groupes",
      icon: Users,
      href: "/group",
    },
    { label: "Statuts",
       icon: CircleDashed, 
       href: "/status" },
    {
      label: "Paramètres",
      icon: Settings,
      href: "/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <>
      {/* Bouton Toggle - Même dégradé que la sidebar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-60 ${toggleButtonBg} text-white p-2 rounded-r-md shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? "left-16" : "-left-2"
        }`}
        title={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className={`fixed inset-0 ${overlayBg} z-48 lg:hidden`}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Même dégradé que le ChatHeader */}
      <aside
        className={`fixed left-0 top-0 h-screen w-16 ${sidebarBg} flex flex-col items-center py-4 shadow-xl z-49 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Pattern background (comme dans ChatHeader) */}
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${
            isDark ? "opacity-10" : "opacity-20"
          }`}
        ></div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col items-center gap-6 mt-4 relative z-10">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="relative group">
                <button
                  onClick={() => {
                    router.push(item.href);
                    // Fermer sur mobile après clic
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                  className="flex flex-col items-center transition-colors"
                >
                  <div
                    className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${menuItemStyle}`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                </button>
                {/* Tooltip au survol */}
                <span
                  className={`absolute left-20 top-1/2 -translate-y-1/2 ${tooltipBg} text-sm font-medium py-2 px-3 rounded-lg border shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="relative group mt-auto mb-4 z-10">
          <button
            onClick={handleLogout}
            className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${logoutStyle}`}
          >
            <LogOut className="w-6 h-6" />
          </button>
          <span
            className={`absolute left-20 top-1/2 -translate-y-1/2 ${logoutTooltipBg} text-sm font-medium py-2 px-3 rounded-lg border shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50`}
          >
            Déconnexion
          </span>
        </div>
      </aside>
    </>
  );
}
