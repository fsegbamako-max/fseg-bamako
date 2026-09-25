import { useQuery } from '@tanstack/react-query';
import { FileText, FileVideo, File, Download, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { studentApi } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function FileIcon({ type }) {
  if (type === 'pdf')    return <FileText className="w-5 h-5 text-red-500" />;
  if (type === 'video')  return <FileVideo className="w-5 h-5 text-purple-500" />;
  if (type === 'image')  return <File className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function CoursCard({ cours }) {
  const [open, setOpen] = useState(false);
  const dateStr = new Date(cours.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-start justify-between p-4 text-left gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{cours.titre}</p>
          {cours.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cours.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{dateStr} · {cours.fichiers?.length || 0} fichier(s)</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />}
      </button>

      {open && cours.fichiers?.length > 0 && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-2 space-y-2">
          {cours.fichiers.map(f => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <FileIcon type={f.type} />
              <span className="flex-1 text-sm text-gray-700 truncate">{f.nom}</span>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-fseg-green shrink-0" />
            </a>
          ))}
        </div>
      )}

      {open && (!cours.fichiers || cours.fichiers.length === 0) && (
        <div className="border-t border-gray-50 px-4 py-4 text-sm text-gray-400 text-center">
          Aucun fichier disponible
        </div>
      )}
    </div>
  );
}

export default function Cours() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cours'],
    queryFn:  () => studentApi.getCours().then(r => r.data.data)
  });

  return (
    <div className="max-w-md mx-auto px-4 pt-5">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-fseg-green" />
        <h1 className="text-xl font-bold text-gray-900">Cours</h1>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          Impossible de charger les cours.
        </div>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun cours publié pour l'instant.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.map(cours => <CoursCard key={cours.id} cours={cours} />)}
      </div>
    </div>
  );
}
