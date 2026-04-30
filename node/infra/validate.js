import { ERROR_CODE, ClientError } from './error.js';

export function required(value, name = 'value') {
  if (value == null || value === '') {
    throw new ClientError(ERROR_CODE.ARG_MISSING, `missing ${name}`, { name });
  }

  return value;
}

export function nonBlank(value, name = 'value') {
  required(value, name);

  if (typeof value === 'string' && value.trim() === '') {
    throw new ClientError(ERROR_CODE.ARG_EMPTY, `empty ${name}`, { name });
  }

  return value;
}

export function callable(fn, name = 'function') {
  if (typeof fn !== 'function') {
    throw new ClientError(ERROR_CODE.ARG_INVALID, `invalid ${name}`, { name });
  }

  return fn;
}

export function emitter(value, name = 'emitter') {
  if (
    !value ||
    typeof value.on !== 'function' ||
    typeof value.off !== 'function'
  ) {
    throw new ClientError(ERROR_CODE.ARG_INVALID, `invalid ${name}`, { name });
  }

  return value;
}