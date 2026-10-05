import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Heart, Users, User, MessageSquare, CheckCircle2, Loader2, AlertCircle, ArrowLeft, Facebook, Instagram, Star, Car, Home, Building2, PlusCircle, X, Share2 } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';
import { EMAIL_REGEX, soloDigitos10 } from '../lib/validation';

const FACEBOOK_REVIEW_URL = 'https://www.facebook.com/106460525837472/reviews/';

type Paso = 'datos' | 'comentario' | 'referidos';
const PASOS: Paso[] = ['datos', 'comentario', 'referidos'];

type TipoCredito = 'automotriz' | 'hipotecario' | 'empresarial';

interface ReferidoData {
  nombre: string;
  telefono: string;
  correo: string;
  empresa: string;
  tipoCredito: TipoCredito | '';
}

const MAX_REFERIDOS = 7;

const TIPOS_CREDITO: { valor: TipoCredito; etiqueta: string; icono: React.ReactNode }[] = [
  { valor: 'automotriz', etiqueta: 'Automotriz', icono: <Car size={18} /> },
  { valor: 'hipotecario', etiqueta: 'Hipotecario', icono: <Home size={18} /> },
  { valor: 'empresarial', etiqueta: 'Empresarial', icono: <Building2 size={18} /> },
];

const ETIQUETAS_ESTRELLAS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

const REFERIDO_VACIO: ReferidoData = { nombre: '', telefono: '', correo: '', empresa: '', tipoCredito: '' };

const referidoVacio = (r: ReferidoData) =>
  !r.nombre.trim() && !r.telefono && !r.correo.trim() && !r.empresa.trim() && !r.tipoCredito;

// Los datos pueden venir en el enlace (WhatsApp / GHL): /gracias?nombre=Ana&empresa=ACME&correo=ana@acme.com&telefono=5512345678
function primerParam(params: URLSearchParams, ...claves: string[]): string {
  for (const c of claves) {
    const v = params.get(c);
    if (v && v.trim()) return v.trim();
  }
  return '';
}

