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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">

      {/* Top bar */}
      <header className="bg-fseg-green text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm min-h-[3.25rem]">
        <img src="/assets/images/logo.png" alt="FSEG" className="w-8 h-8 object-contain rounded" />
        <span className="font-semibold text-sm tracking-wide">FSEG Bamako</span>
      </header>

      {/* Page content */}
      <div className="flex-1 min-w-0 overflow-y-auto md:ml-56 animate-fade-in">
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav aria-label="Navigation étudiant" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-4px_16px_rgba(18,53,35,0.06)] z-30 safe-pb md:top-[3.25rem] md:bottom-0 md:right-auto md:w-56 md:border-t-0 md:border-r md:p-3 md:shadow-none md:bg-white">
        <div className="grid grid-cols-5 md:flex md:flex-col md:gap-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center py-2 gap-0.5 transition-colors md:min-h-11 md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:rounded-lg ${
                  isActive ? 'text-fseg-green bg-fseg-light' : 'text-gray-500 hover:text-fseg-green hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-medium md:text-sm">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
