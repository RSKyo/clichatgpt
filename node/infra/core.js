import { ERROR_CODE, ClientError } from './error.js';

export function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch {
    return String(url || '').trim();
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function ensurePositiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function toPositiveNumber(value, fallback) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return ensurePositiveNumber(n, fallback);
}

const TRUE_VALUES = new Set([true, 'true', '1']);
const FALSE_VALUES = new Set([false, 'false', '0']);

export function toBool(value, field = 'boolean', defaultValue = true) {
  if (value == null || value === '') return defaultValue;

  if (TRUE_VALUES.has(value)) return true;
  if (FALSE_VALUES.has(value)) return false;

  throw new ClientError(
    ERROR_CODE.ARG_INVALID,
    `invalid ${field}`
  );
}

export function toNumber(value, field = 'number') {
  if (value == null || value === '') {
    throw new ClientError(
      ERROR_CODE.ARG_INVALID,
      `invalid ${field}`
    );
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new ClientError(
      ERROR_CODE.ARG_INVALID,
      `invalid ${field}`
    );
  }

  return n;
}

export function toInt(value, field = 'integer') {
  const n = toNumber(value, field);

  if (!Number.isInteger(n)) {
    throw new ClientError(
      ERROR_CODE.ARG_INVALID,
      `invalid ${field} (must be integer)`
    );
  }

  return n;
}
