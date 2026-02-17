import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, DollarSign, Clock, Users } from 'lucide-react';

export const ApprovedLanding: React.FC = () => {
    useEffect(() => {
        // Confetti effect on page load - two bursts from bottom corners
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Left corner burst
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });

            // Right corner burst
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 font-sans">
            {/* Header/Navbar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-firma-green rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">F7</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-charcoal">Firma 7</h1>
                                <p className="text-xs text-gray-500">Portal de Cliente</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Status Banner */}
                <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-center space-x-4">
                        <div className="flex-shrink-0">
                            <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-green-800 mb-1">
                                ¡Felicidades! Perfil Pre-Aprobado
                            </h2>
                            <p className="text-green-700 text-lg">
                                Tu solicitud ha sido validada exitosamente
                            </p>
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="mb-10 text-center">
                    <h3 className="text-2xl font-serif font-bold text-charcoal mb-3">
                        Bienvenido a tu Portal de Cliente
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Estás a un paso de obtener el financiamiento que tu empresa necesita.
                        Completa el siguiente formulario para continuar con tu proceso.
                    </p>
                </div>

                {/* Value Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Card 1 */}
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-firma-green group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-firma-green to-green-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <DollarSign className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <h4 className="text-xl font-bold text-charcoal mb-2">Hasta $5M MXN</h4>
                            <p className="text-gray-600 text-sm">
                                Accede a financiamiento flexible adaptado a las necesidades de tu empresa
                            </p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-firma-green group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-firma-green to-green-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Clock className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <h4 className="text-xl font-bold text-charcoal mb-2">Respuesta en 24h</h4>
                            <p className="text-gray-600 text-sm">
                                Evaluación rápida y eficiente de tu solicitud de financiamiento
                            </p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-firma-green group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-firma-green to-green-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <h4 className="text-xl font-bold text-charcoal mb-2">Asesoría Personalizada SOC</h4>
                            <p className="text-gray-600 text-sm">
                                Acompañamiento experto durante todo el proceso de financiamiento
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-10">
                    <div className="mb-6 text-center">
                        <h3 className="text-2xl font-serif font-bold text-charcoal mb-2">
                            Formulario de Documentación
                        </h3>
                        <p className="text-gray-600">
                            Por favor, completa el siguiente formulario con la documentación requerida
                        </p>
                    </div>

                    {/* GoHighLevel Form Integration */}
                    <div className="ghl-form-container">
                        {/* 
              INTEGRACIÓN GOHIGHLEVEL - FORMULARIO 2 (Carga de Documentos)
              Instrucciones:
              1. Obtén el código de embed del "Formulario 2" desde GoHighLevel
              2. Reemplaza este comentario con el iframe o script proporcionado por GHL
              3. Ejemplo de integración:
                 <iframe src="TU_URL_DE_GHL_FORMULARIO_2" width="100%" height="800" frameborder="0"></iframe>
              
              Nota: Asegúrate de que el formulario tenga los campos necesarios para la carga de documentos
            */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                            <div className="max-w-md mx-auto">
                                <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-firma-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-charcoal mb-2">
                                    Integrar Formulario de GoHighLevel
                                </h4>
                                <p className="text-gray-600 text-sm mb-4">
                                    Inserta aquí el código del "Formulario 2" de carga de documentos desde tu cuenta de GoHighLevel
                                </p>
                                <code className="text-xs bg-gray-100 px-3 py-1 rounded text-firma-green">
                                    Línea 157-165
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-firma-green to-green-700 rounded-2xl shadow-xl p-8 text-center">
                    <h3 className="text-2xl font-serif font-bold text-white mb-3">
                        ¿Necesitas Ayuda Personalizada?
                    </h3>
                    <p className="text-green-50 mb-6 max-w-2xl mx-auto">
                        Agenda una sesión de perfilamiento con nuestros expertos para resolver tus dudas
                        y acelerar tu proceso de financiamiento
                    </p>

                    {/* 
            INTEGRACIÓN GOHIGHLEVEL - BOTÓN DE AGENDAMIENTO
            Opción 1: Reemplaza el href con tu enlace de calendario de GHL
            Opción 2: Agrega un onclick que abra el widget de GHL
          */}
                    <a
                        href="https://tu-enlace-de-calendario-ghl.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white text-firma-green font-bold text-lg rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Agendar Sesión de Perfilamiento
                    </a>
                </div>

                {/* Footer Note */}
                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-500">
                        ¿Tienes preguntas? Contáctanos en{' '}
                        <a href="mailto:contacto@firma7.com" className="text-firma-green hover:underline font-semibold">
                            contacto@firma7.com
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
};
