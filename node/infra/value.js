export function assert(value, error) {
  if (value === null || value === undefined) {
    throw typeof error === 'function' ? error() : error;
  }
  return value;
}

export function ensure(value, defaultValue) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value;
}

export function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parsePositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) ? n : null;
}

export function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : null;
}

export function parseBool(value) {
  if (typeof value !== 'string') return null;

  const v = value.toLowerCase();

  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;

  return null;
}

export function parseNonBlank(value) {
  if (value === undefined || value === null) return null;

  const str = String(value).trim();
  return str !== '' ? str : null;
}

export function isCallable(value) {
  return typeof value === 'function';
}

export function isEmitter(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.on === 'function' &&
    typeof value.off === 'function'
  );
}