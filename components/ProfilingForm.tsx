import React, { useEffect } from 'react';

export const ProfilingForm: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://link.msgsndr.com/js/form_embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
            Paso Final
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-charcoal mb-6">
            <span className="italic text-firma-green">Pre-califícate</span> hoy mismo
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light">
            Completa el formulario oficial para recibir un análisis detallado por parte de nuestros socios directores.
          </p>
        </div>

        <div className="w-full bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 rounded-[2rem] overflow-hidden group mb-8">
          <div className="h-2 w-full bg-gradient-to-r from-firma-green/20 via-firma-green to-firma-green/20"></div>
          <iframe
            src="https://api.leadconnectorhq.com/widget/form/ytF9MgH3xDmSVPGeKAyS"
            style={{
              width: '100%',
              border: 'none',
              minHeight: '1300px',
              display: 'block',
              paddingTop: '3rem',
              paddingBottom: '4rem'
            }}
            id="inline-ytF9MgH3xDmSVPGeKAyS"
            data-layout="{'id':'INLINE'}"
            data-trigger-type="alwaysShow"
            data-trigger-value=""
            data-activation-type="alwaysActivated"
            data-activation-value=""
            data-deactivation-type="neverDeactivate"
            data-deactivation-value=""
            data-form-name="FORMULARIO LANDING PAGE"
            data-height="958"
            data-layout-iframe-id="inline-ytF9MgH3xDmSVPGeKAyS"
            data-form-id="ytF9MgH3xDmSVPGeKAyS"
            title="FORMULARIO LANDING PAGE"
          />
        </div>

        <p className="text-center mt-12 text-xs text-gray-400 font-light tracking-wide italic">
          Tu información está protegida por nuestros protocolos de seguridad bancaria y confidencialidad.
        </p>
      </div>
    </section>
  );
};