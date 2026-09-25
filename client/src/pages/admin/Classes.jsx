import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { admApi } from '../../services/api';
import { toast } from '../../store/toastStore';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Modal   from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

export default function AdminClasses() {
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', data? }
  const qc = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn:  () => admApi.getClasses().then(r => r.data.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => admApi.deleteClasse(id),
    onSuccess:  () => { qc.invalidateQueries(['admin-classes']); toast.success('Classe supprimée'); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Erreur')
  });

  function confirmDelete(id, nom) {
    if (window.confirm(`Supprimer la classe "${nom}" ?`)) deleteMutation.mutate(id);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {classes?.map((c, i) => (
          <div key={c.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <GraduationCap className="w-4 h-4 text-fseg-green shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{c.nom_classe}</p>
              <p className="text-xs text-gray-400">{c.niveau} — {c.filiere}{c.option_nom ? ` (${c.option_nom})` : ''}</p>
            </div>
            <button onClick={() => setModal({ mode: 'edit', data: c })} className="text-gray-400 hover:text-fseg-green p-1.5 rounded-lg hover:bg-gray-50">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => confirmDelete(c.id, c.nom_classe)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!isLoading && !classes?.length && (
          <div className="text-center py-12 text-gray-400 text-sm">Aucune classe créée</div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Modifier la classe' : 'Nouvelle classe'}>
        <ClasseForm initial={modal?.data} mode={modal?.mode} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}

function ClasseForm({ initial, mode, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial });
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  async function onSubmit(data) {
    setLoading(true);
    try {
      if (mode === 'edit') await admApi.updateClasse(initial.id, data);
      else                 await admApi.createClasse(data);
      qc.invalidateQueries(['admin-classes']);
      toast.success(mode === 'edit' ? 'Classe modifiée' : 'Classe créée');
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally      { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nom de la classe" placeholder="Ex : L1 Économie" error={errors.nom_classe?.message}
        {...register('nom_classe', { required: 'Requis' })} />
      <Input label="Niveau"   placeholder="Ex : L1, L2, L3" error={errors.niveau?.message}
        {...register('niveau',    { required: 'Requis' })} />
      <Input label="Filière"  placeholder="Ex : Économie, Gestion" error={errors.filiere?.message}
        {...register('filiere',   { required: 'Requis' })} />
      <Input label="Option (facultatif)" placeholder="Ex : Finance, Marketing"
        {...register('option_nom')} />
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1">{mode === 'edit' ? 'Modifier' : 'Créer'}</Button>
      </div>
    </form>
  );
}
