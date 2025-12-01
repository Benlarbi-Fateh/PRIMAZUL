'use client';

import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { AuthContext } from '@/context/AuthProvider';
import { MessageCircle, Users, Settings, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';

export default function MainSidebar() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <>
      {/* Bouton Toggle - Au milieu de la bordure gauche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-60 bg-blue-600 text-white p-1.5 rounded-r-md shadow-md hover:bg-blue-700 transition-all duration-300 ${
          isOpen ? 'left-16' : '-left-2'
        }`}
        title={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-48 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Largeur 16 (64px) comme avant */}
      <aside
        className={`fixed left-0 top-0 h-screen w-16 bg-blue-700 border-r border-blue-800 flex flex-col items-center py-4 shadow-xl z-49 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Items */}
        <nav className="flex-1 flex flex-col items-center gap-6 mt-4">
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
                  className="flex flex-col items-center text-white/80 hover:text-white transition-colors"
                >
                  <div className="p-3 rounded-xl hover:bg-blue-600 transition-all duration-200">
                    <IconComponent className="w-6 h-6" />
                  </div>
                </button>
                {/* Tooltip au survol */}
                <span className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm font-medium py-2 px-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="relative group mt-auto mb-4">
          <button
            onClick={handleLogout}
            className="p-3 rounded-xl hover:bg-red-600 text-white/80 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-6 h-6" />
          </button>
          <span className="absolute left-20 top-1/2 -translate-y-1/2 bg-red-600 text-white text-sm font-medium py-2 px-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            Déconnexion
          </span>
        </div>
      </aside>
    </>
  );
}