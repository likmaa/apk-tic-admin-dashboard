import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, Lock, LogIn, Eye, EyeOff } from 'lucide-react'; // Icônes pour une meilleure UI

// ⚡ Si lucide-react n’est pas installé :
// npm install lucide-react

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // États
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 🔧 Gestion du formulaire
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Construire dynamiquement le payload
      const payload = {
        [loginMethod]: identifier,
        password,
      };

      console.log('Sending login request:', { url: '/api/admin/login', payload });
      const res = await api.post('/api/admin/login', payload);
      console.log('Login response:', res.data);

      // Authentification réussie
      login(res.data.token, res.data.user);
      navigate('/'); // Redirection vers la page principale après succès
    } catch (err: any) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      // 🧩 Correction : ton erreur était dans le bloc try sans catch
      setError(err?.response?.data?.message || 'La connexion a échoué. Veuillez vérifier vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  // 🧱 Composant réutilisable pour les champs
  const InputField = React.forwardRef<HTMLInputElement, {
    icon: React.ReactNode;
  } & React.InputHTMLAttributes<HTMLInputElement>>(({ icon, className = '', ...props }, ref) => (
    <div className="relative flex items-center">
      <div className="absolute left-0 inset-y-0 flex items-center pl-3">
        {icon}
      </div>
      <input
        ref={ref}
        className={`w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary focus:outline-none ${className}`}
        {...props}
      />
    </div>
  ));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* 🧭 En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Connexion Administrateur</h1>
          <p className="text-gray-500 mt-2">Accédez à votre tableau de bord</p>
        </div>

        {/* 🔀 Sélecteur de méthode de connexion */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setIdentifier(''); }}
            className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'email' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('phone'); setIdentifier(''); }}
            className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'phone' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            Téléphone
          </button>
        </div>

        {/* 🧾 Formulaire */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor={loginMethod} className="block text-sm font-medium text-gray-700 mb-1">
              {loginMethod === 'email' ? 'Adresse Email' : 'Numéro de téléphone'}
            </label>
            <InputField
              id={loginMethod}
              type={loginMethod === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                console.log('Identifier changed:', e.target.value);
                setIdentifier(e.target.value);
              }}
              placeholder={loginMethod === 'email' ? 'admin@example.com' : '+22960000000'}
              required
              icon={loginMethod === 'email' ? <Mail size={18} /> : <Phone size={18} />}
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <InputField
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
              }}
              required
              icon={<Lock size={18} />}
            />
            {/* Oeil pour afficher/masquer le mot de passe */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-primary transition-colors focus:outline-none"
              title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* ⚠️ Message d’erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* 🔘 Bouton de soumission */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-primary text-white font-semibold py-2.5 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
