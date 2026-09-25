export function formatCurrency(value, options = {}) {
  const { compact = false, fallback = '—' } = options;

  if (value === null || value === undefined || value === '') return fallback;

  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;

  if (compact) {
    if (Math.abs(number) >= 10000000) return `₹${(number / 10000000).toFixed(1)}Cr`;
    if (Math.abs(number) >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
    if (Math.abs(number) >= 1000) return `₹${(number / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatDate(value, format = 'short') {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const formats = {
    short: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    datetime: {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return new Intl.DateTimeFormat('en-IN', formats[format] || formats.short).format(date);
}

export function formatLabel(value) {
  if (!value) return '—';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function formatNumber(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toLocaleString('en-IN');
}

export function formatPercent(value, decimals = 1, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toFixed(decimals)}%`;
}