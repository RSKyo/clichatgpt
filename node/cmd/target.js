// ========================
// CLI target commands
// ========================
import { normalizeUrl } from '../infra/url.js';

import {
  listTargets,
  hasTarget,
  newTarget,
  activateTarget,
  closeTarget,
  findTarget,
  currentTarget,
} from '../cdp/target.js';

// target 命令注册表
export const TARGET_COMMANDS = {
  list: handle_list,
  has: handle_has,
  new: handle_new,
  open: handle_open,
  activate: handle_activate,
  close: handle_close,
  find: handle_find,
  current: handle_current,
};

async function handle_list() {
  return await listTargets();
}

async function handle_has(args) {
  const [targetId] = args;
  return await hasTarget(targetId);
}

async function handle_new(args) {
  const [url] = args;
  return await newTarget(url);
}

async function handle_open(args) {
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

async function handle_activate(args) {
  const [targetId] = args;
  await activateTarget(targetId);
}

async function handle_close(args) {
  const [targetId] = args;
  await closeTarget(targetId);
}

async function handle_find(args) {
  const [keyword] = args;
  return await findTarget(keyword);
}

async function handle_current() {
  return await currentTarget();
}