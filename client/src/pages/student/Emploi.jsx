import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, FileText, Image } from 'lucide-react';
import { studentApi } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function Emploi() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['emplois'],
    queryFn:  () => studentApi.getEmplois().then(r => r.data)
  });

  const pinned = data?.pinned;
  const autres = data?.autres || [];

  return (
    <div className="max-w-md mx-auto px-4 pt-5">
      <div className="flex items-center gap-2 mb-5">
        <Calendar className="w-5 h-5 text-fseg-green" />
        <h1 className="text-xl font-bold text-gray-900">Emploi du temps</h1>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          Impossible de charger l'emploi du temps.
        </div>
      )}

      {/* Image épinglée */}
      {pinned && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-fseg-green">📌</span>
              Emploi actuel
            </h2>
            <a href={pinned.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-xs text-fseg-green hover:underline">
              <Download className="w-3 h-3" />
              Télécharger
            </a>
          </div>

          {pinned.type === 'image' ? (
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <img src={pinned.url} alt="Emploi du temps" className="w-full object-contain bg-gray-50 max-h-96" />
            </div>
          ) : (
            <a href={pinned.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <FileText className="w-8 h-8 text-red-400" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{pinned.nom}</p>
                <p className="text-xs text-gray-400">Appuyer pour ouvrir</p>
              </div>
            </a>
          )}
        </div>
      )}

      {/* Autres fichiers */}
      {autres.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Anciens emplois du temps</h2>
          <div className="space-y-2">
            {autres.map(f => (
              <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:bg-gray-50 group">
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{f.nom}</p>
                  {f.date && (
                    <p className="text-xs text-gray-400">
                      {new Date(f.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <Download className="w-4 h-4 text-gray-300 group-hover:text-fseg-green shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !pinned && autres.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun emploi du temps disponible.</p>
        </div>
      )}
    </div>
  );
}
