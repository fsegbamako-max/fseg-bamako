import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../services/api';
import { FileText, File, Image } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

function FileIcon({ type }) {
  if (type === 'pdf')   return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  if (type === 'image') return <Image    className="w-5 h-5 text-blue-400 shrink-0" />;
  return <File className="w-5 h-5 text-gray-400 shrink-0" />;
}

function nomPropre(url) {
  return url?.split('?')[0].split('/').pop().replace(/^\d+_/, '') || '';
}

export default function Documents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-documents'],
    queryFn: () => publicApi.getDocuments().then(r => r.data.data),
  });

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-fseg-green mb-2">📄 Documents officiels</h1>
      <p className="text-gray-500 text-sm mb-8">
        Communiqués, résultats, notes officielles et documents administratifs de la FSEG.
      </p>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-xl p-4">
          Impossible de charger les documents.
        </p>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <p className="text-gray-400 text-center py-16">Aucun document disponible.</p>
      )}

      <div className="space-y-5">
        {data?.map(pub => (
          <article key={pub.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">{pub.titre}</h3>
            {pub.description && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{pub.description}</p>
            )}
            {pub.fichiers_documents?.length > 0 && (
              <ul className="mt-3 space-y-2">
                {pub.fichiers_documents.map(f => (
                  <li key={f.id}>
                    {f.type_fichier === 'video' ? (
                      <video controls className="w-full rounded-xl bg-black">
                        <source src={f.fichier} />
                      </video>
                    ) : (
                      <a
                        href={f.fichier}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <FileIcon type={f.type_fichier} />
                        <span className="text-sm text-gray-700 truncate">{nomPropre(f.fichier)}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
