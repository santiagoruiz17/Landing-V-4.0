// Validación de correo más estricta que un simple "algo@algo.algo" — exige un dominio con al menos un punto real.
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function esCorreoValido(correo: string): boolean {
  return EMAIL_REGEX.test(correo.trim());
}

// Los teléfonos mexicanos que maneja el sitio son a 10 dígitos — se filtra mientras
// escriben (no solo se valida al final) para que no puedan meter letras, espacios ni de más.
export function soloDigitos10(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}
