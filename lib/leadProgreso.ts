import { supabase } from './supabase';

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
