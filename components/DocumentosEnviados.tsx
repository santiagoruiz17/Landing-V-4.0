import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, MessageCircle, Star, Loader2, Facebook, Instagram, ArrowLeft, Search, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { estadoAtencion, HORARIO_ATENCION_TEXTO } from '../lib/horarioAtencion';

const FACEBOOK_REVIEW_URL = 'https://www.facebook.com/106460525837472/reviews/';
const WHATSAPP_NUMERO = '525525069817';

interface DocumentosEnviadosProps {
  leadId: string;
  nombre?: string;
  total: number;
  completados: number;
  faltantes: string[];
  onSeguirSubiendo: () => void;
}

const ETIQUETAS_ESTRELLAS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

export const DocumentosEnviados: React.FC<DocumentosEnviadosProps> = ({
  leadId, nombre, total, completados, faltantes, onSeguirSubiendo,
}) => {
  const atencion = useMemo(() => estadoAtencion(), []);

  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [valoracionStatus, setValoracionStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const waMensaje = encodeURIComponent(
    `Hola, soy ${nombre || 'cliente'}. Acabo de subir mi documentación en Firma 7.`
  );

  const enviarValoracion = async () => {
    if (estrellas === 0) return;
    setValoracionStatus('sending');
    const { error } = await supabase.rpc('submit_valoracion_lead', {
      p_lead_id: leadId,
      p_calificacion: estrellas,
      p_comentario: comentario,
    });
    setValoracionStatus(error ? 'error' : 'done');
  };

  const pasos = [
    { icon: <CheckCircle2 size={18} />, titulo: 'Recibida', detalle: 'Tu documentación ya está con nosotros', activo: true },
    { icon: <Search size={18} />, titulo: 'Revisión', detalle: 'Un asesor revisa tu caso', activo: false },
    { icon: <MessageCircle size={18} />, titulo: 'Contacto', detalle: 'Te escribimos por WhatsApp', activo: false },
  ];

  return (
    <div className="space-y-6">
      {/* ── Confirmación ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={34} className="text-firma-green" />
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-charcoal font-bold mb-2">
          {nombre ? `¡Listo, ${nombre}!` : '¡Listo!'} Recibimos tu documentación
        </h3>

        <div className="inline-flex items-start gap-2 text-left bg-firma-green/5 border border-firma-green/20 rounded-xl px-4 py-3 mt-3 max-w-md">
          <Clock size={17} className="text-firma-green flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 leading-relaxed">
            {atencion.abierto ? (
              <p><strong className="text-charcoal">Un asesor te escribirá en los próximos minutos.</strong></p>
            ) : (
              <p>
                Ahora estamos fuera de horario. <strong className="text-charcoal">Un asesor te contactará {atencion.proximoContacto}.</strong>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Atendemos {HORARIO_ATENCION_TEXTO}. En cualquier caso, te contactamos en menos de 24 horas hábiles.
            </p>
          </div>
        </div>

        {/* Línea de pasos */}
        <div className="grid grid-cols-3 gap-2 mt-7 max-w-md mx-auto">
          {pasos.map((p, i) => (
            <div key={p.titulo} className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${p.activo ? 'bg-firma-green text-white' : 'bg-gray-100 text-gray-400'}`}>
                {p.icon}
              </div>
              <p className={`text-xs font-bold uppercase tracking-wider ${p.activo ? 'text-firma-green' : 'text-gray-400'}`}>
                {i + 1}. {p.titulo}
              </p>
              <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{p.detalle}</p>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="mt-7 border-t border-gray-100 pt-5 text-sm">
          <p className="text-gray-500">
            Documentos recibidos: <strong className="text-charcoal">{completados} de {total}</strong>
          </p>
          {faltantes.length > 0 && (
            <div className="mt-3 text-left max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">Aún puedes completar (agiliza tu trámite):</p>
              <ul className="list-disc pl-5 text-xs text-amber-900 space-y-0.5">
                {faltantes.map(f => <li key={f}>{f}</li>)}
              </ul>
              <button
                type="button"
                onClick={onSeguirSubiendo}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-firma-green hover:underline"
              >
                <ArrowLeft size={13} /> Seguir subiendo documentos
              </button>
            </div>
          )}
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMERO}?text=${waMensaje}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 px-7 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#1ebe5c] transition-colors no-underline text-sm"
        >
          <MessageCircle size={18} /> Escribirnos por WhatsApp
        </a>
        <p className="text-[11px] text-gray-400 mt-2">Si prefieres adelantarte, escríbenos y avisamos a tu asesor.</p>
      </div>

      {/* ── Valoración ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        {valoracionStatus === 'done' ? (
          <div className="py-2">
            <div className="w-12 h-12 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-firma-green" />
            </div>
            <h4 className="font-serif text-xl text-charcoal font-bold mb-1">¡Gracias por tu opinión!</h4>
            {estrellas >= 4 ? (
              <>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                  Nos alegra mucho. ¿Nos ayudas compartiéndola en Facebook? Solo toma un minuto y ayuda a otras empresas a confiar en nosotros.
                </p>
                <a
                  href={FACEBOOK_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] text-white font-semibold rounded-full hover:bg-[#1468d6] transition-colors no-underline text-sm"
                >
                  <Facebook size={16} fill="currentColor" /> Dejar reseña en Facebook
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Lo tomaremos en cuenta para mejorar. Si hay algo que podamos resolver, tu asesor lo verá contigo.
              </p>
            )}
          </div>
        ) : (
          <>
            <h4 className="font-serif text-xl text-charcoal font-bold mb-1">Mientras te contactamos…</h4>
            <p className="text-sm text-gray-500 mb-4">¿Cómo fue tu experiencia subiendo tu documentación?</p>

            <div className="flex items-center justify-center gap-1.5 mb-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEstrellas(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={(hover || estrellas) >= n ? 'text-amber-400' : 'text-gray-200'}
                    fill="currentColor"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 h-4 mb-3">{ETIQUETAS_ESTRELLAS[hover || estrellas]}</p>

            {estrellas > 0 && (
              <div className="space-y-3 max-w-md mx-auto text-left">
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="¿Quieres contarnos algo más? (opcional)"
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/30 resize-none"
                />
                <p className="text-[11px] text-gray-400">
                  Con tu permiso, tu comentario podría aparecer como testimonio en nuestra página (solo tu nombre y empresa).
                </p>
                {valoracionStatus === 'error' && (
                  <p className="text-xs text-red-500">No se pudo enviar. Intenta de nuevo.</p>
                )}
                <button
                  type="button"
                  onClick={enviarValoracion}
                  disabled={valoracionStatus === 'sending'}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-colors text-sm"
                >
                  {valoracionStatus === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  Enviar mi opinión
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Redes ──────────────────────────────────────────── */}
      <p className="text-center text-xs text-gray-400">
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
  );
};
