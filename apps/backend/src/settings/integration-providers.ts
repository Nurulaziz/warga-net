export type IntegrationCategory = 'payment' | 'whatsapp';

export interface ProviderDefinition {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
}

// Registry tunggal provider yang didukung. Menambah provider baru dimulai di sini,
// lalu implementasikan adapter pengirim/pembayarannya di service kategori terkait.
export const INTEGRATION_PROVIDERS: ProviderDefinition[] = [
  { id: 'disabled', name: 'Tidak aktif', category: 'payment', description: 'Pembayaran online dinonaktifkan' },
  { id: 'midtrans', name: 'Midtrans', category: 'payment', description: 'Midtrans Snap' },
  { id: 'disabled', name: 'Tidak aktif', category: 'whatsapp', description: 'Pengiriman WhatsApp dinonaktifkan' },
  { id: 'fonnte', name: 'Fonnte', category: 'whatsapp', description: 'WhatsApp gateway Fonnte' },
];

export function providersFor(category: IntegrationCategory) {
  return INTEGRATION_PROVIDERS.filter((provider) => provider.category === category);
}

export function assertProvider(category: IntegrationCategory, id: string): void {
  if (!providersFor(category).some((provider) => provider.id === id)) {
    throw new Error(`Provider ${category} tidak didukung: ${id}`);
  }
}