function telefono10(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

function fireConfetti() {
  const defaults = { startVelocity: 28, spread: 360, ticks: 55, zIndex: 0, colors: ['#006d4e', '#00a86b', '#ffd700'] };
  confetti({ ...defaults, particleCount: 60, origin: { x: 0.2, y: 0.4 } });
  confetti({ ...defaults, particleCount: 60, origin: { x: 0.8, y: 0.4 } });
}

const ReferidoCard: React.FC<{
  n: number;
  value: ReferidoData;
  onChange: (v: ReferidoData) => void;
  onRemove?: () => void;
  errors: Record<string, string>;
}> = ({ n, value, onChange, onRemove, errors }) => {
  const set = <K extends keyof ReferidoData>(campo: K, v: ReferidoData[K]) => onChange({ ...value, [campo]: v });
  const err = (campo: string) => errors[`r${n}${campo}`];
  const clase = (campo: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${err(campo) ? 'border-red-300' : 'border-gray-200'}`;

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest text-firma-green uppercase">Referido {n}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
            <X size={14} /> Quitar
          </button>
        )}
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">¿Qué crédito necesita?</p>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS_CREDITO.map(t => (
            <button
              key={t.valor}
              type="button"
              onClick={() => set('tipoCredito', t.valor)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-colors ${
                value.tipoCredito === t.valor
                  ? 'border-firma-green bg-firma-green/10 text-firma-green'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-firma-green/40'
              }`}
            >
              {t.icono}
              {t.etiqueta}
            </button>
          ))}
        </div>
        {err('Tipo') && <p className="text-xs text-red-500 mt-1">{err('Tipo')}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input type="text" placeholder="Nombre de la persona" value={value.nombre} onChange={e => set('nombre', e.target.value)} className={clase('Nombre')} />
          {err('Nombre') && <p className="text-xs text-red-500 mt-1">{err('Nombre')}</p>}
        </div>
        <div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Teléfono (10 dígitos)"
            value={value.telefono}
            onChange={e => set('telefono', soloDigitos10(e.target.value))}
            className={clase('Telefono')}
          />
          {err('Telefono') && <p className="text-xs text-red-500 mt-1">{err('Telefono')}</p>}
        </div>
        <div>
          <input type="email" placeholder="Correo (opcional)" value={value.correo} onChange={e => set('correo', e.target.value)} className={clase('Correo')} />
          {err('Correo') && <p className="text-xs text-red-500 mt-1">{err('Correo')}</p>}
        </div>
        <div>
          <input type="text" placeholder="Empresa (opcional)" value={value.empresa} onChange={e => set('empresa', e.target.value)} className={clase('Empresa')} />
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

  const [searchParams] = useSearchParams();
  const [nombre, setNombre] = useState(() => primerParam(searchParams, 'nombre', 'name'));
  const [empresa, setEmpresa] = useState(() => primerParam(searchParams, 'empresa', 'company'));
  const [correo, setCorreo] = useState(() => primerParam(searchParams, 'correo', 'email'));
  const [telefono, setTelefono] = useState(() => telefono10(primerParam(searchParams, 'telefono', 'tel', 'celular', 'phone')));
  // Si el enlace ya trae los datos obligatorios, se salta el primer paso.
  const [saltoDatos, setSaltoDatos] = useState(
    () => Boolean(nombre.trim() && EMAIL_REGEX.test(correo.trim()) && telefono.length === 10)
  );
  const [paso, setPaso] = useState<Paso>(saltoDatos ? 'comentario' : 'datos');
  const [calificacion, setCalificacion] = useState(0);
  const [hoverEstrella, setHoverEstrella] = useState(0);
  const [comentario, setComentario] = useState('');
  const [autoriza, setAutoriza] = useState(false);
  const [opinionId, setOpinionId] = useState<string | null>(null);
  const [guardandoOpinion, setGuardandoOpinion] = useState(false);
  const [refs, setRefs] = useState<ReferidoData[]>([REFERIDO_VACIO]);
  const [referidosEnviados, setReferidosEnviados] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const continuarDatos = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Requerido';
    if (!correo.trim() || !EMAIL_REGEX.test(correo.trim())) e.correo = 'Correo inválido';
    if (telefono.length !== 10) e.telefono = 'Debe tener 10 dígitos';
    setErrors(e);
    if (Object.keys(e).length === 0) setPaso('comentario');
  };

  // La opinión se guarda al continuar: así no se pierde aunque el cliente no llegue a los referidos.
  const continuarComentario = async () => {
    const e: Record<string, string> = {};
    if (calificacion === 0) e.calificacion = 'Elige de 1 a 5 estrellas';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setGuardandoOpinion(true);
    const { data, error } = await supabase.rpc('guardar_opinion_gracias', {
      p: {
        id: opinionId,
        nombre,
        empresa,
        correo,
        telefono,
        calificacion,
        comentario,
        autoriza: autoriza && comentario.trim().length > 0,
      },
    });
    setGuardandoOpinion(false);
    if (error || !data) {
      setErrors({ calificacion: 'No pudimos guardar tu opinión. Intenta de nuevo.' });
      return;
    }
    setOpinionId(data as string);
    setPaso('referidos');
  };

  const validateReferidos = (): boolean => {
    const e: Record<string, string> = {};
    const llenos = refs.map((r, i) => ({ r, n: i + 1 })).filter(({ r }) => !referidoVacio(r));
    if (llenos.length === 0) e.general = 'Agrega al menos un referido, o elige "No tengo referidos por el momento".';
    llenos.forEach(({ r, n }) => {
      if (!r.tipoCredito) e[`r${n}Tipo`] = 'Elige el tipo de crédito';
      if (!r.nombre.trim()) e[`r${n}Nombre`] = 'Requerido';
      if (r.telefono.length !== 10) e[`r${n}Telefono`] = 'Debe tener 10 dígitos';
      if (r.correo.trim() && !EMAIL_REGEX.test(r.correo.trim())) e[`r${n}Correo`] = 'Correo inválido';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const enviarReferidos = async (items: ReferidoData[]) => {
    if (!opinionId) { setPaso('comentario'); return; }
    setStatus('sending');
    const { error } = await supabase.rpc('agregar_referidos_gracias', {
      p_id: opinionId,
      p: items.map(r => ({
        nombre: r.nombre.trim(),
        telefono: r.telefono,
        correo: r.correo.trim(),
        empresa: r.empresa.trim(),
        tipoCredito: r.tipoCredito,
      })),
    });
    if (error) {
      setStatus('error');
      return;
    }
    setReferidosEnviados(items.length);
    setStatus('success');
  };

  const submit = async () => {
    if (!validateReferidos()) return;
    await enviarReferidos(refs.filter(r => !referidoVacio(r)));
  };

  const sinReferidos = async () => {
    setErrors({});
    await enviarReferidos([]);
  };

  const pasosVisibles = saltoDatos ? PASOS.filter(p => p !== 'datos') : PASOS;
  const pasoIndex = pasosVisibles.indexOf(paso);
  const progress = ((pasoIndex + 1) / pasosVisibles.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline" aria-label="Ir al inicio de Firma 7">
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
          </a>
          <a href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-[#006d4e] text-sm font-medium transition-colors no-underline">
            <ArrowLeft size={16} /> Ir al inicio
          </a>
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

        {/* ── Datos, comentario y referidos (formulario de 3 pasos) ──── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 mt-6 shadow-sm">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-firma-green" />
              </div>
              <h3 className="font-serif text-2xl text-charcoal mb-2">
                {referidosEnviados > 0 ? '¡Gracias por tu opinión y tus referidos!' : '¡Gracias por tu opinión!'}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {referidosEnviados > 0
                  ? `Un asesor contactará ${referidosEnviados === 1 ? 'a la persona que nos recomendaste' : `a las ${referidosEnviados} personas que nos recomendaste`} y les diremos que vienen de tu parte.`
                  : 'Cuando conozcas a alguien que necesite crédito automotriz, hipotecario o empresarial, aquí estaremos para ayudarle.'}
                {autoriza && comentario.trim() && ' Revisaremos tu comentario y podría aparecer como testimonio en nuestra página principal.'}
              </p>
            </div>
          ) : (
            <>
              {/* ── Progreso ───────────────────────────── */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-firma-green uppercase tracking-widest">
                    Paso {pasoIndex + 1} de {pasosVisibles.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-firma-green/70 to-firma-green rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {paso === 'datos' && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User size={22} className="text-firma-green" />
                    </div>
                    <h3 className="font-serif text-2xl text-charcoal mb-2">Cuéntanos quién eres</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                      Antes de continuar, confírmanos tus datos.
                    </p>
                  </div>
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
                  <div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Tu teléfono (10 dígitos)"
                      value={telefono}
                      onChange={e => setTelefono(soloDigitos10(e.target.value))}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.telefono ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={continuarDatos}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {paso === 'comentario' && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={22} className="text-firma-green" />
                    </div>
                    {saltoDatos && (
                      <p className="text-xs text-gray-400 mb-3">
                        Hola, <strong className="text-gray-600">{nombre.split(' ')[0]}</strong> ·{' '}
                        <button type="button" onClick={() => { setSaltoDatos(false); setPaso('datos'); }} className="underline hover:text-firma-green">
                          ¿No eres tú? Cambiar mis datos
                        </button>
                      </p>
                    )}
                    <h3 className="font-serif text-2xl text-charcoal mb-2">¿Cómo fue tu experiencia con nosotros?</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                      Tu opinión nos ayuda a mejorar.
                    </p>
                  </div>

                  {/* Estrellas */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5" onMouseLeave={() => setHoverEstrella(0)}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { setCalificacion(n); setErrors({}); }}
                          onMouseEnter={() => setHoverEstrella(n)}
                          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={36}
                            className={(hoverEstrella || calificacion) >= n ? 'text-amber-400' : 'text-gray-200'}
                            fill="currentColor"
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 h-4 mt-1">{ETIQUETAS_ESTRELLAS[hoverEstrella || calificacion]}</p>
                    {errors.calificacion && <p className="text-xs text-red-500 mt-1">{errors.calificacion}</p>}
                  </div>

                  {calificacion > 0 && (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        maxLength={500}
                        placeholder={calificacion >= 4 ? '¿Qué fue lo que más te gustó? (opcional)' : '¿Qué podríamos mejorar? (opcional)'}
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 resize-none"
                      />
                      {comentario.trim().length > 0 && (
                        <label className="flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoriza}
                            onChange={e => setAutoriza(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-firma-green focus:ring-firma-green/30"
                          />
                          <span>Autorizo que mi comentario aparezca como testimonio en la página de Firma 7, con mi nombre y empresa.</span>
                        </label>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setSaltoDatos(false); setPaso('datos'); }}
                      className="inline-flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold text-gray-400 hover:text-charcoal transition-colors"
                    >
                      <ArrowLeft size={15} /> Atrás
                    </button>
                    <button
                      type="button"
                      onClick={continuarComentario}
                      disabled={guardandoOpinion}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                    >
                      {guardandoOpinion ? <><Loader2 size={18} className="animate-spin" /> Guardando…</> : 'Continuar'}
                    </button>
                  </div>
                </div>
              )}

              {paso === 'referidos' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={22} className="text-firma-green" />
                    </div>
                    <h3 className="font-serif text-2xl text-charcoal mb-2">¿Conoces a alguien que necesite financiamiento?</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                      Recomiéndanos a personas o empresas que busquen{' '}
                      <strong className="text-charcoal">crédito automotriz, crédito hipotecario o crédito empresarial</strong>
                      {' '}— nosotros nos encargamos del resto.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      {TIPOS_CREDITO.map(t => (
                        <span key={t.valor} className="inline-flex items-center gap-1.5 text-xs font-semibold text-firma-green bg-firma-green/5 border border-firma-green/20 rounded-full px-3 py-1.5">
                          {t.icono} Crédito {t.etiqueta.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {refs.map((r, i) => (
                      <ReferidoCard
                        key={i}
                        n={i + 1}
                        value={r}
                        onChange={v => setRefs(prev => prev.map((x, j) => (j === i ? v : x)))}
                        onRemove={refs.length > 1 ? () => setRefs(prev => prev.filter((_, j) => j !== i)) : undefined}
                        errors={errors}
                      />
                    ))}

                    {refs.length < MAX_REFERIDOS && (
                      <button
                        type="button"
                        onClick={() => setRefs(prev => [...prev, REFERIDO_VACIO])}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:border-firma-green/50 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
                      >
                        <PlusCircle size={16} /> Agregar otro referido
                      </button>
                    )}

                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Avísales que un asesor de Firma 7 los contactará.
                    </p>

                    {errors.general && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {errors.general}
                      </div>
                    )}
                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        No se pudo enviar. Por favor intenta de nuevo.
                      </div>
                    )}

                    <div className="space-y-3 pt-1">
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
                      <button
                        type="button"
                        onClick={sinReferidos}
                        disabled={status === 'sending'}
                        className="w-full px-8 py-3 text-sm font-semibold text-gray-500 border-2 border-gray-200 rounded-full hover:border-firma-green/40 hover:text-firma-green disabled:opacity-60 transition-colors"
                      >
                        No tengo referidos por el momento
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaso('comentario')}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-charcoal transition-colors"
                      >
                        <ArrowLeft size={13} /> Volver a mi opinión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Cierre ──────────────────────────────────── */}
        {/* Solo al terminar: con 4 o 5 estrellas se invita a la reseña pública en Facebook; con menos, solo se agradece. */}
        {status === 'success' && calificacion >= 4 && (
        <div className="bg-charcoal rounded-2xl p-8 text-center text-white mt-6">
          <div className="w-12 h-12 bg-[#1877F2]/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Facebook size={22} className="text-[#1877F2]" fill="currentColor" />
          </div>
          <h3 className="font-serif text-2xl mb-2">¿Nos regalas una reseña en Facebook?</h3>
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
            <Facebook size={18} fill="currentColor" />
            Dejar una reseña en Facebook
          </a>
        </div>
        )}

        {status === 'success' && calificacion < 4 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center mt-6 shadow-sm">
            <h3 className="font-serif text-xl text-charcoal mb-2">Gracias por tu franqueza</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-5">
              Tomaremos tu opinión en cuenta para mejorar. Si quieres que un asesor revise tu caso contigo, escríbenos.
            </p>
            <a
              href="https://wa.me/525525069817?text=Hola%2C%20acabo%20de%20dejar%20mi%20opini%C3%B3n%20en%20Firma%207%20y%20quisiera%20comentarla."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#1ebe5c] transition-colors no-underline text-sm"
            >
              Escribirnos por WhatsApp
            </a>
          </div>
        )}

        {status === 'success' && (
          <>
            {/* Compartir Firma 7 por WhatsApp */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center mt-6 shadow-sm">
              <h3 className="font-serif text-xl text-charcoal mb-2">¿Conoces a alguien más? Comparte Firma 7</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-5">
                Mándale el enlace por WhatsApp a quien pueda necesitar un crédito empresarial, automotriz o hipotecario.
              </p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Te recomiendo a Firma 7 (SOC Asesores): comparan varias instituciones financieras para conseguirte el mejor crédito empresarial, automotriz o hipotecario. Mira aquí: https://firma7.com')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#1ebe5c] transition-colors no-underline text-sm"
              >
                <Share2 size={16} /> Compartir por WhatsApp
              </a>
            </div>

            {/* Volver al sitio + redes */}
            <div className="text-center mt-6 space-y-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-7 py-3 border-2 border-firma-green/30 text-firma-green font-bold rounded-full hover:bg-firma-green/5 transition-colors no-underline text-sm"
              >
                Ir a la página principal
              </a>
              <p className="text-gray-400 text-xs">
                Síguenos en{' '}
                <a href="https://www.instagram.com/soc_firma_7/" target="_blank" rel="noopener noreferrer" className="text-gray-600 font-semibold no-underline hover:underline inline-flex items-center gap-1">
                  <Instagram size={13} /> Instagram
                </a>
                {' · '}
                <a href="https://www.facebook.com/Firma7.Soc" target="_blank" rel="noopener noreferrer" className="text-gray-600 font-semibold no-underline hover:underline inline-flex items-center gap-1">
                  <Facebook size={13} /> Facebook
                </a>
              </p>
            </div>
          </>
        )}

        <p className="text-center text-gray-400 text-xs pt-8">
          © {new Date().getFullYear()} Firma 7 · SOC Asesores
        </p>
      </main>
    </div>
  );
};
