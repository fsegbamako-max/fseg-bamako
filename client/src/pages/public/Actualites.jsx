import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function formatText(text) {
  if (!text) return null;
  // Support balisage WhatsApp basique : *gras* _italique_ ~barré~
  return text
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br>');
}

export default function Actualites() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-actualites'],
    queryFn: () => publicApi.getActualites().then(r => r.data.data),
  });

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-fseg-green mb-8">📰 Actualités</h1>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-xl p-4">
          Impossible de charger les actualités.
        </p>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <p className="text-gray-400 text-center py-16">Aucune actualité pour le moment.</p>
      )}

      <div className="space-y-6">
        {data?.map(a => (
          <article key={a.id} className="border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="text-xs text-gray-400 mb-2">
              Publié le {new Date(a.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">{a.titre}</h2>

            {a.contenu && (
              <div
                className="text-gray-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(a.contenu) }}
              />
            )}

            {/* Images */}
            {a.fichiers_actualites?.filter(f => f.type_fichier === 'image').map(f => (
              <img
                key={f.id}
                src={f.fichier}
                alt=""
                className="mt-4 rounded-xl max-h-80 w-full object-contain bg-gray-50"
              />
            ))}

            {/* PDFs */}
            {a.fichiers_actualites?.filter(f => f.type_fichier === 'pdf').map(f => (
              <a
                key={f.id}
                href={f.fichier}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm text-fseg-green hover:underline"
              >
                📄 {f.fichier.split('/').pop().replace(/^\d+_/, '')}
              </a>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
