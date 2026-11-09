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

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
  const path = `${leadId}/${tipoDocumento}/${slotIndex}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
  });
  if (uploadError) {
    return { ok: false, error: 'No se pudo subir el archivo. Intenta de nuevo.' };
  }

  // La metadata se registra vía RPC (security definer): un upsert directo del
  // navegador requeriría un policy de SELECT en la tabla para que Postgres pueda
  // localizar la fila en conflicto, y eso expondría metadata de otros leads.
  const { error: rpcError } = await supabase.rpc('record_document_upload', {
    p_lead_id: leadId,
    p_tipo_documento: tipoDocumento,
    p_slot_index: slotIndex,
    p_storage_path: path,
    p_file_name: file.name,
    p_file_size_bytes: file.size,
    p_mime_type: file.type || null,
  });
  if (rpcError) {
    return { ok: false, error: 'El archivo se subió pero no se pudo registrar. Intenta de nuevo.' };
  }

  return { ok: true, fileName: file.name };
}
