import { supabase } from './supabase';
import { compressImageIfNeeded } from './imageCompression';

const MB = 1024 * 1024;
// Actas y estados de cuenta suelen ser escaneos pesados: se permite hasta 20 MB. El resto, 10 MB.
// (El bucket de Supabase acepta hasta 20 MB; este tope por tipo se valida aquí.)
const TIPOS_20MB = ['acta_constitutiva', 'acta_asamblea', 'estado_cuenta'];

export function limiteMbPorTipo(tipoDocumento: string): number {
  return TIPOS_20MB.includes(tipoDocumento) ? 20 : 10;
}
const BUCKET = 'lead-documentos';

// Solo la INE (del cliente o del accionista) puede ser una foto y abrir la cámara del celular.
// Todo lo demás (estados de cuenta, comprobantes, actas, constancias…) se sube únicamente en PDF.
const TIPOS_CON_FOTO = ['ine', 'ine_accionista'];

export function permiteFoto(tipoDocumento: string): boolean {
  return TIPOS_CON_FOTO.includes(tipoDocumento);
}

// Valor del atributo `accept` del selector de archivos: con solo PDF, el celular abre los documentos (no la cámara).
export function aceptaArchivos(tipoDocumento: string): string {
  return permiteFoto(tipoDocumento) ? 'application/pdf,image/*' : 'application/pdf,.pdf';
}

export function esPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export interface UploadDocumentoResult {
  ok: boolean;
  error?: string;
  fileName?: string;
}

export async function uploadDocumento(params: {
  leadId: string;
  tipoDocumento: string;
  slotIndex: number;
  file: File;
}): Promise<UploadDocumentoResult> {
  const { leadId, tipoDocumento, slotIndex } = params;
  if (!permiteFoto(tipoDocumento) && !esPdf(params.file)) {
    return { ok: false, error: 'Este documento debe subirse en PDF. Descárgalo en PDF desde el banco o portal, o escanéalo y guárdalo como PDF.' };
  }
  const file = await compressImageIfNeeded(params.file);

  const limiteMb = limiteMbPorTipo(tipoDocumento);
  if (file.size > limiteMb * MB) {
    return { ok: false, error: `El archivo pesa más de ${limiteMb}MB. Intenta subir el PDF directo del banco/portal en vez de una foto o escaneo.` };
  }

  // Extensión segura: solo letras/números (algunos teléfonos mandan nombres raros).
  const extRaw = file.name.includes('.') ? (file.name.split('.').pop() ?? '') : '';
  const ext = /^[A-Za-z0-9]{1,8}$/.test(extRaw) ? extRaw.toLowerCase() : 'pdf';
  let path = '';

  // Subida con reintentos: una falla momentánea de señal/red del celular no debe tumbar la carga.
  // Cada intento usa su propia ruta (la política de subida solo permite crear, no sobrescribir).
  let ultimoError: unknown = null;
  let subido = false;
  for (let intento = 0; intento < INTENTOS && !subido; intento++) {
    if (intento > 0) await pausa(ESPERA_MS[intento - 1]);
    path = `${leadId}/${tipoDocumento}/${slotIndex}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
    });
    if (!error) { subido = true; break; }
    ultimoError = error;
    if (!esErrorReintentable(error)) break;
  }
  if (!subido) {
    return { ok: false, error: mensajeDeError(ultimoError, 'subir') };
  }

  // La metadata se registra vía RPC (security definer): un upsert directo del
  // navegador requeriría un policy de SELECT en la tabla para que Postgres pueda
  // localizar la fila en conflicto, y eso expondría metadata de otros leads.
  let rpcFallo: unknown = null;
  let registrado = false;
  for (let intento = 0; intento < INTENTOS && !registrado; intento++) {
    if (intento > 0) await pausa(ESPERA_MS[intento - 1]);
    const { error } = await supabase.rpc('record_document_upload', {
      p_lead_id: leadId,
      p_tipo_documento: tipoDocumento,
      p_slot_index: slotIndex,
      p_storage_path: path,
      p_file_name: file.name,
      p_file_size_bytes: file.size,
      p_mime_type: file.type || null,
    });
    if (!error) { registrado = true; break; }
    rpcFallo = error;
    if (!esErrorReintentable(error)) break;
  }
  if (!registrado) {
    return { ok: false, error: mensajeDeError(rpcFallo, 'registrar') };
  }

  return { ok: true, fileName: file.name };
}

const INTENTOS = 3;
const ESPERA_MS = [1200, 3000];
const pausa = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Un error "con estatus" lo respondió el servidor (permisos, formato…); uno sin estatus es de red (sin señal, bloqueo, etc.).
function estatusDe(err: unknown): number | null {
  const e = err as { status?: number | string; statusCode?: number | string } | null;
  const raw = e?.status ?? e?.statusCode;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : raw;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function esErrorDeRed(err: unknown): boolean {
  return estatusDe(err) === null;
}

function esErrorReintentable(err: unknown): boolean {
  const s = estatusDe(err);
  return s === null || s >= 500 || s === 408 || s === 429;
}

function mensajeDeError(err: unknown, paso: 'subir' | 'registrar'): string {
  if (esErrorDeRed(err)) {
    return 'No pudimos conectar con el servidor (revisa tu señal o Wi‑Fi, o desactiva VPN / "Relevo privado" de iCloud). Intenta de nuevo; si sigue igual, mándalo por WhatsApp al 55 2506 9817.';
  }
  return paso === 'subir'
    ? 'No se pudo subir el archivo. Intenta de nuevo; si sigue igual, mándalo por WhatsApp al 55 2506 9817.'
    : 'El archivo se subió pero no se pudo registrar. Intenta de nuevo.';
}
