import React, { Suspense, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';
import { Handshake, TrendingUp, Clock, ShieldCheck, Car, Truck, Building2, Wrench, CheckCircle2 } from 'lucide-react';

const Footer = React.lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));

const AUDIENCIA = [
  { icon: Car, label: 'Lotes de autos' },
  { icon: Building2, label: 'Concesionarias' },
  { icon: Truck, label: 'Agencias de tractocamiones' },
  { icon: Truck, label: 'Lotes de tractocamiones' },
  { icon: Wrench, label: 'Equipo especializado' },
  { icon: Handshake, label: 'Otros negocios que venden a crédito' },
];

const BENEFICIOS = [
  { icon: TrendingUp, title: 'Vende más', desc: 'Cierra negocios que antes perdías porque el cliente no tenía el efectivo completo.' },
  { icon: Clock, title: 'Respuesta rápida', desc: 'Evaluamos y respondemos a tu cliente en 24–72 horas, sin que el proceso te quite tiempo.' },
  { icon: ShieldCheck, title: 'Sin costo para ti', desc: 'No pagas nada por referir. Nuestros honorarios los cubre la institución financiera.' },
];

interface FormData {
  nombre: string;
  empresa: string;
  tipoNegocio: string;
  telefono: string;
  correo: string;
  ciudad: string;
  mensaje: string;
}

const INITIAL: FormData = { nombre: '', empresa: '', tipoNegocio: '', telefono: '', correo: '', ciudad: '', mensaje: '' };

