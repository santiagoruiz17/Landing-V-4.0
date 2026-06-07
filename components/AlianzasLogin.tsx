import React, { useState } from 'react';
import { supabase } from '../services/supabase';

type Step = 'email' | 'sent';

export const AlianzasLogin: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify the email has an active invitation before sending magic link
      const { data: invite, error: inviteError } = await supabase
        .from('alianza_invitations')
        .select('id, status')
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'active')
        .maybeSingle();

      if (inviteError) throw inviteError;

      if (!invite) {
        setError('Este correo no tiene una invitación activa. Contacta a tu ejecutivo de Firma 7.');
        setLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/alianzas/dashboard`,
        },
      });

      if (authError) throw authError;

      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-firma-green rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">F7</span>
        </div>
        <span className="text-white font-serif text-lg font-semibold tracking-wide">Firma 7</span>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Decorative accent */}
          <div className="h-1 w-16 bg-firma-green rounded-full mb-8 mx-auto" />

          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
            {step === 'email' ? (
              <>
                <div className="mb-8 text-center">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2">
                    Portal de Alianzas
                  </h1>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Accede con tu correo institucional. Recibirás un enlace seguro para ingresar.
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-firma-green focus:border-transparent transition text-sm"
                    />
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
                    disabled={loading || !email}
                    className="w-full py-3 px-6 bg-firma-green text-white font-semibold rounded-xl hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm tracking-wide shadow-lg shadow-green-900/20"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Verificando...
                      </span>
                    ) : (
                      'Enviar enlace de acceso'
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400">
                  ¿No tienes acceso?{' '}
                  <a href="mailto:alianzas@firma7.com" className="text-firma-green hover:underline font-medium">
                    Contacta a Firma 7
                  </a>
                </p>
              </>
            ) : (
              /* Success state */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-firma-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-serif font-bold text-charcoal mb-2">
                  Revisa tu correo
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-1">
                  Enviamos un enlace de acceso a
                </p>
                <p className="text-charcoal font-semibold text-sm mb-6">{email}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  El enlace expira en 1 hora. Si no lo encuentras, revisa tu carpeta de spam.
                </p>
                <button
                  onClick={() => { setStep('email'); setError(''); }}
                  className="mt-6 text-xs text-firma-green hover:underline font-medium"
                >
                  Usar otro correo
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            © {new Date().getFullYear()} Firma 7. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
