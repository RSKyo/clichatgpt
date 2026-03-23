
export const ERROR_CODE = {
  MISSING_ARGS: 'MISSING_ARGS',
  INVALID_ARGS: 'INVALID_ARGS',
  EMPTY_VALUE: 'EMPTY_VALUE',
  EVALUATE_ERROR: 'evaluate_ERROR',
  MISSING_CMD: 'MISSING_CMD',
  INVALID_CMD: 'INVALID_CMD',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EVAL_FAILED: 'EVAL_FAILED',
  MISSING_TARGET_ID: 'MISSING_TARGET_ID',
  TARGET_NOT_FOUND: 'TARGET_NOT_FOUND',
};

export class CliError extends Error {
  constructor(code, message, details = null) {
    super(message);
    // 在 JS 里，继承普通类通常没事，但继承一些内建对象时，尤其是 Error，有时实例的原型链不会完全按你预期工作。
    // err instanceof CliError 可能判断不稳定
    // 把当前实例 this 的原型，设成 CliError 的 prototype
    // new.target 被哪个构造函数 new 出来的，new CliError(...) 就是 CliError
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'CliError';
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
  }
}

function toErrorPayload(err) {
  if (err && typeof err === 'object') {
    return {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'unknown error',
      details: err.details ?? null,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: String(err ?? 'unknown error'),
    details: null,
  };
}

function safeStringify(value) {
  const seen = new WeakSet();

  return JSON.stringify(value, (_, v) => {
    // JSON 标准本身没有 BigInt 类型
    if (typeof v === 'bigint') return String(v);

    // Error 中 message、stack、cause 通常都不是可枚举属性
    // 而 JSON.stringify() 主要只序列化可枚举自有属性，所以会丢掉核心信息
    if (v instanceof Error) {
      return toErrorPayload(v);
    }

    // 判断 循环引用 或 重复引用
    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) return '[Circular or Duplicate]';
      seen.add(v);
    }

    return v;
  });
}

function writeJson(payload) {
  process.stdout.write(safeStringify(payload) + '\n');
}

export function respondOk(data, meta = {}) {
  writeJson({
    ok: true,
    data: data ?? null,
    meta: {
      code: 'OK',
      ...meta,
    },
  });
}

export function respondError(err) {
  writeJson({
    ok: false,
    error: toErrorPayload(err),
  });
}

export async function run(main) {
  try {
    const data = await main();
    respondOk(data);
    process.exitCode = 0;
  } catch (err) {
    respondError(err);
    process.exitCode = 1;
  }
}

