import { getClient } from './client.js';
import { requireArg } from './assert.js';
import { buildEvaluateExpression, evaluate } from './runtime.js';
import { ERROR_CODE, CliError } from '../infra/protocol.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPredicate(targetId, expression) {
  const result = await evaluate(targetId, expression);

  if (!result || typeof result !== 'object') {
    return {
      ok: false,
      value: undefined,
      error: 'predicate result must be an object',
    };
  }

  if (result.ok === false) {
    return {
      ok: false,
      value: result.value,
      error: result.error ?? null,
    };
  }

  return {
    ok: !!result.value,
    value: result.value,
    error: null,
  };
}

async function poll(targetId, name, predicate, options = {}) {
  requireArg(targetId, 'missing targetId');

  const timeout = options.timeout ?? 10000;
  const interval = options.interval ?? 200;
  const start = Date.now();

  let lastValue = undefined;
  let lastError = null;

  while (Date.now() - start < timeout) {
    const result = await predicate();

    if (result?.ok) {
      return {
        ok: true,
        name,
        elapsed: Date.now() - start,
        value: result.value,
      };
    }

    lastValue = result?.value;
    lastError = result?.error ?? null;

    await sleep(interval);
  }

  throw new CliError(
    ERROR_CODE.TIMEOUT,
    `wait timeout: ${name}`,
    {
      name,
      timeout,
      interval,
      elapsed: Date.now() - start,
      lastValue,
      lastError,
    },
  );
}

/**
 * 等 selector 出现
 */
export async function waitSelector(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = buildEvaluateExpression(`
    () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return !!el;
    }
  `);

  return poll(targetId, 'selector', async () => {
    return checkPredicate(targetId, expression);
  }, options);
}

/**
 * 等元素可见
 */
export async function waitVisible(targetId, selector, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = buildEvaluateExpression(`
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
    return checkPredicate(targetId, expression);
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
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');

  const expression = buildEvaluateExpression(`
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

      const enabled =
        !el.disabled &&
        el.getAttribute('aria-disabled') !== 'true';

      return visible && enabled;
    }
  `);

  return poll(targetId, 'clickable', async () => {
    return checkPredicate(targetId, expression);
  }, options);
}

/**
 * 等 selector 对应元素的文本满足条件
 *
 * options:
 * - mode: includes | equals | regex
 */
export async function waitText(targetId, selector, expectedText, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(selector, 'missing selector');
  requireArg(expectedText, 'missing expectedText');

  const mode = options.mode || 'includes';
  const expected = String(expectedText);

  const expression = buildEvaluateExpression(`
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
    return checkPredicate(targetId, expression);
  }, options);
}

/**
 * 等某个 JS 条件成立
 *
 * expression 应该返回 truthy / falsy。
 */
export async function waitFunction(targetId, expression, options = {}) {
  requireArg(targetId, 'missing targetId');
  requireArg(expression, 'missing expression');

  const wrapped = buildEvaluateExpression(`
    () => {
      return (${expression});
    }
  `);

  return poll(targetId, 'function', async () => {
    return checkPredicate(targetId, wrapped);
  }, options);
}

async function waitPageEvent(targetId, name, subscribe, options = {}) {
  requireArg(targetId, 'missing targetId');

  const timeout = options.timeout ?? 10000;

  return new Promise((resolve, reject) => {
    let settled = false;
    let off = null;

    const timer = setTimeout(() => {
      cleanup();
      reject(new CliError(
        ERROR_CODE.TIMEOUT,
        `wait timeout: ${name}`,
        { name, timeout },
      ));
    }, timeout);

    function cleanup() {
      clearTimeout(timer);

      if (typeof off === 'function') {
        const fn = off;
        off = null;
        fn();
      }
    }

    function resolveOnce(value) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        ok: true,
        name,
        value,
      });
    }

    function rejectOnce(error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    Promise.resolve()
      .then(() => subscribe(resolveOnce))
      .then(unsub => {
        off = unsub;
      })
      .catch(rejectOnce);
  });
}

/**
 * 等导航完成
 *
 * 这里用 Page.frameNavigated 监听主导航，适合“等发生一次导航”。
 * 真正要等页面资源加载完，通常还应继续 waitLoad。
 */
export async function waitNavigation(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(
    targetId,
    'navigation',
    (done) => Page.frameNavigated((params) => {
      done(params ?? null);
    }),
    options,
  );
}

/**
 * 等 load 事件
 */
export async function waitLoad(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(
    targetId,
    'load',
    (done) => Page.loadEventFired((params) => {
      done(params ?? null);
    }),
    options,
  );
}

/**
 * 等 DOMContentLoaded
 */
export async function waitDom(targetId, options = {}) {
  requireArg(targetId, 'missing targetId');

  const { Page } = await getClient(targetId);
  await Page.enable();

  return waitPageEvent(
    targetId,
    'dom',
    (done) => Page.domContentEventFired((params) => {
      done(params ?? null);
    }),
    options,
  );
}