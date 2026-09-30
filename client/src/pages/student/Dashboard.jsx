import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart2, Calendar, User, Newspaper, Bell } from 'lucide-react';
import { studentApi } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const tiles = [
  { to: '/etudiants/cours',  icon: BookOpen,  label: 'Cours',            color: 'bg-fseg-green', bg: 'bg-fseg-light' },
  { to: '/etudiants/notes',  icon: BarChart2, label: 'Notes',            color: 'bg-teal-700',   bg: 'bg-teal-50'    },
  { to: '/etudiants/emploi', icon: Calendar,  label: 'Emploi du temps',  color: 'bg-amber-600',  bg: 'bg-amber-50'   },
  { to: '/etudiants/profil', icon: User,      label: 'Mon profil',       color: 'bg-cyan-800',   bg: 'bg-cyan-50'    },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profilData, isLoading } = useQuery({
    queryKey: ['profil'],
    queryFn:  () => studentApi.getProfil().then(r => r.data.data)
  });

  const { data: actusData } = useQuery({
    queryKey: ['actualites', 1],
    queryFn:  () => studentApi.getActualites(1).then(r => r.data.data)
  });

  return (
    <div className="max-w-3xl mx-auto px-4 pt-5 pb-2 animate-fade-in">
      {/* Header greeting */}
      <div className="flex items-center gap-3 mb-6">
        {profilData?.photo_profil ? (
          <img src={profilData.photo_profil} alt="Photo" className="w-12 h-12 rounded-full object-cover border-2 border-fseg-green/20" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-fseg-light flex items-center justify-center text-fseg-green font-bold text-lg">
            {profilData?.prenom?.[0] || '?'}
          </div>
        )}
        <div>
          {isLoading ? (
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-sm text-gray-500">Bienvenue,</p>
              <p className="font-semibold text-gray-900">{profilData?.prenom} {profilData?.nom}</p>
              <p className="text-xs text-fseg-green">{profilData?.nom_classe}</p>
            </>
          )}
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {tiles.map(({ to, icon: Icon, label, color, bg }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`${bg} min-h-32 rounded-2xl p-4 flex flex-col items-start gap-3 text-left hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fseg-green`}
          >
            <div className={`${color} text-white rounded-xl p-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
          </button>
        ))}
      </div>

      {/* Actualités récentes */}
      {actusData?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-fseg-green" />
              Actualités
            </h2>
          </div>
          <div className="space-y-3">
            {actusData.slice(0, 3).map(actu => (
              <div key={actu.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <span className="inline-block bg-fseg-light text-fseg-green text-xs font-medium px-2 py-0.5 rounded-full mb-2">
                  {actu.categorie}
                </span>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{actu.titre}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(actu.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
