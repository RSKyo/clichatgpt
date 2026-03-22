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
// 负责“target 对象管理”这一层：
// - 列出有哪些 target
// - target 是否存在
// - 新建 target
// - 打开或复用已有 target
// - 激活 target
// - 关闭 target
// - 查找 target
// - 获取当前 target
export const TARGET_COMMANDS = {
  list: cmd_list,
  has: cmd_has,
  new: cmd_new,
  open: cmd_open,
  activate: cmd_activate,
  close: cmd_close,
  find: cmd_find,
  current: cmd_current,
};

/**
 * 列出所有 targets
 *
 * 用法：
 *   welm target list
 *
 * 返回：
 * - 当前浏览器中的 target 列表
 */
async function cmd_list() {
  return await listTargets();
}

/**
 * 判断 target 是否存在
 *
 * 用法：
 *   welm target has <targetId>
 *
 * 示例：
 *   welm target has ABC123
 */
async function cmd_has(args) {
  const [targetId] = args;
  return await hasTarget(targetId);
}

/**
 * 新建一个 target
 *
 * 用法：
 *   welm target new [url]
 *
 * 说明：
 * - 不传 url 时，新建一个空白页
 * - 传 url 时，新建 target 并直接打开该地址
 *
 * 示例：
 *   welm target new
 *   welm target new https://example.com
 */
async function cmd_new(args) {
  const [url] = args;
  return await newTarget(url);
}

/**
 * 打开指定 url
 *
 * 用法：
 *   welm target open <url>
 *
 * 说明：
 * - 先对输入 url 做标准化
 * - 如果当前已存在相同 url 的 target，则直接激活并返回该 targetId
 * - 如果不存在，则新建 target 并打开该 url
 *
 * 这个命令的语义是：
 * - 优先复用已有页面
 * - 没有才创建新页面
 *
 * 示例：
 *   welm target open https://example.com
 */
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

/**
 * 激活指定 target
 *
 * 用法：
 *   welm target activate <targetId>
 *
 * 说明：
 * - 将指定 target 切换到前台
 *
 * 示例：
 *   welm target activate ABC123
 */
async function cmd_activate(args) {
  const [targetId] = args;
  await activateTarget(targetId);
}

/**
 * 关闭指定 target
 *
 * 用法：
 *   welm target close <targetId>
 *
 * 示例：
 *   welm target close ABC123
 */
async function cmd_close(args) {
  const [targetId] = args;
  await closeTarget(targetId);
}

/**
 * 按关键字查找 target
 *
 * 用法：
 *   welm target find <keyword>
 *
 * 说明：
 * - 一般会在 title、url 等信息中查找匹配项
 *
 * 示例：
 *   welm target find chatgpt
 *   welm target find example.com
 */
async function cmd_find(args) {
  const [keyword] = args;
  return await findTarget(keyword);
}

/**
 * 获取当前 target
 *
 * 用法：
 *   welm target current
 *
 * 返回：
 * - 当前激活的 target 信息
 */
async function cmd_current() {
  return await currentTarget();
}