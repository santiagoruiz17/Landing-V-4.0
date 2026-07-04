import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ─── N8N Webhook ──────────────────────────────────────────────────────────────
const N8N_WEBHOOK_URL_PROD = 'https://n8n1.apexdigital.com.mx/webhook/firma7-leads';
const N8N_WEBHOOK_URL_TEST = 'https://santiagor17.app.n8n.cloud/webhook-test/956ed48a-8870-4b82-b74b-579b22e8c073';
const N8N_WEBHOOK_URL = N8N_WEBHOOK_URL_PROD || N8N_WEBHOOK_URL_TEST;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  nombreCompleto: string;
  numero: string;
  correo: string;
  rfc: string;
  cargo: string;
  ingresos: string;
  antiguedad: string;
  constitucion: string;
  buroPF: string;
  buroPFDetalle: string;
  buroPMEmpresa: string;
  buroPMEmpresaDetalle: string;
  buroPMAccionista: string;
  buroPMAccionistaDetalle: string;
  giro: string;
  monto: string;
  destino: string;
  garantia: string;
}

const INITIAL: FormData = {
  nombreCompleto: '', numero: '', correo: '', rfc: '', cargo: '',
  ingresos: '', antiguedad: '', constitucion: '',
  buroPF: '', buroPFDetalle: '',
  buroPMEmpresa: '', buroPMEmpresaDetalle: '',
  buroPMAccionista: '', buroPMAccionistaDetalle: '',
  giro: '', monto: '', destino: '', garantia: '',
};

// ─── Progreso guardado ─────────────────────────────────────────────────────────
const PROGRESS_STORAGE_KEY = 'firma7_profiling_progress';
const PROGRESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function loadSavedProgress(): { data: FormData; step: number } | null {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > PROGRESS_MAX_AGE_MS) return null;
    if (!parsed.data) return null;
    return { data: { ...INITIAL, ...parsed.data }, step: parsed.step ?? 0 };
  } catch {
    return null;
  }
}

