'use client';

import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { AuthContext } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';

import { MessageCircle, Users, Settings, LogOut,Trash , ChevronRight, ChevronLeft } from 'lucide-react';


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

  const overlayBg = isDark
    ? "bg-black/60"
    : "bg-black/50";

  const menuItems = [
    {
      label: 'Discussions',
      icon: MessageCircle,
      href: '/',
    },
    {
      label: 'Groupes',
      icon: Users,
      href: '/group',
    },
    {
      label: 'Paramètres',
      icon: Settings,
      href: '/settings',
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;
 //suppression 
 const deleteAccount = async () => {
  const confirmDelete = confirm("Es-tu sûr de vouloir supprimer définitivement ton compte ?");
  if (!confirmDelete) return;

  await fetch("http://localhost:3000/user/delete", {
    method: "DELETE",
    credentials: "include",
  });

  logout(); 
  router.push("/login");
};
return (
  <>
    {/* Bouton Toggle */}
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`fixed top-1/2 -translate-y-1/2 z-60 ${toggleButtonBg} text-white p-2 rounded-r-md ${
        isOpen ? 'left-16' : '-left-2'
      }`}
    >
      {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>

    {/* Overlay mobile */}
    {isOpen && (
      <div
        className={`fixed inset-0 ${overlayBg} z-48 lg:hidden`}
        onClick={() => setIsOpen(false)}
      />
    )}

    {/* Sidebar */}
    <aside
      className={`fixed left-0 top-0 h-screen w-16 ${sidebarBg} flex flex-col items-center py-4 z-49 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Menu */}
      <nav className="flex-1 flex flex-col items-center gap-6 mt-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className="p-3 rounded-xl"
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="relative group mb-4">
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl text-red-500 hover:bg-red-100"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Supprimer compte */}
      <div className="relative group mb-4">
        <button
          onClick={deleteAccount}
          className="p-3 rounded-xl text-red-600 hover:bg-red-600/20"
        >
          <Trash className="w-6 h-6" />
        </button>
      </div>
    </aside>
  </>
);

}