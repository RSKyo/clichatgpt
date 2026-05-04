// ========================
// CDP Client (session manager)
// ========================

import CDP from "chrome-remote-interface";
import { HOST, PORT } from "./config.js";
import { assert, parseNonBlank } from "../infra/value.js";
import {
  targetMissingError,
  targetNotFoundError,
  ClientError,
  ERROR_CODE,
} from "../infra/error.js";

/**
 * targetId -> client
 */
const clientPromiseMap = new Map();

// 不通过 CDP.List 判断 target 是否存在，保持 client.js 的纯粹性
function isTargetNotFoundError(error) {
  if (!error) return false;

  const code = error?.code || error?.error?.code;
  const message = error?.message || error?.error?.message || String(error);

  const lower = message.toLowerCase();

  if (code === -32000) {
    if (
      lower.includes("no target") ||
      lower.includes("no such target") ||
      lower.includes("target not found")
    ) {
      return true;
    }
  }

  return false;
}

async function createClient(targetId) {
  targetId = assert(parseNonBlank(targetId), targetMissingError);

  try {
    const client = await CDP({
      target: targetId,
      host: HOST,
      port: PORT,
    });

    client.on("disconnect", () => {
      clientPromiseMap.delete(targetId);
    });

    return client;
  } catch (error) {
    if (isTargetNotFoundError(error)) {
      throw targetNotFoundError(targetId);
    }

    // 已经是 ClientError → 原样抛
    if (error instanceof ClientError) {
      throw error;
    }

    // 兜底统一包装
    throw new ClientError(
      ERROR_CODE.INTERNAL_ERROR,
      error?.message || "cdp client error",
      { cause: error },
    );
  }
}

/**
 * 获取 client（自动复用）
 */
export async function getClient(targetId) {
  targetId = assert(parseNonBlank(targetId), targetMissingError);

  let clientPromise = clientPromiseMap.get(targetId);

  if (!clientPromise) {
    clientPromise = createClient(targetId).catch((err) => {
      // 失败必须清掉，否则会缓存一个 rejected Promise
      clientPromiseMap.delete(targetId);
      throw err;
    });

    clientPromiseMap.set(targetId, clientPromise);
  }

  return await clientPromise;
}

/**
 * 关闭 client
 */
export async function closeClient(targetId) {
  targetId = assert(parseNonBlank(targetId), targetMissingError);

  const clientPromise = clientPromiseMap.get(targetId);
  if (!clientPromise) return;

  try {
    const client = await clientPromise;
    await client.close();
  } finally {
    clientPromiseMap.delete(targetId);
  }
}

/**
 * 清理所有 client
 */
export async function closeAllClients() {
  const promises = [];

  for (const p of clientPromiseMap.values()) {
    promises.push(
      p.then((client) => client.close()).catch(() => {})
    );
  }

  await Promise.all(promises);
  clientPromiseMap.clear();
}
