import React from 'react';
import { useAlianzasAuth } from '../hooks/useAlianzasAuth';

export const AlianzasDashboard: React.FC = () => {
  const { profile, signOut, loading } = useAlianzasAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-firma-green" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-gray-400 text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete">
      {/* Navbar */}
      <header className="bg-midnight border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-firma-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F7</span>
            </div>
            <div>
              <span className="text-white font-serif font-semibold text-base">Firma 7</span>
              <span className="text-gray-400 text-xs ml-2">· Portal de Alianzas</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profile?.nombre_empresa && (
              <span className="hidden sm:block text-gray-300 text-sm font-medium">
                {profile.nombre_empresa}
              </span>
            )}
            <button
              onClick={signOut}
              className="text-xs text-gray-400 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
            Bienvenido{profile?.nombre_empresa ? `, ${profile.nombre_empresa}` : ''}
          </h1>
          {profile?.ejecutivo_asignado && (
            <p className="text-gray-500 text-sm mt-1">
              Ejecutivo asignado: <span className="font-medium text-charcoal">{profile.ejecutivo_asignado}</span>
            </p>
          )}
        </div>

        {/* Placeholder panels */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Clientes Referidos', desc: 'Seguimiento de tus referidos activos', icon: '👥' },
            { title: 'Comisiones', desc: 'Estado de tus comisiones y pagos', icon: '💰' },
            { title: 'Materiales', desc: 'Kit de ventas y recursos de apoyo', icon: '📁' },
          ].map((card) => (
            <div key={card.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <span className="text-3xl mb-3 block">{card.icon}</span>
              <h3 className="font-serif font-bold text-charcoal text-lg mb-1">{card.title}</h3>
              <p className="text-gray-500 text-sm">{card.desc}</p>
              <div className="mt-4 h-1 w-8 bg-firma-green rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
