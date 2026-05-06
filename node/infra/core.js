
export function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch {
    return String(url || '').trim();
  }
}

/**
 * 将对象安全序列化为 JSON 并输出到 stdout。
 * - 支持 bigint
 * - 自动展开 Error
 * - 处理循环引用
 */
function writeJson(payload) {
  const seen = new WeakSet();

  const json = JSON.stringify(payload, (_, v) => {
    if (typeof v === "bigint") return String(v);

    if (v instanceof Error) return normalizeError(v);

    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }

    return v;
  });

  process.stdout.write(`${json}\n`);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function interpolate(
  template,
  values = {},
  tokenPattern = /\{(\w+)\}/g
) {
  return String(template).replace(
    tokenPattern,
    (match, key) => {
      return values[key] == null
        ? match
        : String(values[key]);
    }
  );
}