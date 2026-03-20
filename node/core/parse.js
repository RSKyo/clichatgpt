export function parseBool(value, defaultValue = true) {
  if (value == null || value === '') return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}