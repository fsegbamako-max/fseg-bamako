import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { useCountUp } from '../../hooks/useCountUp';

const institutions = [
  { href: 'https://portail.ussgb.online/', src: '/assets/images/logo_ussgb.jpeg', label: 'USSGB' },
  { href: 'https://cenou.sama.money', src: '/assets/images/logo_sama.png', label: 'SAMA Money' },
  { href: 'https://play.google.com/store/apps/details?id=com.cenoumali.moncenouapp&hl=fr', src: '/assets/images/logo_cenou.png', label: 'CENOU' },
  { href: 'https://portail.campusmali.edu.ml/', src: '/assets/images/logo_campusmali.png', label: 'Campus Mali' },
  { href: 'https://www.enseignementsuperieur.gouv.ml', src: '/assets/images/logo_mesrs.jpeg', label: 'MESRS' },
];

function StatBox({ target, label }) {
  const [count, ref] = useCountUp(target);
  return (
    <div ref={ref} className="text-center p-6">
      <p className="text-4xl font-bold text-fseg-green">{count.toLocaleString('fr-FR')}</p>
      <p className="text-gray-600 mt-1 text-sm">{label}</p>
    </div>
  );
}

function excerpt(text, max = 200) {
  if (typeof text !== 'string' || !text) return '';
  let plain = text;
  let previous;
  do {
    previous = plain;
    plain = plain.replace(/<[^>]*>/g, '');
  } while (plain !== previous);
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

export default function Accueil() {
  const { data: actualites } = useQuery({
    queryKey: ['public-actualites-home'],
    queryFn: () => publicApi.getActualites(2).then(r => r.data.data),
  });

  const { data: documents } = useQuery({
    queryKey: ['public-documents-home'],
    queryFn: () => publicApi.getDocuments(2).then(r => r.data.data),
  });

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-fseg-green to-fseg-dark text-white py-16 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Faculté des Sciences Économiques et de Gestion (FSEG)
        </h2>
        <p className="mt-4 text-white/80 text-base max-w-xl mx-auto">
          Former des cadres compétents en sciences économiques et en gestion au service du Mali.
        </p>
      </section>

      {/* ── Photo ── */}
      <section>
        <img
          src="/assets/images/fseg.jpeg"
          alt="FSEG photo"
          className="w-full max-h-72 object-cover"
        />
      </section>

      {/* ── Bienvenue ── */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h3 className="text-xl font-bold text-fseg-green mb-3">Bienvenue à la FSEG – Bamako</h3>
        <p className="text-gray-700 leading-relaxed">
          La Faculté des Sciences Économiques et de Gestion (FSEG) de l'Université des Sciences Sociales
          et de Gestion de Bamako (USSGB) est une structure publique d'enseignement et de formation.
          Elle accueille des milliers d'étudiants et assure la formation de cadres capables d'analyser
          et de concevoir des politiques économiques et de gestion adaptées au développement durable du Mali.
        </p>
      </section>

      {/* ── Message du Doyen ── */}
      <section className="bg-fseg-light px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-fseg-green mb-3">Message du Doyen</h3>
          <p className="text-gray-700 leading-relaxed">
            <strong>Professeur Boubacar SANOGO</strong><br />
            La FSEG propose des formations en économie, gestion, finance et assurance, avec des filières
            adaptées aux besoins du marché de l'emploi. Nous nous engageons à préparer les étudiants
            aux emplois qualifiés de demain, en renforçant leur expertise et leur capacité à contribuer
            au développement économique du Mali.
          </p>
        </div>
      </section>

      {/* ── Actualités récentes ── */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h3 className="text-xl font-bold text-fseg-green mb-4">Actualités récentes</h3>
        {actualites?.length ? (
          <>
            <div className="space-y-4">
              {actualites.map(a => (
                <article key={a.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-semibold text-gray-900">{a.titre}</h4>
                  {a.contenu && <p className="text-sm text-gray-600 mt-1">{excerpt(a.contenu)}</p>}
                  <small className="text-xs text-gray-400 mt-2 block">
                    Publié le {new Date(a.date_publication).toLocaleDateString('fr-FR')}
                  </small>
                </article>
              ))}
            </div>
            <Link to="/actualites" className="inline-block mt-4 text-fseg-green font-medium hover:underline text-sm">
              Afficher toutes les actualités →
            </Link>
          </>
        ) : (
          <p className="text-gray-500 text-sm">Aucune actualité pour le moment.</p>
        )}
      </section>

      {/* ── Documents récents ── */}
      <section className="bg-gray-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-fseg-green mb-4">Documents récents</h3>
          {documents?.length ? (
            <>
              <div className="space-y-4">
                {documents.map(d => (
                  <article key={d.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
                    <h4 className="font-semibold text-gray-900">{d.titre}</h4>
                    {d.description && <p className="text-sm text-gray-600 mt-1">{excerpt(d.description, 150)}</p>}
                    <small className="text-xs text-gray-400 mt-2 block">
                      Publié le {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </small>
                  </article>
                ))}
              </div>
              <Link to="/documents" className="inline-block mt-4 text-fseg-green font-medium hover:underline text-sm">
                Afficher tous les documents →
              </Link>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Aucun document pour le moment.</p>
          )}
        </div>
      </section>

      {/* ── Chiffres clés ── */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-3 gap-4 divide-x divide-gray-100">
          <StatBox target={52600} label="Étudiants" />
          <StatBox target={137}   label="Enseignants" />
          <StatBox target={3}     label="Filières" />
        </div>
      </section>

      {/* ── Institutions ── */}
      <section className="bg-fseg-light px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-fseg-green mb-6 text-center">
            Institutions et services universitaires
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            {institutions.map(({ href, src, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img src={src} alt={label} className="h-12 w-12 object-contain rounded-lg" />
                <span className="text-xs text-fseg-green font-medium">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
