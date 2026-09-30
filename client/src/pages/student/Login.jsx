import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { studentApi } from '../../services/api';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';

export default function StudentLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPwd, setShowPwd]   = useState(false);
  const [error,   setError]     = useState('');
  const [loading, setLoading]   = useState(false);
  const loginSuccess = useAuthStore(s => s.loginSuccess);
  const navigate     = useNavigate();
  const location     = useLocation();

  // Message de succès si vient de l'inscription ou d'une réinitialisation
  const justRegistered = location.state?.registered;
  const justReset       = location.state?.resetDone;

  async function onSubmit(data) {
    setError('');
    setLoading(true);
    try {
      const res = await studentApi.login(data);
      loginSuccess(res.data.token, res.data);
      navigate('/etudiants/tableau-de-bord', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fseg-green to-fseg-dark flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md mx-4">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/images/logo-fseg.png" alt="Logo FSEG Bamako" className="block mx-auto h-24 w-24 object-contain mb-3" />
          <h1 className="text-2xl font-bold text-white">FSEG Bamako</h1>
          <p className="text-white/70 text-sm mt-1">Espace étudiant</p>
        </div>

        {/* Form */}
        <div className="w-full bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Connexion</h2>

          {justRegistered && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
              Compte créé avec succès ! Connectez-vous.
            </div>
          )}

          {justReset && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
              Mot de passe modifié avec succès ! Connectez-vous.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Matricule"
              placeholder="Ex : 12345"
              autoCapitalize="characters"
              autoComplete="username"
              error={errors.matricule?.message}
              {...register('matricule', { required: 'Matricule requis' })}
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPwd ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                error={errors.mot_de_passe?.message}
                className="pr-14"
                {...register('mot_de_passe', { required: 'Mot de passe requis' })}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-2 top-6 min-h-11 min-w-11 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-right -mt-2">
              <Link to="/etudiants/mot-de-passe-oublie" className="text-xs text-fseg-green hover:underline">
                Mot de passe oublié ?
              </Link>
            </p>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ?{' '}
            <Link to="/etudiants/inscription" className="text-fseg-green font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Retour au site */}
        <p className="text-center mt-4">
          <Link to="/" className="text-white/70 text-sm hover:text-white">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
