import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

// Aviso cuando no se pudo cargar el avance del cliente (sin conexión con el servidor).
export const ProgresoErrorCard: React.FC<{ onReintentar: () => void }> = ({ onReintentar }) => (
  <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center space-y-4">
    <AlertCircle size={28} className="text-red-500 mx-auto" />
    <div className="space-y-1">
      <p className="text-sm font-semibold text-gray-700">No pudimos conectar con el servidor</p>
      <p className="text-sm text-gray-500 leading-relaxed">
        Tus documentos anteriores no se perdieron: solo no logramos cargarlos. Revisa tu señal o Wi‑Fi (si usas VPN o "Relevo privado" de iCloud, desactívalo) e intenta de nuevo.
      </p>
    </div>
    <button
      type="button"
      onClick={onReintentar}
      className="inline-flex items-center justify-center gap-2 bg-firma-green text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
    >
      <RotateCcw size={14} /> Reintentar
    </button>
    <p className="text-xs text-gray-400">
      ¿Sigue sin funcionar? Escríbenos por{' '}
      <a
        href="https://wa.me/525525069817?text=Hola%2C%20no%20puedo%20subir%20mis%20documentos."
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-firma-green"
      >
        WhatsApp
      </a>{' '}
      y te ayudamos.
    </p>
  </div>
);
