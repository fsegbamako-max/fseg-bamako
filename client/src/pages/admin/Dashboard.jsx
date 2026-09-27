import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, BookOpen, BarChart2, GraduationCap, UserCheck, Newspaper, FileText, Calendar, Upload, ExternalLink } from 'lucide-react';
import { admApi } from '../../services/api';
import { useAdminStore } from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';

const quickLinks = [
  { to: '/admin/actualites', icon: Newspaper, label: 'Actualités' },
  { to: '/admin/documents', icon: FileText, label: 'Documents officiels' },
  { to: '/admin/etudiants', icon: Users, label: 'Étudiants' },
  { to: '/admin/cours', icon: BookOpen, label: 'Cours' },
  { to: '/admin/notes', icon: Upload, label: 'Importer des notes' },
  { to: '/admin/emplois', icon: Calendar, label: 'Emplois du temps' },
  { to: '/admin/classes', icon: GraduationCap, label: 'Classes' },
];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`${color} text-white rounded-xl p-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const admin = useAdminStore(s => s.admin);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => admApi.getStats().then(r => r.data.stats)
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenue, <span className="font-medium text-fseg-green">{admin?.nom_complet || admin?.username}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Users}       label="Étudiants inscrits"  value={stats?.total_etudiants?.toLocaleString()} color="bg-blue-500" />
          <StatCard icon={UserCheck}   label="Comptes actifs"      value={stats?.comptes_actifs?.toLocaleString()}  color="bg-emerald-500" />
          <StatCard icon={GraduationCap} label="Classes"           value={stats?.total_classes}  color="bg-purple-500" />
          <StatCard icon={BookOpen}    label="Cours publiés"       value={stats?.total_cours}    color="bg-orange-500" />
          <StatCard icon={BarChart2}   label="Publications notes"  value={stats?.total_notes}    color="bg-red-500" />
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold text-gray-900">Accès rapide</h2>
          <Link to="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-fseg-green hover:underline">
            Voir le site public <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 text-sm font-medium text-gray-700 hover:border-fseg-green/50 hover:text-fseg-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fseg-green">
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
