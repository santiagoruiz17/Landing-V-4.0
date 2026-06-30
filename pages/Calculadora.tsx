import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const GREEN = '#006d4e';
const CHARCOAL = '#1A1A1A';
const MIDNIGHT = '#0F172A';

const fmt = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMP_RATE = 0.30 / 12;
const EMP_TERMS = [12, 18, 24, 36];
const AUTO_RATE = 0.14 / 12;
const AUTO_MAX_TERMS: Record<number, number> = {
  2017: 24, 2018: 36, 2019: 48, 2020: 60,
  2021: 60, 2022: 72, 2023: 84, 2024: 96,
  2025: 108, 2026: 120,
};

function calcPayment(principal: number, monthlyRate: number, n: number) {
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function autoTerms(year: number) {
  const max = AUTO_MAX_TERMS[year] || 36;
  const out: number[] = [];
  for (let t = 12; t <= max; t += 12) out.push(t);
  return out;
}

export const Calculadora: React.FC = () => {
  useSEO({
    title: 'Calculadora de Crédito Empresarial y Automotriz | Firma 7',
    description: 'Simula tu pago mensual de crédito empresarial o automotriz. Calcula tasas, plazos y montos antes de solicitar tu financiamiento con Firma 7.',
    canonical: 'https://firma7.com/calculadora',
  });

  const navigate = useNavigate();
  const [type, setType] = useState<'empresarial' | 'automotriz'>('empresarial');
  const [modalOpen, setModalOpen] = useState(false);

  // Empresarial state
  const [empAmount, setEmpAmount] = useState(1500000);
  const [empTerm, setEmpTerm] = useState(24);
  const [empResult, setEmpResult] = useState<number | null>(null);

  // Automotriz state
  const [autoYear, setAutoYear] = useState(2024);
  const [autoTerm, setAutoTerm] = useState(60);
  const [autoPriceStr, setAutoPriceStr] = useState('');
  const [autoPrice, setAutoPrice] = useState(0);
  const [autoEnganche, setAutoEnganche] = useState(20);
  const [autoResult, setAutoResult] = useState<{ payment: number; principal: number } | null>(null);

  const empRangeRef = useRef<HTMLInputElement>(null);
  const autoEngancheRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (empRangeRef.current) updateRangeBg(empRangeRef.current, 150000, 7500000, empAmount);
  }, [empAmount]);

  useEffect(() => {
    if (autoEngancheRef.current) updateRangeBg(autoEngancheRef.current, 10, 90, autoEnganche);
  }, [autoEnganche]);

  // Clamp autoTerm when year changes
  useEffect(() => {
    const terms = autoTerms(autoYear);
    if (!terms.includes(autoTerm)) setAutoTerm(terms[Math.floor(terms.length / 2)] || terms[0]);
  }, [autoYear]);

  function updateRangeBg(input: HTMLInputElement, min: number, max: number, val: number) {
    const pct = ((val - min) / (max - min)) * 100;
    input.style.backgroundSize = pct + '% 100%';
  }

  function handleEmpCalc() {
    const payment = calcPayment(empAmount, EMP_RATE, empTerm);
    setEmpResult(payment);
  }

  function handleAutoCalc() {
    if (!autoPrice) { alert('Por favor ingresa el precio del vehículo.'); return; }
    const principal = autoPrice * (1 - autoEnganche / 100);
    if (principal <= 0) { alert('El enganche no puede ser igual o mayor al precio.'); return; }
    const payment = calcPayment(principal, AUTO_RATE, autoTerm);
    setAutoResult({ payment, principal });
  }

  function sendToWhatsApp() {
    const phone = '525525069817';
    let text = '';
    if (type === 'empresarial' && empResult) {
      text = `Hola, me gustaría solicitar la tabla de amortización para un *Crédito Empresarial*.\n\n*Monto solicitado:* ${fmt(empAmount)}\n*Plazo:* ${empTerm} meses.\n*Pago mensual estimado:* ${fmt(empResult)}`;
    } else if (type === 'automotriz' && autoResult) {
      text = `Hola, me gustaría solicitar la tabla de amortización para un *Crédito Automotriz*.\n\n*Vehículo:* Año ${autoYear}\n*Precio:* ${fmt(autoPrice)}\n*Enganche:* ${autoEnganche}%\n*Monto a financiar:* ${fmt(autoResult.principal)}\n*Plazo:* ${autoTerm} meses.\n*Pago mensual estimado:* ${fmt(autoResult.payment)}`;
    }
    if (text) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  const currentResult = type === 'empresarial' ? empResult : autoResult?.payment ?? null;

  const termBtn = (t: number, active: boolean, onClick: () => void) => (
    <button key={t} onClick={onClick} style={{
      padding: '0.6rem 0.25rem', border: `1.5px solid ${active ? GREEN : '#e5e7eb'}`,
      borderRadius: '0.5rem', background: active ? GREEN : 'white',
      color: active ? 'white' : '#6b7280', cursor: 'pointer', fontSize: '0.78rem',
      fontWeight: 600, textAlign: 'center', transition: 'all 0.2s',
    }}>{t} m</button>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8faf9', color: CHARCOAL, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Estilos para el range slider */}
      <style>{`
        input[type="range"] {
          -webkit-appearance: none; appearance: none; width: 100%; height: 6px;
          background: #e5e7eb; border-radius: 999px; outline: none; cursor: pointer;
          background-image: linear-gradient(${GREEN}, ${GREEN});
          background-repeat: no-repeat;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
          background: white; border: 3px solid ${GREEN}; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,109,78,0.3); transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg viewBox="0 0 100 100" fill={GREEN} width="36" height="36">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: GREEN }}>SOC</span>
                <div style={{ height: '24px', width: '2px', background: GREEN }} />
                <span style={{ fontSize: '1.5rem', fontWeight: 400, color: GREEN }}>FIRMA 7</span>
              </div>
              <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.15em', color: GREEN, textTransform: 'uppercase' }}>
                Líderes en Asesoría Financiera
              </span>
            </div>
          </a>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="/#methodology" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>Metodología</a>
            <a href="/alianzas/" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>Alianzas</a>
            <button onClick={() => navigate('/#profiling')} style={{ background: CHARCOAL, color: 'white', padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.3s' }}
              onMouseOver={e => (e.currentTarget.style.background = GREEN)}
              onMouseOut={e => (e.currentTarget.style.background = CHARCOAL)}>
              Diagnóstico Rápido →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '5rem 1.5rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <span style={{ display: 'inline-block', padding: '0.25rem 0.85rem', border: '1px solid rgba(0,109,78,0.25)', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: GREEN, background: 'rgba(0,109,78,0.05)', marginBottom: '1.25rem' }}>
          Herramienta Financiera
        </span>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: CHARCOAL, lineHeight: 1.15, marginBottom: '1rem' }}>
          Calcula tu <em style={{ fontStyle: 'italic', background: `linear-gradient(135deg, ${GREEN}, ${MIDNIGHT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Crédito</em> hoy mismo
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#4b5563', maxWidth: '560px', margin: '0 auto', fontWeight: 300, lineHeight: 1.7 }}>
          Simula tu financiamiento y da el primer paso hacia el capital que necesitas.
        </p>
      </div>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0 1.5rem 4rem' }}>

        {/* Disclaimer */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.25rem 1.5rem', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.65, marginBottom: '2rem' }}>
          <strong style={{ color: GREEN }}>⚠️ Aviso importante:</strong> Esta calculadora es únicamente una herramienta de estimación orientativa. Los resultados se basan en una tasa de referencia y pueden variar según la institución financiera, el perfil crediticio del solicitante y las condiciones del mercado.
        </div>

        {/* Type Selector */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.35rem', gap: '0.35rem', maxWidth: '480px', margin: '0 auto 2.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {(['empresarial', 'automotriz'] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setEmpResult(null); setAutoResult(null); }} style={{
              flex: 1, padding: '0.75rem 1rem', border: 'none', borderRadius: '0.5rem',
              background: type === t ? GREEN : 'transparent', color: type === t ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.25s',
              boxShadow: type === t ? '0 4px 14px rgba(0,109,78,0.3)' : 'none',
            }}>
              {t === 'empresarial' ? '🏢 Crédito Empresarial' : '🚗 Crédito Automotriz'}
            </button>
          ))}
        </div>

        {/* Calculator Card */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.07)' }}>
          <div style={{ height: '4px', background: `linear-gradient(90deg, rgba(0,109,78,0.2), ${GREEN}, rgba(0,109,78,0.2))` }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

            {/* Input Panel */}
            <div style={{ padding: '2.5rem', borderRight: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: GREEN, marginBottom: '1.75rem' }}>
                {type === 'empresarial' ? '🏢 Crédito Empresarial — Configura tu simulación' : '🚗 Crédito Automotriz — Configura tu simulación'}
              </div>

              {type === 'empresarial' ? (
                <>
                  {/* Monto */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.6rem' }}>Monto del crédito</label>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 600, color: CHARCOAL, marginBottom: '0.75rem' }}>
                      $<span style={{ color: GREEN }}>{empAmount.toLocaleString('es-MX')}</span>
                    </div>
                    <input type="range" ref={empRangeRef} min={150000} max={7500000} step={50000} value={empAmount}
                      onChange={e => { setEmpAmount(parseInt(e.target.value)); setEmpResult(null); }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                      <span>$150,000</span><span>$7,500,000</span>
                    </div>
                  </div>
                  {/* Plazo */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.6rem' }}>Plazo en meses</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                      {EMP_TERMS.map(t => termBtn(t, t === empTerm, () => { setEmpTerm(t); setEmpResult(null); }))}
                    </div>
                  </div>
                  <button onClick={handleEmpCalc} style={{ width: '100%', padding: '1rem', background: CHARCOAL, color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', marginTop: '0.5rem' }}
                    onMouseOver={e => { e.currentTarget.style.background = GREEN; }}
                    onMouseOut={e => { e.currentTarget.style.background = CHARCOAL; }}>
                    🧮 Calcular Amortización
                  </button>
                </>
              ) : (
                <>
                  {/* Año */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.6rem' }}>Año del vehículo</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                      {Object.keys(AUTO_MAX_TERMS).map(y => termBtn(parseInt(y), parseInt(y) === autoYear, () => setAutoYear(parseInt(y))))}
                    </div>
                  </div>
                  {/* Precio */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.6rem' }}>Precio del vehículo</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: GREEN }}>$</span>
                      <input type="text" value={autoPriceStr} placeholder="Ej. 350,000"
                        style={{ width: '100%', padding: '0.75rem 0.85rem 0.75rem 1.75rem', border: '1.5px solid #e5e7eb', borderRadius: '0.6rem', fontSize: '1rem', fontWeight: 600, color: CHARCOAL, outline: 'none' }}
                        onChange={e => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          const n = parseInt(raw) || 0;
                          setAutoPrice(n);
                          setAutoPriceStr(raw ? n.toLocaleString('es-MX') : '');
                          setAutoResult(null);
                        }}
                      />
                    </div>
                  </div>
                  {/* Enganche */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.6rem' }}>
                      Enganche: <strong style={{ color: GREEN }}>{autoEnganche}%</strong>
                      {autoPrice > 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}> ≈ {fmt(autoPrice * autoEnganche / 100)}</span>}
                    </label>
                    <input type="range" ref={autoEngancheRef} min={10} max={90} step={5} value={autoEnganche}
                      onChange={e => { setAutoEnganche(parseInt(e.target.value)); setAutoResult(null); }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                      <span>10%</span><span>90%</span>
                    </div>
                  </div>
                  {/* Plazo */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.6rem' }}>
                      Plazo en meses <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.75rem' }}>(máx. {AUTO_MAX_TERMS[autoYear]} meses para {autoYear})</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(autoTerms(autoYear).length, 6)}, 1fr)`, gap: '0.4rem' }}>
                      {autoTerms(autoYear).map(t => termBtn(t, t === autoTerm, () => { setAutoTerm(t); setAutoResult(null); }))}
                    </div>
                  </div>
                  <button onClick={handleAutoCalc} style={{ width: '100%', padding: '1rem', background: CHARCOAL, color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', marginTop: '0.5rem' }}
                    onMouseOver={e => { e.currentTarget.style.background = GREEN; }}
                    onMouseOut={e => { e.currentTarget.style.background = CHARCOAL; }}>
                    🧮 Calcular Amortización
                  </button>
                </>
              )}
            </div>

            {/* Results Panel */}
            <div style={{ padding: '2.5rem', background: '#f9fafb' }}>
              {currentResult === null ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', textAlign: 'center', color: '#9ca3af', gap: '1rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', opacity: 0.4 }}>
                    <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3"/><path d="M9 15l6.5-6.5"/><path d="M17 3l4 4-4 4"/><path d="M21 7H13"/>
                  </svg>
                  <p style={{ fontSize: '0.85rem', maxWidth: '220px', lineHeight: 1.6 }}>Configura los parámetros y presiona <strong>Calcular</strong> para ver tu pago mensual estimado.</p>
                </div>
              ) : (
                <div>
                  <div style={{ background: `linear-gradient(135deg, ${GREEN}, ${MIDNIGHT})`, color: 'white', borderRadius: '0.85rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem' }}>Pago mensual estimado</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', fontWeight: 600, color: 'white' }}>{fmt(currentResult)}</div>
                  </div>
                  {type === 'automotriz' && autoResult && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {[
                        { label: 'Precio del vehículo', val: fmt(autoPrice) },
                        { label: 'Monto financiado', val: fmt(autoResult.principal) },
                        { label: 'Enganche', val: fmt(autoPrice * autoEnganche / 100) },
                        { label: 'Plazo', val: `${autoTerm} meses` },
                      ].map(item => (
                        <div key={item.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.85rem', padding: '1rem' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '0.3rem' }}>{item.label}</div>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: CHARCOAL }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {type === 'empresarial' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {[
                        { label: 'Monto solicitado', val: fmt(empAmount) },
                        { label: 'Plazo', val: `${empTerm} meses` },
                      ].map(item => (
                        <div key={item.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.85rem', padding: '1rem' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '0.3rem' }}>{item.label}</div>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 600, color: CHARCOAL }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={sendToWhatsApp} style={{ width: '100%', padding: '1rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    📋 Solicitar tabla de amortización por WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ margin: '2.5rem auto 0', maxWidth: '680px', background: `linear-gradient(135deg, ${MIDNIGHT} 0%, #0d2d1f 100%)`, borderRadius: '1.5rem', padding: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <span style={{ display: 'inline-block', padding: '0.25rem 0.85rem', border: '1px solid rgba(0,109,78,0.3)', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#4ade80', background: 'rgba(0,109,78,0.2)', marginBottom: '1rem' }}>
            Siguiente Paso
          </span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 600, color: 'white', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            ¿Listo para <em style={{ fontStyle: 'italic', color: '#6ee7b7' }}>pre-calificarte</em>?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', marginBottom: '2rem', fontWeight: 300, position: 'relative', zIndex: 1 }}>
            Nuestros socios directores analizarán tu perfil y te presentarán las mejores opciones de financiamiento disponibles para ti.
          </p>
          <button onClick={() => setModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2rem', background: GREEN, color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', position: 'relative', zIndex: 1, boxShadow: '0 8px 24px rgba(0,109,78,0.4)' }}>
            ✅ Iniciar Diagnóstico Gratuito
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#052b22', color: 'white', padding: '2.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <svg viewBox="0 0 100 100" fill="white" width="28" height="28">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>SOC</span>
                <div style={{ width: '2px', height: '18px', background: 'rgba(255,255,255,0.35)' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>FIRMA 7</span>
              </div>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginTop: '2px' }}>
                Líderes en Asesoría Financiera
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} Firma 7. Todos los derechos reservados. · Av Patria 2085 Piso 1, Puerta de Hierro, Zapopan, Jalisco.
            {' · '}
            <a href="/aviso-de-privacidad" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>
              Aviso de Privacidad
            </a>
          </div>
        </div>
      </footer>

      {/* Modal Diagnóstico */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '3rem 1rem' }}
        >
          <div style={{ background: 'white', borderRadius: '1.5rem', maxWidth: '700px', width: '100%', margin: 'auto', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
            <div style={{ height: '4px', background: `linear-gradient(90deg, rgba(0,109,78,0.2), ${GREEN}, rgba(0,109,78,0.2))` }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 600, color: CHARCOAL }}>
                <em style={{ fontStyle: 'italic', color: GREEN }}>Pre-califícate</em> hoy mismo
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ width: '36px', height: '36px', border: 'none', background: '#f3f4f6', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '16px' }}>✕</button>
            </div>
            <iframe
              src="https://api.leadconnectorhq.com/widget/form/ytF9MgH3xDmSVPGeKAyS"
              style={{ width: '100%', border: 'none', minHeight: '85vh', display: 'block', paddingTop: '1.5rem' }}
              title="Formulario de Diagnóstico Firma 7"
            />
            <div style={{ padding: '0.75rem 2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', fontStyle: 'italic' }}>
              🔒 Tu información está protegida por nuestros protocolos de seguridad bancaria y confidencialidad.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
