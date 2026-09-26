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
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-fseg-green text-white z-50 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="FSEG" className="w-8 h-8 rounded-full" onError={e => e.target.style.display='none'} />
            <div>
              <p className="font-bold text-sm">FSEG Bamako</p>
              <p className="text-xs text-white/60">Administration</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
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
                `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors
                 ${isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`
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
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/70 hover:text-white text-sm w-full">
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">Panel d'administration</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
