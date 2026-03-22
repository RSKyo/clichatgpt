import { getClient } from './client.js';

export async function evaluate(targetId, expression) {
  const client = await getClient(targetId);

  const { Runtime } = client;

  const res = await Runtime.evaluate({
    expression,
    returnByValue: true,
  });

  return res.result.value;
}