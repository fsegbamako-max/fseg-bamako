import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, Calendar, User } from 'lucide-react';

const tabs = [
  { to: '/etudiants/tableau-de-bord', icon: LayoutDashboard, label: 'Accueil'  },
  { to: '/etudiants/cours',           icon: BookOpen,        label: 'Cours'    },
  { to: '/etudiants/notes',           icon: BarChart2,       label: 'Notes'    },
  { to: '/etudiants/emploi',          icon: Calendar,        label: 'Emploi'   },
  { to: '/etudiants/profil',          icon: User,            label: 'Profil'   },
];

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">

      {/* Top bar */}
      <header className="bg-fseg-green text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow">
        <img src="/assets/images/logo.png" alt="FSEG" className="w-7 h-7 object-contain rounded" />
        <span className="font-semibold text-sm">FSEG Bamako</span>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-pb">
        <div className="grid grid-cols-5">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive ? 'text-fseg-green' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
