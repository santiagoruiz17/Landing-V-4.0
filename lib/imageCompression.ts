const COMPRESSION_THRESHOLD_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.75;

// Fotos de celular pueden pesar 8-15MB; las recomprimimos en el navegador antes
// de subirlas para acelerar la subida y evitar fallos en conexiones lentas.
// Si algo falla (formato no soportado, navegador viejo, etc.) devolvemos el
// archivo original tal cual — nunca bloqueamos la subida por esto.
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= COMPRESSION_THRESHOLD_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
