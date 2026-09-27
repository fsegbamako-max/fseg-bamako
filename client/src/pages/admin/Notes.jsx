import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Upload, FileSpreadsheet, ScanSearch, CheckCircle2 } from 'lucide-react';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [identityColumns, setIdentityColumns] = useState('6');
  const [notesFile, setNotesFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [subjectNames, setSubjectNames] = useState([]);
  const importRef  = useRef();
  const qc         = useQueryClient();

  const { data: classes } = useQuery({ queryKey: ['admin-classes'], queryFn: () => admApi.getClasses().then(r => r.data.data) });

  function handleNotesFileChange(event) {
    setNotesFile(event.target.files?.[0] || null);
    setAnalysis(null);
    setSubjectNames([]);
  }

  async function analyzeNotesFile() {
    if (!notesFile) { toast.error('Choisissez un fichier Excel ou CSV.'); return; }
    if (!classe || !semestre) { toast.error('Sélectionnez la classe et le semestre.'); return; }
    const form = new FormData();
    form.append('fichier', notesFile);
    form.append('id_classe', classe);
    form.append('id_semestre', semestre);
    form.append('identity_columns', identityColumns);
    setAnalyzing(true);
    try {
      const res = await admApi.previewNotesImport(form);
      const detected = res.data.data;
      setAnalysis(detected);
      setSubjectNames(detected.subjects.map(subject => /^\d+$/.test(subject.header) ? '' : subject.header));
      toast.success(`Analyse réussie : ${detected.subjects.length} matière(s) détectée(s) après ${detected.identity_columns} colonne(s) d’identité.`);
    } catch (error) {
      toast.error(`Analyse échouée. ${error.response?.data?.message || error.message || 'Vérifiez le fichier et ses colonnes.'}`);
    } finally { setAnalyzing(false); }
  }

  async function handleImportNotes() {
    if (!notesFile || !analysis || !classe || !semestre) {
      toast.error('Analysez le fichier et sélectionnez la classe et le semestre.');
      return;
    }
    if (subjectNames.length !== analysis.subjects.length || subjectNames.some(name => !name.trim())) {
      toast.error('Saisissez le nom de chaque matière détectée.');
      return;
    }

    const form = new FormData();
    form.append('fichier', notesFile);
    form.append('id_classe', classe);
    form.append('id_semestre', semestre);
    form.append('identity_columns', analysis.identity_columns);
    form.append('subject_names', JSON.stringify(subjectNames));
    setLoading(true);
    try {
      const res = await admApi.importNotes(form);
      toast.success(res.data.message || 'Import des notes terminé avec succès.');
      setNotesFile(null);
      setAnalysis(null);
      setSubjectNames([]);
      if (importRef.current) importRef.current.value = '';
    } catch (error) {
      const message = error.code === 'ECONNABORTED'
        ? 'Le traitement prend trop de temps. Vérifiez les résultats avant de relancer.'
        : error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Import échoué. ${message}`);
    } finally { setLoading(false); }
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
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 mb-5">
            <FileSpreadsheet className="w-5 h-5 text-fseg-green" />
            <h2 className="text-lg font-semibold text-gray-900">Import individuel des notes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label htmlFor="notes-import-class" className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select id="notes-import-class" value={classe} onChange={e => setClasse(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Sélectionner une classe</option>
                {classes?.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="notes-import-semester" className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <select id="notes-import-semester" value={semestre} onChange={e => setSemestre(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Sélectionner un semestre</option>
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semestre {s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="notes-identity-columns" className="block text-sm font-medium text-gray-700 mb-1">Colonnes d’identité</label>
              <select id="notes-identity-columns" value={identityColumns}
                onChange={e => { setIdentityColumns(e.target.value); setAnalysis(null); setSubjectNames([]); }}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="6">6 colonnes, matières à partir de la 7e</option>
                <option value="7">7 colonnes, matières à partir de la 8e</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
            <div className="flex-1 min-w-0">
              <label htmlFor="notes-import-file" className="block text-sm font-medium text-gray-700 mb-1">Fichier Excel ou CSV</label>
              <input ref={importRef} id="notes-import-file" type="file" accept=".xlsx,.xls,.csv"
                onChange={event => handleNotesFileChange(event)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium cursor-pointer" />
            </div>
            <Button onClick={analyzeNotesFile} loading={analyzing} disabled={loading || !notesFile}>
              <ScanSearch className="w-4 h-4" /> {analyzing ? 'Analyse en cours...' : 'Analyser les colonnes'}
            </Button>
          </div>

          {analysis && (
            <section className="border-t border-gray-200 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">{analysis.subjects.length} matières détectées</h3>
                </div>
                <span className="text-xs text-gray-500">
                  Identifiant détecté : {analysis.identifier_type === 'numero_ordre' ? 'numéro d’ordre' : 'matricule'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                {analysis.subjects.map((subject, index) => (
                  <div key={subject.columnIndex} className="grid grid-cols-[minmax(7rem,0.75fr)_minmax(0,1.25fr)] items-center gap-3 py-3 border-b border-gray-100">
                    <div className="min-w-0">
                      <label htmlFor={`notes-subject-${index}`} className="block text-sm font-medium text-gray-800">Matière {subject.position}</label>
                      <span className="block text-xs text-gray-500 truncate" title={subject.header}>Colonne {subject.columnIndex + 1} · {subject.header}</span>
                      {subject.samples.some(Boolean) && (
                        <span className="block text-[11px] text-gray-400 truncate">Notes : {subject.samples.filter(Boolean).slice(0, 3).join(' · ')}</span>
                      )}
                    </div>
                    <input id={`notes-subject-${index}`} type="text" required maxLength={120}
                      placeholder={`Nom de la matière ${subject.position}`}
                      value={subjectNames[index] || ''}
                      onChange={event => setSubjectNames(current => current.map((name, nameIndex) => nameIndex === index ? event.target.value : name))}
                      className="w-full min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-5">
                <Button onClick={handleImportNotes} loading={loading} disabled={analyzing || subjectNames.some(name => !name.trim())}>
                  <Upload className="w-4 h-4" /> {loading ? 'Import en cours...' : `Importer ${analysis.subjects.length} matières`}
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
