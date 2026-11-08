import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Car, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackLead } from '../lib/metaPixel';
import { trackEvent } from '../lib/analytics';
import { getStoredUtmParams } from '../lib/utmTracking';
import { EMAIL_REGEX, soloDigitos10 } from '../lib/validation';

type TipoPersona = 'asalariado' | 'fisica' | 'moral';
type Buro = 'Bueno' | 'Regular' | 'Malo';
type Origen = 'Lote' | 'Particular' | 'Agencia';

const TIPOS: { valor: TipoPersona; titulo: string; desc: string }[] = [
  { valor: 'asalariado', titulo: 'Persona física (asalariado)', desc: 'Recibo un sueldo de una empresa' },
  { valor: 'fisica', titulo: 'Persona física con actividad empresarial', desc: 'Trabajo por mi cuenta o tengo un negocio a mi nombre' },
  { valor: 'moral', titulo: 'Persona moral', desc: 'La compra la hará una empresa' },
];

// Textos exactos definidos por Firma 7. Solo "Regular" y "Malo" descartan el perfil.
const BUROS: { valor: Buro; titulo: string; desc: string }[] = [
  { valor: 'Bueno', titulo: 'Bueno', desc: 'No tengo ningún atraso en buró de crédito' },
  { valor: 'Regular', titulo: 'Regular', desc: 'Tengo un pequeño atraso en buró de crédito' },
  { valor: 'Malo', titulo: 'Malo', desc: 'Tengo un atraso grave en buró de crédito' },
];

const ORIGENES: Origen[] = ['Agencia', 'Lote', 'Particular'];

// Antigüedad máxima del auto: 9 años menos que el año en curso (en 2026 → 2017; el 1 de enero de 2027 → 2018).
// Se calcula con la fecha del dispositivo, así que se actualiza sola cada año. Se permite el modelo del año siguiente.
const ANIO_ACTUAL = new Date().getFullYear();
const ANIO_MAX = ANIO_ACTUAL + 1;
const ANIO_MIN = ANIO_ACTUAL - 9;
const ANIOS = Array.from({ length: ANIO_MAX - ANIO_MIN + 1 }, (_, i) => String(ANIO_MAX - i));

const soloDigitos = (v: string) => v.replace(/\D/g, '').slice(0, 9);
const pesos = (digitos: string) => (digitos ? `$${Number(digitos).toLocaleString('es-MX')}` : '');

const campo = (error?: string) =>
  `w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 focus:border-firma-green transition ${error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'}`;

const Etiqueta: React.FC<{ texto: string; ayuda?: string }> = ({ texto, ayuda }) => (
  <div className="mb-1.5">
    <label className="block text-sm font-semibold text-charcoal">{texto}</label>
    {ayuda && <p className="text-xs text-gray-400 mt-0.5">{ayuda}</p>}
  </div>
);

const Error: React.FC<{ texto?: string }> = ({ texto }) => (texto ? <p className="text-xs text-red-500 mt-1">{texto}</p> : null);

