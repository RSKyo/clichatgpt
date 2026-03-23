import { getClient } from './client.js';
import { ERROR_CODE, CliError } from '../infra/protocol.js';

export function buildEvaluateExpression(source) {
  return `
    (() => {
      try {
        const value = (${source})();
        return {
          ok: true,
          value,
        };
      } catch (error) {
        return {
          ok: false,
          error: String(error?.message ?? error),
        };
      }
    })()
  `;
}

export async function evaluate(targetId, expression) {
  const client = await getClient(targetId);

  const { Runtime } = client;

  const res = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  return evaluateResult(res);
}

export function evaluateResult(res) {
  const { result, exceptionDetails } = res

  if (exceptionDetails) {
    const msg =
      exceptionDetails.text ||
      exceptionDetails.exception?.description ||
      'evaluation failed';
    throw new CliError(ERROR_CODE.EVALUATE_ERROR, msg);
  }

  if (!result) return undefined;

  return 'value' in result
    ? result.value
    : result.description;
}