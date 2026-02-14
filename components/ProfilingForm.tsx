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
    <section id="profiling" className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">Diagnóstico de Capital</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Completa el formulario para recibir un análisis personalizado de tu perfil financiero.
          </p>
        </div>

        <div className="w-full bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-2 sm:p-4">
            <iframe
              src="https://api.leadconnectorhq.com/widget/form/ytF9MgH3xDmSVPGeKAyS"
              style={{
                width: '100%',
                border: 'none',
                minHeight: '1000px',
                display: 'block'
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
        </div>
      </div>
    </section>
  );
};