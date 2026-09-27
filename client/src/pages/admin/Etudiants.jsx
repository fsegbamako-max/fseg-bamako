import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Upload, Download, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight, ArrowLeft, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { admApi } from '../../services/api';
import { toast } from '../../store/toastStore';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';

export default function AdminEtudiants() {
  const [tab,       setTab]       = useState('liste');     // 'liste' | 'comptes'
  const [search,    setSearch]    = useState('');
  const [classe,    setClasse]    = useState('');
  const [page,      setPage]      = useState(1);
  const [importPage, setImportPage] = useState(1);
  const [studentModal, setStudentModal] = useState(null);
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [selectedImports, setSelectedImports] = useState([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importClass, setImportClass] = useState('');
  const [importType, setImportType] = useState('partielle');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const importRef   = useRef();
  const qc          = useQueryClient();

  const { data: classes } = useQuery({ queryKey: ['admin-classes'], queryFn: () => admApi.getClasses().then(r => r.data.data) });

  const { data: etudData, isLoading } = useQuery({
    queryKey: ['admin-etudiants', search, classe, page],
    queryFn:  () => admApi.getEtudiants({ search, id_classe: classe || undefined, page, limit: 50 }).then(r => r.data),
    keepPreviousData: true
  });

  const { data: imports, isLoading: loadingImports } = useQuery({
    queryKey: ['admin-etudiant-imports'],
    queryFn: () => admApi.getImports().then(r => r.data.data),
    enabled: tab === 'liste'
  });

  const { data: importStudents, isLoading: loadingImportStudents } = useQuery({
    queryKey: ['admin-etudiant-import', selectedImportId, importPage],
    queryFn: () => admApi.getImportStudents(selectedImportId, { page: importPage, limit: 50 }).then(r => r.data),
    enabled: tab === 'liste' && Boolean(selectedImportId)
  });

  const { data: comptes, isLoading: loadingComptes } = useQuery({
    queryKey: ['admin-comptes'],
    queryFn:  () => admApi.getComptes().then(r => r.data.data),
    enabled:  tab === 'comptes'
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }) => admApi.toggleCompte(id, action),
    onSuccess:  () => { qc.invalidateQueries(['admin-comptes']); toast.success('Compte mis à jour'); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Erreur')
  });

  const deleteStudentMutation = useMutation({
    mutationFn: admApi.deleteEtudiant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-etudiants'] });
      toast.success('Étudiant supprimé');
    },
    onError: error => toast.error(error.response?.data?.message || 'Suppression impossible')
  });

  const deleteImportsMutation = useMutation({
    mutationFn: admApi.deleteImports,
    onSuccess: (_response, ids) => {
      qc.invalidateQueries({ queryKey: ['admin-etudiant-imports'] });
      setSelectedImports([]);
      if (ids.includes(selectedImportId)) setSelectedImportId(null);
      toast.success(`${ids.length} liste(s) d’import supprimée(s). Les fiches officielles sont conservées.`);
    },
    onError: error => toast.error(error.response?.data?.message || 'Suppression impossible')
  });

  function confirmDeleteStudent(student) {
    const name = `${student.prenom} ${student.nom}`.trim();
    if (window.confirm(`Supprimer définitivement la fiche de ${name} et son compte étudiant associé ?`)) {
      deleteStudentMutation.mutate(student.id);
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!importFile || !importClass) { toast.error('Sélectionnez une classe et un fichier'); return; }
    const form = new FormData();
    form.append('fichier', importFile);
    form.append('id_classe', importClass);
    form.append('type_liste', importType);
    setImporting(true);
    try {
      const res = await admApi.importEtudiants(form);
      toast.success(`Import réussi. ${res.data.message}`);
      qc.invalidateQueries({ queryKey: ['admin-etudiants'] });
      qc.invalidateQueries({ queryKey: ['admin-etudiant-imports'] });
      setSelectedImportId(res.data.import_id);
      setPage(1);
      setImportPage(1);
      closeImportModal();
    } catch (error) {
      const message = error.code === 'ECONNABORTED'
        ? 'Le délai est dépassé. Vérifiez la liste des fichiers importés avant de relancer, car le lot a peut-être déjà été enregistré.'
        : error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Échec de l’import. ${message}`);
    }
    finally { setImporting(false); }
  }

  function toggleImportSelection(id) {
    setSelectedImports(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  function confirmDeleteImports(ids) {
    if (!ids.length) return;
    const noun = ids.length === 1 ? 'cette liste' : 'ces listes';
    if (window.confirm(`Supprimer ${noun} et les fichiers importés associés ? Les étudiants déjà ajoutés à la liste officielle seront conservés.`)) {
      deleteImportsMutation.mutate(ids);
    }
  }

  function closeImportModal() {
    setImportModalOpen(false);
    setImportClass('');
    setImportType('partielle');
    setImportFile(null);
    if (importRef.current) importRef.current.value = '';
  }

  async function handleExport() {
    try {
      const res = await admApi.exportEtudiants({ id_classe: classe || undefined });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = Object.assign(document.createElement('a'), { href: url, download: 'etudiants.xlsx' });
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export Excel téléchargé avec succès.');
    } catch (error) { toast.error(`Échec de l’export. ${error.response?.data?.message || error.message || 'Erreur inconnue'}`); }
  }

  const etudiants = etudData?.data || [];
  const total     = etudData?.total || 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Étudiants</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setStudentModal({ mode: 'create' })}>
            <Plus className="w-4 h-4" /> Ajouter étudiant
          </Button>
          <Button variant="secondary" onClick={handleExport} size="sm">
            <Download className="w-4 h-4" /> Exporter
          </Button>
          <Button size="sm" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4" /> Ajouter une liste
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[['liste', 'Liste officielle'], ['comptes', 'Comptes']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === key ? 'bg-white shadow-sm text-fseg-green' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'liste' && (
        <>
          <section className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Fichiers importés</h2>
                <p className="text-xs text-gray-500 mt-0.5">{imports?.length || 0} liste(s)</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedImports.length > 0 && (
                  <Button variant="secondary" size="sm" disabled={deleteImportsMutation.isPending}
                    onClick={() => confirmDeleteImports(selectedImports)}>
                    <Trash2 className="w-4 h-4" /> Supprimer ({selectedImports.length})
                  </Button>
                )}
                {!!imports?.length && (
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={selectedImports.length === imports.length}
                      onChange={() => setSelectedImports(selectedImports.length === imports.length ? [] : imports.map(item => item.id))} />
                    Tout sélectionner
                  </label>
                )}
              </div>
            </div>
            {loadingImports ? <div className="flex justify-center py-8"><Spinner /></div> : imports?.length ? (
              <div className="divide-y divide-gray-100">
                {imports.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${selectedImportId === item.id ? 'bg-green-50/60' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" aria-label={`Sélectionner ${importFileName(item)}`}
                      checked={selectedImports.includes(item.id)} onChange={() => toggleImportSelection(item.id)} />
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                    <button type="button" onClick={() => { setSelectedImportId(item.id); setImportPage(1); }}
                      className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fseg-green rounded">
                      <span className="block text-sm font-medium text-gray-800 truncate">{importFileName(item)}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {item.classes?.nom_classe || 'Classe inconnue'} · {formatImportDate(item.date_import)}
                      </span>
                      <span className="inline-flex mt-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {item.type_liste === 'complete' ? 'Liste complète' : 'Liste partielle'}
                      </span>
                    </button>
                    {item.fichier && (
                      <a href={item.fichier} target="_blank" rel="noopener noreferrer" title="Télécharger le fichier d’origine"
                        aria-label={`Télécharger ${importFileName(item)}`} className="p-2 text-gray-400 hover:text-fseg-green">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="px-4 py-8 text-center text-sm text-gray-500">Aucun fichier importé</p>}
          </section>

          {selectedImportId && (
            <section className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <button type="button" onClick={() => setSelectedImportId(null)} title="Fermer la liste"
                    className="p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {importFileName(importStudents?.import || imports?.find(item => item.id === selectedImportId))}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {importStudents?.import?.classes?.nom_classe || imports?.find(item => item.id === selectedImportId)?.classes?.nom_classe || ''}
                      {importStudents?.total !== undefined ? ` · ${importStudents.total} étudiant(s)` : ''}
                    </p>
                  </div>
                </div>
                {importStudents?.import?.fichier && (
                  <a href={importStudents.import.fichier} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-fseg-green hover:underline">
                    <ExternalLink className="w-4 h-4" /> Fichier d’origine
                  </a>
                )}
              </div>
              {loadingImportStudents ? <div className="flex justify-center py-10"><Spinner /></div> : importStudents?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">N°</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Matricule</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Étudiant</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Classe actuelle</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {importStudents.data.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{student.numero_ordre || '—'}</td>
                          <td className="px-4 py-3 font-mono text-gray-800">{student.matricule}</td>
                          <td className="px-4 py-3 text-gray-700">{student.prenom} {student.nom}</td>
                          <td className="px-4 py-3 text-gray-500">{student.classes?.nom_classe || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                    <span>{importStudents.total?.toLocaleString()} étudiant(s)</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setImportPage(value => Math.max(1, value - 1))} disabled={importPage === 1}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                      <span>Page {importPage}</span>
                      <button type="button" onClick={() => setImportPage(value => value + 1)} disabled={importStudents.data.length < 50}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ) : <p className="px-4 py-8 text-center text-sm text-gray-500">Aucun nouvel étudiant n’a été ajouté depuis ce fichier.</p>}
            </section>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select value={classe} onChange={e => { setClasse(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes les classes</option>
              {classes?.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
            </select>
          </div>

          {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">N°</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Matricule</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Prénom Nom</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">CENOU</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Date de naissance</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Lieu de naissance</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Passage</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Amphi</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Classe</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {etudiants.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{e.numero_ordre}</td>
                          <td className="px-4 py-3 font-mono font-medium text-gray-900">{e.matricule}</td>
                          <td className="px-4 py-3 text-gray-700">{e.prenom} {e.nom}</td>
                          <td className="px-4 py-3 text-gray-500">{e.cenou || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{e.date_naissance || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{e.lieu_naissance || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{e.passage || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{e.amphi || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{e.classes?.nom_classe}</td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" title="Modifier l’étudiant" aria-label={`Modifier ${e.prenom} ${e.nom}`}
                              onClick={() => setStudentModal({ mode: 'edit', data: e })}
                              className="inline-flex p-2 text-gray-400 hover:text-fseg-green hover:bg-gray-100 rounded-lg">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button type="button" title="Supprimer l’étudiant" aria-label={`Supprimer ${e.prenom} ${e.nom}`}
                              disabled={deleteStudentMutation.isPending}
                              onClick={() => confirmDeleteStudent(e)}
                              className="inline-flex p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>{total.toLocaleString()} étudiant(s)</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>Page {page}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={etudiants.length < 50}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'comptes' && (
        <>
          {loadingComptes ? <div className="flex justify-center py-16"><Spinner /></div> : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Étudiant</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Classe</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Créé le</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {comptes?.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{c.etudiants_officiels?.prenom} {c.etudiants_officiels?.nom}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.etudiants_officiels?.matricule}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{c.etudiants_officiels?.classes?.nom_classe}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${c.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {c.actif ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(c.date_creation).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleMutation.mutate({ id: c.etudiants_officiels?.id, action: c.actif ? 'deactivate' : 'activate' })}
                              className={`p-1.5 rounded-lg transition-colors ${c.actif ? 'text-orange-400 hover:bg-orange-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                              title={c.actif ? 'Désactiver' : 'Activer'}
                            >
                              {c.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Supprimer ce compte ?')) toggleMutation.mutate({ id: c.etudiants_officiels?.id, action: 'delete' }); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!comptes?.length && <div className="text-center py-12 text-sm text-gray-400">Aucun compte étudiant</div>}
            </div>
          )}
        </>
      )}

      <Modal
        open={importModalOpen}
        onClose={closeImportModal}
        title="Ajouter une liste d’étudiants"
      >
        <form onSubmit={handleImport} className="space-y-4">
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1.5">Type de liste</legend>
            <div role="group" aria-label="Type de liste" className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
              {[
                ['partielle', 'Liste partielle'],
                ['complete', 'Liste complète']
              ].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={importType === value}
                  onClick={() => setImportType(value)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${importType === value ? 'bg-white text-fseg-green shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="import-student-class" className="block text-sm font-medium text-gray-700 mb-1">Classe cible</label>
            <select id="import-student-class" value={importClass} onChange={event => setImportClass(event.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Sélectionner la classe à compléter</option>
              {classes?.map(item => <option key={item.id} value={item.id}>{item.nom_classe}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="import-student-file" className="block text-sm font-medium text-gray-700 mb-1">Fichier Excel ou CSV</label>
            <input id="import-student-file" ref={importRef} type="file" accept=".xlsx,.xls,.csv" required
              onChange={event => setImportFile(event.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium cursor-pointer" />
          </div>
          {importFile && <p className="text-xs text-gray-500 truncate">{importFile.name}</p>}
          <p className="text-sm text-gray-600">
            {importType === 'complete'
              ? 'Importez tous les étudiants de cette classe. Les fiches existantes restent intactes.'
              : 'Importez seulement les étudiants à ajouter ou à compléter. Les fiches existantes restent intactes.'}
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={closeImportModal} className="flex-1">Annuler</Button>
            <Button type="submit" loading={importing} disabled={!importClass || !importFile} className="flex-1">
              <Upload className="w-4 h-4" /> {importing ? 'Import en cours...' : 'Ajouter la liste'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!studentModal}
        onClose={() => setStudentModal(null)}
        title={studentModal?.mode === 'edit' ? 'Modifier un étudiant' : 'Ajouter un étudiant'}
        size="lg"
      >
        <EtudiantForm
          initial={studentModal?.data}
          mode={studentModal?.mode}
          classes={classes || []}
          selectedClass={classe}
          onClose={() => setStudentModal(null)}
        />
      </Modal>
    </div>
  );
}

function EtudiantForm({ initial, mode, classes, selectedClass, onClose }) {
  const qc = useQueryClient();
  const { data: studentDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['admin-etudiant', initial?.id],
    queryFn: () => admApi.getEtudiant(initial.id).then(r => r.data.data),
    enabled: mode === 'edit' && Boolean(initial?.id)
  });
  const student = studentDetails || initial;
  const compte = Array.isArray(student?.comptes_etudiants)
    ? student.comptes_etudiants[0]
    : student?.comptes_etudiants;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      ...initial,
      id_classe: initial?.id_classe || selectedClass || '',
      date_naissance: dateInputValue(initial?.date_naissance),
      telephone: '',
      nouveau_mot_de_passe: ''
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !student) return;
    reset({
      ...student,
      id_classe: student.id_classe || selectedClass || '',
      date_naissance: dateInputValue(student.date_naissance),
      telephone: compte?.telephone || '',
      nouveau_mot_de_passe: ''
    });
  }, [mode, student, compte?.telephone, selectedClass, reset]);

  async function onSubmit(values) {
    setLoading(true);
    const { matricule, photo_profil_fichier, ...studentData } = values;
    try {
      if (mode === 'edit') {
        const form = new FormData();
        Object.entries(studentData).forEach(([key, value]) => {
          if (key === 'nouveau_mot_de_passe' && !value) return;
          if (value !== undefined && value !== null) form.append(key, value);
        });
        if (photo_profil_fichier?.[0]) form.append('photo', photo_profil_fichier[0]);
        await admApi.updateEtudiant(initial.id, form);
      }
      else await admApi.createEtudiant({ ...studentData, matricule });
      await qc.invalidateQueries({ queryKey: ['admin-etudiants'] });
      await qc.invalidateQueries({ queryKey: ['admin-comptes'] });
      await qc.invalidateQueries({ queryKey: ['admin-etudiant', initial?.id] });
      toast.success(mode === 'edit' ? 'Étudiant modifié' : 'Étudiant ajouté');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enregistrement impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input label="Matricule" disabled={mode === 'edit'} error={errors.matricule?.message}
        {...register('matricule', { required: mode === 'create' ? 'Matricule requis' : false })} />
      <Input label="Numéro d’ordre" placeholder="Ex. 12, G1, EG2" {...register('numero_ordre')} />
      <Input label="Prénom" error={errors.prenom?.message}
        {...register('prenom', { required: 'Prénom requis' })} />
      <Input label="Nom" error={errors.nom?.message}
        {...register('nom', { required: 'Nom requis' })} />
      <Input label="CENOU" {...register('cenou')} />
      <Input label="Date de naissance" type="date" {...register('date_naissance')} />
      <Input label="Lieu de naissance" {...register('lieu_naissance')} />
      <Input label="Passage" {...register('passage')} />
      <Input label="Amphi" {...register('amphi')} />
      <div className="flex flex-col gap-1">
        <label htmlFor="student-class" className="text-sm font-medium text-gray-700">Classe</label>
        <select id="student-class" {...register('id_classe', { required: 'Classe requise' })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Choisir une classe</option>
          {classes.map(item => <option key={item.id} value={item.id}>{item.nom_classe}</option>)}
        </select>
        {errors.id_classe && <p className="text-xs text-red-600">{errors.id_classe.message}</p>}
      </div>
      {mode === 'edit' && loadingDetails && (
        <p className="sm:col-span-2 text-sm text-gray-500">Chargement du compte étudiant...</p>
      )}
      {mode === 'edit' && !loadingDetails && compte && (
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <Input label="Téléphone" inputMode="numeric" maxLength={8} error={errors.telephone?.message}
            {...register('telephone', { pattern: { value: /^[0-9]{8}$/, message: 'Le numéro doit contenir 8 chiffres.' } })} />
          <Input label="Nouveau mot de passe" type="password" autoComplete="new-password"
            error={errors.nouveau_mot_de_passe?.message}
            {...register('nouveau_mot_de_passe', { minLength: { value: 6, message: '6 caractères minimum.' } })} />
          <div className="sm:col-span-2 flex items-center gap-4">
            {compte.photo_profil && (
              <img src={compte.photo_profil} alt="Photo de profil actuelle"
                className="h-14 w-14 rounded-full object-cover" />
            )}
            <Input label="Nouvelle photo de profil" type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              {...register('photo_profil_fichier')} />
          </div>
        </div>
      )}
      {mode === 'edit' && !loadingDetails && !compte && (
        <p className="sm:col-span-2 text-sm text-gray-500">Aucun compte étudiant n’est associé à cette fiche.</p>
      )}
      <div className="sm:col-span-2 flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} disabled={loadingDetails} className="flex-1">{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
      </div>
    </form>
  );
}

function dateInputValue(value) {
  if (!value) return '';
  const iso = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const local = String(value).match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (local) return `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}`;
  return '';
}

function importFileName(item) {
  if (item?.nom_fichier) return item.nom_fichier;
  const storedName = item?.fichier?.split('/').pop()?.split('?')[0];
  if (!storedName) return 'Fichier importé';
  try { return decodeURIComponent(storedName).replace(/^\d+_/, ''); }
  catch { return storedName.replace(/^\d+_/, ''); }
}

function formatImportDate(value) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
