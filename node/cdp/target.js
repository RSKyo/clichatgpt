import CDP from 'chrome-remote-interface';
import { HOST, PORT, TARGET_TYPES } from '../infra/env.js';
import { ERROR_CODE, CliError } from '../infra/protocol.js';

function normalizeTarget(t) {
  return {
    id: t.id,
    type: t.type ?? '',
    title: t.title ?? '',
    url: t.url ?? '',
    attached: Boolean(t.attached),
  };
}

function shouldKeepTarget(t) {
  if (!Array.isArray(TARGET_TYPES) || TARGET_TYPES.length === 0) {
    return true;
  }

  return TARGET_TYPES.includes(t.type);
}

function isUsableTarget(target) {
  if (!target) return false;
  if (target.type !== 'page') return false;
  if (!target.url) return false;

  return (
    target.url.startsWith('http://') ||
    target.url.startsWith('https://')
  );
}

/**
 * 获取所有 target
 */
export async function listTargets() {
  const targets = await CDP.List({ host: HOST, port: PORT });

  return targets
    .filter(shouldKeepTarget)
    .filter(isUsableTarget)
    .map(normalizeTarget);
}

export async function hasTarget(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const targets = await listTargets();
  return targets.some(t => t.id === targetId);
}

/**
 * 创建 target
 */
export async function newTarget(url) {
  if (!url) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing url');
  }

  const target = await CDP.New({
    url,
    host: HOST,
    port: PORT,
  });

  return target.id;
}

/**
 * 激活 target
 */
export async function activateTarget(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  await CDP.Activate({
    id: targetId,
    host: HOST,
    port: PORT,
  });
}

/**
 * 关闭 target
 */
export async function closeTarget(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  await CDP.Close({
    id: targetId,
    host: HOST,
    port: PORT,
  });
}

/**
 * 查找 target
 */
export async function findTarget(keyword) {
  if (!keyword) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing keyword');
  }

  const targets = await listTargets();

  const target = targets.find(t =>
    (t.url && t.url.includes(keyword)) ||
    (t.title && t.title.includes(keyword))
  );

  if (!target) {
    throw new CliError(ERROR_CODE.NOT_FOUND, 'target not found');
  }

  return target;
}

/**
 * 获取当前激活 target
 */
export async function currentTarget() {
  const targets = await listTargets();

  const target = targets.find(t => t.attached);

  if (!target) {
    throw new CliError(ERROR_CODE.NOT_FOUND, 'no active target');
  }

  return target;
}

