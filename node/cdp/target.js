import CDP from 'chrome-remote-interface';
import { HOST, PORT } from '../infra/env.js';
import { requireArg, requireValue } from './assert.js';

function normalizeTarget(t) {
  return {
    id: t.id,
    type: t.type ?? '',
    title: t.title ?? '',
    url: t.url ?? '',
    attached: Boolean(t.attached),
  };
}

function isWebPageTarget(target) {
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
  return targets.map(normalizeTarget);
}

/**
 * 获取所有网页 target
 */
export async function listWebPageTargets() {
  const targets = await CDP.List({ host: HOST, port: PORT });

  return targets
    .filter(isWebPageTarget)
    .map(normalizeTarget);
}

export async function hasTarget(targetId) {
  requireArg(targetId, 'missing targetId');

  const targets = await listTargets();
  return targets.some(t => t.id === targetId);
}

/**
 * 新建 target
 */
export async function newTarget(url) {
  requireArg(url, 'missing url');

  const target = await CDP.New({
    url,
    host: HOST,
    port: PORT,
  });

  return target.id;
}

/**
 * 获取当前激活的 target
 */
export async function currentTarget() {
  const targets = await listTargets();

  const target = targets.find(t => t.attached);
  requireValue(target, 'no active target');

  return target;
}

/**
 * 激活 target
 */
export async function activateTarget(targetId) {
  requireArg(targetId, 'missing targetId');

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
  requireArg(targetId, 'missing targetId');

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
  requireArg(keyword, 'missing keyword');

  const targets = await listTargets();
  
  const target = targets.find(t =>
    (t.url && t.url.includes(keyword)) ||
    (t.title && t.title.includes(keyword))
  );
  requireValue(target, `no target found for keyword: ${keyword}`);

  return target;
}

/**
 * 查找网页 target
 */
export async function findWebPageTarget(keyword) {
  requireArg(keyword, 'missing keyword');

  const targets = await listWebPageTargets();
  
  const target = targets.find(t =>
    (t.url && t.url.includes(keyword)) ||
    (t.title && t.title.includes(keyword))
  );
  requireValue(target, `no web page target found for keyword: ${keyword}`);
  
  return target;
}
