import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, BarChart2, GraduationCap, UserCheck, LayoutDashboard } from 'lucide-react';
import { admApi } from '../../services/api';
import { useAdminStore } from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';

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
    <div className="max-w-4xl mx-auto">
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

      <div className="mt-8 bg-fseg-light border border-fseg-green/20 rounded-2xl p-5">
        <h2 className="font-semibold text-fseg-green mb-2">Accès rapide</h2>
        <p className="text-sm text-gray-600">
          Utilisez la barre latérale pour gérer les étudiants, publier des cours, importer des notes et administrer l'emploi du temps.
        </p>
      </div>
    </div>
  );
}
