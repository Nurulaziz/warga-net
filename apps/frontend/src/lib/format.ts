// Format nominal ke standar Rupiah: Rp X.XXX.XXX (tanpa desimal)
const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number | null | undefined): string {
  return rupiahFormatter.format(amount || 0);
}
