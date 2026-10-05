// Horario de atención: lunes a viernes, 8:00 a 18:00, hora de la Ciudad de México.
export const HORARIO_ATENCION_TEXTO = 'lunes a viernes de 8:00 a 18:00 h (hora CDMX)';

const DIAS_HABILES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HORA_INICIO = 8;
const HORA_FIN = 18;

export interface EstadoAtencion {
  abierto: boolean;
  // Cuándo nos comunicamos si estamos fuera de horario (p. ej. "mañana a primera hora").
  proximoContacto: string;
}

export function estadoAtencion(ahora: Date = new Date()): EstadoAtencion {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(ahora);

  const dia = partes.find(p => p.type === 'weekday')?.value ?? 'Mon';
  const hora = Number(partes.find(p => p.type === 'hour')?.value ?? '12') % 24;
  const esHabil = DIAS_HABILES.includes(dia);

  if (esHabil && hora >= HORA_INICIO && hora < HORA_FIN) {
    return { abierto: true, proximoContacto: '' };
  }

  let proximoContacto: string;
  if (esHabil && hora < HORA_INICIO) proximoContacto = 'hoy a partir de las 8:00 h';
  else if (dia === 'Fri' || dia === 'Sat' || dia === 'Sun') proximoContacto = 'el lunes a primera hora';
  else proximoContacto = 'mañana a primera hora';

  return { abierto: false, proximoContacto };
}
