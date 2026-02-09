import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo SOC | FIRMA 7 */}
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection('hero')}>
            {/* Icono de puntos */}
            <div className="w-10 h-10">
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-[#006d4e]">
                <circle cx="50" cy="50" r="12" />
                <circle cx="50" cy="20" r="12" />
                <circle cx="50" cy="80" r="12" />
                <circle cx="24" cy="35" r="12" />
                <circle cx="24" cy="65" r="12" />
                <circle cx="76" cy="35" r="12" />
                <circle cx="76" cy="65" r="12" />
              </svg>
            </div>

            {/* Texto del Logo */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 leading-none mb-1">
                <span className="font-sans text-3xl font-bold tracking-tight text-[#006d4e]">SOC</span>
                <div className="h-7 w-[2.5px] bg-[#006d4e]"></div>
                <span className="font-sans text-3xl font-medium tracking-wide text-[#006d4e]">FIRMA 7</span>
              </div>
              <span className="hidden sm:block text-[0.6rem] font-bold tracking-[0.15em] text-[#006d4e] uppercase">
                LÍDERES EN ASESORÍA FINANCIERA
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <button onClick={() => scrollToSection('methodology')} className="text-sm font-medium text-gray-600 hover:text-[#006d4e] transition-colors">
              Metodología
            </button>
            <button onClick={() => scrollToSection('calendar')} className="text-sm font-medium text-gray-600 hover:text-[#006d4e] transition-colors">
              Agenda
            </button>
            <button
              onClick={() => scrollToSection('profiling')}
              className="bg-charcoal text-white px-6 py-2.5 rounded-none text-sm font-medium hover:bg-[#006d4e] transition-colors duration-300 flex items-center gap-2 shadow-lg shadow-[#006d4e]/20"
            >
              Diagnóstico Rápido <ArrowRight size={16} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-[#006d4e] focus:outline-none transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              onClick={() => scrollToSection('methodology')}
              className="block w-full text-left px-3 py-4 text-base font-medium text-gray-600 hover:text-[#006d4e] hover:bg-gray-50 transition-colors"
            >
              Metodología
            </button>
            <button
              onClick={() => scrollToSection('calendar')}
              className="block w-full text-left px-3 py-4 text-base font-medium text-gray-600 hover:text-[#006d4e] hover:bg-gray-50 transition-colors"
            >
              Agenda
            </button>
            <button
              onClick={() => scrollToSection('profiling')}
              className="block w-full text-left px-3 py-4 text-base font-medium text-[#006d4e] font-bold bg-green-50"
            >
              Iniciar Diagnóstico
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};