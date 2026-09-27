import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Upload, Download, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [studentModal, setStudentModal] = useState(null);
  const importRef   = useRef();
  const qc          = useQueryClient();

  const { data: classes } = useQuery({ queryKey: ['admin-classes'], queryFn: () => admApi.getClasses().then(r => r.data.data) });

  const { data: etudData, isLoading } = useQuery({
    queryKey: ['admin-etudiants', search, classe, page],
    queryFn:  () => admApi.getEtudiants({ search, id_classe: classe || undefined, page, limit: 50 }).then(r => r.data),
    keepPreviousData: true
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

  function confirmDeleteStudent(student) {
    const name = `${student.prenom} ${student.nom}`.trim();
    if (window.confirm(`Supprimer définitivement la fiche de ${name} et son compte étudiant associé ?`)) {
      deleteStudentMutation.mutate(student.id);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file || !classe) { toast.error('Sélectionnez une classe d\'abord'); return; }
    const form = new FormData();
    form.append('fichier', file);
    form.append('id_classe', classe);
    try {
      const res = await admApi.importEtudiants(form);
      toast.success(res.data.message);
      qc.invalidateQueries(['admin-etudiants']);
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur import'); }
    e.target.value = '';
  }

  async function handleExport() {
    try {
      const res = await admApi.exportEtudiants({ id_classe: classe || undefined });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = Object.assign(document.createElement('a'), { href: url, download: 'etudiants.xlsx' });
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Erreur export'); }
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
          <Button size="sm" onClick={() => importRef.current?.click()}>
            <Upload className="w-4 h-4" /> Importer Excel
          </Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
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
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      ...initial,
      id_classe: initial?.id_classe || selectedClass || '',
      date_naissance: dateInputValue(initial?.date_naissance)
    }
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(values) {
    setLoading(true);
    const { matricule, ...studentData } = values;
    try {
      if (mode === 'edit') await admApi.updateEtudiant(initial.id, studentData);
      else await admApi.createEtudiant({ ...studentData, matricule });
      await qc.invalidateQueries({ queryKey: ['admin-etudiants'] });
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
      <Input label="Numéro d’ordre" inputMode="numeric" {...register('numero_ordre')} />
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
      <div className="sm:col-span-2 flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1">{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
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