export const PerfiladorAutomotriz: React.FC = () => {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState<TipoPersona | ''>('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [ingresos, setIngresos] = useState('');
  const [buro, setBuro] = useState<Buro | ''>('');
  const [enganche, setEnganche] = useState('');
  const [tieneAuto, setTieneAuto] = useState<'si' | 'no' | ''>('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [origen, setOrigen] = useState<Origen | ''>('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'error'>('idle');

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!tipo) e.tipo = 'Elige cómo solicitarás el crédito';
    if (!nombre.trim()) e.nombre = 'Escribe tu nombre completo';
    if (telefono.length !== 10) e.telefono = 'Debe tener 10 dígitos';
    if (!correo.trim() || !EMAIL_REGEX.test(correo.trim())) e.correo = 'Escribe un correo válido';
    if (!ciudad.trim()) e.ciudad = 'Escribe tu ciudad';
    if (!ingresos) e.ingresos = 'Escribe tus ingresos mensuales aproximados';
    if (!buro) e.buro = 'Elige cómo está tu buró de crédito';
    if (!enganche) e.enganche = 'Escribe el enganche con el que cuentas';
    if (!tieneAuto) e.tieneAuto = 'Cuéntanos si ya tienes el auto';
    if (tieneAuto === 'si') {
      if (!marca.trim()) e.marca = 'Escribe la marca';
      if (!modelo.trim()) e.modelo = 'Escribe el modelo';
      if (!anio) e.anio = 'Elige el año';
      if (!origen) e.origen = 'Elige dónde lo compras';
    }
    setErrores(e);
    if (Object.keys(e).length > 0) {
      const primero = Object.keys(e)[0];
      document.getElementById(`auto-${primero}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(e).length === 0;
  };

  const enviar = async () => {
    if (!validar() || !tipo || !buro) return;
    setEstado('enviando');

    const payload = {
      tipoPersona: tipo,
      nombreCompleto: nombre.trim(),
      numero: telefono,
      correo: correo.trim(),
      ciudad: ciudad.trim(),
      ingresos: pesos(ingresos),
      buro,
      enganche: pesos(enganche),
      tieneVehiculo: tieneAuto === 'si',
      vehiculoMarca: marca.trim(),
      vehiculoModelo: modelo.trim(),
      vehiculoAnio: anio,
      vehiculoOrigen: origen,
      ...getStoredUtmParams(),
    };

    const llamar = () => supabase.rpc('submit_lead_automotriz', { p: payload });
    let { data, error } = await llamar();
    if (error || !(data as { leadId?: string } | null)?.leadId) {
      // Un reintento por si fue una red lenta; es seguro: el mismo correo actualiza el mismo trámite.
      await new Promise(r => setTimeout(r, 1500));
      ({ data, error } = await llamar());
    }
    const res = data as { leadId?: string; calificado?: boolean } | null;
    if (error || !res?.leadId) {
      console.error('submit_lead_automotriz', error);
      setEstado('error');
      return;
    }

    trackEvent('automotriz_form_submit', { calificado: Boolean(res.calificado) });
    if (!res.calificado) {
      navigate('/espera');
      return;
    }
    trackLead();
    const params = new URLSearchParams({
      tipo,
      nombre: nombre.trim().split(' ')[0],
      leadId: res.leadId,
      producto: 'automotriz',
    });
    navigate(`/aprobado?${params.toString()}`);
  };

  const opcion = (activa: boolean) =>
    `w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${activa ? 'border-firma-green bg-firma-green/5' : 'border-gray-200 bg-white hover:border-firma-green/40'}`;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-firma-green/5 p-6 md:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-firma-green/10 flex items-center justify-center flex-shrink-0">
          <Car size={22} className="text-firma-green" />
        </div>
        <div>
          <h3 className="font-serif text-2xl text-charcoal font-bold leading-tight">Evalúa tu perfil</h3>
          <p className="text-sm text-gray-500">Contesta estas preguntas, toma unos minutos.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* ── Cómo solicitarás ───────────────────────────── */}
        <div id="auto-tipo">
          <Etiqueta texto="¿Cómo solicitarás el crédito?" />
          <div className="grid gap-2.5 md:grid-cols-3">
            {TIPOS.map(t => (
              <button key={t.valor} type="button" onClick={() => setTipo(t.valor)} className={opcion(tipo === t.valor)}>
                <p className="text-sm font-semibold text-charcoal leading-snug">{t.titulo}</p>
                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
          <Error texto={errores.tipo} />
        </div>

        {/* ── Tus datos ──────────────────────────────────── */}
        <div className="grid gap-5 md:grid-cols-2">
          <div id="auto-nombre" className="md:col-span-2">
            <Etiqueta texto="Nombre completo" />
            <input type="text" autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} className={campo(errores.nombre)} />
            <Error texto={errores.nombre} />
          </div>
          <div id="auto-telefono">
            <Etiqueta texto="Teléfono" ayuda="10 dígitos, de preferencia con WhatsApp" />
            <input type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={telefono} onChange={e => setTelefono(soloDigitos10(e.target.value))} className={campo(errores.telefono)} />
            <Error texto={errores.telefono} />
          </div>
          <div id="auto-correo">
            <Etiqueta texto="Correo electrónico" />
            <input type="email" autoComplete="email" value={correo} onChange={e => setCorreo(e.target.value)} className={campo(errores.correo)} />
            <Error texto={errores.correo} />
          </div>
          <div id="auto-ciudad">
            <Etiqueta texto="Ciudad donde vives" />
            <input type="text" autoComplete="address-level2" value={ciudad} onChange={e => setCiudad(e.target.value)} className={campo(errores.ciudad)} />
            <Error texto={errores.ciudad} />
          </div>
          <div id="auto-ingresos">
            <Etiqueta texto="Ingresos mensuales aproximados" />
            <input type="text" inputMode="numeric" placeholder="$0" value={pesos(ingresos)} onChange={e => setIngresos(soloDigitos(e.target.value))} className={campo(errores.ingresos)} />
            <Error texto={errores.ingresos} />
          </div>
        </div>

        {/* ── Buró de crédito ────────────────────────────── */}
        <div id="auto-buro">
          <Etiqueta texto="¿Cómo está tu buró de crédito?" />
          <div className="grid gap-2.5 md:grid-cols-3">
            {BUROS.map(b => (
              <button key={b.valor} type="button" onClick={() => setBuro(b.valor)} className={opcion(buro === b.valor)}>
                <p className="text-sm font-semibold text-charcoal">{b.titulo}</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{b.desc}</p>
              </button>
            ))}
          </div>
          <Error texto={errores.buro} />
        </div>

        {/* ── Enganche ───────────────────────────────────── */}
        <div id="auto-enganche" className="max-w-md">
          <Etiqueta texto="¿Con cuánto enganche cuentas?" ayuda="El enganche mínimo es del 10% del valor del auto." />
          <input type="text" inputMode="numeric" placeholder="$0" value={pesos(enganche)} onChange={e => setEnganche(soloDigitos(e.target.value))} className={campo(errores.enganche)} />
          <Error texto={errores.enganche} />
        </div>

        {/* ── ¿Ya tienes el auto? ────────────────────────── */}
        <div id="auto-tieneAuto">
          <Etiqueta texto="¿Ya tienes el auto que quieres financiar?" />
          <div className="grid grid-cols-2 gap-2.5 max-w-md">
            {([['si', 'Sí, ya lo tengo'], ['no', 'Todavía no']] as const).map(([valor, texto]) => (
              <button key={valor} type="button" onClick={() => setTieneAuto(valor)} className={opcion(tieneAuto === valor)}>
                <p className="text-sm font-semibold text-charcoal text-center">{texto}</p>
              </button>
            ))}
          </div>
          <Error texto={errores.tieneAuto} />

          {tieneAuto === 'si' && (
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-5 grid gap-5 md:grid-cols-3">
              <div id="auto-marca">
                <Etiqueta texto="Marca" />
                <input type="text" value={marca} onChange={e => setMarca(e.target.value)} className={campo(errores.marca)} />
                <Error texto={errores.marca} />
              </div>
              <div id="auto-modelo">
                <Etiqueta texto="Modelo" />
                <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} className={campo(errores.modelo)} />
                <Error texto={errores.modelo} />
              </div>
              <div id="auto-anio">
                <Etiqueta texto="Año" />
                <select value={anio} onChange={e => setAnio(e.target.value)} className={campo(errores.anio)}>
                  <option value="">Elige…</option>
                  {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Financiamos autos de hasta {ANIO_ACTUAL - ANIO_MIN} años de antigüedad.</p>
                <Error texto={errores.anio} />
              </div>
              <div id="auto-origen" className="md:col-span-3">
                <Etiqueta texto="¿Dónde lo compras?" />
                <div className="grid grid-cols-3 gap-2.5 max-w-lg">
                  {ORIGENES.map(o => (
                    <button key={o} type="button" onClick={() => setOrigen(o)} className={opcion(origen === o)}>
                      <p className="text-sm font-semibold text-charcoal text-center">{o === 'Lote' ? 'Un lote' : o === 'Particular' ? 'Un particular' : 'Una agencia'}</p>
                    </button>
                  ))}
                </div>
                <Error texto={errores.origen} />
              </div>
            </div>
          )}
        </div>

        {estado === 'error' && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              No pudimos enviar tus datos. Revisa tu conexión e inténtalo de nuevo; si sigue sin funcionar,{' '}
              <a
                href="https://wa.me/525525069817?text=Hola%2C%20quiero%20informaci%C3%B3n%20del%20cr%C3%A9dito%20automotriz."
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                escríbenos por WhatsApp
              </a>.
            </span>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={enviar}
            disabled={estado === 'enviando'}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-firma-green text-white font-bold rounded-full shadow-lg shadow-firma-green/25 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 transition-all"
          >
            {estado === 'enviando' ? (
              <><Loader2 size={18} className="animate-spin" /> Evaluando tu perfil…</>
            ) : (
              <>Evaluar mi perfil <ArrowRight size={18} /></>
            )}
          </button>
          <p className="mt-3 text-xs text-gray-400 flex items-start gap-1.5">
            <ShieldCheck size={14} className="flex-shrink-0 mt-px" />
            <span>
              Al continuar aceptas nuestro{' '}
              <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:text-firma-green">Aviso de Privacidad</a>.
              Tus datos solo los ve nuestro equipo.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
