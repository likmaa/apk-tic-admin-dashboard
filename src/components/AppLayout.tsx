import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, UserCheck, Car, DollarSign, Bell,
  ShieldCheck, Code, LogOut, Menu, X, Navigation
} from 'lucide-react';

import Img from '@/assets/LOGO_OR.png';
// Le composant NavItem reste inchangé, il est déjà parfait.
function NavItem({ to, label, icon, onClick }: { to: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick} // Pour fermer le menu en naviguant sur mobile
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-primary text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Fermer la sidebar lors d'un changement de page sur mobile
  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location]);

  const adminMenu = [
    { to: '/overview', label: "Vue d'ensemble", icon: <LayoutDashboard size={18} /> },
    { to: '/rides/active', label: 'Courses actives', icon: <Navigation size={18} /> },
    { to: '/drivers/pending', label: 'Chauffeurs en attente', icon: <UserCheck size={18} /> },
    { to: '/drivers/online', label: 'Statut chauffeurs', icon: <UserCheck size={18} /> },
    { to: '/drivers/stats', label: 'Statistiques chauffeurs', icon: <UserCheck size={18} /> },
    { to: '/fleet', label: 'Flotte (chauffeurs)', icon: <Car size={18} /> },
    { to: '/passengers', label: 'Passagers', icon: <Users size={18} /> },
    { to: '/users', label: 'Utilisateurs', icon: <Users size={18} /> },
    { to: '/pricing', label: 'Tarification', icon: <DollarSign size={18} /> },
    { to: '/finance', label: 'Finances', icon: <DollarSign size={18} /> },
    { to: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { to: '/accounts', label: 'Modération', icon: <ShieldCheck size={18} /> },
  ];

  const developerMenu = [
    ...adminMenu,
    { to: '/dev/tools', label: 'Outils développeur', icon: <Code size={18} /> },
  ];

  const renderNavItems = (onClick?: () => void) => (
    <>
      {user?.role === 'admin' && adminMenu.map(item => <NavItem key={item.to} {...item} onClick={onClick} />)}
      {user?.role === 'developer' && developerMenu.map(item => <NavItem key={item.to} {...item} onClick={onClick} />)}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* --- Barre latérale pour grands écrans (Desktop) --- */}
      {/* Reste visible sur les écrans 'lg' et plus, cachée en dessous */}
      <aside className="w-64 fixed inset-y-0 left-0 z-20 bg-white border-r border-gray-200 flex-col hidden lg:flex">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img src={Img} alt="Logo" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="p-3 flex-1"><div className="space-y-2">{renderNavItems()}</div></nav>
          {/* Section utilisateur */}
          <div className="p-3 border-t border-gray-200">
            {/* ... (la section utilisateur reste la même) ... */}
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white transition-colors duration-200">
              <LogOut size={16} /><span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- Barre latérale pour petits écrans (Mobile) --- */}
      {/* Apparaît en superposition quand isSidebarOpen est true */}
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo et bouton de fermeture */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img src={Img} alt="Logo" className="h-8 w-auto" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-500 hover:text-primary rounded-full">
            <X size={24} />
          </button>
        </div>
        {/* Navigation mobile */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="p-3 flex-1"><div className="space-y-2">{renderNavItems(() => setSidebarOpen(false))}</div></nav>
          {/* Section utilisateur mobile */}
          <div className="p-3 border-t border-gray-200">
            {/* ... (la section utilisateur reste la même) ... */}
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white transition-colors duration-200">
              <LogOut size={16} /><span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- Contenu principal --- */}
      {/* Le 'lg:pl-64' décale le contenu pour laisser la place à la sidebar sur grand écran */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Barre supérieure (Header) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          {/* Bouton Hamburger (visible uniquement sur mobile) */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-primary">
            <Menu size={24} />
          </button>

          {/* Titre de la page (ou un espace vide pour l'alignement) */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-xl font-semibold text-gray-800">
              {/* Le titre pourrait être dynamique */}
            </h1>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-primary"><Bell size={20} /></button>
            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
