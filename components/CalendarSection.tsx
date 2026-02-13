import React, { useEffect } from 'react';

export const CalendarSection: React.FC = () => {
    useEffect(() => {
        // Load the external script for the form embed
        const script = document.createElement('script');
        script.src = "https://link.msgsndr.com/js/form_embed.js";
        script.async = true;
        script.type = "text/javascript";
        document.body.appendChild(script);

        return () => {
            // Cleanup script if component unmounts
            document.body.removeChild(script);
        };
    }, []);

    return (
        <section id="calendar" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">Agenda tu Sesión</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Selecciona el horario que mejor se adapte a ti para una consultoría personalizada.
                    </p>
                </div>

                <div className="w-full max-w-4xl mx-auto">
                    <iframe
                        src="https://api.leadconnectorhq.com/widget/booking/qXgJkbDL8iudpWIjMVP7"
                        style={{ width: '100%', minHeight: '700px', border: 'none' }}
                        scrolling="yes"
                        id="qXgJkbDL8iudpWIjMVP7_1770661591461"
                        title="Calendar Booking Widget"
                    />
                </div>
            </div>
        </section>
    );
};
