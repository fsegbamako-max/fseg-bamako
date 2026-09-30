import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/',             label: 'Accueil',                exact: true },
  { to: '/a-propos',     label: 'À propos'               },
  { to: '/formations',   label: 'Formations'             },
  { to: '/departements', label: 'Départements'           },
  { to: '/actualites',   label: 'Actualités et Annonces' },
  { to: '/documents',    label: 'Documents officiels'    },
  { to: '/projets',      label: 'Projets'                },
  { to: '/contact',      label: 'Contact'                },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Header ── */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

          {/* Logo + titre */}
          <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setMenuOpen(false)}>
            <img src="/assets/images/logo.png" alt="FSEG Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-fseg-green text-sm leading-tight hidden sm:block">
              Faculté des Sciences Économiques<br />et de Gestion (FSEG)
            </span>
            <span className="font-bold text-fseg-green text-sm sm:hidden">FSEG</span>
          </Link>

          {/* Hamburger */}
          <button
            className="text-fseg-green p-2 rounded-lg hover:bg-fseg-light transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu déroulant */}
        {menuOpen && (
          <div className="bg-white border-t border-gray-100 shadow-lg" onClick={() => setMenuOpen(false)}>
            <nav className="max-w-6xl mx-auto px-4 py-2 flex flex-col gap-1">
              {navLinks.map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-fseg-green text-white'
                        : 'text-gray-700 hover:bg-fseg-light hover:text-fseg-green'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-2 flex flex-col gap-1">
                <Link
                  to="/etudiants/connexion"
                  className="px-4 py-3 rounded-xl text-sm font-semibold bg-fseg-green text-white hover:bg-fseg-dark transition-colors text-center"
                >
                  Connexion étudiant
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Contenu ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-fseg-green text-white text-center py-6 mt-8">
        <p className="text-sm">© 2025 FSEG – Bamako | Tous droits réservés</p>
        <p className="text-xs text-white/70 mt-1">
          Université des Sciences Sociales et de Gestion de Bamako (USSGB)
        </p>
      </footer>
    </div>
  );
}
