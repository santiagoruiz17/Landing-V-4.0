import React, { useState, useEffect, useRef } from 'react';

export const ExitIntentPopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (shown.current) return;
      if (e.clientY <= 5) {
        shown.current = true;
        setVisible(true);
      }
    };

    // Solo activar después de 15 segundos en la página
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 15000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleCTA = () => {
    setVisible(false);
    document.getElementById('profiling')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        animation: 'fadeInOverlay 0.25s ease-out',
      }}
      onClick={e => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        maxWidth: '480px',
        width: '90%',
        overflow: 'hidden',
        animation: 'slideUpModal 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
      }}>
        {/* Barra verde top */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, #006d4e, #00a86b, #006d4e)' }} />

        {/* Botón cerrar */}
        <button
          onClick={() => setVisible(false)}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6b7280', fontSize: '16px', lineHeight: 1,
          }}
        >
          ✕
        </button>

        <div style={{ padding: '32px 36px 36px', textAlign: 'center' }}>
          {/* Emoji */}
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>

          {/* Titular */}
          <h2 style={{
            fontSize: '22px', fontWeight: 700, color: '#111827',
            margin: '0 0 10px', lineHeight: 1.3, fontFamily: 'Georgia, serif',
          }}>
            Antes de irte — ¿sabías que el{' '}
            <span style={{ color: '#006d4e', fontStyle: 'italic' }}>96%</span>{' '}
            de nuestros clientes obtiene aprobación?
          </h2>

          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
            Tu diagnóstico es <strong style={{ color: '#111827' }}>completamente gratuito</strong> y toma menos de 2 minutos.
            Un asesor experto revisará tu perfil en las próximas 24–72 horas.
          </p>

          {/* Bullets */}
          <div style={{
            background: '#f0fdf4', borderRadius: '12px',
            padding: '14px 18px', marginBottom: '24px', textAlign: 'left',
          }}>
            {[
              'Sin costo de consultoría',
              'Comparamos +20 instituciones por ti',
              'Respuesta en 24–72 horas',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006d4e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleCTA}
            style={{
              width: '100%', padding: '14px 24px',
              background: '#006d4e', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#005a3f')}
            onMouseOut={e => (e.currentTarget.style.background = '#006d4e')}
          >
            Iniciar Diagnóstico Gratuito →
          </button>

          <button
            onClick={() => setVisible(false)}
            style={{
              marginTop: '12px', background: 'none', border: 'none',
              fontSize: '12px', color: '#9ca3af', cursor: 'pointer',
            }}
          >
            No me interesa por ahora
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
    </div>
  );
};
