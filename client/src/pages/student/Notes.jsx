import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { studentApi } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

function NoteRow({ matiere, note }) {
  const val    = note !== null && note !== undefined ? parseFloat(note) : null;
  const color  = val === null ? 'text-gray-400'
               : val >= 10   ? 'text-emerald-600 font-semibold'
               : 'text-red-500 font-semibold';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700 flex-1 pr-4">{matiere}</span>
      <span className={`text-sm ${color}`}>{val !== null ? `${val}/20` : '—'}</span>
    </div>
  );
}

function DocCard({ doc }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(o => !o)}>
        <div>
          <p className="font-semibold text-sm text-gray-900">{doc.titre}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-2 space-y-2">
          {doc.fichiers?.map(f => (
            <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 group">
              <FileText className="w-4 h-4 text-red-400" />
              <span className="flex-1 text-sm text-gray-700 truncate">{f.nom}</span>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-fseg-green" />
            </a>
          ))}
          {!doc.fichiers?.length && <p className="text-sm text-gray-400 text-center">Aucun fichier</p>}
        </div>
      )}
    </div>
  );
}

export default function Notes() {
  const [tab,      setTab]      = useState('releve');    // 'releve' | 'documents'
  const [semestre, setSemestre] = useState(0);

  const notesQuery = useQuery({
    queryKey: ['notes', semestre],
    queryFn:  () => studentApi.getNotes(semestre).then(r => r.data),
    enabled:  tab === 'releve'
  });

  const docsQuery = useQuery({
    queryKey: ['note-documents'],
    queryFn:  () => studentApi.getNoteDocuments().then(r => r.data.data),
    enabled:  tab === 'documents'
  });

  const semestres = notesQuery.data?.semestres || [];
  const notes     = notesQuery.data?.notes     || [];

  return (
    <div className="max-w-md mx-auto px-4 pt-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 className="w-5 h-5 text-fseg-green" />
        <h1 className="text-xl font-bold text-gray-900">Notes</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {[['releve', 'Relevé de notes'], ['documents', 'Documents publiés']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === key ? 'bg-white shadow-sm text-fseg-green' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Relevé de notes ── */}
      {tab === 'releve' && (
        <>
          {notesQuery.isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

          {!notesQuery.isLoading && semestres.length > 0 && (
            <>
              {/* Semester selector */}
              <div className="flex flex-wrap gap-2 mb-5">
                {semestres.map(s => (
                  <button key={s} onClick={() => setSemestre(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${semestre === s ? 'bg-fseg-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-fseg-green'}`}>
                    S{s}
                  </button>
                ))}
              </div>

              {semestre === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">
                  Sélectionnez un semestre pour voir vos notes.
                </p>
              )}

              {semestre > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Semestre {semestre}</p>
                  {notes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune note disponible.</p>}
                  {notes.map((n, i) => <NoteRow key={i} matiere={n.matiere} note={n.note} />)}
                </div>
              )}
            </>
          )}

          {!notesQuery.isLoading && semestres.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-16">Aucun semestre disponible.</p>
          )}
        </>
      )}

      {/* ── Documents publiés ── */}
      {tab === 'documents' && (
        <>
          {docsQuery.isLoading && <div className="flex justify-center py-16"><Spinner /></div>}
          {docsQuery.data?.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-16">Aucun document publié.</p>
          )}
          <div className="space-y-3">
            {docsQuery.data?.map(doc => <DocCard key={doc.id} doc={doc} />)}
          </div>
        </>
      )}
    </div>
  );
}
