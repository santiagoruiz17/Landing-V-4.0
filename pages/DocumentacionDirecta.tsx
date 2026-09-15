import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, User, FileText, Loader2, AlertCircle, Link2 } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';
import { EMAIL_REGEX, soloDigitos10 } from '../lib/validation';
import { DocumentUpload } from '../components/DocumentUpload';

type Constitucion = 'Persona Física con Actividad Empresarial' | 'Persona Moral';
type Paso = 'tipo' | 'form' | 'documentos';

function constitucionDesdeTipoUrl(tipo: string | null): Constitucion | null {
  if (tipo === 'moral') return 'Persona Moral';
  if (tipo === 'fisica') return 'Persona Física con Actividad Empresarial';
  return null;
}

const Header: React.FC = () => (
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

  const esMoral = constitucion === 'Persona Moral';

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
    const { data, error } = await supabase.rpc('submit_lead_documentacion_directa', {
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
    if (error || !data) {
      setStatus('error');
      return;
    }
    setLeadId(data as string);
    setSearchParams({ leadId: data as string, tipo: esMoral ? 'moral' : 'fisica' });
    setPaso('documentos');
  };

  if (paso === 'documentos' && leadId && constitucion) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl md:text-3xl text-charcoal font-bold mb-2">
              Sube tu documentación
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Con esto nuestro equipo podrá continuar con el análisis de tu solicitud.
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-firma-green/5 border border-firma-green/20 rounded-xl px-4 py-3 mb-6">
            <Link2 size={15} className="text-firma-green flex-shrink-0 mt-0.5" />
            <span>
              Guarda o comparte este enlace — puedes cerrarlo y volver más tarde para continuar subiendo tu documentación sin perder tu avance.
            </span>
          </div>
          <DocumentUpload leadId={leadId} tipo={esMoral ? 'moral' : 'fisica'} />
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
                No se pudo continuar. Por favor intenta de nuevo.
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
              <button
                type="button"
                onClick={() => { setPaso('tipo'); setConstitucion(null); setErrors({}); }}
                className="w-full text-sm text-gray-400 hover:text-charcoal font-medium text-center"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs pt-8">
          © {new Date().getFullYear()} Firma 7 · SOC Asesores
        </p>
      </main>
    </div>
  );
};