function clearSavedProgress(): void {
  try { localStorage.removeItem(PROGRESS_STORAGE_KEY); } catch { /* noop */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isDescarte(data: FormData): boolean {
  if (data.ingresos === 'Menor a 150 mil pesos') return true;
  if (data.antiguedad === 'Menor a 6 meses') return true;
  if (data.constitucion === 'Persona Física con Actividad Empresarial' && data.buroPF === 'Malo') return true;
  if (data.constitucion === 'Persona Moral') {
    if (data.buroPMEmpresa === 'Malo') return true;
    if (data.buroPMAccionista === 'Malo') return true;
  }
  return false;
}

function buildWhatsAppMessage(data: FormData): string {
  const lines: string[] = [
    '📋 *NUEVA SOLICITUD DE CRÉDITO – FIRMA 7*', '',
    '👤 *DATOS DEL SOLICITANTE*',
    `• Nombre: ${data.nombreCompleto}`,
    `• Número: ${data.numero}`,
    `• Correo: ${data.correo}`,
    `• RFC: ${data.rfc}`,
    `• Cargo: ${data.cargo}`, '',
    '🏭 *GIRO DEL NEGOCIO*',
    `• ${data.giro}`, '',
    '💰 *INGRESOS MENSUALES DE LA EMPRESA*',
    `• ${data.ingresos}`, '',
    '📅 *ANTIGÜEDAD DE LA EMPRESA*',
    `• ${data.antiguedad}`, '',
    '🏢 *CONSTITUCIÓN*',
    `• ${data.constitucion}`, '',
  ];
  if (data.constitucion === 'Persona Física con Actividad Empresarial') {
    lines.push('📊 *BURÓ DE CRÉDITO (Persona Física)*');
    lines.push(`• ${data.buroPF}`);
    if (data.buroPF === 'Regular' && data.buroPFDetalle) lines.push(`  Detalle: ${data.buroPFDetalle}`);
    lines.push('');
  }
  if (data.constitucion === 'Persona Moral') {
    lines.push('📊 *BURÓ DE CRÉDITO (Empresa)*');
    lines.push(`• ${data.buroPMEmpresa}`);
    if (data.buroPMEmpresa === 'Regular' && data.buroPMEmpresaDetalle) lines.push(`  Detalle: ${data.buroPMEmpresaDetalle}`);
    lines.push('');
    lines.push('📊 *BURÓ DE CRÉDITO (Principal Accionista)*');
    lines.push(`• ${data.buroPMAccionista}`);
    if (data.buroPMAccionista === 'Regular' && data.buroPMAccionistaDetalle) lines.push(`  Detalle: ${data.buroPMAccionistaDetalle}`);
    lines.push('');
  }
  lines.push('💵 *MONTO DE CRÉDITO SOLICITADO*');
  lines.push(`• $${Number(data.monto.replace(/\D/g, '')).toLocaleString('es-MX')} MXN`);
  lines.push('');
  lines.push('🎯 *DESTINO DEL CRÉDITO*');
  lines.push(`• ${data.destino}`);
  lines.push('');
  lines.push('🏠 *GARANTÍA*');
  lines.push(`• ${data.garantia}`);
  return lines.join('\n');
}

// ─── Integrations ─────────────────────────────────────────────────────────────
function sendToN8N(data: FormData, calificado: boolean, evento?: string): void {
  const payload = {
    ...data,
    calificado,
    evento: evento ?? (calificado ? 'lead_calificado' : 'lead_descartado'),
    timestamp: new Date().toISOString(),
  };
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Se usa un RPC (security definer) en vez de insert().select().single() directo:
// PostgREST necesita permiso de SELECT en RLS para devolver la fila insertada, y
// leads no lo tiene (exponer SELECT dejaría leer todos los leads desde el navegador).
async function sendToSupabase(data: FormData, calificado: boolean, evento?: string): Promise<string | null> {
  const eventoFinal = evento ?? (calificado ? 'lead_calificado' : 'lead_descartado');
  try {
    const { data: id, error } = await supabase.rpc('submit_lead', {
      p: { ...data, calificado, evento: eventoFinal },
    });
    if (error) return null;
    return (id as string) ?? null;
  } catch {
    return null;
  }
}

// La sincronización a GHL ocurre en Supabase (trigger sync_lead_to_ghl sobre
// la tabla leads), no aquí — así se evita exponer credenciales en el navegador.
function sendToAll(data: FormData, calificado: boolean, evento?: string): void {
  sendToN8N(data, calificado, evento);
  sendToSupabase(data, calificado, evento);
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#006d4e', '#00a86b', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
    const pieces: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; angle: number; spin: number; opacity: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.05;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (pieces.some(p => p.opacity > 0)) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepDot: React.FC<{ active: boolean; completed: boolean; label: string }> = ({ active, completed, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
      completed ? 'bg-firma-green scale-110' : active ? 'bg-firma-green ring-4 ring-firma-green/20' : 'bg-gray-300'
    }`} />
    <span className={`text-[9px] font-medium tracking-wide hidden sm:block ${active ? 'text-firma-green' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

// ─── Radio Option ─────────────────────────────────────────────────────────────
const RadioOption: React.FC<{
  value: string; selected: boolean; onChange: (v: string) => void;
  children: React.ReactNode; isDescarte?: boolean;
}> = ({ value, selected, onChange, children, isDescarte }) => (
  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
    ${selected
      ? isDescarte ? 'border-red-400 bg-red-50' : 'border-firma-green bg-firma-green/5'
      : 'border-gray-200 hover:border-firma-green/40 hover:bg-gray-50'
    }`}>
    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
      selected
        ? isDescarte ? 'border-red-400 bg-red-400' : 'border-firma-green bg-firma-green'
        : 'border-gray-400'
    }`}>
      {selected && <div className="w-2 h-2 rounded-full bg-white m-auto mt-0.5" />}
    </div>
    <input type="radio" value={value} checked={selected} onChange={() => onChange(value)} className="sr-only" />
    <span className={`text-sm font-medium leading-snug ${
      selected
        ? isDescarte ? 'text-red-700' : 'text-firma-green'
        : 'text-charcoal group-hover:text-charcoal'
    }`}>
      {children}
    </span>
  </label>
);

// ─── Buro Section ─────────────────────────────────────────────────────────────
const BuroSection: React.FC<{
  title: string; value: string; detalle: string;
  onChangeBuro: (v: string) => void; onChangeDetalle: (v: string) => void;
}> = ({ title, value, detalle, onChangeBuro, onChangeDetalle }) => {
  const opciones = ['Excelente', 'Bueno', 'Regular', 'Malo'];
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-charcoal">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opciones.map(op => (
          <RadioOption key={op} value={op} selected={value === op} onChange={onChangeBuro} isDescarte={op === 'Malo'}>
            {op}
          </RadioOption>
        ))}
      </div>
      {value === 'Regular' && (
        <div className="mt-3 animate-fadeIn">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
            ¿Cuánto debe y con quién?
          </label>
          <textarea
            value={detalle}
            onChange={e => onChangeDetalle(e.target.value)}
            rows={3}
            placeholder="Ej: $50,000 MXN con Banco XYZ por un crédito personal…"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green resize-none transition"
          />
        </div>
      )}
    </div>
  );
};

// ─── Seguimiento de leads incompletos ──────────────────────────────────────────
// Si el lead llena sus datos de contacto pero no termina el formulario en este
// tiempo, se notifica como "no completó" (no como descarte) con lo que haya capturado.
const FOLLOWUP_DELAY_MS = 10 * 60 * 1000;

// ─── Main Component ───────────────────────────────────────────────────────────
export const ProfilingForm: React.FC = () => {
  const navigate = useNavigate();
  const [savedProgress] = useState(() => loadSavedProgress());
  const [data, setData] = useState<FormData>(() => savedProgress?.data ?? INITIAL);
  const [step, setStep] = useState(() => savedProgress?.step ?? 0);
  const [showRestoredBanner, setShowRestoredBanner] = useState(() => savedProgress !== null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Guarda el progreso en cada cambio, para poder retomarlo si el lead cierra
  // o recarga la página antes de terminar.
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ data, step, savedAt: Date.now() }));
    } catch { /* noop */ }
  }, [data, step]);

  const startOver = () => {
    clearSavedProgress();
    setData(INITIAL);
    setStep(0);
    setErrors({});
    setShowRestoredBanner(false);
  };

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const resolvedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const followupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFollowupTimer = () => {
    if (followupTimeoutRef.current) {
      clearTimeout(followupTimeoutRef.current);
      followupTimeoutRef.current = null;
    }
  };

  const scheduleFollowupTimer = () => {
    followupTimeoutRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      sendToAll(dataRef.current, false, 'lead_incompleto');
    }, FOLLOWUP_DELAY_MS);
  };

  useEffect(() => () => clearFollowupTimer(), []);

  const set = (field: keyof FormData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  // Paso 0–5 igual que antes; paso 6 = Giro; 7 = Monto; 8 = Destino; 9 = Garantía
  const STEPS = ['Contacto', 'Ingresos', 'Antigüedad', 'Constitución', 'Buró', 'Empresa', 'Giro', 'Monto', 'Destino', 'Garantía'];

  // ─── Validate ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!data.nombreCompleto.trim()) e.nombreCompleto = 'Requerido';
      if (!data.numero.trim()) e.numero = 'Requerido';
      if (!data.correo.trim() || !/\S+@\S+\.\S+/.test(data.correo)) e.correo = 'Correo inválido';
    }
    if (step === 1 && !data.ingresos) e.ingresos = 'Selecciona una opción';
    if (step === 2 && !data.antiguedad) e.antiguedad = 'Selecciona una opción';
    if (step === 3 && !data.constitucion) e.constitucion = 'Selecciona una opción';
    if (step === 4) {
      if (data.constitucion === 'Persona Física con Actividad Empresarial') {
        if (!data.buroPF) e.buroPF = 'Selecciona una opción';
        if (data.buroPF === 'Regular' && !data.buroPFDetalle.trim()) e.buroPFDetalle = 'Por favor detalla el monto y acreedor';
      }
      if (data.constitucion === 'Persona Moral') {
        if (!data.buroPMEmpresa) e.buroPMEmpresa = 'Selecciona una opción';
        if (data.buroPMEmpresa === 'Regular' && !data.buroPMEmpresaDetalle.trim()) e.buroPMEmpresaDetalle = 'Por favor detalla el monto y acreedor';
        if (!data.buroPMAccionista) e.buroPMAccionista = 'Selecciona una opción';
        if (data.buroPMAccionista === 'Regular' && !data.buroPMAccionistaDetalle.trim()) e.buroPMAccionistaDetalle = 'Por favor detalla el monto y acreedor';
      }
    }
    if (step === 5) {
      if (!data.rfc.trim()) e.rfc = 'Requerido';
      if (!data.cargo.trim()) e.cargo = 'Requerido';
    }
    if (step === 6 && !data.giro.trim()) e.giro = 'Por favor describe a qué se dedica tu empresa';
    if (step === 7) {
      if (!data.monto.trim()) e.monto = 'Requerido';
      else if (!/^\d[\d,]*$/.test(data.monto.replace(/\s/g, ''))) e.monto = 'Solo números';
    }
    if (step === 8 && !data.destino.trim()) e.destino = 'Por favor describe el destino del crédito';
    if (step === 9 && !data.garantia) e.garantia = 'Selecciona una opción';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const next = () => {
    if (!validate()) return;
    if (step === 0 && !timerStartedRef.current) {
      // Ya tenemos datos de contacto: arrancamos la cuenta regresiva de 10 min.
      // Si el lead no termina el formulario en ese lapso, se notifica como
      // "no completó" — no se envía ningún correo todavía.
      timerStartedRef.current = true;
      scheduleFollowupTimer();
    }
    if (isDescarte({ ...data })) {
      resolvedRef.current = true;
      clearFollowupTimer();
      clearSavedProgress();
      sendToAll(data, false, 'lead_descartado');
      navigate('/espera');
      return;
    }
    setStep(s => s + 1);
  };

  const prev = () => { setErrors({}); setStep(s => Math.max(0, s - 1)); };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!validate()) return;
    resolvedRef.current = true;
    clearFollowupTimer();
    clearSavedProgress();
    sendToN8N(data, true);
    const leadId = await sendToSupabase(data, true);
    const tipo = data.constitucion === 'Persona Moral' ? 'moral' : 'fisica';
    const params = new URLSearchParams({ tipo, nombre: data.nombreCompleto.split(' ')[0] });
    if (leadId) params.set('leadId', leadId);
    navigate(`/aprobado?${params.toString()}`);
  };

  const inputClass = (field: string) =>
    `w-full border ${errors[field] ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition`;

  // ─── Buro step ─────────────────────────────────────────────────────────────
  const renderBuroStep = () => {
    if (data.constitucion === 'Persona Física con Actividad Empresarial') {
      return (
        <div className="space-y-6">
          <BuroSection
            title="¿Cómo se encuentra en buró de crédito?"
            value={data.buroPF} detalle={data.buroPFDetalle}
            onChangeBuro={v => { set('buroPF', v); setErrors({}); }}
            onChangeDetalle={v => set('buroPFDetalle', v)}
          />
          {errors.buroPF && <p className="field-error">{errors.buroPF}</p>}
          {errors.buroPFDetalle && <p className="field-error">{errors.buroPFDetalle}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <BuroSection
          title="¿Cómo se encuentra en buró de crédito la empresa?"
          value={data.buroPMEmpresa} detalle={data.buroPMEmpresaDetalle}
          onChangeBuro={v => { set('buroPMEmpresa', v); setErrors({}); }}
          onChangeDetalle={v => set('buroPMEmpresaDetalle', v)}
        />
        {errors.buroPMEmpresa && <p className="field-error">{errors.buroPMEmpresa}</p>}
        {errors.buroPMEmpresaDetalle && <p className="field-error">{errors.buroPMEmpresaDetalle}</p>}
        <div className="border-t border-gray-100 pt-6">
          <BuroSection
            title="¿Cómo se encuentra en buró de crédito el principal accionista?"
            value={data.buroPMAccionista} detalle={data.buroPMAccionistaDetalle}
            onChangeBuro={v => { set('buroPMAccionista', v); setErrors({}); }}
            onChangeDetalle={v => set('buroPMAccionistaDetalle', v)}
          />
          {errors.buroPMAccionista && <p className="field-error">{errors.buroPMAccionista}</p>}
          {errors.buroPMAccionistaDetalle && <p className="field-error">{errors.buroPMAccionistaDetalle}</p>}
        </div>
      </div>
    );
  };

  // ─── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Solo toma 2 minutos. Empieza con tus datos de contacto.</p>
            <div>
              <label className="field-label">Nombre completo</label>
              <input id="f-nombre" className={inputClass('nombreCompleto')} placeholder="Juan García Pérez" value={data.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)} />
              {errors.nombreCompleto && <p className="field-error">{errors.nombreCompleto}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Número de teléfono / WhatsApp</label>
                <input id="f-numero" type="tel" className={inputClass('numero')} placeholder="55 1234 5678" value={data.numero} onChange={e => set('numero', e.target.value)} />
                {errors.numero && <p className="field-error">{errors.numero}</p>}
              </div>
              <div>
                <label className="field-label">Correo electrónico</label>
                <input id="f-correo" type="email" className={inputClass('correo')} placeholder="correo@empresa.com" value={data.correo} onChange={e => set('correo', e.target.value)} />
                {errors.correo && <p className="field-error">{errors.correo}</p>}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Selecciona el rango de ingresos mensuales de tu empresa.</p>
            {[
              { value: 'Menor a 150 mil pesos', d: true },
              { value: 'Entre 150 mil y 300 mil pesos', d: false },
              { value: 'Entre 300 mil y 500 mil pesos', d: false },
              { value: 'Más de 500 mil pesos', d: false },
            ].map(op => (
              <RadioOption key={op.value} value={op.value} selected={data.ingresos === op.value}
                onChange={v => { set('ingresos', v); setErrors({}); }} isDescarte={op.d}>
                {op.value}
              </RadioOption>
            ))}
            {errors.ingresos && <p className="field-error">{errors.ingresos}</p>}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">¿Cuánto tiempo lleva operando tu empresa?</p>
            {[
              { value: 'Menor a 6 meses', d: true },
              { value: 'Entre 6 meses y 1 año', d: false },
              { value: 'Entre 1 año y 2 años', d: false },
              { value: 'Más de 2 años', d: false },
            ].map(op => (
              <RadioOption key={op.value} value={op.value} selected={data.antiguedad === op.value}
                onChange={v => { set('antiguedad', v); setErrors({}); }} isDescarte={op.d}>
                {op.value}
              </RadioOption>
            ))}
            {errors.antiguedad && <p className="field-error">{errors.antiguedad}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">¿Cómo está constituida tu empresa?</p>
            {['Persona Física con Actividad Empresarial', 'Persona Moral'].map(op => (
              <RadioOption key={op} value={op} selected={data.constitucion === op}
                onChange={v => {
                  set('constitucion', v);
                  set('buroPF', ''); set('buroPFDetalle', '');
                  set('buroPMEmpresa', ''); set('buroPMEmpresaDetalle', '');
                  set('buroPMAccionista', ''); set('buroPMAccionistaDetalle', '');
                  setErrors({});
                }}>
                {op}
              </RadioOption>
            ))}
            {errors.constitucion && <p className="field-error">{errors.constitucion}</p>}
          </div>
        );

      case 4:
        return renderBuroStep();

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">¡Vas muy bien! Necesitamos los datos formales de tu empresa.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">RFC de la empresa</label>
                <input id="f-rfc" className={inputClass('rfc')} placeholder="XAXX010101000" value={data.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} maxLength={13} />
                {errors.rfc && <p className="field-error">{errors.rfc}</p>}
              </div>
              <div>
                <label className="field-label">Tu cargo en la empresa</label>
                <input id="f-cargo" className={inputClass('cargo')} placeholder="Director, Gerente, etc." value={data.cargo} onChange={e => set('cargo', e.target.value)} />
                {errors.cargo && <p className="field-error">{errors.cargo}</p>}
              </div>
            </div>
          </div>
        );

      // Paso 6 — Giro del negocio (nuevo)
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Cuéntanos sobre tu empresa: ¿a qué se dedica, qué productos o servicios ofrece y quiénes son sus clientes?
            </p>
            <div>
              <label className="field-label">Descripción del negocio</label>
              <textarea
                id="f-giro"
                value={data.giro}
                rows={5}
                onChange={e => { set('giro', e.target.value); setErrors({}); }}
                placeholder="Ej: Empresa de construcción enfocada en obra civil para el sector público. Contamos con 15 empleados y operamos principalmente en CDMX y Estado de México…"
                className={`${inputClass('giro')} resize-none`}
              />
              {errors.giro && <p className="field-error">{errors.giro}</p>}
            </div>
            <p className="text-xs text-gray-400">
              Esta información nos ayuda a conectarte con las instituciones financieras más adecuadas para tu industria.
            </p>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa el monto de crédito que deseas solicitar (solo números).</p>
            <div>
              <label className="field-label">Monto solicitado (MXN)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                <input
                  id="f-monto" type="text" inputMode="numeric"
                  className={`${inputClass('monto')} pl-8`} placeholder="500,000"
                  value={data.monto}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    set('monto', raw ? Number(raw).toLocaleString('es-MX') : '');
                    setErrors({});
                  }}
                />
              </div>
              {errors.monto && <p className="field-error">{errors.monto}</p>}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">¿Para qué se va a utilizar el crédito? Brinda una breve explicación.</p>
            <div>
              <label className="field-label">Destino del crédito</label>
              <textarea
                id="f-destino" value={data.destino} rows={5}
                onChange={e => { set('destino', e.target.value); setErrors({}); }}
                placeholder="Ej: Capital de trabajo para inventario, expansión de sucursales, compra de maquinaria…"
                className={`${inputClass('destino')} resize-none`}
              />
              {errors.destino && <p className="field-error">{errors.destino}</p>}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">En caso de requerirse, ¿cuenta con garantía?</p>
            <div className="space-y-3">
              <RadioOption value="Sí" selected={data.garantia === 'Sí'} onChange={v => { set('garantia', v); setErrors({}); }}>
                <span>
                  <span className="font-semibold">Sí</span>
                  <span className="block text-xs text-gray-500 mt-1">⚠️ Solo se aceptan terrenos y propiedades libres de gravamen como garantía.</span>
                </span>
              </RadioOption>
              <RadioOption value="No" selected={data.garantia === 'No'} onChange={v => { set('garantia', v); setErrors({}); }}>
                No
              </RadioOption>
            </div>
            {errors.garantia && <p className="field-error">{errors.garantia}</p>}
          </div>
        );

      default: return null;
    }
  };

  const stepTitles = [
    'Datos de Contacto',
    'Ingresos Mensuales',
    'Antigüedad de la Empresa',
    'Constitución',
    data.constitucion === 'Persona Moral' ? 'Buró de Crédito (Empresa y Accionista)' : 'Buró de Crédito',
    'Datos de la Empresa',
    'Giro del Negocio',
    'Monto de Crédito',
    'Destino del Crédito',
    'Garantía',
  ];

  // ─── Main form ─────────────────────────────────────────────────────────────
  const isLastStep = step === STEPS.length - 1;
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
            Pre-Calificación
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-charcoal mb-6">
            <span className="italic text-firma-green">Perfilate</span> en minutos
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light">
            Completa el formulario para recibir un análisis detallado por parte de nuestros socios directores.
          </p>

          {/* Trust badges */}
          <div className="mt-8 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Acceso a más de 20 instituciones financieras
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['Axionex', 'Xepelin', 'Konfío', 'Creze', 'Hey Banco', 'Covalto', 'Finsus', 'Finkargo'].map(name => (
                <span
                  key={name}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 shadow-sm"
                >
                  {name}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-firma-green/5 border border-firma-green/20 rounded-lg text-xs font-semibold text-firma-green">
                +12 más
              </span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 rounded-[2rem] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-firma-green/20 via-firma-green to-firma-green/20" />

          {/* Progress */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-firma-green uppercase tracking-widest">
                Paso {step + 1} de {STEPS.length}
              </span>
              <span className="text-xs text-gray-400">{Math.round(progress)}% completado</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-firma-green/70 to-firma-green rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Aviso de progreso restaurado */}
          {showRestoredBanner && (
            <div className="mx-8 mt-1 mb-2 flex flex-wrap items-center justify-between gap-2 bg-firma-green/5 border border-firma-green/20 rounded-xl px-4 py-2.5">
              <span className="text-xs text-firma-green font-medium">
                Retomamos tu progreso anterior.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestoredBanner(false)}
                  className="text-xs font-semibold text-firma-green hover:underline"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Empezar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-start justify-between px-8 py-3">
            {STEPS.map((label, i) => (
              <StepDot key={i} label={label} active={i === step} completed={i < step} />
            ))}
          </div>

          {/* Content */}
          <div className="px-8 pb-4 pt-2">
            <h3 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-firma-green/10 flex items-center justify-center text-firma-green text-sm font-bold flex-shrink-0">
                {step + 1}
              </span>
              {stepTitles[step]}
            </h3>
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between gap-4">
            <button
              onClick={prev}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-600
                hover:border-firma-green hover:text-firma-green hover:bg-firma-green/5
                active:scale-95 transition-all duration-200
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
            >
              ← Anterior
            </button>

            {isLastStep ? (
              <button
                id="form-submit-btn"
                onClick={submit}
                className="flex items-center gap-2 px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold
                  hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30
                  active:translate-y-0 active:shadow-md transition-all duration-200 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.271-.099-.47-.148-.666.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.296-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.523 5.849L.054 23.486a.5.5 0 00.612.608l5.678-1.487A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.076-1.387l-.364-.215-3.769.988.997-3.707-.237-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Ver resultado
              </button>
            ) : (
              <button
                id="form-next-btn"
                onClick={next}
                className="px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold
                  hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30
                  active:translate-y-0 active:shadow-md transition-all duration-200 shadow-md"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-gray-400 font-light tracking-wide italic">
          Tu información está protegida por nuestros protocolos de seguridad bancaria y confidencialidad.
        </p>
      </div>

      <style>{`
        .field-label {
          display: block; font-size: 0.7rem; font-weight: 600; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem;
        }
        .field-error { font-size: 0.7rem; color: #f87171; margin-top: 0.25rem; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </section>
  );
};
