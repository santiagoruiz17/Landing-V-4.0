import React from 'react';
import { Facebook, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#052b22] text-white py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            {/* Logo Footer - White Version */}
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
               <div className="w-8 h-8">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-white">
                  <circle cx="50" cy="50" r="12" />
                  <circle cx="50" cy="20" r="12" />
                  <circle cx="50" cy="80" r="12" />
                  <circle cx="24" cy="35" r="12" />
                  <circle cx="24" cy="65" r="12" />
                  <circle cx="76" cy="35" r="12" />
                  <circle cx="76" cy="65" r="12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 leading-none">
                  <span className="font-sans text-2xl font-bold tracking-tight text-white">SOC</span>
                  <div className="h-6 w-0.5 bg-gray-500"></div>
                  <span className="font-sans text-2xl font-normal tracking-wide text-white">FIRMA 7</span>
                </div>
                <span className="text-[0.55rem] font-bold tracking-[0.2em] text-gray-400 uppercase mt-1 text-center md:text-left">
                  Líderes en Asesoría Financiera
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2 ml-1">Consultoría Financiera Premium.</p>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="https://www.facebook.com/Firma7.Soc/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a 
              href="https://www.instagram.com/soc_firma_7/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
          </div>

          <div className="text-sm text-gray-400 text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Firma 7. Todos los derechos reservados.</p>
            <p className="mt-2">Av Patria 2085 Piso 1, Puerta de Hierro</p>
            <p>45116 Zapopan, Jalisco</p>
          </div>
        </div>
      </div>
    </footer>
  );
};