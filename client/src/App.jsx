import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout  from './components/layout/PublicLayout';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout   from './components/layout/AdminLayout';

// Guards
import { StudentRoute, AdminRoute } from './components/ProtectedRoute';

// Toast
import Toast from './components/ui/Toast';

// Pages publiques
import Accueil      from './pages/public/Accueil';
import APropos      from './pages/public/APropos';
import Formations   from './pages/public/Formations';
import Departements from './pages/public/Departements';
import Actualites   from './pages/public/Actualites';
import Documents    from './pages/public/Documents';
import Projets      from './pages/public/Projets';
import Contact      from './pages/public/Contact';

// Pages étudiant auth
import StudentLogin from './pages/student/Login';
import Register     from './pages/student/Register';
import MotDePasseOublie from './pages/student/MotDePasseOublie';

// Pages étudiant (protégées)
import Dashboard    from './pages/student/Dashboard';
import Cours        from './pages/student/Cours';
import Notes        from './pages/student/Notes';
import Emploi       from './pages/student/Emploi';
import Profil       from './pages/student/Profil';

// Pages admin
import AdminLogin      from './pages/admin/Login';
import AdminDashboard  from './pages/admin/Dashboard';
import AdminEtudiants  from './pages/admin/Etudiants';
import AdminCours      from './pages/admin/Cours';
import AdminNotes      from './pages/admin/Notes';
import AdminEmplois    from './pages/admin/Emplois';
import AdminClasses    from './pages/admin/Classes';
import AdminActualites from './pages/admin/Actualites';
import AdminDocuments  from './pages/admin/Documents';

export default function App() {
  return (
    <>
      <Toast />
      <Routes>

        {/* ── Site public (accès libre) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/"            element={<Accueil />} />
          <Route path="/a-propos"    element={<APropos />} />
          <Route path="/about.php"   element={<APropos />} />
          <Route path="/formations"  element={<Formations />} />
          <Route path="/formations.php" element={<Formations />} />
          <Route path="/departements" element={<Departements />} />
          <Route path="/departements.php" element={<Departements />} />
          <Route path="/actualites"  element={<Actualites />} />
          <Route path="/actualites.php" element={<Actualites />} />
          <Route path="/documents"   element={<Documents />} />
          <Route path="/documents/documents.php" element={<Documents />} />
          <Route path="/projets"     element={<Projets />} />
          <Route path="/projets.php" element={<Projets />} />
          <Route path="/contact"     element={<Contact />} />
          <Route path="/contact.php" element={<Contact />} />
        </Route>

        {/* ── Auth étudiant ── */}
        <Route path="/etudiants/connexion"   element={<StudentLogin />} />
        <Route path="/etudiants/login.php"    element={<StudentLogin />} />
        <Route path="/etudiants/inscription"  element={<Register />} />
        <Route path="/etudiants/inscription.php" element={<Register />} />
        <Route path="/etudiants/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/etudiants/mot_de_passe_oublie.php" element={<MotDePasseOublie />} />

        {/* ── Espace étudiant (protégé) ── */}
        <Route element={<StudentRoute />}>
          <Route element={<StudentLayout />}>
            <Route path="/etudiants/tableau-de-bord" element={<Dashboard />} />
            <Route path="/etudiants/tableau_de_bord.php" element={<Dashboard />} />
            <Route path="/etudiants/cours"            element={<Cours />} />
            <Route path="/etudiants/cours.php"        element={<Cours />} />
            <Route path="/etudiants/notes"            element={<Notes />} />
            <Route path="/etudiants/notes.php"        element={<Notes />} />
            <Route path="/etudiants/emploi"           element={<Emploi />} />
            <Route path="/etudiants/emploi_du_temps.php" element={<Emploi />} />
            <Route path="/etudiants/profil"           element={<Profil />} />
            <Route path="/etudiants/profil.php"       element={<Profil />} />
          </Route>
        </Route>

        {/* ── Auth admin ── */}
        <Route path="/admin/connexion" element={<AdminLogin />} />
        <Route path="/admin/login.php" element={<AdminLogin />} />

        {/* ── Espace admin (protégé) ── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"                element={<AdminDashboard />} />
            <Route path="/admin/etudiants"      element={<AdminEtudiants />} />
            <Route path="/admin/cours"          element={<AdminCours />} />
            <Route path="/admin/notes"          element={<AdminNotes />} />
            <Route path="/admin/emplois"        element={<AdminEmplois />} />
            <Route path="/admin/classes"        element={<AdminClasses />} />
            <Route path="/admin/actualites"     element={<AdminActualites />} />
            <Route path="/admin/documents"      element={<AdminDocuments />} />
            <Route path="/admin/documents.php"  element={<AdminDocuments />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
