import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { studentApi } from '../../services/api';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';

export default function MotDePasseOublie() {
  const [step, setStep]           = useState(1); // 1 = vérification identité, 2 = nouveau mot de passe
  const [resetToken, setResetToken] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const navigate                  = useNavigate();

  const verifForm  = useForm();
  const resetForm  = useForm();

  async function onVerify(data) {
    setError('');
    setLoading(true);
    try {
      const res = await studentApi.forgotPassword(data);
      setResetToken(res.data.resetToken);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  }

  async function onReset(data) {
    setError('');
    if (data.mdp1 !== data.mdp2) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (data.mdp1.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await studentApi.resetPassword({ resetToken, mdp1: data.mdp1, mdp2: data.mdp2 });
      navigate('/etudiants/connexion', { replace: true, state: { resetDone: true } });
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fseg-green to-fseg-dark flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg mb-3">
            <KeyRound className="w-8 h-8 text-fseg-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">FSEG Bamako</h1>
          <p className="text-white/70 text-sm mt-1">Réinitialiser le mot de passe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Vérification d'identité</h2>
              <p className="text-sm text-gray-500 mb-5">Renseignez vos informations telles qu'enregistrées.</p>

              <form onSubmit={verifForm.handleSubmit(onVerify)} className="space-y-4">
                <Input
                  label="Matricule"
                  autoCapitalize="characters"
                  error={verifForm.formState.errors.matricule?.message}
                  {...verifForm.register('matricule', { required: 'Matricule requis' })}
                />
                <Input
                  label="Nom"
                  error={verifForm.formState.errors.nom?.message}
                  {...verifForm.register('nom', { required: 'Nom requis' })}
                />
                <Input
                  label="Prénom"
                  error={verifForm.formState.errors.prenom?.message}
                  {...verifForm.register('prenom', { required: 'Prénom requis' })}
                />
                <Input
                  label="Date de naissance"
                  type="date"
                  error={verifForm.formState.errors.date_naissance?.message}
                  {...verifForm.register('date_naissance', { required: 'Date de naissance requise' })}
                />
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Vérifier
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Nouveau mot de passe</h2>
              <p className="text-sm text-gray-500 mb-5">Identité vérifiée, choisissez un nouveau mot de passe.</p>

              <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Nouveau mot de passe"
                    type={showPwd ? 'text' : 'password'}
                    error={resetForm.formState.errors.mdp1?.message}
                    {...resetForm.register('mdp1', { required: 'Mot de passe requis', minLength: { value: 6, message: 'Au moins 6 caractères' } })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  label="Confirmer le mot de passe"
                  type={showPwd ? 'text' : 'password'}
                  error={resetForm.formState.errors.mdp2?.message}
                  {...resetForm.register('mdp2', { required: 'Confirmation requise' })}
                />
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Modifier
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/etudiants/connexion" className="text-fseg-green font-medium hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
