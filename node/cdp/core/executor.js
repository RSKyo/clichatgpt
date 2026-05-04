import { DEFAULT_TIMEOUT, DEFAULT_INTERVAL } from './config.js';
import { getClient } from './client.js';
import { sleep } from '../infra/core.js';
import { assert, ensure, parsePositiveInt, parseNonBlank } from '../infra/value.js';
import { argMissingError } from '../infra/error.js';
import { ok, fail } from '../infra/protocol.js';

/**
 * 执行表达式（Runtime.evaluate）
 */
export async function exec(targetId, expression) {
  targetId = assert(parseNonBlank(targetId), () => argMissingError('targetId'));
  expression = assert(parseNonBlank(expression), () => argMissingError('expression'));

  const client = await getClient(targetId);
  const { Runtime } = client;

  try {
    const { result, exceptionDetails } = await Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });

    if (exceptionDetails) {
      const message =
        exceptionDetails.text ||
        exceptionDetails.exception?.description ||
        'expression threw an exception';

      return fail(message);
    }

    if (!result) {
      return fail('missing evaluation result');
    }

    // 返回可序列化值
    if ('value' in result) {
      return ok(result.value, {
        type: result.type,
        subtype: result.subtype,
        byValue: true,
      });
    }

    // fallback：返回 description
    return ok(result.description, {
      type: result.type,
      subtype: result.subtype,
      byValue: false,
    });

  } catch (error) {
    return fail(error);
  }
}

/**
 * 判断轮询结果是否命中
 */
function isPollMatched(value) {
  if (value == null) return false;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
}

/**
 * 轮询执行表达式，直到命中或超时
 */
export async function poll(targetId, expression, options = {}) {
  const timeout = ensure(parsePositiveInt(options.timeout), DEFAULT_TIMEOUT);
  const interval = ensure(parsePositiveInt(options.interval), DEFAULT_INTERVAL);

  const start = Date.now();
  let result;

  while (Date.now() - start < timeout) {
    result = await exec(targetId, expression);

    if (result.ok && isPollMatched(result.value)) {
      return ok(result.value, {
        ...(result.meta ?? {}),
        timing: {
          timeout,
          interval,
          elapsed: Date.now() - start,
        },
      });
    }

    await sleep(interval);
  }

  return fail(
    result?.error ?? 'poll condition not matched',
    {
      timing: {
        timeout,
        interval,
        elapsed: Date.now() - start,
      },
    }
  );
}