import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-charcoal mb-3">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const AvisoPrivacidad: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline">
            <svg viewBox="0 0 100 100" fill="#006d4e" className="w-9 h-9">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#006d4e]">SOC</span>
                <div className="h-5 w-px bg-[#006d4e]" />
                <span className="text-xl font-medium text-[#006d4e]">FIRMA 7</span>
              </div>
              <span className="hidden sm:block text-[0.5rem] font-bold tracking-[0.15em] text-[#006d4e] uppercase">
                LÍDERES EN ASESORÍA FINANCIERA
              </span>
            </div>
          </a>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#006d4e] text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Ir al inicio
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl md:text-4xl text-charcoal font-bold mb-2">Aviso de Privacidad</h1>
        <p className="text-gray-500 text-sm mb-10">Última actualización: {new Date().getFullYear()}</p>

        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          En cumplimiento a lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares, publicada en el Diario Oficial de la Federación el día 5 de Julio de 2010, SINERGIA SOC
          S.A. de C.V. hace del conocimiento del público en general lo siguiente:
        </p>

        <Section title="La Identidad y Domicilio del Responsable">
          <p>Sinergia SOC S.A. de C.V.</p>
          <p>Con domicilio en Calle Hamburgo Nº 227</p>
          <p>Col. Juárez, Delegación Cuauhtémoc</p>
          <p>C.P.06600 México D.F.</p>
          <p>Tel. 52565770</p>
        </Section>

        <Section title="Datos Personales que se tratarán">
          <p>
            SINERGIA SOC, S.A. DE C.V., le informa que posee, recaba o recabará de usted, los datos personales
            necesarios, incluyendo aquéllos considerados como sensibles conforme a la Ley, principalmente para una
            adecuada prestación de servicios, así como para la celebración de actos que se puedan realizar conforme
            a la Ley. Dichos datos personales pueden haber sido o pueden ser obtenidos de usted, ya sea
            personalmente o bien, directamente por cualquier medio electrónico, óptico, sonoro, visual, o a través
            de cualquier otra tecnología. Asimismo, podemos obtener datos personales de los que usted es titular, a
            través de terceros y de otras fuentes permitidas por la ley.
          </p>
          <p>Los datos personales recabados o que se recaban podrán incluir, entre otros, los siguientes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-charcoal">Datos de identificación y de contacto:</strong> nombre completo,
              dirección, teléfono de casa, celular y/o de trabajo, estado civil, firma, firma electrónica, correo
              electrónico, nombre de usuario y contraseña, dirección I.N.E., C.U.R.P., lugar y fecha de nacimiento,
              edad, nombres de familiares dependientes y beneficiarios, así como sus domicilios, entre otros.
            </li>
            <li>
              <strong className="text-charcoal">Datos laborales:</strong> ocupación, puesto, área o departamento,
              domicilio, teléfono y correo de trabajo, referencias laborales, referencias personales y referencias
              comerciales, entre otros.
            </li>
            <li>
              <strong className="text-charcoal">Datos financieros o patrimoniales:</strong> bienes muebles e
              inmuebles, historial crediticio, ingresos y egresos, cuentas bancarias, seguros, afores, fianzas,
              servicios contratados, entre otros.
            </li>
          </ul>
        </Section>

        <Section title="Datos Excluidos">
          <p>
            El sitio web de SINERGIA SOC S.A. de C.V., puede incluir enlaces a sitios web de terceros. Si obtiene
            acceso a dichos enlaces, abandonará el sitio web de SINERGIA SOC, por lo cual SINERGIA SOC, no asume
            ninguna responsabilidad en relación con esos sitios web de terceros. Si publica, comenta o comparte
            información personal, incluidas fotografías, en cualquier foro público, red social, blog u otro foro de
            este tipo, debe tener en cuenta que cualquier información personal que publique la podrán leer, ver,
            recabar o utilizar otros usuarios de dichos foros, y se podría utilizar para ponerse en contacto con
            usted, enviarle mensajes no solicitados con fines que ni usted ni SINERGIA SOC, pueden controlar.
          </p>
          <p>
            Derivado de ello SINERGIA SOC no es responsable de la información personal que decida enviar a estos
            foros o redes sociales.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            El usuario, titular y/o el visitante del sitio web de SINERGIA SOC conocen y acepta que SINERGIA SOC
            podrá utilizar un sistema de seguimiento mediante la utilización de cookies (las "Cookies").
          </p>
          <p>
            Las "Cookies" son pequeños archivos que se instalan en el disco rígido, con una duración limitada en el
            tiempo que ayudan a personalizar los servicios.
          </p>
          <p>También ofrecemos ciertas funcionalidades que sólo están disponibles mediante el empleo de "Cookies".</p>
          <p>
            Las "Cookies" se utilizan con el fin de conocer los intereses, el comportamiento y la demografía de
            quienes visitan o son usuarios de nuestro Sitio Web y de esa forma, comprender mejor sus necesidades e
            intereses y darles un mejor servicio o proveerle información relacionada.
          </p>
          <p>
            También usaremos la información obtenida por intermedio de las "Cookies" para analizar las páginas
            navegadas por el visitante o usuario, las búsquedas realizadas, mejorar nuestras iniciativas comerciales
            y promocionales, mostrar publicidad o promociones, banners de interés, noticias sobre SINERGIA SOC,
            perfeccionar nuestra oferta de contenidos y artículos, personalizar dichos contenidos, presentación y
            servicios; también podremos utilizar "Cookies" para promover y hacer cumplir las reglas y seguridad del
            sitio.
          </p>
          <p>SINERGIA SOC podrá agregar "Cookies" en los correos electrónicos que envíe para medir la efectividad de las promociones.</p>
          <p>
            Utilizamos adicionalmente las "Cookies" para que el usuario no tenga que introducir su clave tan
            frecuentemente durante una sesión de navegación, también para contabilizar y corroborar las
            inscripciones, la actividad del usuario y otros conceptos para el Programa SINERGIA SOC y otros acuerdos
            comerciales, siempre teniendo como objetivo de la instalación de las "Cookies", el beneficio del usuario
            que la recibe, y no será usado con otros fines ajenos a SINERGIA SOC.
          </p>
          <p>
            Se establece que la instalación, permanencia y existencia de las "Cookies" en el computador del
            usuario, titular y/o visitante depende de su exclusiva voluntad y puede ser eliminada de su computador
            cuando el usuario así lo desee.
          </p>
          <p>
            Adicionalmente, se pueden encontrar "Cookies" u otros sistemas similares instalados por terceros en
            ciertas páginas de nuestro sitio web. Por ejemplo, al navegar por una página creada por un usuario,
            puede que exista una Cookie emplazada en tal página. Se aclara expresamente que estas políticas cubren
            la utilización de "Cookies" por este sitio y no la utilización de "Cookies" por parte de anunciantes.
            Nosotros no controlamos el uso de "Cookies" por terceros.
          </p>
          <p>
            El web beacon es una imagen electrónica, también llamada single-pixel (1 x 1) o pixel transparente, que
            es colocada en código de una página web.
          </p>
          <p>
            Un web beacon tiene finalidades similares a las "Cookies". Adicionalmente un web beacon es utilizado
            para medir patrones de tráfico de los usuarios de una página a otra con el objeto de maximizar como
            fluye el tráfico a través de la web.
          </p>
          <p>
            EVA Employment Verification cuya finalidad es la investigación de información relativa a movimientos de
            las cuentas sobre servicios gubernamentales, siendo de manera enunciativa mas no limitativa, seguridad
            social, impuestos y ahorro para la vivienda.
          </p>
        </Section>

        <Section title="Las Finalidades Del Tratamiento De Datos">
          <p>
            Los datos personales que se encuentran en las bases de datos de SINERGIA SOC S.A. de C.V. y de sus
            subsidiarias y filiales son utilizados para la prestación de los servicios de asesoría financiera y de
            inversión, así como de promoción, comercialización y publicidad de créditos y préstamos de cualquier
            naturaleza ofrecidos por terceras personas y la tramitación y gestión de los mismos ante dichas terceras
            personas. La mediación, gestión o asesoría a personas morales o físicas para la obtención de los
            créditos ante entidades financieras o la comisión o representación o prestación de servicios
            especializados en el ramo hipotecario y financiero; así como también la prestación de otros servicios
            relacionados con el negocio hipotecario o inmobiliario y demás actividades necesarias. Contratar,
            reclutar, seleccionar y capacitar personal con la finalidad de proporcionar servicios laborales en las
            áreas administrativas, informáticas y de servicios de apoyo a personas físicas y morales.
          </p>
          <p>
            SINERGIA SOC, S.A. DE C.V., sus subsidiarias y filiales, harán tratamiento de los datos personales
            recabados, incluyendo especialmente aquellos financieros o patrimoniales, así como aquéllos
            considerados sensibles conforme a la Ley en su caso, para los siguientes fines:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Para la prestación de los servicios, así como la celebración de los demás actos que se puedan realizar conforme a la ley.</li>
            <li>La atención de requerimientos de cualquier autoridad competente.</li>
            <li>La realización de cualquier actividad complementaria o auxiliar necesaria para la realización de los fines anteriores.</li>
            <li>La realización de consultas, investigaciones y revisiones en relación a cualquier queja reclamación.</li>
            <li>La puesta en contacto con usted para tratar cualquier tema relacionado con sus datos personales o con el presente aviso de privacidad.</li>
          </ul>
          <p className="font-medium text-charcoal mt-4">El tratamiento de datos personales se limitará:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Al cumplimiento de las finalidades previstas en este aviso de privacidad.</li>
            <li>Para fines distintos que resulten compatibles o análogos a los establecidos en este aviso de privacidad, sin que para ello se requiera obtener nuevamente, en su caso, el consentimiento del titular.</li>
          </ul>
          <p>
            En caso que el Titular desee oponerse al tratamiento para las finalidades previstas en este párrafo,
            sólo deberá suscribir la carta de oposición que para tales efectos le proporcione la Responsable, bajo
            el procedimiento establecido en el siguiente párrafo.
          </p>
        </Section>

        <Section title="Opciones y Medidas para Limitar el Uso o Divulgación de los Datos">
          <p>
            Para restringir, limitar o controlar tus datos personales, SINERGIA SOC S.A. de C.V. cuenta siempre con
            medidas de Seguridad para evitar su divulgación, implementando diversos controles de seguridad y
            protección de la información en sus servidores, equipos de cómputo y redes informáticas. De igual
            manera en la utilización de información de forma física se efectúa un estricto control de vigilancia
            por parte del personal, quien además se adhiere desde el momento de su ingreso a las cláusulas de
            confidencialidad de la empresa.
          </p>
          <p>
            Puedes Acceder, Rectificar, Cancelar tus datos personales, así como Oponerte (ejercicio de tus derechos
            ARCO) al tratamiento de los mismos o en su caso revocar el consentimiento para el fin que nos los hayas
            otorgado a través de tu solicitud.
          </p>
          <p>
            Las medidas para ejercer los derechos de acceso, rectificación, cancelación u oposición de conformidad a
            lo dispuesto en esta Ley y Procedimiento por el cual el responsable comunicara a los titulares de
            cambios al aviso de privacidad de conformidad con lo previsto en esta Ley.
          </p>
          <p>
            El titular podrá ejercer estos derechos, por si mismos o a través de su representante legal por medio de
            una solicitud dirigida a SINERGIA SOC S.A. DE C.V. que contenga como mínimo los siguientes datos:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Nombre del titular.</li>
            <li>Domicilio para recibir respuesta a la solicitud.</li>
            <li>Documentos con que acredite su identidad el titular o la representación legal.</li>
            <li>Descripción clara y precisa de los datos personales sobre los que ejercerá sus derechos.</li>
            <li>Cualquier elemento que facilite la localización de datos personales.</li>
          </ul>
          <p>
            Dicha solicitud y documentos podrán presentarse físicamente en el domicilio de Sinergia SOC S.A. de
            C.V., o por medio de documentos digitalizados a la cuenta de email{' '}
            <a href="mailto:arco@socasesores.com" className="text-[#006d4e] font-medium hover:underline">arco@socasesores.com</a>
            {' '}y{' '}
            <a href="mailto:c.hernandez@socasesores.com.mx" className="text-[#006d4e] font-medium hover:underline">c.hernandez@socasesores.com.mx</a>
            {' '}a la que recaerá respuesta en un plazo máximo de 20 días hábiles contados desde la fecha de
            recepción de la solicitud y cubriendo previamente los gastos de envío que se pudieran generar por el
            envío de la información.
          </p>
        </Section>

        <Section title="Transferencia de Datos que se Efectúen">
          <p>
            SINERGIA SOC S.A. DE C.V., se compromete a cuidar el cumplimiento de todos los principios legales de
            protección en torno a la transferencia de sus Datos Personales. De igual forma, manifiesta su
            compromiso para que se respete en todo momento, el presente aviso de privacidad, por las personas
            físicas o morales a las que se pudiera transferir la información proporcionada, con el fin de dar el
            servicio adecuado y con la mejor calidad a nuestros clientes.
          </p>
          <p>
            Para cumplir con las finalidades de este aviso de privacidad, así como con los fines distintos que
            resulten compatibles o análogos, el Titular acepta y autoriza a SINERGIA SOC, S.A. DE C.V., subsidiarias
            y filiales; para que transmita a cualquier tercero con los que tenga celebrada, o celebre
            posteriormente, una relación jurídica o de negocios, incluyendo de manera enunciativa, mas no
            limitativa, a entidades financieras los datos e información que le haya entregado, por lo que SINERGIA
            SOC, S.A. DE C.V. subsidiarias y filiales se comprometen a velar porque se cumplan todos los principios
            legales de protección en torno a la transferencia de sus datos personales.
          </p>
          <p>
            Al ponerse a disposición del Titular el presente aviso de privacidad y no manifestar éste oposición
            alguna, se entenderá que el Titular otorga SINERGIA SOC, S.A. DE C.V., subsidiarias y filiales su
            consentimiento para llevar a cabo el tratamiento de los Datos Personales que hubieran sido
            proporcionados y/o los que con motivo de alguna de las finalidades establecidas en el presente aviso
            proporcione en lo futuro, ya sea de forma personal o a través de terceros, así como de cualquier medio
            electrónico, óptico, sonoro, audiovisual o a través de cualquier otra tecnología o medio con el que
            llegue a contar.
          </p>
          <p>
            No será necesario el consentimiento expreso para el tratamiento de Datos Personales cuando su manejo
            tenga el propósito de cumplir obligaciones derivadas de una relación jurídica entre el Titular y el
            Responsable, ni en los casos que contempla el artículo 10 de la referida Ley.
          </p>
        </Section>

        <Section title="Procedimiento y Medio por el cual se Comunicará a los Titulares de Cambios al Aviso de Privacidad">
          <p>Sinergia SOC, S.A. de C.V. se reserva el derecho de realizar modificaciones al Aviso de Privacidad.</p>
          <p>
            Para dar a conocer los cambios en el Aviso de Privacidad a los titulares se comunicará a través de la
            página web{' '}
            <a href="https://firma7.com/aviso-de-privacidad" className="text-[#006d4e] font-medium hover:underline">
              https://firma7.com/aviso-de-privacidad
            </a>
            {' '}y en todo caso se aplicarán las medidas compensatorias que refiere la ley.
          </p>
        </Section>
      </main>

      <footer className="bg-[#052b22] text-white py-8 mt-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Firma 7 · SOC Asesores · Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
