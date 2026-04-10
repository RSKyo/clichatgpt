// ========================
// CLI target commands
// ========================

import { normalizeUrl } from '../infra/core.js';

import {
  listTargets,
  listWebPageTargets,
  hasTarget,
  newTarget,
  currentTarget,
  activateTarget,
  closeTarget,
  findTarget,
  findWebPageTarget,
} from '../cdp/target.js';

export const TARGET_COMMANDS = {
  list: cmd_list,         // 列出所有 target
  listweb: cmd_listweb,   // 列出网页 target
  has: cmd_has,           // 判断 target 是否存在
  new: cmd_new,           // 新建 target
  open: cmd_open,         // 打开 url
  current: cmd_current,   // 获取当前 target
  activate: cmd_activate, // 激活 target
  close: cmd_close,       // 关闭 target
  find: cmd_find,         // 查找 target
  findweb: cmd_findweb,   // 查找网页 target
};

// 列出所有 target
async function cmd_list() {
  return await listTargets();
}

// 列出网页 target
async function cmd_listweb() {
  return await listWebPageTargets();
}

// 判断 target 是否存在
async function cmd_has(args) {
  const [targetId] = args;
  return await hasTarget(targetId);
}

// 新建 target
async function cmd_new(args) {
  const [url] = args;
  return await newTarget(url);
}

// 打开 url，存在则激活，不存在则新建
async function cmd_open(args) {
  const [url] = args;

  const inputUrl = normalizeUrl(url);

  const targets = await listTargets();
  const target = targets.find(t => normalizeUrl(t.url) === inputUrl);

  if (target) {
    await activateTarget(target.id);
    return target.id;
  }

  return await newTarget(url);
}

// 获取当前 target
async function cmd_current() {
  return await currentTarget();
}

// 激活 target
async function cmd_activate(args) {
  const [targetId] = args;
  await activateTarget(targetId);
}

// 关闭 target
async function cmd_close(args) {
  const [targetId] = args;
  await closeTarget(targetId);
}

// 查找 target
async function cmd_find(args) {
  const [keyword] = args;
  return await findTarget(keyword);
}

// 查找网页 target
async function cmd_findweb(args) {
  const [keyword] = args;
  return await findWebPageTarget(keyword);
}
