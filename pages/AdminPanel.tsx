import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle2, XCircle, Trash2, Users, MessageSquareQuote, Star } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';

const PASSCODE_STORAGE_KEY = 'firma7_admin_passcode';

interface Testimonio {
  id: string;
  nombre: string;
  empresa: string | null;
  comentario: string;
  aprobado: boolean;
  created_at: string;
}

interface Referido {
  id: string;
  referido_por_nombre: string;
  referido_por_empresa: string | null;
  referido_por_correo: string | null;
  comentario: string | null;
  referido_1_empresa: string;
  referido_1_contacto: string;
  referido_1_correo: string;
  referido_1_telefono: string;
  referido_2_empresa: string | null;
  referido_2_contacto: string | null;
  referido_2_correo: string | null;
  referido_2_telefono: string | null;
  referido_3_empresa: string | null;
  referido_3_contacto: string | null;
  referido_3_correo: string | null;
  referido_3_telefono: string | null;
  created_at: string;
}

type Tab = 'testimonios' | 'referidos' | 'rating';

export const AdminPanel: React.FC = () => {
  useSEO({
    title: 'Panel interno | Firma 7',
    description: 'Panel interno de Firma 7.',
    canonical: 'https://firma7.com/admin',
    noindex: true,
  });

  const [passcode, setPasscode] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [tab, setTab] = useState<Tab>('testimonios');
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [ratingValue, setRatingValue] = useState('');
  const [reviewsValue, setReviewsValue] = useState('');
  const [ratingStatus, setRatingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const saved = sessionStorage.getItem(PASSCODE_STORAGE_KEY);
    if (saved) setPasscode(saved);
  }, []);

  useEffect(() => {
    if (!passcode) return;
    cargarTestimonios();
    cargarReferidos();
    cargarRating();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passcode]);

  const cargarTestimonios = async () => {
    const { data } = await supabase.rpc('admin_list_testimonios', { p_passcode: passcode });
    setTestimonios(data ?? []);
  };

  const cargarReferidos = async () => {
    const { data } = await supabase.rpc('admin_list_referidos', { p_passcode: passcode });
    setReferidos(data ?? []);
  };

  const cargarRating = async () => {
    const { data } = await supabase.from('site_config').select('rating_facebook, rating_facebook_reviews').eq('id', 1).maybeSingle();
    if (data) {
      setRatingValue(data.rating_facebook != null ? String(data.rating_facebook) : '');
      setReviewsValue(data.rating_facebook_reviews != null ? String(data.rating_facebook_reviews) : '');
    }
  };

  const intentarEntrar = async () => {
    setAuthError('');
    setAuthLoading(true);
    const { error } = await supabase.rpc('admin_list_testimonios', { p_passcode: passcodeInput });
    setAuthLoading(false);
    if (error) {
      setAuthError('Passcode incorrecto.');
      return;
    }
    sessionStorage.setItem(PASSCODE_STORAGE_KEY, passcodeInput);
    setPasscode(passcodeInput);
  };

  const salir = () => {
    sessionStorage.removeItem(PASSCODE_STORAGE_KEY);
    setPasscode('');
    setPasscodeInput('');
  };

  const aprobar = async (id: string, aprobado: boolean) => {
    await supabase.rpc('admin_set_testimonio_aprobado', { p_passcode: passcode, p_id: id, p_aprobado: aprobado });
    cargarTestimonios();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este comentario permanentemente?')) return;
    await supabase.rpc('admin_delete_testimonio', { p_passcode: passcode, p_id: id });
    cargarTestimonios();
  };

  const guardarRating = async () => {
    setRatingStatus('saving');
    const rating = parseFloat(ratingValue);
    const reviews = parseInt(reviewsValue, 10);
    const { error } = await supabase.rpc('admin_set_rating_facebook', {
      p_passcode: passcode,
      p_rating: isNaN(rating) ? null : rating,
      p_reviews: isNaN(reviews) ? null : reviews,
    });
    setRatingStatus(error ? 'error' : 'saved');
  };

  if (!passcode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-firma-green" />
          </div>
          <h1 className="font-serif text-xl font-bold text-charcoal mb-1">Panel interno</h1>
          <p className="text-sm text-gray-500 mb-5">Acceso restringido al equipo de Firma 7.</p>
          <input
            type="password"
            placeholder="Passcode"
            value={passcodeInput}
            onChange={e => setPasscodeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && intentarEntrar()}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-firma-green/30 mb-3"
          />
          <button
            type="button"
            onClick={intentarEntrar}
            disabled={authLoading || !passcodeInput}
            className="w-full bg-firma-green text-white font-bold py-2.5 rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors"
          >
            {authLoading ? 'Verificando…' : 'Entrar'}
          </button>
          {authError && <p className="text-xs text-red-500 mt-3">{authError}</p>}
        </div>
      </div>
    );
  }

  const pendientes = testimonios.filter(t => !t.aprobado).length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="font-serif text-lg font-bold text-firma-green">Panel interno · Firma 7</span>
        <button type="button" onClick={salir} className="text-xs text-gray-400 hover:text-charcoal">
          Salir
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab('testimonios')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === 'testimonios' ? 'bg-firma-green text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            <MessageSquareQuote size={14} /> Testimonios {pendientes > 0 && `(${pendientes} pendientes)`}
          </button>
          <button
            type="button"
            onClick={() => setTab('referidos')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === 'referidos' ? 'bg-firma-green text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            <Users size={14} /> Referidos
          </button>
          <button
            type="button"
            onClick={() => setTab('rating')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === 'rating' ? 'bg-firma-green text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            <Star size={14} /> Rating Facebook
          </button>
        </div>

        {tab === 'testimonios' && (
          <div className="space-y-3">
            {testimonios.length === 0 && <p className="text-sm text-gray-400">Sin testimonios todavía.</p>}
            {testimonios.map(t => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-charcoal">
                      {t.nombre} {t.empresa && <span className="text-gray-400 font-normal">· {t.empresa}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(t.created_at).toLocaleString('es-MX')}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ${t.aprobado ? 'bg-firma-green/10 text-firma-green' : 'bg-amber-50 text-amber-600'}`}>
                    {t.aprobado ? 'Publicado' : 'Pendiente'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3 italic">"{t.comentario}"</p>
                <div className="flex gap-2 mt-4">
                  {!t.aprobado ? (
                    <button
                      type="button"
                      onClick={() => aprobar(t.id, true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-firma-green px-3 py-1.5 rounded-full hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle2 size={13} /> Aprobar y publicar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => aprobar(t.id, false)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <XCircle size={13} /> Quitar de la página
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => eliminar(t.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'referidos' && (
          <div className="space-y-3">
            {referidos.length === 0 && <p className="text-sm text-gray-400">Sin referidos todavía.</p>}
            {referidos.map(r => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-sm">
                <p className="text-xs text-gray-400 mb-2">{new Date(r.created_at).toLocaleString('es-MX')}</p>
                <p className="font-bold text-charcoal">
                  {r.referido_por_nombre} {r.referido_por_empresa && <span className="text-gray-400 font-normal">· {r.referido_por_empresa}</span>}
                </p>
                <p className="text-gray-400 text-xs">{r.referido_por_correo}</p>
                {r.comentario && <p className="text-gray-600 italic mt-2">"{r.comentario}"</p>}
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  {[
                    { empresa: r.referido_1_empresa, contacto: r.referido_1_contacto, correo: r.referido_1_correo, telefono: r.referido_1_telefono },
                    { empresa: r.referido_2_empresa, contacto: r.referido_2_contacto, correo: r.referido_2_correo, telefono: r.referido_2_telefono },
                    { empresa: r.referido_3_empresa, contacto: r.referido_3_contacto, correo: r.referido_3_correo, telefono: r.referido_3_telefono },
                  ].filter(x => x.empresa).map((x, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold text-charcoal">{x.empresa}</p>
                      <p className="text-gray-500">{x.contacto}</p>
                      <p className="text-gray-400 text-xs">{x.correo}</p>
                      <p className="text-gray-400 text-xs">{x.telefono}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'rating' && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm max-w-sm">
            <p className="text-sm text-gray-500 mb-4">
              Este número se muestra como insignia de confianza cerca del encabezado de la página principal.
              Actualízalo manualmente cuando revises las reseñas de Facebook. Déjalo vacío para ocultar la insignia.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating (0-5)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={ratingValue}
                  onChange={e => setRatingValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-firma-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide"># de reseñas</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={reviewsValue}
                  onChange={e => setReviewsValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-firma-green/30"
                />
              </div>
              <button
                type="button"
                onClick={guardarRating}
                disabled={ratingStatus === 'saving'}
                className="w-full bg-firma-green text-white font-bold py-2.5 rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors"
              >
                {ratingStatus === 'saving' ? 'Guardando…' : 'Guardar'}
              </button>
              {ratingStatus === 'saved' && <p className="text-xs text-firma-green text-center">Guardado ✓</p>}
              {ratingStatus === 'error' && <p className="text-xs text-red-500 text-center">Error al guardar</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
