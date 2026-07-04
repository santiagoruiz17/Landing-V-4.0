import React, { useRef, useState } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const BUCKET = 'lead-documentos';

export type DocumentoTipo =
  | 'constancia_situacion_fiscal' | 'ine' | 'declaracion_anual' | 'estado_cuenta'
  | 'comprobante_domicilio_fiscal' | 'comprobante_domicilio_particular'
  | 'acta_constitutiva' | 'escrituras_modificaciones'
  | 'ine_accionista' | 'comprobante_domicilio_accionista' | 'constancia_situacion_fiscal_accionista';

type Status = 'idle' | 'uploading' | 'success' | 'error';

interface DocumentSlotProps {
  leadId: string;
  tipoDocumento: DocumentoTipo;
  slotIndex?: number;
  label: string;
  optional?: boolean;
  onUploaded?: (tipoDocumento: DocumentoTipo, slotIndex: number) => void;
}

export const DocumentSlot: React.FC<DocumentSlotProps> = ({
  leadId, tipoDocumento, slotIndex = 1, label, optional, onUploaded,
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus('error');
      setError('El archivo pesa más de 10MB. Intenta subir el PDF directo del banco/portal en vez de una foto o escaneo.');
      return;
    }

    setStatus('uploading');
    setFileName(file.name);

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'pdf';
    const path = `${leadId}/${tipoDocumento}/${slotIndex}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
    });

    if (uploadError) {
      setStatus('error');
      setError('No se pudo subir el archivo. Intenta de nuevo.');
      return;
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
      setStatus('error');
      setError('El archivo se subió pero no se pudo registrar. Intenta de nuevo.');
      return;
    }

    setStatus('success');
    onUploaded?.(tipoDocumento, slotIndex);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="field-label !mb-0">{label}</span>
        {optional && (
          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 rounded-full px-2 py-0.5">
            Opcional
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {status === 'idle' && (
        <button
          type="button"
          onClick={openPicker}
          className="w-full flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-firma-green/50 hover:bg-firma-green/5 transition-colors"
        >
          <Upload size={16} className="text-gray-400 flex-shrink-0" />
          Subir archivo (PDF o imagen, máx. 10MB)
        </button>
      )}

      {status === 'uploading' && (
        <div className="w-full flex items-center gap-3 border-2 border-firma-green/30 bg-firma-green/5 rounded-xl px-4 py-3 text-sm text-firma-green">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          Subiendo {fileName}…
        </div>
      )}

      {status === 'success' && (
        <div className="w-full flex items-center justify-between gap-3 border-2 border-firma-green/30 bg-firma-green/5 rounded-xl px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-firma-green font-medium truncate">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span className="truncate">{fileName}</span>
          </span>
          <button type="button" onClick={openPicker} className="text-xs text-gray-400 hover:text-firma-green flex-shrink-0 underline">
            Cambiar
          </button>
        </div>
      )}

      {status === 'error' && (
        <button
          type="button"
          onClick={openPicker}
          className="w-full flex items-center gap-3 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-100 transition-colors text-left"
        >
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <RotateCcw size={14} className="flex-shrink-0" />
        </button>
      )}
    </div>
  );
};
