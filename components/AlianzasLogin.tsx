import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export const AlianzasLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
        } else {
          setError(authError.message);
        }
      }
    } catch (err: any) {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#006d4e' }}>

      {/* Card centrada */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo SOC · Firma 7 */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-4">
                {/* Dot grid icon */}
                <svg width="44" height="44" viewBox="0 0 100 100" fill="white">
                  <circle cx="50" cy="50" r="12"/>
                  <circle cx="50" cy="20" r="12"/>
                  <circle cx="50" cy="80" r="12"/>
                  <circle cx="24" cy="35" r="12"/>
                  <circle cx="24" cy="65" r="12"/>
                  <circle cx="76" cy="35" r="12"/>
                  <circle cx="76" cy="65" r="12"/>
                </svg>
                <span className="text-white font-bold text-4xl tracking-tight">SOC</span>
                <div className="w-px h-10 bg-white/60" />
                <span className="text-white font-light text-4xl tracking-tight">FIRMA 7</span>
              </div>
              <span className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mt-1">
                Líderes en Asesoría Financiera
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2">
                Qué gusto verte de nuevo
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Ingresa con tus credenciales para acceder al portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition text-sm"
                  style={{ '--tw-ring-color': '#006d4e' } as React.CSSProperties}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 2px #006d4e'}
                  onBlur={e => e.target.style.boxShadow = ''}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-charcoal placeholder-gray-400 focus:outline-none transition text-sm"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #006d4e'}
                    onBlur={e => e.target.style.boxShadow = ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 px-6 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm tracking-wide"
                style={{ backgroundColor: '#006d4e' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#005a3f')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#006d4e')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              ¿Olvidaste tu contraseña?{' '}
              <a href="mailto:alianzas@firma7.com" className="font-medium hover:underline" style={{ color: '#006d4e' }}>
                Contacta a Firma 7
              </a>
            </p>
          </div>

          <p className="text-center text-white/60 text-xs mt-6">
            © {new Date().getFullYear()} Firma 7. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
