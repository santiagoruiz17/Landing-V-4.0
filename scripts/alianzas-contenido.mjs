// Contenido de cada landing de alianza: SOLO lo esencial, tomado de las presentaciones de cada institución.
// No incluye tasas ni comisiones (pendiente de decisión) ni reglas internas para brokers.
// Para editar un texto: cámbialo aquí y corre `node generate-alianzas.mjs --enlazadas`.
//   quienes:    una frase sobre la institución
//   hechos:     tarjetas con lo más importante (monto, rapidez, ventaja…)
//   requisitos: lo mínimo para aplicar (filtra a quien no califica antes de iniciar)
//   nota:       línea opcional bajo los requisitos
// FinBe: la presentación trae aviso de confidencialidad; Santiago autorizó usar su información (2026-10-05).

export const CONTENIDO = {
  konfio: {
    quienes: 'Fintech mexicana regulada y especializada en PyMEs, con más de 85 mil empresas beneficiadas.',
    hechos: [
      { t: 'Monto', x: 'Personas morales: de $80,000 a $10,000,000. Personas físicas con actividad empresarial: de $80,000 a $1,000,000.' },
      { t: 'Rapidez', x: 'Evaluación digital en minutos y dispersión del crédito en 24 a 48 horas.' },
      { t: 'Sin garantías', x: 'Proceso 100% digital, sin aval ni garantías.' },
      { t: 'Ventaja fiscal', x: 'La comisión por apertura y los intereses son 100% deducibles de ISR.' },
    ],
    requisitos: [
      'INE vigente y tener entre 25 y 75 años',
      'De 3 a 6 meses de facturación continua',
      'Clave CIEC del SAT y constancia de situación fiscal',
      'Persona moral: cuadro accionario actualizado y datos del representante legal',
    ],
  },

  creze: {
    quienes: 'Plataforma financiera mexicana que ofrece productos más accesibles y transparentes para personas y empresas.',
    hechos: [
      { t: 'Monto', x: 'Personas morales: de $1 a $20 millones. Personas físicas con actividad empresarial: de $200 mil a $3 millones.' },
      { t: 'Plazo', x: 'Hasta 24 meses sin garantía y hasta 60 meses con garantía inmobiliaria.' },
      { t: 'Rapidez', x: 'Preoferta en 24 horas.' },
      { t: 'Cobertura', x: 'Atienden en todo el país, excepto Sinaloa. También sustituyen pasivos de otras financieras.' },
    ],
    requisitos: [
      'Persona moral o persona física con actividad empresarial',
      'Edad de 21 a 69 años',
      'Ingresos desde $500 mil mensuales',
      'Buró sin atrasos en los últimos 24 meses',
      'Facturación y operación de al menos 36 meses',
    ],
  },

  'hay-cash': {
    quienes: 'Fintech mexicana que da financiamiento a negocios que cobran con tarjeta en terminal punto de venta (TPV): más de 5 años, 2,600 financiamientos y presencia en 32 estados.',
    hechos: [
      { t: 'Monto', x: 'De $250,000 a $10,000,000: te adelantan hasta 2.5 veces tu venta promedio mensual en terminal.' },
      { t: 'Pagas conforme vendes', x: 'El pago se descuenta directo de tu terminal, de acuerdo con tus ventas.' },
      { t: 'Sin garantía real', x: 'No necesitas dejar un bien en garantía.' },
      { t: 'Respuesta', x: 'En menos de 24 horas. Las terminales no tienen costo ni renta.' },
    ],
    requisitos: [
      'Negocio que cobre con tarjeta en terminal punto de venta (TPV)',
      'Ventas en terminal de al menos $200,000 al mes',
      'Sin atrasos vigentes en buró',
      'Constancia de situación fiscal, 6 estados de cuenta donde recibes tus ventas de TPV y clave CIEC',
    ],
    nota: 'Mayor aprobación: restaurantes, abarrotes, retail, farmacias, servicios automotrices y gasolineras.',
  },

  xepelin: {
    quienes: 'Fintech fundada en 2019 que ha ayudado a más de 50,000 empresas con factoraje y financiamiento 100% digital.',
    hechos: [
      { t: 'Adelanto de facturas', x: 'Te adelantan hasta el 80% del valor de tus facturas, sin esperar 30, 60 o 90 días.' },
      { t: 'Línea de crédito', x: 'Una línea que crece con tus ventas, evaluada de forma 100% digital en 24 a 48 horas.' },
      { t: 'Sin costos de entrada', x: 'Sin costo por anualidad ni por apertura.' },
    ],
    requisitos: [
      'Ventas de más de $400 mil al mes (persona moral) o $250 mil (persona física con actividad empresarial)',
      'Facturación continua: 12 meses (persona moral) o 24 meses (persona física)',
      'Sin mora mayor a 60 días en buró durante el último año',
      'Registro con correo, teléfono, CIEC y RFC',
    ],
  },

  finsus: {
    quienes: 'Institución financiera 100% digital, regulada como SOFIPO, enfocada en facilitar el acceso al crédito.',
    hechos: [
      { t: 'Monto sin garantía', x: 'Personas morales: de $100,000 a $15,000,000. Personas físicas: de $100,000 a $750,000 (hasta $3,000,000 con aval).' },
      { t: 'Con garantía inmobiliaria', x: 'Personas morales hasta $50 millones, con plazos de hasta 5 años.' },
      { t: 'Plazos', x: 'De 6 a 36 meses en crédito sin garantía.' },
      { t: 'Ventaja', x: 'Saldos insolutos y sin penalización por pagos anticipados.' },
    ],
    requisitos: [
      'Persona moral o persona física con actividad comercial de al menos 1 año',
      'Ventas facturables de al menos $1,800,000 en los últimos 12 meses',
      'Entre 24 y 70 años (accionista principal o titular)',
      'Buró sin quitas ni saldos vencidos',
    ],
  },

  covalto: {
    quienes: 'Banco digital mexicano fundado en 2015, enfocado en empresas y respaldado por inversionistas institucionales.',
    hechos: [
      { t: 'Crédito con garantía', x: 'De $500 mil a $50 millones, con plazo de hasta 60 meses.' },
      { t: 'Crédito sin garantía', x: 'De $500 mil a $5 millones, con plazo de hasta 2 años.' },
      { t: 'Crédito Ágil', x: 'De $100 mil a $2 millones, financiamiento rápido basado en tecnología (personas morales).' },
      { t: 'Más productos', x: 'Factoraje de hasta $30 millones y arrendamiento de hasta $30 millones.' },
    ],
    requisitos: [
      'Ingresos anuales desde $20 millones (crédito con garantía y Crédito Ágil) o desde $80 millones (sin garantía)',
      'Antigüedad mínima de 2 años (con garantía) o 3 años (sin garantía)',
      'Edad de 21 a 68 años',
      'Buen historial crediticio',
    ],
  },
  'finbe-abc': {
    quienes: 'Alianza entre FinBe, ABC Leasing y Lendia, respaldada por Grupo Bepensa y enfocada en financiar a las PyMEs.',
    hechos: [
      { t: 'Crédito simple', x: 'Hasta $50 millones (hasta $10 millones sin garantía hipotecaria), plazo de 12 a 60 meses y sin penalización por pagos anticipados.' },
      { t: 'Crédito PyME Digital', x: 'De $1 a $3 millones, plazo de 12 a 36 meses. Respuesta en 24 horas con tu clave CIEC y recursos en menos de 5 días.' },
      { t: 'Arrendamiento puro', x: 'Plazo de 12 a 60 meses, renta mensual fija y anticipo desde 0%.' },
      { t: 'Cuenta corriente', x: 'Línea revolvente: contrato de 12 meses, y hasta 36 meses con garantía hipotecaria.' },
    ],
    requisitos: [
      'RFC y clave CIEC válidos, y firmantes con FIEL activa',
      'Al menos 24 meses de operación en tu actividad principal',
      'Accionista mayoritario de 30 a 70 años, sin morosidad en buró, que funge como aval',
      'Empresa con buen perfil crediticio y cuenta bancaria activa con ventas acordes a su facturación',
    ],
    nota: 'Estos requisitos aplican al Crédito PyME Digital; para crédito simple y arrendamiento, tu asesor revisa tu caso.',
  },
};
