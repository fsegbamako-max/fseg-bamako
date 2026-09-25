import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, User, Calendar } from 'lucide-react';
import { studentApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';

// Étapes : 1 = saisie matricule+ddn  2 = confirmation identité  3 = création compte
export default function Register() {
  const navigate = useNavigate();
  const loginSuccess = useAuthStore(s => s.loginSuccess);

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Champs étape 1
  const [matricule,      setMatricule]      = useState('');
  const [dateNaissance,  setDateNaissance]  = useState('');

  // Données étudiant trouvé
  const [etudiant, setEtudiant] = useState(null); // { id, prenom, nom, date_naissance }

  // Champs étape 3
  const [telephone,   setTelephone]   = useState('');
  const [password,    setPassword]    = useState('');
  const [passwordCfm, setPasswordCfm] = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showPwdCfm,  setShowPwdCfm]  = useState(false);

  // Comme dans inscription.php, la vérification démarre automatiquement
  // dès que les deux informations d'identité sont complètes.
  useEffect(() => {
    if (step !== 1 || !matricule.trim() || !dateNaissance) return undefined;
    const timer = setTimeout(() => verifier(), 350);
    return () => clearTimeout(timer);
  }, [matricule, dateNaissance, step]);

  // ── Étape 1 : vérifier l'identité ─────────────────────────────────────────
  async function verifier() {
    if (!matricule.trim() || !dateNaissance) return;
    setError('');
    setLoading(true);
    try {
      const res = await studentApi.verifierEtudiant({ matricule: matricule.trim(), date_naissance: dateNaissance });
      const { status, etudiant: etu } = res.data;

      if (status === 'found') {
        setEtudiant(etu);
        setStep(2);
      } else if (status === 'already_active') {
        setError('Vous avez déjà un compte. Connectez-vous.');
      } else if (status === 'disabled') {
        setError('Votre compte a été désactivé. Contactez l\'administration.');
      } else if (status === 'deleted') {
        setError('Votre compte a été supprimé. Contactez l\'administration.');
      } else {
        setError('Étudiant non reconnu. Vérifiez votre matricule et votre date de naissance.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }

  // ── Étape 3 : créer le compte ──────────────────────────────────────────────
  async function creerCompte(e) {
    e.preventDefault();
    setError('');

    if (!telephone || !password || !passwordCfm) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (!/^[0-9]{8}$/.test(telephone)) {
      setError('Le numéro de téléphone doit contenir exactement 8 chiffres.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== passwordCfm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await studentApi.register({ id_etudiant: etudiant.id, telephone, mot_de_passe: password });
      loginSuccess(res.data.token, res.data);
      navigate('/etudiants/tableau-de-bord', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setEtudiant(null);
    setError('');
    setMatricule('');
    setDateNaissance('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fseg-green to-fseg-dark flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg mb-3">
            <UserPlus className="w-8 h-8 text-fseg-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">FSEG Bamako</h1>
          <p className="text-white/70 text-sm mt-1">Inscription étudiant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">

          {/* ── Étape 1 : Matricule + Date de naissance ── */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Vérification de votre identité</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={e => { e.preventDefault(); verifier(); }} className="space-y-4">
                <Input
                  label="Matricule FSEG"
                  placeholder="Ex : 12345"
                  value={matricule}
                  onChange={e => setMatricule(e.target.value)}
                  autoCapitalize="characters"
                  required
                />

                <div>
                  <Input
                    label="Date de naissance"
                    type="date"
                    value={dateNaissance}
                    onChange={e => setDateNaissance(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Vérifier mon identité
                </Button>
              </form>
            </>
          )}

          {/* ── Étape 2 : Confirmation identité ── */}
          {step === 2 && etudiant && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Est-ce bien vous ?</h2>

              <div className="bg-fseg-light border border-fseg-green/20 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-fseg-green/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-fseg-green" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {etudiant.prenom} {etudiant.nom}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Né(e) le {new Date(etudiant.date_naissance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Oui, c'est moi
                </Button>
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}

          {/* ── Étape 3 : Création compte ── */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Créer votre compte</h2>
              <p className="text-sm text-gray-500 mb-5">
                {etudiant?.prenom} {etudiant?.nom}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={creerCompte} className="space-y-4">
                <Input
                  label="Téléphone (8 chiffres)"
                  type="tel"
                  placeholder="Ex : 76123456"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  maxLength={8}
                  required
                />

                <div className="relative">
                  <Input
                    label="Mot de passe"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 6 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirmer le mot de passe"
                    type={showPwdCfm ? 'text' : 'password'}
                    placeholder="Répétez le mot de passe"
                    value={passwordCfm}
                    onChange={e => setPasswordCfm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwdCfm(p => !p)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPwdCfm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Créer mon compte
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Déjà inscrit ?{' '}
            <Link to="/etudiants/connexion" className="text-fseg-green font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
