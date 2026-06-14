import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, Users } from 'lucide-react';

export const Aprobado: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti explosion on load
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    script.onload = () => {
      const confetti = (window as any).confetti;
      const duration = 3000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        const count = 50 * ((end - Date.now()) / duration);
        confetti({ particleCount: count, origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() - 0.2 }, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 });
        confetti({ particleCount: count, origin: { x: Math.random() * 0.3 + 0.6, y: Math.random() - 0.2 }, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 });
      }, 250);
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const cards = [
    { icon: <DollarSign size={32} color="white" />, title: 'Hasta $5M MXN', desc: 'Accede a financiamiento flexible adaptado a las necesidades de tu empresa' },
    { icon: <Clock size={32} color="white" />, title: 'Respuesta en 24h', desc: 'Evaluación rápida y eficiente de tu solicitud de financiamiento' },
    { icon: <Users size={32} color="white" />, title: 'Asesoría Personalizada SOC', desc: 'Acompañamiento experto durante todo el proceso de financiamiento' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #f9fafb 100%)', color: '#1A1A1A', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg viewBox="0 0 100 100" fill="#006d4e" width="40" height="40">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#006d4e' }}>SOC</span>
                <div style={{ height: '20px', width: '2px', background: '#006d4e' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: 500, color: '#006d4e' }}>FIRMA 7</span>
              </div>
              <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: '#006d4e', textTransform: 'uppercase' }}>
                LÍDERES EN ASESORÍA FINANCIERA
              </span>
            </div>
          </a>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
          >
            <ArrowLeft size={18} /> Regresar al inicio
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Status Banner */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)', border: '2px solid #4ade80', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,109,78,0.1)', textAlign: 'center' }}>
          <svg style={{ color: '#16a34a', animation: 'pulse 2s infinite', margin: '0 auto 1rem', display: 'block' }} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>
            ¡Felicidades! Perfil Pre-Aprobado
          </h2>
          <p style={{ color: '#15803d', fontSize: '1.125rem' }}>Tu solicitud ha sido validada exitosamente</p>
        </div>

        {/* Welcome */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.875rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.75rem' }}>
            Bienvenido a tu Portal de Cliente
          </h3>
          <p style={{ color: '#4b5563', maxWidth: '42rem', margin: '0 auto' }}>
            Estás a un paso de obtener el financiamiento que tu empresa necesita. Completa el siguiente formulario para continuar con tu proceso.
          </p>
        </div>

        {/* Value Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {cards.map(card => (
            <div key={card.title} style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem 1.5rem', border: '1px solid #e5e7eb', textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #006d4e, #15803d)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                {card.icon}
              </div>
              <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem' }}>{card.title}</h4>
              <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* GHL Form */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.875rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem' }}>
              Formulario de Documentación
            </h3>
            <p style={{ color: '#4b5563' }}>Por favor, completa el siguiente formulario con la documentación requerida</p>
          </div>
          <iframe
            src="https://api.leadconnectorhq.com/widget/form/DxB8rjFqcSbClXQ5WCkI"
            style={{ width: '100%', height: '967px', border: 'none', borderRadius: '8px' }}
            id="inline-DxB8rjFqcSbClXQ5WCkI"
            data-layout="{'id':'INLINE'}"
            data-trigger-type="alwaysShow"
            data-activation-type="alwaysActivated"
            data-deactivation-type="neverDeactivate"
            data-form-name="LEAD CALIFICADO | SOLICITUD DE INFO"
            data-height="967"
            data-form-id="DxB8rjFqcSbClXQ5WCkI"
            title="LEAD CALIFICADO | SOLICITUD DE INFO"
          />
          <script src="https://link.msgsndr.com/js/form_embed.js" async />
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #006d4e, #15803d)', borderRadius: '1rem', boxShadow: '0 20px 25px rgba(0,109,78,0.2)', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            ¿Necesitas Ayuda Personalizada?
          </h3>
          <p style={{ color: '#d1fae5', marginBottom: '1.5rem', maxWidth: '42rem', margin: '0 auto 1.5rem' }}>
            Agenda una sesión de perfilamiento con nuestros expertos para resolver tus dudas y acelerar tu proceso de financiamiento
          </p>
          <a
            href="https://wa.me/525525069817?text=Hola%2C%20mi%20perfil%20fue%20pre-aprobado%20y%20quisiera%20agendar%20una%20sesi%C3%B3n%20de%20perfilamiento."
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', background: 'white', color: '#006d4e', fontWeight: 700, fontSize: '1.125rem', borderRadius: '0.75rem', textDecoration: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}
          >
            📅 Agendar Sesión de Perfilamiento
          </a>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', marginTop: '2.5rem' }}>
          ¿Tienes preguntas? <a href="mailto:contacto@firma7.com" style={{ color: '#006d4e', fontWeight: 600 }}>contacto@firma7.com</a>
        </p>
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
    </div>
  );
};
