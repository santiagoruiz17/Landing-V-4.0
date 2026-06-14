import React, { useState, useEffect } from 'react';

const NOTIFICATIONS = [
  { ciudad: 'Monterrey', monto: '$2.4M', tiempo: '8 min' },
  { ciudad: 'CDMX', monto: '$850K', tiempo: '14 min' },
  { ciudad: 'Guadalajara', monto: '$1.1M', tiempo: '23 min' },
  { ciudad: 'Puebla', monto: '$3.2M', tiempo: '31 min' },
  { ciudad: 'Querétaro', monto: '$680K', tiempo: '45 min' },
  { ciudad: 'León', monto: '$1.5M', tiempo: '52 min' },
  { ciudad: 'Tijuana', monto: '$990K', tiempo: '1 h' },
  { ciudad: 'Mérida', monto: '$2.0M', tiempo: '1 h 20 min' },
];

export const SocialProofToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Primera notificación después de 8 segundos
    const first = setTimeout(() => showNext(0), 8000);
    return () => clearTimeout(first);
  }, []);

  const showNext = (i: number) => {
    setIndex(i);
    setAnimating(true);
    setVisible(true);

    // Ocultar después de 5 seg
    setTimeout(() => {
      setAnimating(false);
      setTimeout(() => {
        setVisible(false);
        // Siguiente notificación en 18 seg
        const next = (i + 1) % NOTIFICATIONS.length;
        setTimeout(() => showNext(next), 18000);
      }, 400);
    }, 5000);
  };

  if (!visible) return null;

  const n = NOTIFICATIONS[index];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        transform: animating ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: animating ? 1 : 0,
      }}
    >
      <div style={{
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '300px',
        minWidth: '240px',
      }}>
        {/* Icono */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #006d4e, #00a86b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
            Empresa de {n.ciudad}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280', lineHeight: 1.4 }}>
            recibió pre-aprobación de <strong style={{ color: '#006d4e' }}>{n.monto} MXN</strong>
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '10.5px', color: '#9ca3af' }}>
            Hace {n.tiempo} · via Firma 7
          </p>
        </div>

        {/* Punto verde parpadeante */}
        <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: '#22c55e', animation: 'ping 1.2s ease-out infinite',
          }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
