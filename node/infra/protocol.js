import { normalizeError } from "./error.js";



/**
 * 构造成功结果
 */
export function ok(value = null, meta) {
  return meta === undefined
    ? { ok: true, value }
    : { ok: true, value, meta };
}

/**
 * 构造失败结果（自动标准化 error）
 */
export function fail(error = null, meta) {
  const err = normalizeError(error ?? "unknown error");

  return meta === undefined
    ? { ok: false, error: err }
    : { ok: false, error: err, meta };
}

/**
 * 判断是否为协议结果对象
 */
function isProtocolResult(x) {
  return (
    x &&
    typeof x === "object" &&
    typeof x.ok === "boolean" &&
    (x.ok ? "value" in x : "error" in x)
  );
}

/**
 * 将任意返回值收敛为协议结果
 */
function toProtocolResult(x) {
  return isProtocolResult(x) ? x : ok(x);
}

/**
 * CLI 入口执行器：
 * - 执行 main
 * - 统一输出结果
 * - 捕获未处理异常并转为 fail
 */
export async function run(main) {
  try {
    const result = await main();
    writeJson(toProtocolResult(result));
    process.exitCode = 0;
  } catch (error) {
    const result = fail(error);
    writeJson(result);
    process.exitCode = 1;
  }
}
