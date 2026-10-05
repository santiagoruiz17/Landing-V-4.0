import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, Star, XCircle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';

interface TestimonioPreview {
  nombre: string;
  empresa: string | null;
  comentario: string;
  calificacion: number | null;
  aprobado: boolean;
  autoriza_publicar: boolean;
}

// Página interna: el enlace "Publicar testimonio" del correo abre esto. No publica al abrirse
// (los filtros de correo suelen abrir los enlaces solos): hay que confirmar con un clic.
export const AprobarTestimonio: React.FC = () => {
  useSEO({
    title: 'Publicar testimonio | Firma 7',
    description: 'Página interna para publicar un testimonio.',
    canonical: 'https://firma7.com/aprobar-testimonio',
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'no_encontrado'>('cargando');
  const [testimonio, setTestimonio] = useState<TestimonioPreview | null>(null);
  const [accion, setAccion] = useState<'idle' | 'enviando' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('no_encontrado');
      return;
    }
    supabase.rpc('testimonio_por_token', { p_token: token }).then(({ data, error }) => {
      if (error || !data) {
        setEstado('no_encontrado');
        return;
      }
      setTestimonio(data as TestimonioPreview);
      setEstado('listo');
    });
  }, [token]);

  const decidir = async (publicar: boolean) => {
    setAccion('enviando');
    setMensaje('');
    const { data, error } = await supabase.rpc('decidir_testimonio_por_token', { p_token: token, p_publicar: publicar });
    const res = data as { ok?: boolean; motivo?: string } | null;
    if (error || !res?.ok) {
      setAccion('error');
      setMensaje(res?.motivo === 'sin_autorizacion' ? 'Este cliente no autorizó publicar su comentario.' : 'No se pudo completar. Intenta de nuevo.');
      return;
    }
    setAccion('idle');
    setTestimonio(t => (t ? { ...t, aprobado: publicar } : t));
    setMensaje(publicar ? 'Listo: el testimonio ya aparece en la página principal.' : 'Listo: el testimonio no se mostrará en la página.');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <svg viewBox="0 0 100 100" fill="#006d4e" className="w-9 h-9">
            <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
            <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
          </svg>
          <span className="text-xl font-bold text-[#006d4e]">SOC</span>
          <div className="h-5 w-px bg-[#006d4e]" />
          <span className="text-xl font-medium text-[#006d4e]">FIRMA 7</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        {estado === 'cargando' && (
          <div className="text-center py-16">
            <Loader2 size={28} className="text-firma-green animate-spin mx-auto" />
          </div>
        )}

        {estado === 'no_encontrado' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
            <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold mb-2">Enlace no válido</h1>
            <p className="text-sm text-gray-500">Este enlace no existe o ya no está disponible. Puedes administrar los testimonios desde el panel interno.</p>
          </div>
        )}

        {estado === 'listo' && testimonio && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-firma-green uppercase mb-3">Testimonio de cliente</p>

            {testimonio.calificacion && (
              <div className="flex items-center gap-0.5 mb-3" aria-label={`${testimonio.calificacion} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={18} className={n <= (testimonio.calificacion ?? 0) ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                ))}
              </div>
            )}

            <p className="text-gray-700 italic leading-relaxed">“{testimonio.comentario}”</p>
            <p className="mt-3 text-sm font-bold text-charcoal">
              {testimonio.nombre}
              {testimonio.empresa && <span className="text-gray-400 font-normal"> · {testimonio.empresa}</span>}
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${testimonio.aprobado ? 'bg-firma-green/10 text-firma-green' : 'bg-amber-50 text-amber-600'}`}>
                {testimonio.aprobado ? 'Publicado' : 'No publicado'}
              </span>
              {!testimonio.autoriza_publicar && <span className="text-amber-600">El cliente no autorizó publicarlo.</span>}
            </div>

            {mensaje && (
              <div className={`mt-5 flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${accion === 'error' ? 'text-red-600 bg-red-50 border-red-200' : 'text-firma-green bg-firma-green/5 border-firma-green/20'}`}>
                {accion === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {mensaje}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!testimonio.aprobado ? (
                <button
                  type="button"
                  onClick={() => decidir(true)}
                  disabled={accion === 'enviando' || !testimonio.autoriza_publicar}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {accion === 'enviando' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Publicar en la página
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => decidir(false)}
                  disabled={accion === 'enviando'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={16} /> Quitar de la página
                </button>
              )}
              {!testimonio.aprobado && (
                <button
                  type="button"
                  onClick={() => decidir(false)}
                  disabled={accion === 'enviando'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-500 font-semibold rounded-full hover:border-gray-300 disabled:opacity-50 transition-colors"
                >
                  No publicar
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
