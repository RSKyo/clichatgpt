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
