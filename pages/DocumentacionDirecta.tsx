import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, User, FileText, Loader2, AlertCircle, Link2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';
import { EMAIL_REGEX, soloDigitos10 } from '../lib/validation';
import { DocumentUpload } from '../components/DocumentUpload';
// BORRADOR (portal de clientes): imports de ClienteCrearCuentaCTA y CuentaExistenteBanner
// desactivados junto con sus usos de abajo.

type Constitucion = 'Persona Física con Actividad Empresarial' | 'Persona Moral';
type Paso = 'tipo' | 'form' | 'codigo' | 'documentos';

function constitucionDesdeTipoUrl(tipo: string | null): Constitucion | null {
  if (tipo === 'moral') return 'Persona Moral';
  if (tipo === 'fisica') return 'Persona Física con Actividad Empresarial';
  return null;
}

const Header: React.FC = () => (
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
);

export const DocumentacionDirecta: React.FC = () => {
  useSEO({
    title: 'Sube tu documentación | Firma 7',
    description: 'Identifícate y sube tu documentación para continuar con tu solicitud de crédito con Firma 7.',
    canonical: 'https://firma7.com/documentacion',
    noindex: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const leadIdFromUrl = searchParams.get('leadId') || '';
  const constitucionFromUrl = constitucionDesdeTipoUrl(searchParams.get('tipo'));
  const tieneResumeUrl = Boolean(leadIdFromUrl && constitucionFromUrl);

  const [paso, setPaso] = useState<Paso>(tieneResumeUrl ? 'documentos' : 'tipo');
  const [constitucion, setConstitucion] = useState<Constitucion | null>(tieneResumeUrl ? constitucionFromUrl : null);
  const [leadId, setLeadId] = useState(tieneResumeUrl ? leadIdFromUrl : '');

  // Persona Física con Actividad Empresarial
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  // Persona Moral
  const [empresa, setEmpresa] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [correoContacto, setCorreoContacto] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [enviado, setEnviado] = useState(false);

  // Código por correo (cuando el correo ya tiene un trámite con avance)
  const [codigo, setCodigo] = useState('');
  const [codigoStatus, setCodigoStatus] = useState<'idle' | 'verifying' | 'error'>('idle');
  const [codigoMsg, setCodigoMsg] = useState('');
  const [reenvioEn, setReenvioEn] = useState(0);

  const esMoral = constitucion === 'Persona Moral';
  const correoIngresado = (esMoral ? correoContacto : correo).trim();

  useEffect(() => {
    if (reenvioEn <= 0) return;
    const t = setTimeout(() => setReenvioEn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [reenvioEn]);

  const elegirTipo = (c: Constitucion) => {
    setConstitucion(c);
    setPaso('form');
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (esMoral) {
      if (!empresa.trim()) e.empresa = 'Requerido';
      if (!contacto.trim()) e.contacto = 'Requerido';
      if (!correoContacto.trim() || !EMAIL_REGEX.test(correoContacto.trim())) e.correoContacto = 'Correo inválido';
      if (telefonoContacto.length !== 10) e.telefonoContacto = 'Debe tener 10 dígitos';
    } else {
      if (!nombre.trim()) e.nombre = 'Requerido';
      if (!correo.trim() || !EMAIL_REGEX.test(correo.trim())) e.correo = 'Correo inválido';
      if (telefono.length !== 10) e.telefono = 'Debe tener 10 dígitos';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || !constitucion) return;
    setStatus('sending');
    setErrorMsg('');
    const { data, error } = await supabase.rpc('registrar_lead_documentacion_directa', {
      p: esMoral
        ? {
            nombreCompleto: contacto,
            numero: telefonoContacto,
            correo: correoContacto,
            empresa,
            constitucion,
          }
        : {
            nombreCompleto: nombre,
            numero: telefono,
            correo,
            constitucion,
          },
    });
    const res = data as { status?: string; leadId?: string; sent?: boolean; reason?: string } | null;
    if (error || !res?.status) {
      setStatus('error');
      return;
    }

    if (res.status === 'codigo') {
      // 'espera' = ya se le mandó un código hace menos de un minuto: seguimos a la pantalla del código.
      if (!res.sent && res.reason !== 'espera') {
        setStatus('error');
        setErrorMsg(
          res.reason === 'limite'
            ? 'Hiciste demasiados intentos. Espera un rato e inténtalo de nuevo, o escríbenos por WhatsApp.'
            : ''
        );
        return;
      }
      setStatus('idle');
      setCodigo('');
      setCodigoStatus('idle');
      setCodigoMsg('');
      setReenvioEn(60);
      setPaso('codigo');
      return;
    }

    if (!res.leadId) {
      setStatus('error');
      return;
    }
    setStatus('idle');
    setLeadId(res.leadId);
    setSearchParams({ leadId: res.leadId, tipo: esMoral ? 'moral' : 'fisica' });
    setPaso('documentos');
  };

  const verificarCodigo = async () => {
    if (codigo.length !== 6) {
      setCodigoStatus('error');
      setCodigoMsg('El código tiene 6 dígitos.');
      return;
    }
    setCodigoStatus('verifying');
    const { data, error } = await supabase.rpc('verificar_codigo_lead', { p_correo: correoIngresado, p_codigo: codigo });
    const res = data as { ok?: boolean; leadId?: string; tipo?: string; reason?: string; intentosRestantes?: number } | null;
    if (error || !res) {
      setCodigoStatus('error');
      setCodigoMsg('No se pudo verificar. Intenta de nuevo.');
      return;
    }
    if (res.ok && res.leadId) {
      const c = constitucionDesdeTipoUrl(res.tipo ?? null);
      if (c) setConstitucion(c);
      setLeadId(res.leadId);
      setSearchParams({ leadId: res.leadId, tipo: res.tipo ?? 'fisica' });
      setCodigoStatus('idle');
      setPaso('documentos');
      return;
    }
    setCodigoStatus('error');
    setCodigoMsg(
      res.reason === 'expirado' ? 'El código venció. Pide uno nuevo.'
      : res.reason === 'bloqueado' ? 'Demasiados intentos. Pide un código nuevo.'
      : 'Código incorrecto. Revísalo e inténtalo de nuevo.'
    );
  };

  const reenviarCodigo = async () => {
    setCodigoMsg('');
    setCodigoStatus('idle');
    const { data } = await supabase.rpc('solicitar_codigo_lead', { p_correo: correoIngresado });
    const res = data as { sent?: boolean; reason?: string } | null;
    if (res?.sent) {
      setReenvioEn(60);
      setCodigoMsg('Te enviamos un código nuevo.');
    } else if (res?.reason === 'espera') {
      setReenvioEn(60);
    } else {
      setCodigoStatus('error');
      setCodigoMsg('No pudimos enviar otro código ahora. Intenta más tarde o escríbenos por WhatsApp.');
    }
  };

  if (paso === 'documentos' && leadId && constitucion) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* BORRADOR (portal de clientes): se reactiva junto con la creación de cuentas.
          <CuentaExistenteBanner />
          */}
          {!enviado && (
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-firma-green/5 border border-firma-green/20 rounded-xl px-4 py-3 mb-6">
              <Link2 size={15} className="text-firma-green flex-shrink-0 mt-0.5" />
              <span>
                Guarda o comparte este enlace — puedes cerrarlo y volver más tarde para continuar subiendo tu documentación sin perder tu avance.
              </span>
            </div>
          )}
          <DocumentUpload leadId={leadId} tipo={esMoral ? 'moral' : 'fisica'} onEnviadoChange={setEnviado} />
          {/* BORRADOR (portal de clientes): se reactiva cuando esté listo el proceso de crear cuentas.
          <div className="mt-6">
            <ClienteCrearCuentaCTA />
          </div>
          */}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={26} className="text-firma-green" />
          </div>
          <h1 className="font-serif text-3xl text-charcoal font-bold mb-3">
            Gracias por tu interés en Firma 7
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
            Para continuar con tu solicitud, identifícate y sube tu documentación —
            nuestro equipo ya está listo para revisar tu caso.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Lock size={12} /> Tus documentos viajan cifrados y solo los ve nuestro equipo
          </p>
        </div>

        {paso === 'tipo' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-3">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase text-center mb-2">
              ¿Cómo está constituido tu negocio?
            </p>
            <button
              type="button"
              onClick={() => elegirTipo('Persona Física con Actividad Empresarial')}
              className="w-full flex items-center gap-4 border-2 border-gray-200 rounded-xl px-5 py-4 text-left hover:border-firma-green/50 hover:bg-firma-green/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-firma-green/10 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-firma-green" />
              </div>
              <div>
                <p className="font-semibold text-charcoal">Persona Física con Actividad Empresarial</p>
                <p className="text-sm text-gray-500">Facturas y operas a tu nombre</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => elegirTipo('Persona Moral')}
              className="w-full flex items-center gap-4 border-2 border-gray-200 rounded-xl px-5 py-4 text-left hover:border-firma-green/50 hover:bg-firma-green/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-firma-green/10 flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-firma-green" />
              </div>
              <div>
                <p className="font-semibold text-charcoal">Persona Moral</p>
                <p className="text-sm text-gray-500">Tu negocio es una empresa constituida (S.A., S.A.P.I., etc.)</p>
              </div>
            </button>
          </div>
        )}

        {paso === 'form' && constitucion && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
            <p className="text-xs font-bold tracking-widest text-firma-green uppercase text-center mb-2">
              {constitucion}
            </p>

            {esMoral ? (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Nombre de la empresa"
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.empresa ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.empresa && <p className="text-xs text-red-500 mt-1">{errors.empresa}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nombre del contacto"
                    value={contacto}
                    onChange={e => setContacto(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.contacto ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.contacto && <p className="text-xs text-red-500 mt-1">{errors.contacto}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Teléfono del contacto (10 dígitos)"
                    value={telefonoContacto}
                    onChange={e => setTelefonoContacto(soloDigitos10(e.target.value))}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.telefonoContacto ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.telefonoContacto && <p className="text-xs text-red-500 mt-1">{errors.telefonoContacto}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Correo del contacto"
                    value={correoContacto}
                    onChange={e => setCorreoContacto(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.correoContacto ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.correoContacto && <p className="text-xs text-red-500 mt-1">{errors.correoContacto}</p>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.nombre ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Teléfono (10 dígitos)"
                    value={telefono}
                    onChange={e => setTelefono(soloDigitos10(e.target.value))}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.telefono ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Correo"
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 ${errors.correo ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.correo && <p className="text-xs text-red-500 mt-1">{errors.correo}</p>}
                </div>
              </>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="flex-shrink-0" />
                {errorMsg || 'No se pudo continuar. Por favor intenta de nuevo.'}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={submit}
                disabled={status === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors"
              >
                {status === 'sending' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Continuando…
                  </>
                ) : (
                  'Continuar a documentación'
                )}
              </button>
              <p className="text-center text-xs text-gray-400">
                Al continuar aceptas nuestro{' '}
                <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:text-firma-green">
                  Aviso de Privacidad
                </a>
              </p>
              <button
                type="button"
                onClick={() => { setPaso('tipo'); setConstitucion(null); setErrors({}); setStatus('idle'); setErrorMsg(''); }}
                className="w-full text-sm text-gray-400 hover:text-charcoal font-medium text-center"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {paso === 'codigo' && constitucion && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-firma-green" />
              </div>
              <h2 className="font-serif text-xl text-charcoal font-bold mb-1">Ya tienes un avance con este correo</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Te enviamos un código de 6 dígitos a <strong className="text-charcoal">{correoIngresado}</strong>.
                Escríbelo para retomar tu documentación donde la dejaste.
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={e => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)); if (codigoStatus === 'error') { setCodigoStatus('idle'); setCodigoMsg(''); } }}
              onKeyDown={e => { if (e.key === 'Enter') verificarCodigo(); }}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-semibold focus:outline-none focus:ring-2 focus:ring-firma-green/30"
            />

            {codigoMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${codigoStatus === 'error' ? 'text-red-600 bg-red-50 border-red-200' : 'text-firma-green bg-firma-green/5 border-firma-green/20'}`}>
                {codigoStatus === 'error' && <AlertCircle size={16} className="flex-shrink-0" />}
                {codigoMsg}
              </div>
            )}

            <button
              type="button"
              onClick={verificarCodigo}
              disabled={codigoStatus === 'verifying' || codigo.length !== 6}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors"
            >
              {codigoStatus === 'verifying' ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verificando…
                </>
              ) : (
                'Continuar'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={reenviarCodigo}
                disabled={reenvioEn > 0}
                className="text-firma-green font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {reenvioEn > 0 ? `Reenviar código (${reenvioEn}s)` : 'Reenviar código'}
              </button>
              <button
                type="button"
                onClick={() => { setPaso('form'); setCodigo(''); setCodigoMsg(''); setCodigoStatus('idle'); }}
                className="text-gray-400 hover:text-charcoal font-medium"
              >
                Cambiar correo
              </button>
            </div>
            <p className="text-center text-xs text-gray-400">
              Revisa también tu carpeta de spam. El código vence en 10 minutos.
            </p>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs pt-8">
          © {new Date().getFullYear()} Firma 7 · SOC Asesores
        </p>
      </main>
    </div>
  );
};
