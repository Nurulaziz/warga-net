import { describe, expect, it } from 'vitest';
import {
  formatIndonesianLocalPhone,
  getIndonesianLocalDigits,
  isValidIndonesianLocalPhone,
  normalizeIndonesianPhone,
} from './phone';

describe('utilitas nomor telepon Indonesia', () => {
  it.each([
    ['0812345678901', '812345678901'],
    ['62812345678901', '812345678901'],
    ['+62 812-3456-78901', '812345678901'],
  ])('menormalisasi %s', (input, expected) => {
    expect(getIndonesianLocalDigits(input)).toBe(expected);
    expect(normalizeIndonesianPhone(input)).toBe(`+62${expected}`);
  });

  it('menampilkan seluruh 13 digit lokal tanpa terpotong', () => {
    expect(formatIndonesianLocalPhone('8123456789012')).toBe('812 3456 789012');
  });

  it('memvalidasi batas panjang 9 sampai 13 digit', () => {
    expect(isValidIndonesianLocalPhone('812345678')).toBe(true);
    expect(isValidIndonesianLocalPhone('8123456789012')).toBe(true);
    expect(isValidIndonesianLocalPhone('81234567')).toBe(false);
  });
});
