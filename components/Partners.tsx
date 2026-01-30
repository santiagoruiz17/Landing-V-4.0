import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  { 
    name: 'Konfío', 
    url: 'https://static.wixstatic.com/media/84b48d_c3d0407487a44c8bac8cd9dd0bed9444~mv2.png/v1/fill/w_1000,h_563,al_c,q_90,usm_0.66_1.00_0.01/84b48d_c3d0407487a44c8bac8cd9dd0bed9444~mv2.png',
    sizeClass: 'scale-125' // Increased
  },
  { 
    name: 'Finsus', 
    url: 'https://finsus.mx/wp-content/uploads/2023/09/Logo-Finsus_800x-600x187.png',
    sizeClass: 'scale-75' // Decreased significantly
  },
  { 
    name: 'Xepelin', 
    url: 'https://almomento.mx/wp-content/uploads/2024/02/Logotipo-Xepelin-Press-Kit-1-scaled.jpg',
    sizeClass: 'scale-[1.7]' // Increased significantly to crop whitespace
  },
  { 
    name: 'Covalto', 
    url: 'https://media.cdn.teamtailor.com/images/s3/teamtailor-production/logotype-v3/image_uploads/15e2f7f9-b5a4-476a-852c-c435bc8cc489/original.png',
    sizeClass: 'scale-90'
  },
  { 
    name: 'Anticipa', 
    url: 'https://www.credenza.mx/img/clients/ANTICIPA.png',
    sizeClass: 'scale-90'
  },
  { 
    name: 'Hey Cash', 
    url: 'https://socasesores.com/oficinas/img/bancos/empresarial/HEY-CASH-color.png',
    sizeClass: 'scale-95'
  },
  { 
    name: 'Creze', 
    url: 'https://fincor.com.mx/wp-content/uploads/2019/08/creze222.png',
    sizeClass: 'scale-125' // Increased
  },
];

export const Partners: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-widest">
          Alianzas Estratégicas
        </p>
      </div>
      
      {/* Added py-8 to ensure hover effects don't get clipped by overflow-hidden */}
      <div className="relative w-full overflow-hidden py-8">
        {/* Gradients to fade edges */}
        <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        <motion.div
          className="flex items-center w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 40 
          }}
        >
          {/* We repeat the list 4 times to ensure seamless infinite scrolling on all screen sizes */}
          {[...partners, ...partners, ...partners, ...partners].map((partner, index) => (
            <motion.div 
              key={`${partner.name}-${index}`}
              className="flex-shrink-0 w-64 px-8 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer"
              whileHover={{ y: -10, scale: 1.05 }}
            >
              {/* Fixed container size for consistency */}
              <div className="h-24 w-48 flex items-center justify-center">
                <img 
                  src={partner.url} 
                  alt={partner.name} 
                  className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 ${partner.sizeClass || ''}`} 
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};