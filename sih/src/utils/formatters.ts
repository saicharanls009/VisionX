export function maskMobile(mobile?: string): string {
  if (!mobile) return 'N/A';
  const clean = mobile.trim();
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return '******' + lastFour;
}

export function maskFarmerId(farmerId?: string): string {
  if (!farmerId) return 'N/A';
  const clean = farmerId.trim();
  if (clean.length <= 4) return '****' + clean;
  const lastFour = clean.slice(-4);
  return '****' + lastFour;
}

export function formatDateIndian(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndian(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrencyINR(amount?: number): string {
  if (typeof amount !== 'number') return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

