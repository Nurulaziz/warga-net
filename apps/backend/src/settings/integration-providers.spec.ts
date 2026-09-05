import { assertProvider, providersFor } from './integration-providers';

describe('integration provider registry', () => {
  it('memisahkan provider berdasarkan kategori', () => {
    expect(providersFor('payment').map((item) => item.id)).toEqual(['disabled', 'midtrans']);
    expect(providersFor('whatsapp').map((item) => item.id)).toEqual(['disabled', 'fonnte']);
  });

  it('menolak provider yang belum memiliki adapter', () => {
    expect(() => assertProvider('payment', 'provider-sembarang')).toThrow();
  });
});
