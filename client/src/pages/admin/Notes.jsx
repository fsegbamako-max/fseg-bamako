import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Upload } from 'lucide-react';
import { admApi } from '../../services/api';
import { toast } from '../../store/toastStore';
import PublicationManager from '../../components/admin/PublicationManager';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function AdminNotes() {
  const [tab,      setTab]      = useState('documents');
  const [semestre, setSemestre] = useState('');
  const [classe,   setClasse]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const importRef  = useRef();
  const qc         = useQueryClient();

  const { data: classes } = useQuery({ queryKey: ['admin-classes'], queryFn: () => admApi.getClasses().then(r => r.data.data) });

  async function handleImportNotes(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!classe || !semestre) { toast.error('Sélectionnez classe et semestre'); return; }
    const form = new FormData();
    form.append('fichier', file);
    form.append('id_classe', classe);
    form.append('id_semestre', semestre);
    setLoading(true);
    try {
      const res = await admApi.importNotes(form);
      toast.success(res.data.message);
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur import'); }
    finally { setLoading(false); e.target.value = ''; }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-5 h-5 text-fseg-green" />
        <h1 className="text-2xl font-bold text-gray-900">Notes & Résultats</h1>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[['documents', 'Documents publiés'], ['import', 'Import notes individuelles']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === key ? 'bg-white shadow-sm text-fseg-green' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'documents' && (
        <PublicationManager
          queryKey="admin-notes"
          fetchFn={params => admApi.getNotes(params)}
          createFn={form  => admApi.createNote(form)}
          updateFn={(id, d) => admApi.updateNote(id, d)}
          deleteFn={id    => admApi.deleteNote(id)}
          addFilesFn={(id, f) => admApi.addFilesNote(id, f)}
          deleteFileFn={fileId => admApi.deleteFileNote(fileId)}
          classes={classes || []}
          entityLabel="note"
          fileOptions={{ accept: '.pdf,.doc,.docx,.jpg,.png,*' }}
        />
      )}

      {tab === 'import' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Importer un relevé Excel</h2>
            <p className="text-sm text-gray-500 mb-5">
              Le fichier Excel doit avoir une colonne <strong>Matricule</strong> et une colonne par matière.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Classe</label>
                <select value={classe} onChange={e => setClasse(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner une classe</option>
                  {classes?.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Semestre</label>
                <select value={semestre} onChange={e => setSemestre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner un semestre</option>
                  {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semestre {s}</option>)}
                </select>
              </div>

              <Button onClick={() => importRef.current?.click()} loading={loading} className="w-full">
                <Upload className="w-4 h-4" />
                {loading ? 'Import en cours...' : 'Choisir le fichier Excel'}
              </Button>
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportNotes} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
