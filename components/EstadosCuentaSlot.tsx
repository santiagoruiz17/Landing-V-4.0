import React, { useRef, useState } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { uploadDocumento } from '../lib/uploadDocumento';

const TIPO_DOCUMENTO = 'estado_cuenta';

type SlotStatus = 'idle' | 'uploading' | 'success' | 'error';

interface Slot {
  status: SlotStatus;
  fileName: string;
  error: string;
}

interface EstadosCuentaSlotProps {
  leadId: string;
  meses: number;
  // Los slot_index reales en la BD son slotIndexBase + mes (1-6), para poder
  // tener varios bancos sin cambiar el esquema de lead_documentos.
  slotIndexBase?: number;
  initialUploaded?: { mes: number; fileName: string }[];
  onUploaded?: (tipoDocumento: 'estado_cuenta', slotIndexReal: number) => void;
}

export const EstadosCuentaSlot: React.FC<EstadosCuentaSlotProps> = ({ leadId, meses, slotIndexBase = 0, initialUploaded, onUploaded }) => {
  const [slots, setSlots] = useState<Slot[]>(
    Array.from({ length: meses }, (_, i) => {
      const restaurado = initialUploaded?.find(u => u.mes === i + 1);
      return restaurado
        ? { status: 'success' as SlotStatus, fileName: restaurado.fileName, error: '' }
        : { status: 'idle' as SlotStatus, fileName: '', error: '' };
    })
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = slots.filter(s => s.status === 'success').length;

  const uploadOne = async (file: File, mes: number) => {
    const slotIndexReal = slotIndexBase + mes;
    setSlots(prev => prev.map((s, i) => i === mes - 1 ? { status: 'uploading', fileName: file.name, error: '' } : s));

    const result = await uploadDocumento({ leadId, tipoDocumento: TIPO_DOCUMENTO, slotIndex: slotIndexReal, file });

    if (!result.ok) {
      setSlots(prev => prev.map((s, i) => i === mes - 1 ? { status: 'error', fileName: file.name, error: result.error ?? 'No se pudo subir el archivo. Intenta de nuevo.' } : s));
      return;
    }

    setSlots(prev => prev.map((s, i) => i === mes - 1 ? { status: 'success', fileName: result.fileName ?? file.name, error: '' } : s));
    onUploaded?.(TIPO_DOCUMENTO, slotIndexReal);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const emptySlotIndexes = slots
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status !== 'success')
      .map(({ i }) => i + 1);

    Array.from(fileList).slice(0, emptySlotIndexes.length).forEach((file, idx) => {
      uploadOne(file, emptySlotIndexes[idx]);
    });
  };

  // Un slot en error no cuenta como "success", así que vuelve a ser el primer
  // slot disponible para el próximo archivo seleccionado.
  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="field-label !mb-0">Estados de cuenta bancarios (últimos {meses} meses)</span>
        <span className="text-xs font-semibold text-firma-green">{completedCount} de {meses}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/*"
        capture="environment"
        className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-2">
        {completedCount < meses && (
          <button
            type="button"
            onClick={openPicker}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
          >
            <Upload size={16} className="text-gray-400 flex-shrink-0" />
            Selecciona uno o varios archivos (PDF o imagen, máx. 10MB c/u)
          </button>
        )}

        <div className="grid sm:grid-cols-2 gap-2">
          {slots.map((slot, idx) => {
            const mes = idx + 1;
            return (
              <div
                key={mes}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  slot.status === 'success' ? 'bg-firma-green/5 text-firma-green'
                  : slot.status === 'uploading' ? 'bg-firma-green/5 text-firma-green'
                  : slot.status === 'error' ? 'bg-red-50 text-red-600'
                  : 'bg-gray-50 text-gray-400'
                }`}
              >
                {slot.status === 'uploading' && <Loader2 size={13} className="animate-spin flex-shrink-0" />}
                {slot.status === 'success' && <CheckCircle2 size={13} className="flex-shrink-0" />}
                {slot.status === 'error' && <AlertCircle size={13} className="flex-shrink-0" />}
                <span className="font-medium flex-shrink-0">Mes {mes}:</span>
                {slot.status === 'idle' ? (
                  <span className="truncate">Pendiente</span>
                ) : slot.status === 'error' ? (
                  <button type="button" onClick={openPicker} className="truncate underline text-left">
                    {slot.error}
                  </button>
                ) : (
                  <span className="truncate">{slot.fileName}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
