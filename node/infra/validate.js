import { errors } from './error.js';

// -------------------------------
// 原子判断（全部正向）
// -------------------------------

// existence
export const isRequired = (v) => v != null;

// type
export const isString = (v) => typeof v === 'string';

export const isNumber = (v) =>
  typeof v === 'number' && Number.isFinite(v);

export const isBoolean = (v) => typeof v === 'boolean';

export const isArray = (v) => Array.isArray(v);

export const isObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export const isFunction = (v) => typeof v === 'function';

// string
export const isBlankValue = (v) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '');

export const isTooShort = (v, min) =>
  typeof v === 'string' && v.length < min;

export const isTooLong = (v, max) =>
  typeof v === 'string' && v.length > max;

export const isPatternMatched = (v, regex) =>
  typeof v === 'string' && regex.test(v);

// number
export const isParsableNumber = (v) =>
  v !== '' &&
  v !== null &&
  v !== undefined &&
  Number.isFinite(Number(v));

export const isInteger = (v) =>
  typeof v === 'number' && Number.isInteger(v);

export const isPositive = (v) =>
  typeof v === 'number' && v > 0;

export const isNegative = (v) =>
  typeof v === 'number' && v < 0;

export const isInRange = (v, { min, max } = {}) =>
  typeof v === 'number' &&
  (min == null || v >= min) &&
  (max == null || v <= max);

// collection
export const isInEnum = (v, values) =>
  Array.isArray(values) && values.includes(v);

export const isUnique = (arr) =>
  Array.isArray(arr) && new Set(arr).size === arr.length;

// format
export const isValidEmail = (v) =>
  typeof v === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isValidUrl = (v) => {
  if (typeof v !== 'string') return false;

  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

export const isValidDate = (v) =>
  v !== '' &&
  v !== null &&
  v !== undefined &&
  !Number.isNaN(new Date(v).getTime());


// -------------------------------
// 组合校验（requireXXX）
// -------------------------------

// 必须是字符串且非空
export function requireNonBlankString(value, field) {
  if (!isRequired(value)) {
    throw errors.required(field);
  }

  if (!isString(value)) {
    throw errors.notString(field);
  }

  if (isBlankValue(value)) {
    throw errors.blankValue(field);
  }

  return value.trim();
}

// 必须是字符串（允许空）
export function requireString(value, field) {
  if (!isRequired(value)) {
    throw errors.required(field);
  }

  if (!isString(value)) {
    throw errors.notString(field);
  }

  return value;
}