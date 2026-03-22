import { CliError } from '../core/error.js';
import { ERROR_CODE } from '../core/error-code.js';
import { getClient } from './client.js';

/**
 * Wait 能力说明
 *
 * 这一层不是单一 CDP 域，而是“编排层”：
 * - Page 负责页面生命周期事件
 * - Runtime 负责执行 JS 条件判断
 * - 轮询、超时、间隔、错误语义，由这里统一处理
 *
 * 这一层专门解决：
 * - 等 selector 出现
 * - 等元素可见
 * - 等元素可点击
 * - 等文本变化
 * - 等某个 JS 条件成立
 * - 等导航完成
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function now() {
  return Date.now();
}

function ensureTargetId(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }
}

function ensureSelector(selector) {
  if (!selector) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing selector');
  }
}

function ensureText(text) {
  if (text == null || text === '') {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing text');
  }
}

function ensureExpression(expression) {
  if (!expression) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing expression');
  }
}

async function getPageClient(targetId) {
  ensureTargetId(targetId);

  const client = await getClient(targetId);
  const { Page, Runtime } = client;

  return { client, Page, Runtime };
}

function buildPredicateExpression(source) {
  return `
    (() => {
      try {
        const value = (${source})();
        return {
          ok: !!value,
          value: value ?? null,
        };
      } catch (error) {
        return {
          ok: false,
          error: String(error && error.message || error),
        };
      }
    })()
  `;
}

async function runtimeEvalValue(targetId, expression) {
  const { Runtime } = await getPageClient(targetId);

  const res = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (res.exceptionDetails) {
    throw new CliError(
      ERROR_CODE.INTERNAL_ERROR,
      'runtime evaluate failed',
      { exceptionDetails: res.exceptionDetails },
    );
  }

  return res.result?.value ?? null;
}

async function poll(targetId, name, predicate, options = {}) {
  ensureTargetId(targetId);

  const timeout = options.timeout ?? 10000;
  const interval = options.interval ?? 200;
  const start = now();
  let lastValue = null;

  while (now() - start < timeout) {
    const result = await predicate();

    if (result?.ok) {
      return {
        ok: true,
        name,
        elapsed: now() - start,
        value: result.value ?? null,
      };
    }

    lastValue = result?.value ?? null;
    await sleep(interval);
  }

  throw new CliError(
    ERROR_CODE.TIMEOUT,
    `wait timeout: ${name}`,
    {
      name,
      timeout,
      interval,
      lastValue,
    },
  );
}

/**
 * 等 selector 出现
 */
export async function waitSelector(targetId, selector, options = {}) {
  ensureSelector(selector);

  const expression = buildPredicateExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return el ? true : false;
    }
  `);

  return poll(targetId, 'selector', async () => {
    const value = await runtimeEvalValue(targetId, expression);
    return {
      ok: !!value?.ok,
      value: value?.value ?? null,
    };
  }, options);
}

/**
 * 等元素可见
 */
export async function waitVisible(targetId, selector, options = {}) {
  ensureSelector(selector);

  const expression = buildPredicateExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0;

      return visible;
    }
  `);

  return poll(targetId, 'visible', async () => {
    const value = await runtimeEvalValue(targetId, expression);
    return {
      ok: !!value?.ok,
      value: value?.value ?? null,
    };
  }, options);
}

/**
 * 等元素可点击
 *
 * 这里的“可点击”定义为：
 * - 元素存在
 * - 可见
 * - 未 disabled
 * - pointer-events 不是 none
 *
 * 这是工程上的可用定义，不是浏览器规范中的官方状态。
 */
