/**
 * Composant générique pour gérer cours / notes / emplois
 * Props :
 *   - queryKey        : string   (ex: 'admin-cours')
 *   - fetchFn         : () => Promise
 *   - createFn        : (FormData) => Promise
 *   - updateFn        : (id, data) => Promise
 *   - deleteFn        : (id) => Promise
 *   - addFilesFn      : (id, FormData) => Promise
 *   - deleteFileFn    : (fileId) => Promise
 *   - classes         : array
 *   - entityLabel     : string   (ex: 'cours')
 *   - extraFields?    : (register, errors) => JSX  (champs additionnels dans le form)
 *   - fileOptions?    : { accept, multiple, isPinnedOption }
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, ChevronDown, ChevronUp, ExternalLink, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from '../../store/toastStore';
import Button  from '../ui/Button';
import Input   from '../ui/Input';
import Modal   from '../ui/Modal';
import Spinner from '../ui/Spinner';

export default function PublicationManager({
  queryKey, fetchFn, createFn, updateFn, deleteFn, addFilesFn, deleteFileFn,
  classes = [], entityLabel = 'publication', fileOptions = {}
}) {
  const [filter, setFilter]     = useState('');
  const [modal,  setModal]      = useState(null);
  const [expanded, setExpanded] = useState({});
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: [queryKey, filter], queryFn: () => fetchFn(filter ? { id_classe: filter } : {}).then(r => r.data.data) });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess:  () => { qc.invalidateQueries([queryKey]); toast.success('Supprimé'); },
    onError:    e  => toast.error(e.response?.data?.message || 'Erreur')
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteFileFn,
    onSuccess:  () => { qc.invalidateQueries([queryKey]); toast.success('Fichier supprimé'); },
    onError:    e  => toast.error(e.response?.data?.message || 'Erreur')
  });

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })); }
  function confirmDelete(id) { if (window.confirm('Supprimer cette publication ?')) deleteMutation.mutate(id); }
  function confirmDeleteFile(fileId) { if (window.confirm('Supprimer ce fichier ?')) deleteFileMutation.mutate(fileId); }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
        </select>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <Plus className="w-4 h-4" /> Nouvelle publication
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      <div className="space-y-3">
        {data?.map(pub => (
          <PublicationCard
            key={pub.id}
            pub={pub}
            expanded={!!expanded[pub.id]}
            onToggle={() => toggle(pub.id)}
            onEdit={() => setModal({ mode: 'edit', data: pub })}
            onDelete={() => confirmDelete(pub.id)}
            onDeleteFile={confirmDeleteFile}
            addFilesFn={addFilesFn}
            queryKey={queryKey}
            fileOptions={fileOptions}
          />
        ))}
        {!isLoading && !data?.length && (
          <div className="text-center py-16 text-sm text-gray-400">Aucune publication</div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? `Modifier la ${entityLabel}` : `Nouvelle ${entityLabel}`}>
        <PubForm
          initial={modal?.data}
          mode={modal?.mode}
          classes={classes}
          onClose={() => setModal(null)}
          createFn={createFn}
          updateFn={updateFn}
          queryKey={queryKey}
          fileOptions={fileOptions}
          entityLabel={entityLabel}
        />
      </Modal>
    </div>
  );
}

function PublicationCard({ pub, expanded, onToggle, onEdit, onDelete, onDeleteFile, addFilesFn, queryKey, fileOptions }) {
  const fileRef = useRef();
  const qc      = useQueryClient();

  const fichiers = pub.fichiers_cours || pub.fichiers_notes || pub.fichiers_emplois || [];
  const dateStr  = new Date(pub.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  async function handleAddFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const form = new FormData();
    files.forEach(f => form.append('fichiers', f));
    try {
      await addFilesFn(pub.id, form);
      qc.invalidateQueries([queryKey]);
      toast.success(`${files.length} fichier(s) ajouté(s)`);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur upload'); }
    e.target.value = '';
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm text-gray-900">{pub.titre}</p>
          {pub.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pub.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{pub.classes?.nom_classe} · {dateStr} · {fichiers.length} fichier(s)</p>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit}   className="p-1.5 text-gray-400 hover:text-fseg-green hover:bg-green-50 rounded-lg"><Pencil  className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500   hover:bg-red-50   rounded-lg"><Trash2   className="w-4 h-4" /></button>
          <button onClick={onToggle} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50  rounded-lg">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
          {fichiers.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
              <span className="flex-1 text-sm text-gray-700 truncate">
                {f.fichier?.replace(/^\d+_/, '').split('/').pop().split('?')[0]}
                {f.is_pinned && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Épinglé</span>}
              </span>
              <a href={f.fichier} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-fseg-green p-1 rounded">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => onDeleteFile(f.id)} className="text-gray-400 hover:text-red-500 p-1 rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-fseg-green hover:underline">
            <Upload className="w-3.5 h-3.5" />
            Ajouter des fichiers
          </button>
          <input ref={fileRef} type="file" multiple accept={fileOptions.accept || '*'} className="hidden" onChange={handleAddFiles} />
        </div>
      )}
    </div>
  );
}

function PubForm({ initial, mode, classes, onClose, createFn, updateFn, queryKey, fileOptions, entityLabel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const qc      = useQueryClient();

  async function onSubmit(data) {
    setLoading(true);
    try {
      if (mode === 'edit') {
        await updateFn(initial.id, { titre: data.titre, description: data.description });
      } else {
        const form = new FormData();
        form.append('titre', data.titre);
        if (data.description) form.append('description', data.description);
        form.append('id_classe', data.id_classe);
        Array.from(fileRef.current?.files || []).forEach(f => form.append('fichiers', f));
        if (data.is_pinned) form.append('is_pinned', 'true');
        await createFn(form);
      }
      qc.invalidateQueries([queryKey]);
      toast.success(mode === 'edit' ? 'Modifié' : 'Publié');
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally      { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Titre" placeholder={`Titre de la ${entityLabel}`} error={errors.titre?.message}
        {...register('titre', { required: 'Requis' })} />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Description (facultatif)</label>
        <textarea rows={2} placeholder="Description..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          {...register('description')} />
      </div>
      {mode === 'create' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Classe</label>
          <select {...register('id_classe', { required: 'Requis' })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Sélectionner une classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
          </select>
          {errors.id_classe && <p className="text-xs text-red-600 mt-0.5">{errors.id_classe.message}</p>}
        </div>
      )}
      {mode === 'create' && fileOptions.isPinnedOption && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" {...register('is_pinned')} className="rounded" />
          Épingler le premier fichier (emploi actuel)
        </label>
      )}
      {mode === 'create' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Fichiers</label>
          <input ref={fileRef} type="file" multiple accept={fileOptions.accept || '*'}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-fseg-light file:text-fseg-green file:font-medium cursor-pointer" />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1">{mode === 'edit' ? 'Modifier' : 'Publier'}</Button>
      </div>
    </form>
  );
}
