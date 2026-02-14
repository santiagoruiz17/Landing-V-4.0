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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">Diagnóstico de Capital</h2>
          <p className="text-gray-500">Completa el formulario para continuar.</p>
        </div>

        <div className="w-full bg-white shadow-xl border border-gray-100 rounded-lg overflow-hidden">
          <iframe
            src="https://api.leadconnectorhq.com/widget/form/ytF9MgH3xDmSVPGeKAyS"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '3px', minHeight: '958px' }}
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
    </section>
  );
};