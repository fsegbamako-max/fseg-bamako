import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, ExternalLink, Newspaper } from 'lucide-react';
import { admApi } from '../../services/api';
import { toast } from '../../store/toastStore';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Modal   from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const CATEGORIES = ['Général','Examens','Résultats','Inscription','Événement','Fermeture','Autre'];

export default function AdminActualites() {
  const [modal, setModal] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-actualites'], queryFn: () => admApi.getActualites().then(r => r.data.data) });

  const deleteMutation = useMutation({
    mutationFn: admApi.deleteActualite,
    onSuccess:  () => { qc.invalidateQueries(['admin-actualites']); toast.success('Actualité supprimée'); },
    onError:    e  => toast.error(e.response?.data?.message || 'Erreur')
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-fseg-green" />
          <h1 className="text-2xl font-bold text-gray-900">Actualités</h1>
        </div>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <Plus className="w-4 h-4" /> Nouvelle
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      <div className="space-y-3">
        {data?.map(actu => (
          <div key={actu.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block bg-fseg-light text-fseg-green text-xs font-medium px-2 py-0.5 rounded-full">
                    {actu.categorie}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(actu.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="font-semibold text-sm text-gray-900">{actu.titre}</p>
                {actu.contenu && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{actu.contenu}</p>}
                {actu.fichiers_actualites?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {actu.fichiers_actualites.map(f => (
                      <a key={f.id} href={f.fichier} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs text-fseg-green hover:underline">
                        <ExternalLink className="w-3 h-3" />
                        {f.fichier.split('/').pop().split('?')[0].replace(/^\d+_/, '')}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal({ mode: 'edit', data: actu })}
                  className="p-1.5 text-gray-400 hover:text-fseg-green hover:bg-green-50 rounded-lg">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => { if (window.confirm('Supprimer ?')) deleteMutation.mutate(actu.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && !data?.length && <div className="text-center py-12 text-sm text-gray-400">Aucune actualité</div>}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? "Modifier l'actualité" : "Nouvelle actualité"}>
        <ActualiteForm initial={modal?.data} mode={modal?.mode} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}

function ActualiteForm({ initial, mode, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  async function onSubmit(data) {
    setLoading(true);
    try {
      if (mode === 'edit') {
        await admApi.updateActualite(initial.id, { titre: data.titre, contenu: data.contenu, categorie: data.categorie });
      } else {
        const form = new FormData();
        form.append('titre', data.titre);
        if (data.contenu)   form.append('contenu',   data.contenu);
        form.append('categorie', data.categorie || 'Général');
        Array.from(fileRef.current?.files || []).forEach(f => form.append('fichiers', f));
        await admApi.createActualite(form);
      }
      qc.invalidateQueries(['admin-actualites']);
      toast.success(mode === 'edit' ? 'Actualité modifiée' : 'Actualité publiée');
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally      { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Titre" placeholder="Titre de l'actualité" error={errors.titre?.message}
        {...register('titre', { required: 'Requis' })} />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Catégorie</label>
        <select {...register('categorie')}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Contenu</label>
        <textarea rows={4} placeholder="Contenu de l'actualité..." {...register('contenu')}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      {mode === 'create' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Fichiers joints (facultatif)</label>
          <input ref={fileRef} type="file" multiple
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
