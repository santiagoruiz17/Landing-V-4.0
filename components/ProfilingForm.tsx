import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Calendar } from 'lucide-react';
import { FormStep, ProfilingFormData } from '../types';
import { supabase } from "../services/supabase";

const INITIAL_DATA: ProfilingFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  rfc: '',
  companyName: '',
  personType: '',
  satAntiquity: '',
  monthlyBilling: '',
  creditScore: '',
  activeProcess: '',
  activeProcessInstitutions: ''
};

export const ProfilingForm: React.FC = () => {
  const [step, setStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<ProfilingFormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [resultType, setResultType] = useState<'VIABLE' | 'NOT_CANDIDATE' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9]\d$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
      formData.firstName.trim().length > 1 &&
      formData.lastName.trim().length > 1 &&
      formData.phone.trim().length >= 10 &&
      emailRegex.test(formData.email) &&
      rfcRegex.test(formData.rfc)
    );
  };

  const validateStep2 = () => {
    return formData.personType !== '' && formData.satAntiquity !== '' && formData.monthlyBilling !== '' && formData.creditScore !== '';
  };

  const validateStep3 = () => {
    if (formData.activeProcess === '') return false;
    if (formData.activeProcess === 'Sí' && formData.activeProcessInstitutions.length < 3) return false;
    return true;
  };

  const calculateResult = async () => {
    setLoading(true);

    // Rejection Logic (OR condition):
    const isRejected =
      formData.satAntiquity === 'Menos de 6 meses' ||
      formData.monthlyBilling === '<150k' ||
      formData.creditScore === 'Malo';

    const finalResult = isRejected ? 'NOT_CANDIDATE' : 'VIABLE';

    try {
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            email: formData.email,
            rfc: formData.rfc,
            company_name: formData.companyName,
            person_type: formData.personType,
            sat_antiquity: formData.satAntiquity,
            monthly_billing: formData.monthlyBilling,
            credit_score: formData.creditScore,
            active_process: formData.activeProcess,
            active_process_institutions: formData.activeProcessInstitutions,
            result_type: finalResult
          },
        ]);

      if (error) {
        console.error('Error saving lead:', error);
      }
    } catch (err) {
      console.error('Unexpected error saving lead:', err);
    }

    // Simulation of small delay for UX
    setTimeout(() => {
      setResultType(finalResult);
      setStep('result');
      setLoading(false);
    }, 1000);
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) calculateResult();
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <h3 className="text-xl font-serif text-charcoal">Identidad</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
          <input
            type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green focus:border-firma-green outline-none transition-all"
            placeholder="Ej. Roberto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
          <input
            type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green focus:border-firma-green outline-none transition-all"
            placeholder="Ej. Martínez"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green focus:border-firma-green outline-none transition-all"
            placeholder="Ej. 55 1234 5678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
          <input
            type="email" name="email" value={formData.email} onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green focus:border-firma-green outline-none transition-all"
            placeholder="Ej. roberto@empresa.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RFC (Con Homoclave)</label>
        <input
          type="text" name="rfc" value={formData.rfc} onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green focus:border-firma-green outline-none transition-all uppercase"
          placeholder="Ej. ABCD800101XYZ"
        />
        {!/^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9]\d$/i.test(formData.rfc) && formData.rfc.length > 0 && (
          <p className="text-xs text-red-500 mt-1">Formato RFC inválido</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa (Opcional)</label>
        <input
          type="text" name="companyName" value={formData.companyName} onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green focus:border-firma-green outline-none transition-all"
          placeholder="Ej. Soluciones Industriales SA de CV"
        />
      </div>
    </div>
  );

  const renderStep2 = () => {
    const creditOptions = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No tengo experiencia'];

    return (
      <div className="space-y-5">
        <h3 className="text-xl font-serif text-charcoal">Perfil Fiscal y Financiero</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona</label>
          <select
            name="personType" value={formData.personType} onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green outline-none"
          >
            <option value="">Selecciona una opción</option>
            <option value="Física con Actividad Empresarial">Física con Actividad Empresarial</option>
            <option value="Moral">Moral</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Antigüedad ante el SAT</label>
          <div className="flex gap-4">
            {['Menos de 6 meses', 'Más de 6 meses'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, satAntiquity: opt as any }))}
                className={`flex-1 py-3 px-2 text-sm border transition-colors ${formData.satAntiquity === opt ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-firma-green/30'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facturación Mensual Promedio</label>
          <select
            name="monthlyBilling" value={formData.monthlyBilling} onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green outline-none"
          >
            <option value="">Selecciona rango</option>
            <option value="<150k">Menos de $150,000 MXN</option>
            <option value="150k - 500k">$150,000 - $500,000 MXN</option>
            <option value="+500k">Más de $500,000 MXN</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calificación en Buró de Crédito</label>
          <div className="grid grid-cols-2 gap-2">
            {creditOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, creditScore: opt as any }))}
                className={`py-2 px-2 text-sm border transition-colors ${formData.creditScore === opt
                  ? 'bg-charcoal text-white border-charcoal'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-firma-green/30'
                  } ${opt === 'No tengo experiencia' ? 'col-span-2' : ''}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-5">
      <h3 className="text-xl font-serif text-charcoal">Estatus Actual</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Tienes algún proceso abierto con otra institución?</label>
        <div className="flex gap-4 mb-4">
          {['Sí', 'No'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, activeProcess: opt as any }))}
              className={`flex-1 py-3 px-4 text-sm border transition-colors ${formData.activeProcess === opt ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-firma-green/30'}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {formData.activeProcess === 'Sí' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Con cuál/es?</label>
            <input
              type="text" name="activeProcessInstitutions" value={formData.activeProcessInstitutions} onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-firma-green outline-none"
              placeholder="Indica el nombre de la institución"
            />
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderResult = () => {
    // VIABLE CASE
    if (resultType === 'VIABLE') {
      return (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-firma-green" />
          </div>
          <h3 className="text-2xl font-serif text-charcoal mb-2">¡Tu perfil es Viable!</h3>
          <p className="text-gray-600 mb-6 px-4">
            Hemos detectado un excelente potencial en tu solicitud. Cumples con los requisitos clave para acceder a nuestros productos de capital estratégico.
          </p>
          <div className="bg-charcoal text-white py-4 px-6 rounded-lg shadow-lg inline-block text-sm font-medium mb-4">
            Un consultor senior te contactará a la brevedad.
          </div>
          <p className="text-xs text-gray-400">Folio de pre-aprobación: F7-{Math.floor(Math.random() * 10000)}</p>
        </div>
      );
    }

    // REJECTION CASE
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-2xl font-serif text-charcoal mb-2">Gracias por compartir tu perfil</h3>
        <p className="text-gray-600 mb-6 px-4 leading-relaxed">
          Analizamos tu información detalladamente. Por el momento, nuestros socios estratégicos requieren un perfil con mayor antigüedad fiscal, facturación o historial crediticio para activar las líneas de capital.
        </p>
        <p className="text-gray-500 font-medium italic">
          Te invitamos a seguir impulsando tu crecimiento y volver a consultarnos en el futuro.
        </p>
      </div>
    );
  };

  return (
    <section id="profiling" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">Diagnóstico de Capital</h2>
          <p className="text-gray-500">Completa el perfilamiento para desbloquear tu estrategia.</p>
        </div>

        <div className="bg-white p-8 md:p-12 shadow-xl border border-gray-100 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 bg-white z-50 flex items-center justify-center flex-col">
              <Loader2 className="w-10 h-10 text-firma-green animate-spin mb-4" />
              <p className="text-gray-500 font-serif">Analizando viabilidad...</p>
            </div>
          ) : null}

          <AnimatePresence mode='wait'>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 'result' && renderResult()}
            </motion.div>
          </AnimatePresence>

          {step !== 'result' && (
            <div className="mt-10 flex justify-between items-center border-t border-gray-100 pt-6">
              {step > 1 ? (
                <button
                  onClick={() => setStep(prev => (prev as number - 1) as FormStep)}
                  className="text-gray-500 hover:text-charcoal font-medium text-sm transition-colors"
                >
                  Atrás
                </button>
              ) : <div></div>}

              <button
                onClick={nextStep}
                disabled={
                  (step === 1 && !validateStep1()) ||
                  (step === 2 && !validateStep2()) ||
                  (step === 3 && !validateStep3())
                }
                className="bg-charcoal disabled:bg-gray-300 text-white px-8 py-3 font-medium tracking-wide hover:bg-firma-green transition-colors disabled:cursor-not-allowed shadow-md hover:shadow-xl"
              >
                {step === 3 ? 'Finalizar Diagnóstico' : 'Siguiente'}
              </button>
            </div>
          )}

          {step !== 'result' && (
            <div className="flex justify-center mt-6 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 w-8 rounded-full transition-colors ${step >= i ? 'bg-firma-green' : 'bg-gray-200'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};