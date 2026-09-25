import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { User, Camera, Key, Phone, Calendar, MapPin, Hash, ChevronRight } from 'lucide-react';
import { studentApi } from '../../services/api';
import { toast } from '../../store/toastStore';
import Spinner from '../../components/ui/Spinner';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Modal   from '../../components/ui/Modal';

export default function Profil() {
  const [pwdModal, setPwdModal] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const fileRef     = useRef();
  const qc          = useQueryClient();

  const { data: profil, isLoading } = useQuery({
    queryKey: ['profil'],
    queryFn:  () => studentApi.getProfil().then(r => r.data.data)
  });

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingPhoto(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await studentApi.updatePhoto(form);
      qc.setQueryData(['profil'], old => old ? { ...old, photo_profil: res.data.photo } : old);
      toast.success('Photo mise à jour !');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setLoadingPhoto(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="max-w-md mx-auto px-4 pt-5">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          {profil?.photo_profil ? (
            <img src={profil.photo_profil} alt="Photo" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-fseg-light flex items-center justify-center border-4 border-white shadow-md">
              <User className="w-10 h-10 text-fseg-green" />
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loadingPhoto}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-fseg-green text-white flex items-center justify-center shadow-md border-2 border-white"
          >
            {loadingPhoto ? <Spinner size="sm" color="text-white" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profil?.prenom} {profil?.nom}</h2>
        <p className="text-fseg-green text-sm font-medium">{profil?.nom_classe}</p>
        <p className="text-gray-400 text-xs mt-0.5">Matricule : {profil?.matricule}</p>
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {[
            { icon: Hash,     label: 'N° ordre',       value: profil?.numero_ordre  },
            { icon: Hash,     label: 'Cenou',           value: profil?.cenou         },
            { icon: Calendar, label: 'Date de naissance', value: profil?.date_naissance },
            { icon: MapPin,   label: 'Lieu de naissance', value: profil?.lieu_naissance },
            { icon: Phone,    label: 'Téléphone',       value: profil?.telephone     },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <Icon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
              <span className="text-sm text-gray-900 truncate">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setPwdModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors rounded-2xl"
        >
          <Key className="w-4 h-4 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-700 text-left">Modifier le mot de passe</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Password Modal */}
      <Modal open={pwdModal} onClose={() => setPwdModal(false)} title="Changer le mot de passe">
        <PasswordForm onClose={() => setPwdModal(false)} />
      </Modal>
    </div>
  );
}

function PasswordForm({ onClose }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    setLoading(true);
    try {
      await studentApi.changePassword({ ancien_mot_de_passe: data.ancien, nouveau_mot_de_passe: data.nouveau });
      toast.success('Mot de passe modifié !');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Ancien mot de passe" type="password" error={errors.ancien?.message}
        {...register('ancien', { required: 'Requis' })} />
      <Input label="Nouveau mot de passe" type="password" error={errors.nouveau?.message}
        {...register('nouveau', { required: 'Requis', minLength: { value: 6, message: 'Minimum 6 caractères' } })} />
      <Input label="Confirmer" type="password" error={errors.confirm?.message}
        {...register('confirm', { validate: v => v === watch('nouveau') || 'Ne correspond pas' })} />
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1">Confirmer</Button>
      </div>
    </form>
  );
}
