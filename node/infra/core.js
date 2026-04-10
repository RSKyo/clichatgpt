

export function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch {
    return String(url || '').trim();
  }
}

export function ensurePositiveNumber(value, fallback) {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0
    ? value
    : fallback;
}