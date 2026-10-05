// Comportamiento de las landings de alianzas con enlace de oficina (alianzas/<slug>/index.html).
// Es un archivo externo porque la política de seguridad del sitio no permite scripts en línea.
(function () {
  'use strict';

  var body = document.body;
  var slug = body.getAttribute('data-alianza');
  var nombreAlianza = body.getAttribute('data-alianza-nombre') || '';
  var sbUrl = body.getAttribute('data-sb-url');
  var sbKey = body.getAttribute('data-sb-key');

  // Año del pie y menú móvil
  var anio = document.getElementById('anio');
  if (anio) anio.textContent = String(new Date().getFullYear());
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');
  if (burger && menu) burger.addEventListener('click', function () { menu.classList.toggle('open'); });

  var modal = document.getElementById('alianza-modal');
  var form = document.getElementById('alianza-form');
  if (!modal || !form || !slug) return;

  var pasoForm = document.getElementById('alianza-paso-form');
  var pasoOk = document.getElementById('alianza-paso-ok');
  var errorEl = document.getElementById('alianza-error');
  var enviarBtn = document.getElementById('alianza-enviar');
  var ultimoFoco = null;

  var modoPrueba = new URLSearchParams(window.location.search).get('prueba') === '1';
  if (modoPrueba) {
    var aviso = document.createElement('div');
    aviso.textContent = 'MODO PRUEBA: no se guarda ningún dato ni se abre la plataforma de la alianza';
    aviso.setAttribute('style', 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#b45309;color:#fff;font:600 13px Inter,sans-serif;text-align:center;padding:8px 12px');
    body.appendChild(aviso);
  }

  function abrir() {
    ultimoFoco = document.activeElement;
    pasoForm.hidden = false;
    pasoOk.hidden = true;
    errorEl.hidden = true;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    var primero = form.querySelector('input[name="nombre"]');
    if (primero) setTimeout(function () { primero.focus(); }, 50);
  }

  function cerrar() {
    modal.hidden = true;
    document.documentElement.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-alianza-cta]'), function (b) { b.addEventListener('click', abrir); });
  Array.prototype.forEach.call(modal.querySelectorAll('[data-cerrar]'), function (b) { b.addEventListener('click', cerrar); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) cerrar(); });

  function mostrarError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function parametrosUtm() {
    var q = new URLSearchParams(window.location.search);
    return { utm_source: q.get('utm_source') || '', utm_medium: q.get('utm_medium') || '', utm_campaign: q.get('utm_campaign') || '' };
  }

  function rastrear() {
    try { if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: slug }); } catch (e) { /* sin pixel */ }
    try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { alianza: slug }); } catch (e) { /* sin analytics */ }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var nombre = form.elements['nombre'].value.trim();
    var telefono = form.elements['telefono'].value.replace(/\D/g, '');
    if (telefono.length > 10) telefono = telefono.slice(-10);
    var correo = form.elements['correo'].value.trim();
    var autoriza = form.elements['autoriza'].checked;

    if (!nombre) return mostrarError('Escribe tu nombre.');
    if (telefono.length !== 10) return mostrarError('Escribe tu teléfono a 10 dígitos.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return mostrarError('Escribe un correo válido.');
    if (!autoriza) return mostrarError('Marca la casilla para que un asesor pueda contactarte.');

    // Modo prueba (agrega ?prueba=1 a la dirección): valida el formulario y muestra el mensaje final,
    // pero NO guarda nada, NO avisa al equipo, NO crea contacto en GHL y NO abre la plataforma de la alianza.
    if (modoPrueba) {
      document.getElementById('alianza-nombre-ok').textContent = nombre.split(' ')[0];
      document.getElementById('alianza-abrio').hidden = false;
      document.getElementById('alianza-continuar').hidden = true;
      pasoForm.hidden = true;
      pasoOk.hidden = false;
      return;
    }

    // Se abre una pestaña en blanco AHORA (con el clic del usuario) para que el navegador no la bloquee;
    // cuando llegue el enlace de la alianza, se redirige esa pestaña.
    var ventana = null;
    try {
      ventana = window.open('', '_blank');
      if (ventana) ventana.opener = null;
    } catch (err) { ventana = null; }

    enviarBtn.disabled = true;
    var textoOriginal = enviarBtn.textContent;
    enviarBtn.textContent = 'Enviando…';

    var utm = parametrosUtm();
    fetch(sbUrl + '/rest/v1/rpc/registrar_lead_alianza', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: sbKey, Authorization: 'Bearer ' + sbKey },
      body: JSON.stringify({
        p: {
          alianza: slug,
          nombre: nombre,
          telefono: telefono,
          correo: correo,
          autoriza: true,
          sitio_web: form.elements['sitio_web'].value,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
        },
      }),
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error('respuesta inválida');
        rastrear();

        document.getElementById('alianza-nombre-ok').textContent = nombre.split(' ')[0];
        var enlace = res.enlace;
        var abrio = document.getElementById('alianza-abrio');
        var continuar = document.getElementById('alianza-continuar');
        abrio.hidden = true;
        continuar.hidden = true;

        if (enlace) {
          if (ventana && !ventana.closed) {
            ventana.location.href = enlace;
            abrio.hidden = false;
          } else {
            // El navegador bloqueó la pestaña: se ofrece el botón
            continuar.href = enlace;
            continuar.hidden = false;
          }
        } else if (ventana && !ventana.closed) {
          ventana.close();
        }

        pasoForm.hidden = true;
        pasoOk.hidden = false;
      })
      .catch(function () {
        if (ventana && !ventana.closed) ventana.close();
        mostrarError('No pudimos registrar tus datos. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.');
      })
      .then(function () {
        enviarBtn.disabled = false;
        enviarBtn.textContent = textoOriginal;
      });
  });

  // Quita el nombre de la alianza del mensaje si no hay nombre (defensivo)
  if (!nombreAlianza) nombreAlianza = slug;
})();
