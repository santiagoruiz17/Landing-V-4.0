import React from 'react';
import { Facebook, Instagram, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ALIANZAS = [
  { name: 'Konfío', slug: 'konfio' },
  { name: 'PDN', slug: 'pdn' },
  { name: 'UNIFIN', slug: 'unifin' },
  { name: 'FinBe ABC', slug: 'finbe-abc' },
  { name: 'Xepelin', slug: 'xepelin' },
  { name: 'Finkargo', slug: 'finkargo' },
  { name: 'imagina LEASING', slug: 'imagina-leasing' },
  { name: 'Covalto', slug: 'covalto' },
  { name: 'engen CAPITAL', slug: 'engen-capital' },
  { name: 'Hey Banco', slug: 'hey-banco' },
  { name: 'Anticipa', slug: 'anticipa' },
  { name: 'Axionex Financiera', slug: 'axionex-financiera' },
  { name: 'Bx+', slug: 'bx-plus' },
  { name: 'Finsus', slug: 'finsus' },
  { name: 'Hay Cash', slug: 'hay-cash' },
  { name: 'Banorte', slug: 'banorte' },
  { name: 'Afirme', slug: 'afirme' },
  { name: 'Creze', slug: 'creze' },
];

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#052b22] text-white py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 pb-10 border-b border-white/10">
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
            <p className="text-gray-400 text-sm mt-2 ml-1 mb-5">Consultoría Financiera Premium.</p>

            <button
              onClick={() => navigate('/perfil')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-firma-green text-white rounded-full text-xs font-bold tracking-wide hover:bg-emerald-600 transition-colors"
            >
              Solicitar Crédito <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
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
          </div>

          {/* Alianzas */}
          <div className="text-center md:text-left">
            <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 uppercase mb-4">Alianzas</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {ALIANZAS.map(a => (
                <a
                  key={a.slug}
                  href={`/alianzas/${a.slug}/`}
                  className="text-sm text-gray-400 hover:text-white transition-colors no-underline"
                >
                  {a.name}
                </a>
              ))}
            </div>
            <a
              href="/alianzas/"
              className="inline-block mt-4 text-xs font-semibold text-firma-green hover:text-emerald-400 transition-colors no-underline"
            >
              Ver todas las alianzas →
            </a>
          </div>

          <div className="text-sm text-gray-400 text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Firma 7. Todos los derechos reservados.</p>
            <p className="mt-2">Av Patria 2085 Piso 1, Puerta de Hierro</p>
            <p>45116 Zapopan, Jalisco</p>
            <p className="mt-2">
              <a href="/aviso-de-privacidad" className="text-gray-400 hover:text-white underline transition-colors">
                Aviso de Privacidad
              </a>
              {' · '}
              <a href="/terminos-y-condiciones" className="text-gray-400 hover:text-white underline transition-colors">
                Términos y Condiciones
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};