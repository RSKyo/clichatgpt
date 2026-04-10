import { ERROR_CODE, CliError } from './protocol.js';



export function parseBool(value, defaultValue = true) {
  if (value == null || value === '') return defaultValue;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
  
    throw new CliError(ERROR_CODE.INVALID_ARGS, `invalid boolean: ${value}`);
}

export function parseInt(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, `invalid ${name}`);
  }

  return n;
}

export function parseFloat(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, `invalid ${name}`);
  }

  return n;
}