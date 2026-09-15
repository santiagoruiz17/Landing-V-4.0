import React, { useRef, useState } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { uploadDocumento } from '../lib/uploadDocumento';

export type DocumentoTipo =
  | 'constancia_situacion_fiscal' | 'ine' | 'declaracion_anual' | 'estado_cuenta'
  | 'comprobante_domicilio_fiscal' | 'comprobante_domicilio_particular' | 'comprobante_domicilio_operativo'
  | 'acta_constitutiva' | 'escrituras_modificaciones'
  | 'ine_accionista' | 'comprobante_domicilio_accionista' | 'constancia_situacion_fiscal_accionista'
  | 'acta_matrimonio_accionista';

type Status = 'idle' | 'uploading' | 'success' | 'error';

interface DocumentSlotProps {
  leadId: string;
  tipoDocumento: DocumentoTipo;
  slotIndex?: number;
  label: string;
  optional?: boolean;
  numero?: number;
  initialFileName?: string;
  onUploaded?: (tipoDocumento: DocumentoTipo, slotIndex: number) => void;
}

export const DocumentSlot: React.FC<DocumentSlotProps> = ({
  leadId, tipoDocumento, slotIndex = 1, label, optional, numero, initialFileName, onUploaded,
}) => {
  const [status, setStatus] = useState<Status>(initialFileName ? 'success' : 'idle');
  const [fileName, setFileName] = useState(initialFileName ?? '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setStatus('uploading');
    setFileName(file.name);

    const result = await uploadDocumento({ leadId, tipoDocumento, slotIndex, file });

    if (!result.ok) {
      setStatus('error');
      setError(result.error ?? 'No se pudo subir el archivo. Intenta de nuevo.');
      return;
    }

    setFileName(result.fileName ?? file.name);
    setStatus('success');
    onUploaded?.(tipoDocumento, slotIndex);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {numero != null && (
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              status === 'success' ? 'bg-firma-green text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {numero}
          </span>
        )}
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
        capture="environment"
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
