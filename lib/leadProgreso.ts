import { supabase } from './supabase';

export const MENSAJE_ENVIO_FALLIDO =
  'No pudimos avisar a tu asesor porque falló la conexión. Tu avance no se perdió: revisa tu señal o Wi‑Fi y vuelve a pulsar el botón. Si sigue igual, escríbenos por WhatsApp al 55 2506 9817.';

// Guarda la preferencia de contacto y avisa al equipo. Devuelve ok:true SOLO si el servidor confirmó el aviso
// (o ya se había avisado antes). Antes se mostraba "enviado" aunque la petición hubiera fallado.
export async function avisarEquipoDocumentacion(
  leadId: string, canal: string, horario: string,
): Promise<{ ok: boolean }> {
  const esperas = [0, 1200, 3000];
  for (const espera of esperas) {
    if (espera) await new Promise(r => setTimeout(r, espera));
    try {
      // La preferencia va primero para que aparezca en el correo; si falla, el aviso igual se intenta.
      await supabase.rpc('guardar_preferencia_contacto', { p_lead_id: leadId, p_canal: canal, p_horario: horario });
      const res = await supabase.rpc('send_lead_documentos_email', { p_lead_id: leadId, p_kind: 'completo' });
      if (!res.error) {
        const d = res.data as { sent?: boolean; reason?: string } | null;
        if (d?.sent || d?.reason === 'already_sent') return { ok: true };
      }
    } catch {
      // sin conexión: se reintenta
    }
  }
  return { ok: false };
}

// Carga lo que el cliente ya subió/llenó, con reintentos. Si la conexión falla se devuelve ok:false
// para NO mostrar el formulario como si estuviera vacío (parecería que el cliente no ha subido nada).
export async function cargarProgresoLead(leadId: string): Promise<{ ok: boolean; data: any }> {
  const esperas = [0, 1200, 3000];
  for (const espera of esperas) {
    if (espera) await new Promise(r => setTimeout(r, espera));
    try {
      const res = await supabase.rpc('get_lead_progreso', { p_lead_id: leadId });
      if (!res.error) return { ok: true, data: res.data };
    } catch {
      // sin conexión: se reintenta
    }
  }
  return { ok: false, data: null };
}
