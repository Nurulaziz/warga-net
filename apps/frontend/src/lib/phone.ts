export const MIN_LOCAL_PHONE_DIGITS = 9;
export const MAX_LOCAL_PHONE_DIGITS = 13;

/** Ambil digit lokal Indonesia dari input 08…, 8…, 62…, atau +62…. */
export function getIndonesianLocalDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  return digits.slice(0, MAX_LOCAL_PHONE_DIGITS);
}

export function normalizeIndonesianPhone(value: string): string {
  const localDigits = getIndonesianLocalDigits(value);
  return localDigits ? `+62${localDigits}` : '';
}

/** Kelompok 3-4-sisa tanpa membuang digit panjang. */
export function formatIndonesianLocalPhone(localDigits: string): string {
  const digits = localDigits.replace(/\D/g, '').slice(0, MAX_LOCAL_PHONE_DIGITS);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

export function isValidIndonesianLocalPhone(localDigits: string): boolean {
  const length = localDigits.replace(/\D/g, '').length;
  return length >= MIN_LOCAL_PHONE_DIGITS && length <= MAX_LOCAL_PHONE_DIGITS;
}
