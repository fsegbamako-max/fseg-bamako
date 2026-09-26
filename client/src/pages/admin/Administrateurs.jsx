import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck, Trash2, UserRound, UsersRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { admApi } from '../../services/api';
import { useAdminStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

export default function AdminAdministrateurs() {
  const [showCreate, setShowCreate] = useState(false);
  const currentAdmin = useAdminStore(state => state.admin);
  const queryClient = useQueryClient();
  const { data: admins, isLoading, isError, error } = useQuery({
    queryKey: ['admin-administrateurs'],
    queryFn: () => admApi.getAdmins().then(response => response.data.data)
  });

  const deleteMutation = useMutation({
    mutationFn: admApi.deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-administrateurs'] });
      toast.success('Administrateur supprimé');
    },
    onError: error => toast.error(error.response?.data?.message || 'Suppression impossible')
  });

  function confirmDelete(admin) {
    if (window.confirm(`Supprimer le compte de ${admin.nom_complet || admin.username} ?`)) {
      deleteMutation.mutate(admin.id);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administrateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Comptes autorisés à gérer la plateforme.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Ajouter un administrateur
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      {isError && (
        <div className="bg-white border border-red-200 rounded-xl p-5 text-sm text-red-700">
          {error.response?.status === 403
            ? 'Cette page est réservée au super-administrateur.'
            : error.response?.data?.message || 'Impossible de charger les administrateurs.'}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-sm font-medium text-gray-700">
            <UsersRound className="w-4 h-4 text-fseg-green" />
            {admins?.length || 0} compte{admins?.length === 1 ? '' : 's'} administrateur
          </div>
          {admins?.map((admin, index) => (
            <div key={admin.id} className={`flex flex-wrap items-center gap-3 px-5 py-4 ${index ? 'border-t border-gray-100' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <UserRound className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{admin.nom_complet || admin.username}</p>
                <p className="text-xs text-gray-500">@{admin.username}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${admin.is_super_admin ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {admin.is_super_admin ? 'Super-admin' : 'Administrateur'}
              </span>
              <span className="text-xs text-gray-400 w-24 text-right">
                {admin.created_at ? new Date(admin.created_at).toLocaleDateString('fr-FR') : ''}
              </span>
              {admin.id !== currentAdmin?.id && (
                <button
                  type="button"
                  title={`Supprimer ${admin.username}`}
                  aria-label={`Supprimer ${admin.username}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => confirmDelete(admin)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {!admins?.length && <p className="text-center py-10 text-sm text-gray-500">Aucun compte administrateur.</p>}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Ajouter un administrateur">
        <AdminForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}

function AdminForm({ onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { is_super_admin: 'false' } });
  const [loading, setLoading] = useState(false);

  async function onSubmit(values) {
    setLoading(true);
    try {
      await admApi.createAdmin({ ...values, is_super_admin: values.is_super_admin === 'true' });
      await queryClient.invalidateQueries({ queryKey: ['admin-administrateurs'] });
      toast.success('Administrateur créé');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Identifiant" autoComplete="username" placeholder="ex. gestionnaire" error={errors.username?.message}
        {...register('username', {
          required: 'Identifiant requis',
          minLength: { value: 3, message: '3 caractères minimum' },
          maxLength: { value: 40, message: '40 caractères maximum' },
          pattern: { value: /^[a-zA-Z0-9._-]+$/, message: 'Lettres, chiffres, point, tiret ou souligné uniquement' }
        })} />
      <Input label="Nom complet" autoComplete="name" placeholder="Nom et prénom" error={errors.nom_complet?.message}
        {...register('nom_complet', { maxLength: { value: 100, message: '100 caractères maximum' } })} />
      <Input label="Mot de passe" type="password" autoComplete="new-password" error={errors.mot_de_passe?.message}
        {...register('mot_de_passe', {
          required: 'Mot de passe requis',
          minLength: { value: 8, message: '8 caractères minimum' },
          maxLength: { value: 72, message: '72 caractères maximum' }
        })} />
      <div className="flex flex-col gap-1">
        <label htmlFor="admin-role" className="text-sm font-medium text-gray-700">Rôle</label>
        <select id="admin-role" {...register('is_super_admin')} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="false">Administrateur</option>
          <option value="true">Super-administrateur</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1">Créer le compte</Button>
      </div>
    </form>
  );
}