export async function waitClickable(targetId, selector, options = {}) {
  ensureSelector(selector);

  const expression = buildPredicateExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        style.pointerEvents !== 'none' &&
        rect.width > 0 &&
        rect.height > 0;

      const enabled = !el.disabled && el.getAttribute('aria-disabled') !== 'true';

      return visible && enabled;
    }
  `);

  return poll(targetId, 'clickable', async () => {
    const value = await runtimeEvalValue(targetId, expression);
    return {
      ok: !!value?.ok,
      value: value?.value ?? null,
    };
  }, options);
}

/**
 * 等 selector 对应元素的文本满足条件
 *
 * options:
 * - mode: includes | equals | regex
 */
export async function waitText(targetId, selector, expectedText, options = {}) {
  ensureSelector(selector);
  ensureText(expectedText);

  const mode = options.mode || 'includes';
  const expected = String(expectedText);

  const expression = buildPredicateExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const text = (el.innerText ?? el.textContent ?? '').trim();
      const mode = ${JSON.stringify(mode)};
      const expected = ${JSON.stringify(expected)};

      if (mode === 'equals') {
        return text === expected ? text : false;
      }

      if (mode === 'regex') {
        const re = new RegExp(expected);
        return re.test(text) ? text : false;
      }

      return text.includes(expected) ? text : false;
    }
  `);

  return poll(targetId, 'text', async () => {
    const value = await runtimeEvalValue(targetId, expression);
    return {
      ok: !!value?.ok,
      value: value?.value ?? null,
    };
  }, options);
}

/**
 * 等某个 JS 条件成立
 *
 * expression 应该返回 truthy / falsy。
 */
export async function waitFunction(targetId, expression, options = {}) {
  ensureExpression(expression);

  const wrapped = buildPredicateExpression(`
    () => {
      return (${expression});
    }
  `);

  return poll(targetId, 'function', async () => {
    const value = await runtimeEvalValue(targetId, wrapped);
    return {
      ok: !!value?.ok,
      value: value?.value ?? null,
    };
  }, options);
}

/**
 * 等导航完成
 *
 * 这里用 Page.frameNavigated 监听主导航，适合“等发生一次导航”。
 * 真正要等页面资源加载完，通常还应继续 waitLoad。
 */
export async function waitNavigation(targetId, options = {}) {
  const timeout = options.timeout ?? 10000;
  const { Page } = await getPageClient(targetId);

  await Page.enable();

  return new Promise((resolve, reject) => {
    let done = false;
    let off = null;

    const timer = setTimeout(() => {
      cleanup();
      reject(new CliError(
        ERROR_CODE.TIMEOUT,
        'wait timeout: navigation',
        { timeout },
      ));
    }, timeout);

    function cleanup() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (typeof off === 'function') off();
    }

    Page.frameNavigated((params) => {
      cleanup();
      resolve({
        ok: true,
        name: 'navigation',
        value: params ?? null,
      });
    }).then(unsub => {
      off = unsub;
    }).catch(reject);
  });
}

/**
 * 等 load 事件
 */
export async function waitLoad(targetId, options = {}) {
  const timeout = options.timeout ?? 10000;
  const { Page } = await getPageClient(targetId);

  await Page.enable();

  return new Promise((resolve, reject) => {
    let done = false;
    let off = null;

    const timer = setTimeout(() => {
      cleanup();
      reject(new CliError(
        ERROR_CODE.TIMEOUT,
        'wait timeout: load',
        { timeout },
      ));
    }, timeout);

    function cleanup() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (typeof off === 'function') off();
    }

    Page.loadEventFired((params) => {
      cleanup();
      resolve({
        ok: true,
        name: 'load',
        value: params ?? null,
      });
    }).then(unsub => {
      off = unsub;
    }).catch(reject);
  });
}

/**
 * 等 DOMContentLoaded
 */
export async function waitDom(targetId, options = {}) {
  const timeout = options.timeout ?? 10000;
  const { Page } = await getPageClient(targetId);

  await Page.enable();

  return new Promise((resolve, reject) => {
    let done = false;
    let off = null;

    const timer = setTimeout(() => {
      cleanup();
      reject(new CliError(
        ERROR_CODE.TIMEOUT,
        'wait timeout: domcontentloaded',
        { timeout },
      ));
    }, timeout);

    function cleanup() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (typeof off === 'function') off();
    }

    Page.domContentEventFired((params) => {
      cleanup();
      resolve({
        ok: true,
        name: 'dom',
        value: params ?? null,
      });
    }).then(unsub => {
      off = unsub;
    }).catch(reject);
  });
}