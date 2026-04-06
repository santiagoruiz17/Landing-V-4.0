import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1 – Datos del solicitante
  nombreCompleto: string;
  numero: string;
  correo: string;
  rfc: string;
  cargo: string;
  // Step 2 – Ingresos mensuales
  ingresos: string;
  // Step 3 – Antigüedad
  antiguedad: string;
  // Step 4 – Constitución
  constitucion: string;
  // Step 5 – Buró persona física (si aplica)
  buroPF: string;
  buroPFDetalle: string; // monto y con quién (si "Regular")
  // Step 6 – Buró empresa (persona moral)
  buroPMEmpresa: string;
  buroPMEmpresaDetalle: string;
  // Step 7 – Buró accionista principal (persona moral)
  buroPMAccionista: string;
  buroPMAccionistaDetalle: string;
  // Step 8 – Monto
  monto: string;
  // Step 9 – Destino
  destino: string;
  // Step 10 – Garantía
  garantia: string;
}

const INITIAL: FormData = {
  nombreCompleto: '',
  numero: '',
  correo: '',
  rfc: '',
  cargo: '',
  ingresos: '',
  antiguedad: '',
  constitucion: '',
  buroPF: '',
  buroPFDetalle: '',
  buroPMEmpresa: '',
  buroPMEmpresaDetalle: '',
  buroPMAccionista: '',
  buroPMAccionistaDetalle: '',
  monto: '',
  destino: '',
  garantia: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DESCARTE_INGRESOS = 'Menor a 150 mil pesos';
const DESCARTE_ANTIGUEDAD = 'Menor a 6 meses';
const DESCARTE_BURO_MALO = 'Malo';

function isDescarte(data: FormData): boolean {
  if (data.ingresos === DESCARTE_INGRESOS) return true;
  if (data.antiguedad === DESCARTE_ANTIGUEDAD) return true;
  if (data.constitucion === 'Persona Física con Actividad Empresarial' && data.buroPF === DESCARTE_BURO_MALO) return true;
  if (data.constitucion === 'Persona Moral') {
    if (data.buroPMEmpresa === DESCARTE_BURO_MALO) return true;
    if (data.buroPMAccionista === DESCARTE_BURO_MALO) return true;
  }
  return false;
}

function buildWhatsAppMessage(data: FormData): string {
  const lines: string[] = [
    '📋 *NUEVA SOLICITUD DE CRÉDITO – FIRMA 7*',
    '',
    '👤 *DATOS DEL SOLICITANTE*',
    `• Nombre: ${data.nombreCompleto}`,
    `• Número: ${data.numero}`,
    `• Correo: ${data.correo}`,
    `• RFC: ${data.rfc}`,
    `• Cargo: ${data.cargo}`,
    '',
    '💰 *INGRESOS MENSUALES DE LA EMPRESA*',
    `• ${data.ingresos}`,
    '',
    '📅 *ANTIGÜEDAD DE LA EMPRESA*',
    `• ${data.antiguedad}`,
    '',
    '🏢 *CONSTITUCIÓN*',
    `• ${data.constitucion}`,
    '',
  ];

  if (data.constitucion === 'Persona Física con Actividad Empresarial') {
    lines.push('📊 *BURÓ DE CRÉDITO (Persona Física)*');
    lines.push(`• ${data.buroPF}`);
    if (data.buroPF === 'Regular' && data.buroPFDetalle) {
      lines.push(`  Detalle: ${data.buroPFDetalle}`);
    }
    lines.push('');
  }

  if (data.constitucion === 'Persona Moral') {
    lines.push('📊 *BURÓ DE CRÉDITO (Empresa)*');
    lines.push(`• ${data.buroPMEmpresa}`);
    if (data.buroPMEmpresa === 'Regular' && data.buroPMEmpresaDetalle) {
      lines.push(`  Detalle: ${data.buroPMEmpresaDetalle}`);
    }
    lines.push('');
    lines.push('📊 *BURÓ DE CRÉDITO (Principal Accionista)*');
    lines.push(`• ${data.buroPMAccionista}`);
    if (data.buroPMAccionista === 'Regular' && data.buroPMAccionistaDetalle) {
      lines.push(`  Detalle: ${data.buroPMAccionistaDetalle}`);
    }
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

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepDot: React.FC<{ active: boolean; completed: boolean; label: string }> = ({ active, completed, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className={`w-3 h-3 rounded-full transition-all duration-300 ${
        completed ? 'bg-firma-green scale-110' : active ? 'bg-firma-green ring-4 ring-firma-green/20' : 'bg-gray-300'
      }`}
    />
    <span className={`text-[9px] font-medium tracking-wide hidden sm:block ${active ? 'text-firma-green' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

// ─── Radio Option ─────────────────────────────────────────────────────────────
const RadioOption: React.FC<{
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
  isDescarte?: boolean;
}> = ({ value, selected, onChange, children, isDescarte }) => (
  <label
    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
      ${selected
        ? isDescarte
          ? 'border-red-400 bg-red-50'
          : 'border-firma-green bg-firma-green/5'
        : 'border-gray-200 hover:border-firma-green/40 hover:bg-gray-50'
      }`}
  >
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
  title: string;
  value: string;
  detalle: string;
  onChangeBuro: (v: string) => void;
  onChangeDetalle: (v: string) => void;
}> = ({ title, value, detalle, onChangeBuro, onChangeDetalle }) => {
  const opciones = ['Excelente', 'Bueno', 'Regular', 'Malo'];
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-charcoal">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opciones.map(op => (
          <RadioOption key={op} value={op} selected={value === op} onChange={onChangeBuro} isDescarte={op === 'Malo'}>
            {op === 'Malo' ? `${op} — (no califica)` : op}
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

// ─── Main Component ───────────────────────────────────────────────────────────
export const ProfilingForm: React.FC = () => {
  const [data, setData] = useState<FormData>(INITIAL);
  const [step, setStep] = useState(0);
  const [descartado, setDescartado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof FormData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  // ─── Steps config ────────────────────────────────────────────────────────
  const STEPS = ['Datos', 'Ingresos', 'Antigüedad', 'Constitución', 'Buró', 'Monto', 'Destino', 'Garantía'];

  // ─── Validate current step ────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (!data.nombreCompleto.trim()) e.nombreCompleto = 'Requerido';
      if (!data.numero.trim()) e.numero = 'Requerido';
      if (!data.correo.trim() || !/\S+@\S+\.\S+/.test(data.correo)) e.correo = 'Correo inválido';
      if (!data.rfc.trim()) e.rfc = 'Requerido';
      if (!data.cargo.trim()) e.cargo = 'Requerido';
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
      if (!data.monto.trim()) e.monto = 'Requerido';
      else if (!/^\d[\d,]*$/.test(data.monto.replace(/\s/g, ''))) e.monto = 'Solo números';
    }
    if (step === 6 && !data.destino.trim()) e.destino = 'Por favor describe el destino del crédito';
    if (step === 7 && !data.garantia) e.garantia = 'Selecciona una opción';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Step navigation ──────────────────────────────────────────────────────
  const next = () => {
    if (!validate()) return;

    // Check descarte after each relevant step
    const updated = { ...data };
    if (isDescarte(updated)) {
      setDescartado(true);
      return;
    }

    setStep(s => s + 1);
  };

  const prev = () => {
    setErrors({});
    setStep(s => Math.max(0, s - 1));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const submit = () => {
    if (!validate()) return;
    const msg = buildWhatsAppMessage(data);
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/525525069817?text=${encoded}`, '_blank');
    setEnviado(true);
  };

  // ─── Input helper ─────────────────────────────────────────────────────────
  const inputClass = (field: string) =>
    `w-full border ${errors[field] ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition`;

  // ─── Buro step content ────────────────────────────────────────────────────
  const renderBuroStep = () => {
    if (data.constitucion === 'Persona Física con Actividad Empresarial') {
      return (
        <div className="space-y-6">
          <BuroSection
            title="¿Cómo se encuentra en buró de crédito?"
            value={data.buroPF}
            detalle={data.buroPFDetalle}
            onChangeBuro={v => { set('buroPF', v); setErrors({}); }}
            onChangeDetalle={v => set('buroPFDetalle', v)}
          />
          {errors.buroPF && <p className="text-red-500 text-xs">{errors.buroPF}</p>}
          {errors.buroPFDetalle && <p className="text-red-500 text-xs">{errors.buroPFDetalle}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <BuroSection
          title="¿Cómo se encuentra en buró de crédito la empresa?"
          value={data.buroPMEmpresa}
          detalle={data.buroPMEmpresaDetalle}
          onChangeBuro={v => { set('buroPMEmpresa', v); setErrors({}); }}
          onChangeDetalle={v => set('buroPMEmpresaDetalle', v)}
        />
        {errors.buroPMEmpresa && <p className="text-red-500 text-xs">{errors.buroPMEmpresa}</p>}
        {errors.buroPMEmpresaDetalle && <p className="text-red-500 text-xs">{errors.buroPMEmpresaDetalle}</p>}

        <div className="border-t border-gray-100 pt-6">
          <BuroSection
            title="¿Cómo se encuentra en buró de crédito el principal accionista?"
            value={data.buroPMAccionista}
            detalle={data.buroPMAccionistaDetalle}
            onChangeBuro={v => { set('buroPMAccionista', v); setErrors({}); }}
            onChangeDetalle={v => set('buroPMAccionistaDetalle', v)}
          />
          {errors.buroPMAccionista && <p className="text-red-500 text-xs">{errors.buroPMAccionista}</p>}
          {errors.buroPMAccionistaDetalle && <p className="text-red-500 text-xs">{errors.buroPMAccionistaDetalle}</p>}
        </div>
      </div>
    );
  };

  // ─── Step content ─────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // Step 0 – Datos del solicitante
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="field-label">Nombre completo</label>
              <input id="f-nombre" className={inputClass('nombreCompleto')} placeholder="Juan García Pérez" value={data.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)} />
              {errors.nombreCompleto && <p className="field-error">{errors.nombreCompleto}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Número de teléfono</label>
                <input id="f-numero" type="tel" className={inputClass('numero')} placeholder="55 1234 5678" value={data.numero} onChange={e => set('numero', e.target.value)} />
                {errors.numero && <p className="field-error">{errors.numero}</p>}
              </div>
              <div>
                <label className="field-label">Correo electrónico</label>
                <input id="f-correo" type="email" className={inputClass('correo')} placeholder="correo@empresa.com" value={data.correo} onChange={e => set('correo', e.target.value)} />
                {errors.correo && <p className="field-error">{errors.correo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">RFC de la empresa</label>
                <input id="f-rfc" className={inputClass('rfc')} placeholder="XAXX010101000" value={data.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} maxLength={13} />
                {errors.rfc && <p className="field-error">{errors.rfc}</p>}
              </div>
              <div>
                <label className="field-label">Cargo</label>
                <input id="f-cargo" className={inputClass('cargo')} placeholder="Director, Gerente, etc." value={data.cargo} onChange={e => set('cargo', e.target.value)} />
                {errors.cargo && <p className="field-error">{errors.cargo}</p>}
              </div>
            </div>
          </div>
        );

      // Step 1 – Ingresos
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Selecciona el rango de ingresos mensuales de tu empresa.</p>
            {[
              { value: 'Menor a 150 mil pesos', isDescarte: true },
              { value: 'Entre 150 mil y 300 mil pesos', isDescarte: false },
              { value: 'Entre 300 mil y 500 mil pesos', isDescarte: false },
              { value: 'Más de 500 mil pesos', isDescarte: false },
            ].map(op => (
              <RadioOption key={op.value} value={op.value} selected={data.ingresos === op.value} onChange={v => { set('ingresos', v); setErrors({}); }} isDescarte={op.isDescarte}>
                {op.isDescarte ? `${op.value} — (no califica)` : op.value}
              </RadioOption>
            ))}
            {errors.ingresos && <p className="field-error">{errors.ingresos}</p>}
          </div>
        );

      // Step 2 – Antigüedad
      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">¿Cuánto tiempo lleva operando tu empresa?</p>
            {[
              { value: 'Menor a 6 meses', isDescarte: true },
              { value: 'Entre 6 meses y 1 año', isDescarte: false },
              { value: 'Entre 1 año y 2 años', isDescarte: false },
              { value: 'Más de 2 años', isDescarte: false },
            ].map(op => (
              <RadioOption key={op.value} value={op.value} selected={data.antiguedad === op.value} onChange={v => { set('antiguedad', v); setErrors({}); }} isDescarte={op.isDescarte}>
                {op.isDescarte ? `${op.value} — (no califica)` : op.value}
              </RadioOption>
            ))}
            {errors.antiguedad && <p className="field-error">{errors.antiguedad}</p>}
          </div>
        );

      // Step 3 – Constitución
      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">¿Cómo está constituida tu empresa?</p>
            {[
              'Persona Física con Actividad Empresarial',
              'Persona Moral',
            ].map(op => (
              <RadioOption key={op} value={op} selected={data.constitucion === op} onChange={v => { set('constitucion', v); set('buroPF', ''); set('buroPFDetalle', ''); set('buroPMEmpresa', ''); set('buroPMEmpresaDetalle', ''); set('buroPMAccionista', ''); set('buroPMAccionistaDetalle', ''); setErrors({}); }}>
                {op}
              </RadioOption>
            ))}
            {errors.constitucion && <p className="field-error">{errors.constitucion}</p>}
          </div>
        );

      // Step 4 – Buró
      case 4:
        return renderBuroStep();

      // Step 5 – Monto
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa el monto de crédito que deseas solicitar (solo números).</p>
            <div>
              <label className="field-label">Monto solicitado (MXN)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                <input
                  id="f-monto"
                  type="text"
                  inputMode="numeric"
                  className={`${inputClass('monto')} pl-8`}
                  placeholder="500,000"
                  value={data.monto}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    const formatted = raw ? Number(raw).toLocaleString('es-MX') : '';
                    set('monto', formatted);
                    setErrors({});
                  }}
                />
              </div>
              {errors.monto && <p className="field-error">{errors.monto}</p>}
            </div>
          </div>
        );

      // Step 6 – Destino
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">¿Para qué se va a utilizar el crédito? Brinda una breve explicación.</p>
            <div>
              <label className="field-label">Destino del crédito</label>
              <textarea
                id="f-destino"
                value={data.destino}
                onChange={e => { set('destino', e.target.value); setErrors({}); }}
                rows={5}
                placeholder="Ej: Capital de trabajo para inventario, expansión de sucursales, compra de maquinaria…"
                className={`${inputClass('destino')} resize-none`}
              />
              {errors.destino && <p className="field-error">{errors.destino}</p>}
            </div>
          </div>
        );

      // Step 7 – Garantía
      case 7:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">En caso de requerirse, ¿cuenta con garantía?</p>
            <div className="space-y-3">
              <RadioOption
                value="Sí"
                selected={data.garantia === 'Sí'}
                onChange={v => { set('garantia', v); setErrors({}); }}
              >
                <span>
                  <span className="font-semibold">Sí</span>
                  <span className="block text-xs text-gray-500 mt-1">⚠️ Solo se aceptan terrenos y propiedades libres de gravamen como garantía.</span>
                </span>
              </RadioOption>
              <RadioOption
                value="No"
                selected={data.garantia === 'No'}
                onChange={v => { set('garantia', v); setErrors({}); }}
              >
                No
              </RadioOption>
            </div>
            {errors.garantia && <p className="field-error">{errors.garantia}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Step titles ──────────────────────────────────────────────────────────
  const stepTitles = [
    'Datos del Solicitante',
    'Ingresos Mensuales',
    'Antigüedad de la Empresa',
    'Constitución',
    data.constitucion === 'Persona Moral' ? 'Buró de Crédito (Empresa y Accionista)' : 'Buró de Crédito',
    'Monto de Crédito',
    'Destino del Crédito',
    'Garantía',
  ];

  // ─── Descarte screen ──────────────────────────────────────────────────────
  if (descartado) {
    return (
      <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 relative z-10 text-center">
          <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-charcoal mb-3">Tu perfil no califica en este momento</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Basándonos en la información proporcionada, actualmente tu empresa no cumple con los requisitos mínimos para nuestros productos de financiamiento. Te recomendamos volver a evaluar tu solicitud en el futuro.
            </p>
            <button
              onClick={() => { setData(INITIAL); setStep(0); setDescartado(false); setErrors({}); }}
              className="px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-firma-green/90 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── Enviado screen ───────────────────────────────────────────────────────
  if (enviado) {
    return (
      <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 relative z-10 text-center">
          <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-12">
            <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-firma-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-charcoal mb-3">¡Solicitud enviada exitosamente!</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Tu información fue enviada por WhatsApp. Un asesor de Firma 7 se pondrá en contacto contigo a la brevedad.
            </p>
            <button
              onClick={() => { setData(INITIAL); setStep(0); setEnviado(false); setErrors({}); }}
              className="px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-firma-green/90 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Nueva solicitud
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  const isLastStep = step === STEPS.length - 1;
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
            Paso Final
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-charcoal mb-6">
            <span className="italic text-firma-green">Pre-califícate</span> hoy mismo
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light">
            Completa el formulario para recibir un análisis detallado por parte de nuestros socios directores.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 rounded-[2rem] overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-firma-green/20 via-firma-green to-firma-green/20" />

          {/* Progress bar */}
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

          {/* Step dots */}
          <div className="flex items-start justify-between px-8 py-3">
            {STEPS.map((label, i) => (
              <StepDot key={i} label={label} active={i === step} completed={i < step} />
            ))}
          </div>

          {/* Step content */}
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
              className="px-6 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-600 hover:border-firma-green hover:text-firma-green transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            {isLastStep ? (
              <button
                id="form-submit-btn"
                onClick={submit}
                className="flex items-center gap-2 px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-firma-green/90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.271-.099-.47-.148-.666.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.296-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.523 5.849L.054 23.486a.5.5 0 00.612.608l5.678-1.487A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.076-1.387l-.364-.215-3.769.988.997-3.707-.237-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Enviar por WhatsApp
              </button>
            ) : (
              <button
                id="form-next-btn"
                onClick={next}
                className="px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-firma-green/90 transition-all duration-200 shadow-md hover:shadow-lg"
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
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }
        .field-error {
          font-size: 0.7rem;
          color: #f87171;
          margin-top: 0.25rem;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </section>
  );
};