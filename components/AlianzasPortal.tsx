import React from 'react';
import { useAlianzasAuth } from '../hooks/useAlianzasAuth';
import { AlianzasLogin } from './AlianzasLogin';
import { AlianzasDashboard } from './AlianzasDashboard';

export const AlianzasPortal: React.FC = () => {
  const { session, loading } = useAlianzasAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-firma-green" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return session ? <AlianzasDashboard /> : <AlianzasLogin />;
};