export const QuieroSerAliado: React.FC = () => {
  useSEO({
    title: 'Conviértete en Aliado | Vende más con financiamiento | Firma 7',
    description: 'Lotes de autos, concesionarias, agencias de tractocamiones y venta de equipo especializado: alíate con Firma 7 y ofrece financiamiento a tus clientes para cerrar más ventas.',
    canonical: 'https://firma7.com/quiero-ser-aliado',
  });

  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const set = (field: keyof FormData, value: string) => setData(prev => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.nombre.trim()) e.nombre = 'Requerido';
    if (!data.empresa.trim()) e.empresa = 'Requerido';
    if (!data.tipoNegocio) e.tipoNegocio = 'Selecciona una opción';
    if (!data.telefono.trim()) e.telefono = 'Requerido';
    if (!data.correo.trim() || !/\S+@\S+\.\S+/.test(data.correo)) e.correo = 'Correo inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    const { error } = await supabase.from('alianza_leads').insert({
      nombre: data.nombre,
      empresa: data.empresa,
      tipo_negocio: data.tipoNegocio,
      telefono: data.telefono,
      correo: data.correo,
      ciudad: data.ciudad,
      mensaje: data.mensaje,
    });
    setStatus(error ? 'error' : 'sent');
  };

  const inputClass = (field: string) =>
    `w-full border ${errors[field] ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition`;

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-firma-green/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 border border-firma-green/20 rounded-full text-xs font-bold tracking-wider text-firma-green uppercase mb-6 bg-firma-green/5">
            <Handshake size={14} /> Programa de Aliados
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium text-charcoal leading-tight mb-6">
            Vende más ofreciendo{' '}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-firma-green to-midnight">financiamiento</span>{' '}
            a tus clientes
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed font-light">
            Si vendes autos, camiones, tractocamiones o equipo especializado, muchos de tus clientes pierden la compra
            por no contar con el crédito adecuado. Nosotros lo conseguimos por ti, tú cierras la venta.
          </p>
          <a href="#contacto" className="inline-flex items-center gap-2 mt-4 px-8 py-4 bg-firma-green text-white rounded-full text-base font-bold shadow-lg shadow-firma-green/30 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all duration-200 no-underline">
            <Handshake size={18} /> Quiero ser Aliado
          </a>
        </div>
      </section>

      {/* ── Audiencia ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
              ¿Para quién es esto?
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal">
              Ideal si tu negocio vende a crédito
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AUDIENCIA.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3 bg-concrete rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-firma-green/10 rounded-xl flex items-center justify-center">
                  <Icon size={22} className="text-firma-green" />
                </div>
                <span className="text-sm font-semibold text-charcoal leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────── */}
      <section className="py-20 bg-concrete">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
              Así de simple
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal">¿Cómo funciona la alianza?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '1', t: 'Refiere a tu cliente', d: 'Cuando un cliente necesite financiamiento para comprar, nos lo presentas.' },
              { n: '2', t: 'Nosotros gestionamos el crédito', d: 'Comparamos +20 instituciones financieras y conseguimos la mejor opción para su perfil.' },
              { n: '3', t: 'Tu cliente compra, tú vendes', d: 'Tu cliente recibe el crédito aprobado y tú cierras la venta sin fricciones.' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-firma-green text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-charcoal mb-2">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios ───────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFICIOS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-concrete border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 bg-firma-green/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-firma-green" />
                </div>
                <h3 className="font-semibold text-charcoal mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulario de contacto ───────────────────── */}
      <section id="contacto" className="py-20 bg-concrete">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
              Únete hoy
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-3">Solicita ser nuestro Aliado</h2>
            <p className="text-gray-500">Completa el formulario y un asesor te contactará para explicarte el programa.</p>
          </div>

          <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 rounded-[2rem] p-8">
            {status === 'sent' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} className="text-firma-green" />
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-2">¡Solicitud enviada!</h3>
                <p className="text-gray-500 text-sm">Un asesor de Firma 7 se pondrá en contacto contigo en menos de 48 horas.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="field-label">Nombre completo</label>
                  <input className={inputClass('nombre')} value={data.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan García" />
                  {errors.nombre && <p className="field-error">{errors.nombre}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Nombre del negocio</label>
                    <input className={inputClass('empresa')} value={data.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Lote Autos del Valle" />
                    {errors.empresa && <p className="field-error">{errors.empresa}</p>}
                  </div>
                  <div>
                    <label className="field-label">Tipo de negocio</label>
                    <select className={inputClass('tipoNegocio')} value={data.tipoNegocio} onChange={e => set('tipoNegocio', e.target.value)}>
                      <option value="">Selecciona…</option>
                      <option>Lote de autos</option>
                      <option>Concesionaria</option>
                      <option>Agencia de tractocamiones</option>
                      <option>Lote de tractocamiones</option>
                      <option>Equipo especializado</option>
                      <option>Otro</option>
                    </select>
                    {errors.tipoNegocio && <p className="field-error">{errors.tipoNegocio}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Teléfono / WhatsApp</label>
                    <input type="tel" className={inputClass('telefono')} value={data.telefono} onChange={e => set('telefono', e.target.value)} placeholder="55 1234 5678" />
                    {errors.telefono && <p className="field-error">{errors.telefono}</p>}
                  </div>
                  <div>
                    <label className="field-label">Correo electrónico</label>
                    <input type="email" className={inputClass('correo')} value={data.correo} onChange={e => set('correo', e.target.value)} placeholder="correo@negocio.com" />
                    {errors.correo && <p className="field-error">{errors.correo}</p>}
                  </div>
                </div>
                <div>
                  <label className="field-label">Ciudad</label>
                  <input className={inputClass('ciudad')} value={data.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Zapopan, Jalisco" />
                </div>
                <div>
                  <label className="field-label">Cuéntanos un poco más (opcional)</label>
                  <textarea rows={3} className={`${inputClass('mensaje')} resize-none`} value={data.mensaje} onChange={e => set('mensaje', e.target.value)} placeholder="¿Cuántas unidades vendes al mes? ¿Qué tipo de financiamiento buscan tus clientes?" />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-500">Hubo un problema al enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30 active:translate-y-0 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <Handshake size={16} />
                  {status === 'sending' ? 'Enviando…' : 'Quiero ser Aliado'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            ¿Prefieres hablar directo?{' '}
            <a
              href="https://wa.me/525525069817?text=Hola%2C%20tengo%20un%20negocio%20y%20me%20interesa%20ser%20Aliado%20de%20Firma%207."
              target="_blank"
              rel="noopener noreferrer"
              className="text-firma-green font-semibold hover:underline"
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="py-12 bg-charcoal" />}>
        <Footer />
      </Suspense>

      <style>{`
        .field-label {
          display: block; font-size: 0.7rem; font-weight: 600; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem;
        }
        .field-error { font-size: 0.7rem; color: #f87171; margin-top: 0.25rem; }
      `}</style>
    </div>
  );
};
