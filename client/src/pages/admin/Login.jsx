import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminStore } from '../../store/authStore';
import { admApi } from '../../services/api';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const loginSuccess = useAdminStore(s => s.loginSuccess);
  const navigate     = useNavigate();

  async function onSubmit(data) {
    setError('');
    setLoading(true);
    try {
      const res = await admApi.login(data);
      loginSuccess(res.data.token, res.data.admin);
      navigate('/admin', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-5">
      <div className="w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-8">
          <img src="/images/logo-fseg.png" alt="Logo FSEG Bamako" className="block mx-auto h-24 w-24 object-contain mb-3" />
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-gray-400 text-sm mt-1">FSEG Bamako</p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Connexion admin</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              placeholder="admin"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username', { required: 'Requis' })}
            />
            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.mot_de_passe?.message}
                {...register('mot_de_passe', { required: 'Requis' })}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
