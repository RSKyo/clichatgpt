// ========================
// CLI dom commands
// ========================

import {
  getDocument,
  queryDocumentSelector,
  queryDocumentSelectorAll,
  describeNode,
  getAttributes,
  attributesToObject,
  getOuterHTML,
  getBoxModel,
  getNodeCenter,
  focusNode,
  resolveNode,
  requestNode,
} from '../cdp/dom.js';

// dom 命令注册表
// 负责“DOM 节点读取与节点定位”这一层：
// - 获取文档根节点
// - 按 selector 查找节点
// - 读取节点描述、属性、HTML、盒模型
// - 获取节点中心点
// - 让节点获取焦点
// - 在 nodeId 和 objectId 之间转换
export const DOM_COMMANDS = {
  doc: cmd_doc,
  find: cmd_find,
  'find-all': cmd_find_all,
  describe: cmd_describe,
  attrs: cmd_attrs,
  html: cmd_html,
  box: cmd_box,
  center: cmd_center,
  focus: cmd_focus,
  resolve: cmd_resolve,
  request: cmd_request,
};

/**
 * 获取文档根节点
 *
 * 用法：
 *   welm dom doc <targetId>
 *
 * 说明：
 * - 相当于拿到当前页面的 DOM 根
 * - 后续很多 DOM 查询都可以从这里开始
 *
 * 示例：
 *   welm dom doc ABC123
 */
async function cmd_doc(args) {
  const [targetId] = args;
  return await getDocument(targetId);
}

/**
 * 按 selector 查找单个节点
 *
 * 用法：
 *   welm dom find <targetId> <selector>
 *
 * 说明：
 * - 返回匹配到的第一个节点 nodeId
 * - 如果没找到，通常会返回 0 或空值，取决于底层实现
 *
 * 示例：
 *   welm dom find ABC123 '#app'
 *   welm dom find ABC123 '.submit'
 */
async function cmd_find(args) {
  const [targetId, selector] = args;
  return await queryDocumentSelector(targetId, selector);
}

/**
 * 按 selector 查找多个节点
 *
 * 用法：
 *   welm dom find-all <targetId> <selector>
 *
 * 说明：
 * - 返回所有匹配节点的 nodeId 列表
 *
 * 示例：
 *   welm dom find-all ABC123 '.item'
 */
async function cmd_find_all(args) {
  const [targetId, selector] = args;
  return await queryDocumentSelectorAll(targetId, selector);
}

/**
 * 获取节点描述信息
 *
 * 用法：
 *   welm dom describe <targetId> <nodeId>
 *
 * 说明：
 * - 可查看节点名、节点类型、属性摘要、子节点信息等
 *
 * 示例：
 *   welm dom describe ABC123 42
 */
async function cmd_describe(args) {
  const [targetId, nodeId] = args;
  return await describeNode(targetId, { nodeId: Number(nodeId) });
}

/**
 * 获取节点属性
 *
 * 用法：
 *   welm dom attrs <targetId> <nodeId>
 *
 * 说明：
 * - 底层先取属性数组
 * - 再转成更好用的对象结构
 *
 * 示例：
 *   welm dom attrs ABC123 42
 */
async function cmd_attrs(args) {
  const [targetId, nodeId] = args;
  const attrs = await getAttributes(targetId, Number(nodeId));
  return attributesToObject(attrs);
}

/**
 * 获取节点 outerHTML
 *
 * 用法：
 *   welm dom html <targetId> <nodeId>
 *
 * 说明：
 * - 返回该节点本身及其子节点对应的 HTML
 *
 * 示例：
 *   welm dom html ABC123 42
 */
async function cmd_html(args) {
  const [targetId, nodeId] = args;
  return await getOuterHTML(targetId, { nodeId: Number(nodeId) });
}

/**
 * 获取节点盒模型
 *
 * 用法：
 *   welm dom box <targetId> <nodeId>
 *
 * 说明：
 * - 可查看 content / padding / border / margin 等盒模型坐标
 * - 常用于点击、定位、调试布局
 *
 * 示例：
 *   welm dom box ABC123 42
 */
async function cmd_box(args) {
  const [targetId, nodeId] = args;
  return await getBoxModel(targetId, { nodeId: Number(nodeId) });
}

/**
 * 获取节点中心点坐标
 *
 * 用法：
 *   welm dom center <targetId> <nodeId>
 *
 * 说明：
 * - 常用于配合 input click 这类坐标点击
 *
 * 示例：
 *   welm dom center ABC123 42
 */
async function cmd_center(args) {
  const [targetId, nodeId] = args;
  return await getNodeCenter(targetId, Number(nodeId));
}

/**
 * 让节点获取焦点
 *
 * 用法：
 *   welm dom focus <targetId> <nodeId>
 *
 * 说明：
 * - 常用于 input、textarea、contenteditable 等可聚焦元素
 *
 * 示例：
 *   welm dom focus ABC123 42
 */
async function cmd_focus(args) {
  const [targetId, nodeId] = args;
  await focusNode(targetId, Number(nodeId));
}

/**
 * 将 nodeId 解析为 objectId
 *
 * 用法：
 *   welm dom resolve <targetId> <nodeId>
 *
 * 说明：
 * - 适合后续交给 Runtime 侧继续操作
 * - resolveNode 返回的是远程对象信息
 *
 * 示例：
 *   welm dom resolve ABC123 42
 */
async function cmd_resolve(args) {
  const [targetId, nodeId] = args;
  return await resolveNode(targetId, Number(nodeId));
}

/**
 * 将 objectId 解析为 nodeId
 *
 * 用法：
 *   welm dom request <targetId> <objectId>
 *
 * 说明：
 * - 适合把 Runtime 拿到的对象，再转回 DOM 节点编号
 *
 * 示例：
 *   welm dom request ABC123 '{"injectedScriptId":1,"id":2}'
 */
async function cmd_request(args) {
  const [targetId, objectId] = args;
  return await requestNode(targetId, objectId);
}