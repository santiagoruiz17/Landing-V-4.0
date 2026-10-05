import React, { useRef, useState } from 'react';
import { Upload, Camera, CheckCircle2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
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
  hint?: string;
  optional?: boolean;
  // Ofrece "Tomar foto" con la cámara trasera (solo se muestra en celulares/tabletas).
  camara?: boolean;
  numero?: number;
  initialFileName?: string;
  // El archivo ya se eliminó por política de retención, pero sabemos que el cliente lo subió.
  initialPurgado?: boolean;
  onUploaded?: (tipoDocumento: DocumentoTipo, slotIndex: number) => void;
}

const esDispositivoTactil = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

export const DocumentSlot: React.FC<DocumentSlotProps> = ({
  leadId, tipoDocumento, slotIndex = 1, label, hint, optional, camara, numero, initialFileName, initialPurgado, onUploaded,
}) => {
  const [purgado, setPurgado] = useState(Boolean(initialPurgado));
  const [status, setStatus] = useState<Status>(initialFileName ? 'success' : 'idle');
  const [fileName, setFileName] = useState(initialFileName ?? '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const camaraRef = useRef<HTMLInputElement>(null);
  const mostrarCamara = Boolean(camara) && esDispositivoTactil();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setPurgado(false);
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

      {hint && <p className="text-xs text-gray-400 leading-relaxed pl-7">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      {mostrarCamara && (
        <input
          ref={camaraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      )}

      {status === 'idle' && (
        mostrarCamara ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => camaraRef.current?.click()}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-firma-green/40 bg-firma-green/5 rounded-xl px-3 py-3 text-sm font-medium text-firma-green hover:bg-firma-green/10 transition-colors"
            >
              <Camera size={16} className="flex-shrink-0" />
              Tomar foto
            </button>
            <button
              type="button"
              onClick={openPicker}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-500 hover:border-firma-green/50 hover:bg-firma-green/5 transition-colors"
            >
              <Upload size={16} className="text-gray-400 flex-shrink-0" />
              Elegir archivo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="w-full flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-firma-green/50 hover:bg-firma-green/5 transition-colors"
          >
            <Upload size={16} className="text-gray-400 flex-shrink-0" />
            Subir archivo (PDF o imagen, máx. 10MB)
          </button>
        )
      )}

      {status === 'uploading' && (
        <div className="w-full flex items-center gap-3 border-2 border-firma-green/30 bg-firma-green/5 rounded-xl px-4 py-3 text-sm text-firma-green">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          Subiendo {fileName}…
        </div>
      )}

      {status === 'success' && (
        <div className="w-full flex items-center justify-between gap-3 border-2 border-firma-green/30 bg-firma-green/5 rounded-xl px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-firma-green font-medium min-w-0">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span className="min-w-0">
              <span className="block truncate">{purgado ? 'Ya lo recibimos' : fileName}</span>
              {purgado && <span className="block text-[11px] font-normal text-gray-400">Por seguridad eliminamos el archivo después de 7 días</span>}
            </span>
          </span>
          <button type="button" onClick={openPicker} className="text-xs text-gray-400 hover:text-firma-green flex-shrink-0 underline">
            {purgado ? 'Volver a subir' : 'Cambiar'}
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
