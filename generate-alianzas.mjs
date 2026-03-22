import fs from 'fs';
import path from 'path';

const partners = [
  { 
    name: 'Konfío', 
    slug: 'konfio', 
    logo: 'https://static.wixstatic.com/media/84b48d_c3d0407487a44c8bac8cd9dd0bed9444~mv2.png/v1/fill/w_1000,h_563,al_c,q_90,usm_0.66_1.00_0.01/84b48d_c3d0407487a44c8bac8cd9dd0bed9444~mv2.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Fintech mexicana fundada en 2013 y regulada por la CNBV, especializada en impulsar el crecimiento de las PyMEs.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Proceso 100% digital. Evalúan la salud de tu negocio conectándose de forma segura a tu facturación del SAT, sin exigir garantías hipotecarias.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Pre-aprobación en cuestión de minutos. Una vez autorizado, el fondeo se deposita entre 24 y 48 horas.</p>
        
        <h3>Ventaja principal</h3>
        <p>Liquidez rápida, proceso 100% digital.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Hasta $5 millones de pesos</p>
      </div>
    `
  },
  { 
    name: 'PDN', 
    slug: 'pdn', 
    logo: '../../images/logo-pdn.jpg',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>SOFOM mexicana regulada por la CNBV con más de 17 años de trayectoria, dedicada exclusivamente a financiar el crecimiento de las PyMEs.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Diseñan créditos empresariales a la medida. Requiriendo que la empresa tenga al menos dos años de operación.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Trámite ágil. Una vez completado el expediente y firmado el contrato, los fondos se liberan en un máximo de 72 horas.</p>
        
        <h3>Ventaja principal</h3>
        <p>Flexibilidad y garantías adaptadas a la realidad de tu industria.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Hasta $15 millones de pesos</p>
      </div>
    `
  },
  { 
    name: 'UNIFIN', 
    slug: 'unifin', 
    logo: '../../images/logo-unifin.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Institución financiera mexicana con amplia trayectoria, especializada en impulsar el crecimiento operativo de las PyMEs mediante arrendamiento y factoraje.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Con Arrendamiento Puro. Te permiten financiar flotillas, maquinaria o equipo especializado sin necesidad de comprarlos de contado, con rentas que pueden ser 100% deducibles de impuestos.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Cuentan con un proceso digital ágil que permite evaluar y pre-autorizar líneas de arrendamiento de forma segura.</p>
        
        <h3>Ventaja principal</h3>
        <p>Adquieres los activos productivos que tu negocio necesita para operar de inmediato, sin descapitalizarte y aprovechando grandes beneficios fiscales.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Hasta $15 millones de pesos</p>
      </div>
    `
  },
  { 
    name: 'FinBe ABC', 
    slug: 'finbe-abc', 
    logo: '../../images/logo-finbe-abc.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Institución financiera respaldada por el sólido Grupo Bepensa, con fuerte presencia nacional y enfocada en PyMEs.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Ofrecen Crédito Simple, Crédito Revolvente y Arrendamiento Puro, adaptándose al ciclo de ingresos de tu empresa para que los pagos no ahoguen tu flujo de efectivo.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Cuentan con procesos de evaluación estandarizados. Una vez integrado el expediente completo, el análisis y respuesta toman en promedio de 3 a 5 días hábiles.</p>
        
        <h3>Ventaja principal</h3>
        <p>El respaldo de un gran corporativo les permite combinar líneas de crédito con arrendamiento en un solo lugar.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Generalmente hasta $5,000,000 de pesos para créditos ágiles (pudiendo estructurar montos mayores dependiendo del perfil, garantías o si se trata de arrendamiento de equipo mayor).</p>
      </div>
    `
  },
  { 
    name: 'Xepelin', 
    slug: 'xepelin', 
    logo: 'https://almomento.mx/wp-content/uploads/2024/02/Logotipo-Xepelin-Press-Kit-1-scaled.jpg',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Fintech fundada en 2019, especializada en servicios financieros B2B, pagos y factoraje 100% digital para PyMEs.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Su plataforma se conecta directamente con el SAT para leer tus facturas. Usan inteligencia artificial para evaluar tu cartera, permitiéndote adelantar el cobro de tus facturas emitidas o financiar el pago a tus proveedores de forma muy sencilla.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Evaluación inicial en cuestión de minutos. Una vez autorizada tu línea, el fondeo o adelanto de tus facturas se realiza en menos de 24 horas.</p>
        
        <h3>Ventaja principal</h3>
        <p>Centralizas, organizas y financias todas tus cuentas por pagar y por cobrar en una sola plataforma.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Te otorgan líneas de factoraje que escalan según tus ventas y el volumen de tus facturas, llegando generalmente hasta los $15,000,000 de pesos.</p>
      </div>
    `
  },
  { 
    name: 'finkargo', 
    slug: 'finkargo', 
    logo: '../../images/logo-finkargo.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Fintech especializada en financiamiento de comercio exterior, diseñada exclusivamente para potenciar las importaciones de las PyMEs en México.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Financian la compra de tu inventario internacional. Ellos se encargan de pagarle de contado a tu proveedor en el extranjero (Asia, Europa, EE. UU., etc.), y tú les pagas a ellos a plazos (hasta 180 días), basando su análisis en tu historial aduanero y financiero sin pedir garantías hipotecarias.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Tienen un proceso de evaluación digital muy ágil. Una vez que integras tu expediente, la línea de crédito suele estar aprobada y lista para usarse en un promedio de 48 a 72 horas.</p>
        
        <h3>Ventaja principal</h3>
        <p>Multiplicas tu capacidad de importar mercancía y negocias mejores precios por pago de contado con tus proveedores internacionales, todo sin afectar tu flujo de caja diario.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Otorgan líneas de crédito revolventes (en dólares o pesos) que generalmente llegan hasta los $2,000,000 USD (o su equivalente en pesos), escalables según tu volumen de importación.</p>
      </div>
    `
  },
  { 
    name: 'imagina LEASING', 
    slug: 'imagina-leasing', 
    logo: '../../images/logo-imagina.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Institución financiera mexicana enfocada en impulsar la productividad y competitividad de las empresas a través de soluciones estratégicas de arrendamiento.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Facilitan el acceso a herramientas, maquinaria y equipo clave para tu negocio. En lugar de exigir compras de contado, diseñan planes de arrendamiento flexibles y personalizados apoyados en tecnología para que adquieras los bienes sin afectar tu liquidez.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Cuentan con procesos digitales muy optimizados que van desde la evaluación hasta la entrega del activo.</p>
        
        <h3>Ventaja principal</h3>
        <p>Crecimiento sin barreras. Te permite escalar la operación de tu empresa de inmediato sin grandes inversiones iniciales, sumando además un fuerte acompañamiento estratégico y beneficios fiscales.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Al tratarse de arrendamiento, las líneas se estructuran como un "traje a la medida", adaptándose específicamente al valor de los activos productivos que tu empresa necesite incorporar.</p>
      </div>
    `
  },
  { 
    name: 'Covalto', 
    slug: 'covalto', 
    logo: 'https://media.cdn.teamtailor.com/images/s3/teamtailor-production/logotype-v3/image_uploads/15e2f7f9-b5a4-476a-852c-c435bc8cc489/original.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Banco digital y fintech mexicano (anteriormente conocido como Credijusto) fundado en 2015. Evolucionaron para convertirse en una institución bancaria regulada enfocada 100% en las PyMEs.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Combinan la agilidad de la tecnología con la solidez de un banco tradicional. Evalúan tu facturación y ofrecen un portafolio multiproducto (crédito simple, arrendamiento y factoraje), con esquemas que pueden o no requerir garantía inmobiliaria.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Tienen una pre-aprobación digital muy rápida. Dependiendo de la estructura del crédito y las garantías, el fondeo final suele tomar entre 5 y 10 días hábiles.</p>
        
        <h3>Ventaja principal</h3>
        <p>Te brindan la seguridad y capacidad de financiamiento de un banco formal, pero operando con la velocidad, atención y tecnología de una fintech moderna.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Sus líneas son muy robustas, alcanzando generalmente hasta $30,000,000 de pesos para impulsar proyectos de gran calado.</p>
      </div>
    `
  },
  { 
    name: 'engen CAPITAL', 
    slug: 'engen-capital', 
    logo: '../../images/logo-engen-capital.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Financiera mexicana con más de 25 años de trayectoria, especializada en financiamiento de activos y crédito para medianas y grandes empresas.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Estructuran soluciones de arrendamiento (puro y financiero) y crédito empresarial a la medida. Facilitan la adquisición de maquinaria pesada, flotillas de transporte, equipo médico y tecnología, adaptando los pagos a los flujos de tu proyecto.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Al tratarse de estructuración financiera avanzada y análisis corporativo detallado, el proceso integral de evaluación y autorización toma en promedio de 1 a 3 semanas.</p>
        
        <h3>Ventaja principal</h3>
        <p>Gran capacidad para fondear proyectos intensivos en capital. Diseñan la estructura fiscal y financiera más eficiente para que adquieras equipamiento de alto valor sin descapitalizarte.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Orientados a operaciones de mayor escala, manejan líneas robustas que generalmente van desde los $10,000,000 hasta superar los $100,000,000 de pesos.</p>
      </div>
    `
  },
  { 
    name: 'hey banco', 
    slug: 'hey-banco', 
    logo: '../../images/logo-hey-banco.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Es el brazo 100% digital de Banregio. Una institución bancaria regulada que combina la agilidad y experiencia de usuario de una fintech con el respaldo, solidez y seguridad de un banco tradicional.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Ofrecen un ecosistema financiero completo para tu empresa. Brindan tarjetas de crédito empresariales y créditos para capital de trabajo, evaluando el historial y la facturación de tu negocio.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Todo el trámite es en línea. La pre-aprobación es inmediata y el proceso completo de evaluación y fondeo para líneas de crédito toma en promedio de 48 a 72 horas hábiles.</p>
        
        <h3>Ventaja principal</h3>
        <p>Centralizas toda la operación diaria de tu negocio en una sola plataforma digital muy intuitiva.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Sus líneas de crédito PyME ágiles (sin necesidad de garantía hipotecaria) alcanzan generalmente hasta los $3,000,000 de pesos.</p>
      </div>
    `
  },
  { 
    name: 'Anticipa', 
    slug: 'anticipa', 
    logo: 'https://www.credenza.mx/img/clients/ANTICIPA.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Plataforma financiera (recientemente integrada al ecosistema de Finsus) especializada en inyectar liquidez a los negocios a través del anticipo de sus ventas.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>No es un crédito tradicional con cuotas fijas. Evalúan el historial de tu terminal punto de venta (TPV) y te adelantan capital. La devolución se realiza automáticamente reteniendo un porcentaje de tus ventas diarias con tarjeta.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Proceso 100% digital. Emiten pre-aprobación en un máximo de 24 horas, depositando los fondos entre 24 y 48 horas una vez que se firma el contrato.</p>
        
        <h3>Ventaja principal</h3>
        <p>Flexibilidad absoluta. La retención se ajusta a tu nivel de transacciones diarias, asegurando que tu flujo de efectivo no se vea comprometido si las ventas varían.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Otorgan líneas desde $150,000 pesos, alcanzando generalmente hasta 1.5 a 2.5 veces tus ventas mensuales cobradas con tarjeta.</p>
      </div>
    `
  },
  { 
    name: 'axionex Financiera', 
    slug: 'axionex-financiera', 
    logo: '../../images/logo-axionex.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Es una SOFOM mexicana enfocada en impulsar el crecimiento y la operatividad de las PyMEs a través de soluciones de liquidez rápidas y personalizadas.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Ofrecen Crédito Simple, Crédito Revolvente y Arrendamiento Financiero. Analizan el panorama completo de la empresa, por lo que el Buró de Crédito no es el factor determinante para su autorización (generalmente solicitan garantía hipotecaria).</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Cuentan con un proceso de análisis ágil y transparente que les permite emitir una pre-aprobación en un lapso de 2 a 3 días.</p>
        
        <h3>Ventaja principal</h3>
        <p>Flexibilidad en sus criterios de evaluación.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Sus líneas de crédito y arrendamiento PyME van desde los $300,000 pesos y alcanzan hasta los $5,000,000 de pesos.</p>
      </div>
    `
  },
  { 
    name: 'Bx+', 
    slug: 'bx-plus', 
    logo: '../../images/logo-bxplus.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Institución bancaria mexicana enfocada en atender al sector empresarial, agropecuario y corporativo.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Operan bajo un modelo de banca tradicional. Ofrecen un portafolio que incluye Crédito Simple, Crédito Revolvente, Arrendamiento y Factoraje, estructurando los financiamientos según el perfil de la empresa.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Al requerir un análisis tradicional por comité, el proceso de evaluación y autorización toma en promedio de 2 a 4 semanas una vez entregado el expediente completo.</p>
        
        <h3>Ventaja principal</h3>
        <p>Ofrecen el esquema y los productos de la banca tradicional.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Sus líneas de crédito corporativo suelen alcanzar hasta los $50,000,000 de pesos (el monto final depende de las garantías y el análisis del proyecto).</p>
      </div>
    `
  },
  { 
    name: 'Finsus', 
    slug: 'finsus', 
    logo: '../../images/logo-finsus.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Sociedad Financiera Popular (SOFIPO) regulada, que opera bajo un modelo 100% digital.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Ofrecen soluciones de inversión y financiamiento para PyMEs. Evalúan la capacidad de pago mediante procesos tecnológicos, permitiendo a las empresas acceder a esquemas de crédito con o sin el requerimiento de una garantía inmobiliaria.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Al estar centralizado en una plataforma digital, la pre-aprobación inicial suele darse en cuestión de horas. El fondeo final se concreta en pocos días hábiles tras la firma y revisión del expediente.</p>
        
        <h3>Ventaja principal</h3>
        <p>Trámite de solicitud completamente en línea, simplificando el acceso al crédito sin necesidad de acudir a sucursales físicas.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Sus líneas de crédito para negocios alcanzan generalmente hasta $7,500,000 de pesos en esquemas sin garantía, y pueden llegar hasta $25,000,000 de pesos si se cuenta con respaldo inmobiliario.</p>
      </div>
    `
  },
  { 
    name: 'Hay Cash', 
    slug: 'hay-cash', 
    logo: 'https://socasesores.com/oficinas/img/bancos/empresarial/HEY-CASH-color.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Empresa financiera mexicana especializada en brindar liquidez rápida a negocios formales a través del esquema de adelanto de ventas.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Evalúan el historial de facturación de la Terminal Punto de Venta (TPV) del negocio (solicitando un volumen mínimo de ventas mensuales con tarjeta). El crédito se paga de manera automática mediante la retención de un porcentaje fijo sobre las ventas futuras diarias.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Su proceso es 100% digital. Una vez que se entrega la información completa y se aprueba el trámite, el fondeo se realiza en un lapso de 24 a 72 horas.</p>
        
        <h3>Ventaja principal</h3>
        <p>El esquema de pago es variable y se adapta directamente al flujo de ingresos del negocio, sin plazos fijos ni cuotas forzosas.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Otorgan un adelanto de capital que generalmente alcanza hasta 2.5 veces el promedio de las ventas mensuales cobradas con tarjeta.</p>
      </div>
    `
  },
  { 
    name: 'BANORTE', 
    slug: 'banorte', 
    logo: '../../images/logo-banorte.png',
    contentHtml: `
      <div class="partner-details">
        <h3>¿Quiénes son?</h3>
        <p>Institución bancaria mexicana de alcance nacional, que cuenta con una división específica para la atención financiera de PyMEs y corporativos.</p>
        
        <h3>¿Cómo trabajan?</h3>
        <p>Operan bajo el modelo de banca múltiple tradicional. Ofrecen Crédito Simple, requiriendo un análisis detallado de estados financieros, historial crediticio y, frecuentemente, la constitución de garantías tangibles.</p>
        
        <h3>Tiempo de respuesta</h3>
        <p>Al requerir una evaluación integral y autorización mediante comité de crédito, el proceso toma en promedio de 2 a 4 semanas a partir de la entrega del expediente completo.</p>
        
        <h3>Ventaja principal</h3>
        <p>Acceso a productos con tasas de interés del sector bancario tradicional.</p>
        
        <h3>Monto Máximo de financiamiento</h3>
        <p>Sus líneas de crédito para el segmento PyME alcanzan generalmente hasta los $30,000,000 de pesos (pudiendo estructurar montos superiores para el sector corporativo o con garantías específicas).</p>
      </div>
    `
  },
  { name: 'AFIRME', slug: 'afirme', logo: '../../images/logo-afirme.png' },
  { name: 'Creze', slug: 'creze', logo: 'https://fincor.com.mx/wp-content/uploads/2019/08/creze222.png' }
];

const template = (partner) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${partner.name} - Alianzas Estratégicas | SOC · Firma 7</title>
  <meta name="description" content="Conoce nuestra alianza estratégica con ${partner.name}." />
  <link rel="icon" href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23006d4e"><circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/><circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/></svg>' type="image/svg+xml">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --green: #006d4e; --green-dark: #052b22; --green-light: #e6f4ef;
      --charcoal: #1a1a2e; --gray-subtle: #f8f9fa; --gray-border: #e9ecef; --gray-text: #6c757d;
    }
    body { font-family: 'Inter', sans-serif; background: #fff; color: var(--charcoal); min-height: 100vh; display: flex; flex-direction: column; }
    
    /* NAVBAR */
    .navbar { position: fixed; top: 0; left: 0; width: 100%; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--gray-border); box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .navbar-inner { max-width: 1280px; margin: 0 auto; padding: 0 2rem; height: 80px; display: flex; align-items: center; justify-content: space-between; }
    .logo-link { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo-icon { width: 36px; height: 36px; color: var(--green); }
    .logo-text { display: flex; flex-direction: column; }
    .logo-name { display: flex; align-items: center; gap: 10px; line-height: 1; }
    .logo-name span { font-size: 1.5rem; font-weight: 700; color: var(--green); letter-spacing: -0.01em; }
    .logo-divider { height: 24px; width: 2px; background: var(--green); }
    .logo-sub { font-size: 0.52rem; font-weight: 700; letter-spacing: 0.18em; color: var(--green); text-transform: uppercase; margin-top: 3px; }
    
    .desktop-menu { display: none; align-items: center; gap: 2rem; }
    @media (min-width: 768px) { .desktop-menu { display: flex; } }
    .nav-link { font-size: 0.875rem; font-weight: 500; color: #4B5563; text-decoration: none; transition: color 0.2s; cursor: pointer; }
    .nav-link:hover { color: #006d4e; }
    .flex-icon { display: flex; align-items: center; gap: 6px; }
    .nav-btn-primary { background: #1a1a2e; color: white; padding: 0.625rem 1.5rem; font-size: 0.875rem; font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 8px; transition: background 0.3s; box-shadow: 0 10px 15px -3px rgba(0, 109, 78, 0.2); cursor: pointer; }
    .nav-btn-primary:hover { background: #006d4e; }
    .mobile-toggle { background: transparent; border: none; color: #4B5563; cursor: pointer; display: flex; align-items: center; }
    @media (min-width: 768px) { .mobile-toggle { display: none; } }
    .mobile-toggle:hover { color: #006d4e; }
    .mobile-menu { display: none; background: white; border-top: 1px solid #F3F4F6; position: absolute; width: 100%; top: 80px; left: 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    .mobile-menu.active { display: block; }
    .mobile-nav-link { display: block; padding: 1rem 1.25rem; font-size: 1rem; font-weight: 500; color: #4B5563; text-decoration: none; transition: background 0.2s; border-bottom: 1px solid #f9fafb; }
    .mobile-nav-link:hover { background: #F9FAFB; color: #006d4e; }
    .mobile-nav-btn { display: block; padding: 1rem 1.25rem; font-size: 1rem; font-weight: 700; color: #006d4e; background: var(--green-light); text-decoration: none; }

    /* CONTENT */
    .partner-content { flex: 1; max-width: 800px; margin: 0 auto; padding: 10rem 2rem 5rem; text-align: center; width: 100%; animation: fadeUp 0.6s ease; }
    
    .partner-logo-container {
      width: 240px; height: 140px; margin: 0 auto 2.5rem; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem; background: #fff; border: 1px solid var(--gray-border); border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.05);
    }
    .partner-logo-container img { max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply; }
    
    h1 { font-family: 'Playfair Display', serif; font-size: 3.5rem; color: var(--charcoal); margin-bottom: 1rem; }
    p.subtitle { font-size: 1.1rem; color: var(--gray-text); line-height: 1.7; margin-bottom: 3rem; max-width: 600px; margin-left: auto; margin-right: auto; }
    
    .partner-details { max-width: 600px; margin: 0 auto 3rem; text-align: left; background: var(--gray-subtle); padding: 2.5rem; border-radius: 16px; border: 1px solid var(--gray-border); box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .partner-details h3 { font-size: 1.05rem; color: var(--green); margin-bottom: 0.6rem; margin-top: 1.5rem; font-weight: 700; }
    .partner-details h3:first-child { margin-top: 0; }
    .partner-details p { font-size: 0.95rem; color: var(--charcoal); line-height: 1.6; }
    .contact-btn {
      display: inline-flex; align-items: center; gap: 10px; padding: 1rem 2.5rem; background: var(--green); color: white;
      text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s;
    }
    .contact-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,109,78,0.25); }

    /* FOOTER */
    footer { background: var(--green-dark); color: white; padding: 2.5rem 2rem; text-align: center; }
    footer .footer-inner { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    footer .logo-wrap { display: flex; align-items: center; gap: 10px; }
    footer .f-logo-icon { width: 28px; height: 28px; color: white; }
    footer .f-logo-name { display: flex; align-items: center; gap: 8px; }
    footer .f-logo-name span { font-size: 1.25rem; font-weight: 700; color: white; }
    footer .f-logo-divider { height: 20px; width: 1.5px; background: rgba(255,255,255,0.4); }
    footer p { font-size: 0.8rem; color: rgba(255,255,255,0.45); }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 640px) { h1 { font-size: 2.5rem; } .logo-sub { display: none; } }
  </style>
</head>
<body>

  <nav class="navbar" id="main-nav">
    <div class="navbar-inner">
      <a href="/" class="logo-link">
        <svg class="logo-icon" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
          <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/>
          <circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
        </svg>
        <div class="logo-text">
          <div class="logo-name"><span>SOC</span><div class="logo-divider"></div><span style="font-weight:400;">FIRMA 7</span></div>
          <span class="logo-sub">Líderes en Asesoría Financiera</span>
        </div>
      </a>

      <div class="desktop-menu">
        <a href="/#methodology" class="nav-link">Metodología</a>
        <a href="/alianzas/" class="nav-link" style="color:#006d4e;">Alianzas</a>
        <a href="https://calculadora.firma7.com" target="_blank" class="nav-link flex-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
          Calculadora
        </a>
        <a href="/#profiling" class="nav-btn-primary">
          Diagnóstico Rápido 
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>

      <button class="mobile-toggle" id="mobile-toggle" aria-label="Abrir menú">
        <svg id="icon-menu" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg id="icon-close" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="mobile-menu" id="mobile-menu">
      <a href="/#methodology" class="mobile-nav-link">Metodología</a>
      <a href="/alianzas/" class="mobile-nav-link" style="color:#006d4e; background:#f9fafb;">Alianzas</a>
      <a href="https://calculadora.firma7.com" target="_blank" class="mobile-nav-link flex-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
        Calculadora de Crédito
      </a>
      <a href="/#profiling" class="mobile-nav-btn">Iniciar Diagnóstico</a>
    </div>
  </nav>

  <main class="partner-content">
    <div class="partner-logo-container">
      <img src="${partner.logo}" alt="Logo de ${partner.name}" />
    </div>
    ${partner.contentHtml ? partner.contentHtml : '<p class="subtitle">Conoce los detalles de nuestra red de financiamiento y cómo esta alianza puede impulsar el crecimiento de tu empresa.</p>'}
    
    <a href="https://api.whatsapp.com/send?phone=5215525069817&text=${encodeURIComponent(`Hola, me interesa iniciar un diagnóstico financiero con ${partner.name}. ¿Me podrían dar información?`)}" class="contact-btn" target="_blank" rel="noopener noreferrer">
      Contactar a un asesor por WhatsApp
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
    </a>
  </main>

  <footer>
    <div class="footer-inner">
      <div class="logo-wrap">
        <svg class="f-logo-icon" viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/><circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/></svg>
        <div class="f-logo-name"><span>SOC</span><div class="f-logo-divider"></div><span style="font-weight:400;">FIRMA 7</span></div>
      </div>
      <p>&copy; ${new Date().getFullYear()} Firma 7. Todos los derechos reservados.</p>
    </div>
  </footer>

  <script>
    const toggleBtn = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const iconMenu = document.getElementById('icon-menu');
    const iconClose = document.getElementById('icon-close');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) {
          iconMenu.style.display = 'none';
          iconClose.style.display = 'block';
        } else {
          iconMenu.style.display = 'block';
          iconClose.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>
`;

partners.forEach(partner => {
  const dirPath = path.join(process.cwd(), 'alianzas', partner.slug);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(path.join(dirPath, 'index.html'), template(partner));
});

console.log('Se generaron ' + partners.length + ' subdirectorios con éxito.');
