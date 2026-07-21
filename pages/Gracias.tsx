import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Star, Users, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';

const FACEBOOK_REVIEW_URL = 'https://www.facebook.com/106460525837472/reviews/';

interface ReferidoData {
  empresa: string;
  contacto: string;
  correo: string;
  telefono: string;
}

const REFERIDO_VACIO: ReferidoData = { empresa: '', contacto: '', correo: '', telefono: '' };

// Validación de correo más estricta que un simple "algo@algo.algo" — exige un dominio con al menos un punto real.
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Los teléfonos mexicanos que maneja el CRM son a 10 dígitos — se filtra mientras escriben
// (no solo se valida al final) para que no puedan meter letras, espacios ni de más.
function soloDigitos10(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function fireConfetti() {
  const defaults = { startVelocity: 28, spread: 360, ticks: 55, zIndex: 0, colors: ['#006d4e', '#00a86b', '#ffd700'] };
  confetti({ ...defaults, particleCount: 60, origin: { x: 0.2, y: 0.4 } });
  confetti({ ...defaults, particleCount: 60, origin: { x: 0.8, y: 0.4 } });
}

const ReferidoFields: React.FC<{
  n: 1 | 2 | 3;
  optional?: boolean;
  value: ReferidoData;
  onChange: (v: ReferidoData) => void;
  errors: Record<string, string>;
}> = ({ n, optional, value, onChange, errors }) => {
  const set = (field: keyof ReferidoData, v: string) => onChange({ ...value, [field]: v });
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold tracking-widest text-firma-green uppercase">
        Referido {n} {optional && <span className="text-gray-400 font-medium normal-case tracking-normal">(opcional)</span>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            placeholder="Nombre de la empresa"
            value={value.empresa}
            onChange={e => set('empresa', e.target.value)}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors[`r${n}Empresa`] ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors[`r${n}Empresa`] && <p className="text-xs text-red-500 mt-1">{errors[`r${n}Empresa`]}</p>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Nombre del contacto"
            value={value.contacto}
            onChange={e => set('contacto', e.target.value)}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors[`r${n}Contacto`] ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors[`r${n}Contacto`] && <p className="text-xs text-red-500 mt-1">{errors[`r${n}Contacto`]}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="Correo"
            value={value.correo}
            onChange={e => set('correo', e.target.value)}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors[`r${n}Correo`] ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors[`r${n}Correo`] && <p className="text-xs text-red-500 mt-1">{errors[`r${n}Correo`]}</p>}
        </div>
        <div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Teléfono (10 dígitos)"
            value={value.telefono}
            onChange={e => set('telefono', soloDigitos10(e.target.value))}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors[`r${n}Telefono`] ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors[`r${n}Telefono`] && <p className="text-xs text-red-500 mt-1">{errors[`r${n}Telefono`]}</p>}
        </div>
      </div>
    </div>
  );
};

