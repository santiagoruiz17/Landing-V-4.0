import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';

export const Espera: React.FC = () => {
  const navigate = useNavigate();

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
            onMouseOver={e => (e.currentTarget.style.color = '#006d4e')}
            onMouseOut={e => (e.currentTarget.style.color = '#4b5563')}
          >
            <ArrowLeft size={18} /> Regresar al inicio
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem' }}>

        {/* Status Banner */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1.5rem', padding: '3rem 2rem', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Clock size={40} strokeWidth={2} />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.25rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '1rem' }}>
            Perfil en Espera
          </h2>
          <p style={{ color: '#4b5563', fontSize: '1.125rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Tu perfil no cumple hoy los criterios mínimos que exigen las instituciones con las que trabajamos — pero eso puede cambiar. Muchas de nuestras empresas más exitosas empezaron exactamente en este punto.
          </p>
        </div>

        {/* Info Card */}
        <div style={{ background: 'linear-gradient(135deg, white 0%, #f9fafb 100%)', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '2.5rem', marginBottom: '3rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, width: '48px', height: '48px', background: '#006d4e', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.75rem', color: '#1A1A1A' }}>
              ¡Esto no es un no definitivo!
            </h3>
            <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              El mercado y los criterios de evaluación cambian constantemente. Tu perfil es valioso para nosotros, pero requiere un poco más de tiempo de maduración financiera o estabilidad operativa según nuestros modelos actuales.
            </p>
            <div style={{ background: '#f3f4f6', borderLeft: '4px solid #006d4e', padding: '1rem 1.5rem', borderRadius: '0 0.5rem 0.5rem 0', fontWeight: 500, color: '#374151' }}>
              Podemos intentar realizar una nueva evaluación de tu perfil en 3 meses.
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Playfair Display, serif' }}>
            ¿Qué puedes hacer mientras tanto?
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { num: '01', text: 'Mantén un historial crediticio impecable en tus cuentas actuales.' },
              { num: '02', text: 'Asegura un flujo de caja constante y documentado.' },
              { num: '03', text: 'Regresa con nosotros en 90 días para una nueva revisión.' },
            ].map(s => (
              <div key={s.num} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb', textAlign: 'left', transition: 'all 0.3s' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#006d4e', display: 'block', marginBottom: '0.5rem' }}>{s.num}</span>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#374151' }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#0F172A', borderRadius: '1.5rem', padding: '3rem', textAlign: 'center', color: 'white' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.875rem', marginBottom: '1rem', color: 'white' }}>
            Hablemos. Te orientamos sin costo.
          </h3>
          <p style={{ color: '#d1d5db', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Un asesor puede darte un diagnóstico personalizado de qué necesitas mejorar para calificar en tu próxima solicitud. Sin compromiso.
          </p>
          <a
            href="https://wa.me/525525069817?text=Hola%2C%20mi%20perfil%20qued%C3%B3%20en%20espera%20y%20me%20gustar%C3%ADa%20saber%20c%C3%B3mo%20mejorar%20mi%20solicitud."
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '1rem 2rem', background: '#25D366', color: 'white', fontWeight: 700, fontSize: '1rem', borderRadius: '0.75rem', textDecoration: 'none', transition: 'all 0.3s' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.271-.099-.47-.148-.666.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.296-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.523 5.849L.054 23.486a.5.5 0 00.612.608l5.678-1.487A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.076-1.387l-.364-.215-3.769.988.997-3.707-.237-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Hablar con un asesor por WhatsApp
          </a>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '1rem' }}>
            También puedes seguirnos:{' '}
            <a href="https://www.instagram.com/soc_firma_7/" target="_blank" rel="noopener noreferrer" style={{ color: '#006d4e', fontWeight: 600 }}>Instagram ↗</a>
            {' · '}
            <a href="https://www.facebook.com/Firma7.Soc" target="_blank" rel="noopener noreferrer" style={{ color: '#006d4e', fontWeight: 600 }}>Facebook ↗</a>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', marginTop: '2.5rem' }}>
          © {new Date().getFullYear()} Firma 7. Todos los derechos reservados.
        </p>
      </main>
    </div>
  );
};
