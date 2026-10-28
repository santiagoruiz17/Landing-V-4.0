import React from 'react';
import { Bookmark, MessageCircle, Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const WHATSAPP_NUMERO = '525525069817';

interface DocumentosGuardadosProps {
  nombre?: string;
  total: number;
  completados: number;
  faltantes: string[];
  onSeguirSubiendo: () => void;
  reenvioStatus: 'idle' | 'sending' | 'sent' | 'error';
  onReenviarEnlace: () => void;
}

// Pantalla que ve el cliente cuando guarda su avance con documentos pendientes
// ("Guardar y cargar el resto después" o "Enviar" con faltantes): el equipo ya recibió el aviso
// de "documentación enviada, faltan documentos", y el cliente vuelve con su enlace a completar y pulsar Enviar.
export const DocumentosGuardados: React.FC<DocumentosGuardadosProps> = ({
  nombre, total, completados, faltantes, onSeguirSubiendo, reenvioStatus, onReenviarEnlace,
}) => {
  const waMensaje = encodeURIComponent(`Hola, soy ${nombre || 'cliente'}. Guardé mi avance de documentación en Firma 7 y tengo una duda.`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bookmark size={30} className="text-firma-green" />
      </div>
      <h3 className="font-serif text-2xl md:text-3xl text-charcoal font-bold mb-2">
        {nombre ? `¡Listo, ${nombre}!` : '¡Listo!'} Guardamos tu avance
      </h3>
      <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
        Ya recibimos <strong className="text-charcoal">{completados} de {total}</strong> documentos y avisamos a tu asesor.
        Cuando tengas lo que falta, vuelve a entrar con tu mismo enlace, carga los documentos y pulsa{' '}
        <strong className="text-charcoal">«Enviar a mi asesor»</strong>.
      </p>

      {faltantes.length > 0 && (
        <div className="mt-6 text-left max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Lo que falta por cargar:</p>
          <ul className="list-disc pl-5 text-xs text-amber-900 space-y-0.5">
            {faltantes.map(f => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSeguirSubiendo}
          className="inline-flex items-center gap-2 px-7 py-3 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Seguir cargando ahora
        </button>
        <a
          href={`https://wa.me/${WHATSAPP_NUMERO}?text=${waMensaje}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-7 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#1ebe5c] transition-colors no-underline text-sm"
        >
          <MessageCircle size={18} /> Escribirnos por WhatsApp
        </a>
      </div>

      <div className="mt-5 pt-5 border-t border-gray-100">
        {reenvioStatus === 'sent' ? (
          <p className="text-xs text-firma-green font-medium inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Te enviamos tu enlace por correo
          </p>
        ) : (
          <button
            type="button"
            onClick={onReenviarEnlace}
            disabled={reenvioStatus === 'sending'}
            className="text-xs text-gray-500 hover:text-firma-green font-medium inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {reenvioStatus === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
            Enviarme mi enlace por correo, para volver después
          </button>
        )}
        {reenvioStatus === 'error' && <p className="text-xs text-red-500 mt-1">No se pudo enviar. Intenta de nuevo en unos minutos.</p>}
        <p className="text-[11px] text-gray-400 mt-2">Tus archivos se conservan 7 días, así que te conviene completar tu documentación pronto.</p>
      </div>
    </div>
  );
};