export const Gracias: React.FC = () => {
  useSEO({
    title: 'Gracias por confiar en nosotros | Firma 7',
    description: 'Gracias por confiar en Firma 7. Estamos encantados de seguir trabajando contigo.',
    canonical: 'https://firma7.com/gracias',
    noindex: true,
  });

  useEffect(() => { fireConfetti(); }, []);

  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [correo, setCorreo] = useState('');
  const [r1, setR1] = useState<ReferidoData>(REFERIDO_VACIO);
  const [r2, setR2] = useState<ReferidoData>(REFERIDO_VACIO);
  const [r3, setR3] = useState<ReferidoData>(REFERIDO_VACIO);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Requerido';
    if (!correo.trim() || !EMAIL_REGEX.test(correo.trim())) e.correo = 'Correo inválido';
    if (!r1.empresa.trim()) e.r1Empresa = 'Requerido';
    if (!r1.contacto.trim()) e.r1Contacto = 'Requerido';
    if (!r1.correo.trim() || !EMAIL_REGEX.test(r1.correo.trim())) e.r1Correo = 'Correo inválido';
    if (r1.telefono.length !== 10) e.r1Telefono = 'Debe tener 10 dígitos';
    if (!r2.empresa.trim()) e.r2Empresa = 'Requerido';
    if (!r2.contacto.trim()) e.r2Contacto = 'Requerido';
    if (!r2.correo.trim() || !EMAIL_REGEX.test(r2.correo.trim())) e.r2Correo = 'Correo inválido';
    if (r2.telefono.length !== 10) e.r2Telefono = 'Debe tener 10 dígitos';
    // Referido 3 es opcional, pero si empiezan a llenarlo, validamos que quede completo.
    const r3Empezado = r3.empresa || r3.contacto || r3.correo || r3.telefono;
    if (r3Empezado) {
      if (!r3.empresa.trim()) e.r3Empresa = 'Requerido';
      if (!r3.contacto.trim()) e.r3Contacto = 'Requerido';
      if (!r3.correo.trim() || !EMAIL_REGEX.test(r3.correo.trim())) e.r3Correo = 'Correo inválido';
      if (r3.telefono.length !== 10) e.r3Telefono = 'Debe tener 10 dígitos';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setStatus('sending');
    const { error } = await supabase.rpc('submit_referido', {
      p: {
        referidoPorNombre: nombre,
        referidoPorEmpresa: empresa,
        referidoPorCorreo: correo,
        referido1Empresa: r1.empresa,
        referido1Contacto: r1.contacto,
        referido1Correo: r1.correo,
        referido1Telefono: r1.telefono,
        referido2Empresa: r2.empresa,
        referido2Contacto: r2.contacto,
        referido2Correo: r2.correo,
        referido2Telefono: r2.telefono,
        referido3Empresa: r3.empresa,
        referido3Contacto: r3.contacto,
        referido3Correo: r3.correo,
        referido3Telefono: r3.telefono,
      },
    });
    setStatus(error ? 'error' : 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" fill="#006d4e" className="w-9 h-9">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#006d4e]">SOC</span>
                <div className="h-5 w-px bg-[#006d4e]" />
                <span className="text-xl font-medium text-[#006d4e]">FIRMA 7</span>
              </div>
              <span className="hidden sm:block text-[0.5rem] font-bold tracking-[0.15em] text-[#006d4e] uppercase">
                LÍDERES EN ASESORÍA FINANCIERA
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ── Gracias ─────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={30} className="text-firma-green" fill="currentColor" fillOpacity={0.15} />
          </div>
          <div className="inline-flex items-center gap-2 bg-firma-green/5 border border-firma-green/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs font-bold tracking-widest text-firma-green uppercase">Cliente Firma 7</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal font-bold mb-4">
            Gracias por confiar en nosotros
          </h1>
          <p className="font-serif italic text-lg text-firma-green/90 mb-6">
            "Los grandes proyectos empiezan con la decisión de dar el primer paso — y tú ya lo diste."
          </p>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
            Fue un privilegio acompañarte en este proceso. Estamos <strong className="text-charcoal">encantados de seguir trabajando contigo</strong> hoy
            y en cada etapa que venga para tu empresa.
          </p>
        </div>

        {/* ── Referidos ───────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 mt-6 shadow-sm">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-firma-green" />
              </div>
              <h3 className="font-serif text-2xl text-charcoal mb-2">¡Gracias por tus referidos!</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Nos pondremos en contacto con ellos pronto. Apreciamos mucho que confíes en nosotros para recomendarnos.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={22} className="text-firma-green" />
                </div>
                <h3 className="font-serif text-2xl text-charcoal mb-2">¿Conoces a alguien que también necesite financiamiento?</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                  Compártenos los datos de 2 empresas o personas que crean que podrían beneficiarse de un crédito
                  empresarial — nosotros nos encargamos del resto. (Y si se te ocurre una tercera, mejor.)
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Tus datos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.nombre ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                    </div>
                    <input
                      type="text"
                      placeholder="Tu empresa (opcional)"
                      value={empresa}
                      onChange={e => setEmpresa(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Tu correo"
                      value={correo}
                      onChange={e => setCorreo(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.correo ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.correo && <p className="text-xs text-red-500 mt-1">{errors.correo}</p>}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <ReferidoFields n={1} value={r1} onChange={setR1} errors={errors} />
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <ReferidoFields n={2} value={r2} onChange={setR2} errors={errors} />
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <ReferidoFields n={3} optional value={r3} onChange={setR3} errors={errors} />
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    No se pudo enviar. Por favor intenta de nuevo.
                  </div>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={status === 'sending'}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Enviando…
                    </>
                  ) : (
                    'Enviar referidos'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Reseña ──────────────────────────────────── */}
        {/* Siempre debajo del formulario, para que primero quede el espacio de compartir referidos. */}
        <div className="bg-charcoal rounded-2xl p-8 text-center text-white mt-6">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={22} className="text-yellow-400" fill="currentColor" />
          </div>
          <h3 className="font-serif text-2xl mb-2">¿Nos regalas una reseña?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Tu experiencia ayuda a que más empresas como la tuya confíen en nosotros.
            Solo te tomará un minuto.
          </p>
          <a
            href={FACEBOOK_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 transition-colors no-underline"
          >
            <Star size={18} fill="currentColor" />
            Dejar una reseña
          </a>
        </div>

        <p className="text-center text-gray-400 text-xs pt-8">
          © {new Date().getFullYear()} Firma 7 · SOC Asesores
        </p>
      </main>
    </div>
  );
};
