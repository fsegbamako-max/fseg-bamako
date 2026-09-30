import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, BarChart2, Calendar,
  Newspaper, FileText, GraduationCap, Menu, X, LogOut, ShieldCheck
} from 'lucide-react';
import { useAdminStore } from '../../store/authStore';
import { admApi } from '../../services/api';

const navItems = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/admin/etudiants',   icon: Users,           label: 'Étudiants'       },
  { to: '/admin/classes',     icon: GraduationCap,   label: 'Classes'         },
  { to: '/admin/cours',       icon: BookOpen,        label: 'Cours'           },
  { to: '/admin/notes',       icon: BarChart2,       label: 'Notes & Résultats'},
  { to: '/admin/emplois',     icon: Calendar,        label: 'Emplois du temps' },
  { to: '/admin/actualites',  icon: Newspaper,       label: 'Actualités'      },
  { to: '/admin/documents',   icon: FileText,        label: 'Documents officiels' },
  { to: '/admin/administrateurs', icon: ShieldCheck, label: 'Administrateurs', superAdminOnly: true },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const admin    = useAdminStore(s => s.admin);
  const logout   = useAdminStore(s => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    try { await admApi.logout(); } catch {}
    logout();
    navigate('/admin/connexion', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside id="admin-sidebar" className={`fixed inset-y-0 left-0 h-full w-64 bg-fseg-dark text-white z-50 flex-col border-r border-white/10 transition-transform duration-300
        ${sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'} md:flex md:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="FSEG" className="w-8 h-8 rounded-full" onError={e => e.target.style.display='none'} />
            <div>
              <p className="font-bold text-sm">FSEG Bamako</p>
              <p className="text-xs text-white/60">Administration</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu" className="md:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.filter(item => !item.superAdminOnly || admin?.is_super_admin).map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `mx-2 flex min-h-11 items-center gap-3 rounded-r-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors
                 ${isActive ? 'border-fseg-gold bg-white/15 text-white' : 'border-transparent text-white/75 hover:text-white hover:bg-white/10'}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {admin?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.nom_complet || admin?.username}</p>
              <p className="text-xs text-white/50">Administrateur</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-white/75 hover:text-white hover:bg-white/10 text-sm w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top bar */}
        <header className="fixed top-0 left-0 right-0 md:left-64 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3 z-30 shadow-sm min-h-[3.25rem]">
          <button onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu" aria-controls="admin-sidebar" aria-expanded={sidebarOpen} className="md:hidden min-h-11 min-w-11 grid place-items-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">Panel d'administration</span>
        </header>

        <main className="flex-1 min-w-0 overflow-auto p-4 pt-16 md:p-6 md:pt-16 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
