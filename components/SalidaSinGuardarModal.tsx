import React, { useEffect } from 'react';
import { Bookmark, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  abierto: boolean;
  guardando: boolean;
  error: boolean;
  mensajeError: string;
  // Si no hay a dónde "salir" (p. ej. el mouse salió por arriba), no se ofrece el botón de salir.
  puedeSalir: boolean;
  onGuardar: () => void;
  onSeguir: () => void;
  onSalir: () => void;
}

// Burbuja "Archivos sin guardar": se abre desde abajo en el celular y al centro en la computadora.
export const SalidaSinGuardarModal: React.FC<Props> = ({ abierto, guardando, error, mensajeError, puedeSalir, onGuardar, onSeguir, onSalir }) => {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onSeguir(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, onSeguir]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onSeguir}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="salida-sin-guardar-titulo"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 id="salida-sin-guardar-titulo" className="font-serif text-lg text-charcoal">Archivos sin guardar</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Ya cargaste documentos, pero tu asesor todavía no recibe tu avance. Guárdalo antes de salir para que pueda continuar tu trámite.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{mensajeError}</p>
        )}

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onGuardar}
            disabled={guardando}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-firma-green px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
            {guardando ? 'Guardando…' : 'Guardar progreso'}
          </button>
          <button
            type="button"
            onClick={onSeguir}
            className="w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-firma-green hover:text-firma-green"
          >
            Seguir aquí
          </button>
          {puedeSalir && (
            <button
              type="button"
              onClick={onSalir}
              className="w-full py-2 text-xs text-gray-400 underline hover:text-gray-600"
            >
              Salir sin guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
