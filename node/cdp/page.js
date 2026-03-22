import { CliError } from '../core/error.js';
import { ERROR_CODE } from '../core/error-code.js';
import { getClient } from './client.js';

/**
 * 启用 Page 域
 */
export async function enablePage(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  await Page.enable();
}

/**
 * 禁用 Page 域
 */
export async function disablePage(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  await Page.disable();
}

/**
 * 跳转到指定 URL
 * 返回 frameId / loaderId / errorText
 */
export async function navigatePage(targetId, url) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!url) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing url');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const res = await Page.navigate({ url });

  return {
    frameId: res.frameId ?? '',
    loaderId: res.loaderId ?? '',
    errorText: res.errorText ?? '',
    isDownload: !!res.isDownload,
  };
}

/**
 * 刷新页面
 */
export async function reloadPage(targetId, options = {}) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const {
    ignoreCache = false,
    scriptToEvaluateOnLoad,
    loaderId,
  } = options || {};

  await Page.reload({
    ignoreCache: !!ignoreCache,
    scriptToEvaluateOnLoad,
    loaderId,
  });
}

/**
 * 停止加载
 */
export async function stopLoadingPage(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  await Page.stopLoading();
}

/**
 * 让目标页切到前台
 */
export async function bringPageToFront(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  await Page.bringToFront();
}

/**
 * 获取 frame 树
 */
export async function getFrameTree(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const res = await Page.getFrameTree();
  return res.frameTree ?? null;
}

/**
 * 获取资源树
 */
export async function getResourceTree(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const res = await Page.getResourceTree();
  return res.frameTree ?? null;
}

/**
 * 获取布局指标
 * 常用于：
 * - 页面总尺寸
 * - 可视区位置
 * - 截整页前计算裁剪范围
 */
export async function getLayoutMetrics(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const res = await Page.getLayoutMetrics();

  return {
    layoutViewport: res.layoutViewport ?? null,
    visualViewport: res.visualViewport ?? null,
    contentSize: res.contentSize ?? null,
    cssLayoutViewport: res.cssLayoutViewport ?? null,
    cssVisualViewport: res.cssVisualViewport ?? null,
    cssContentSize: res.cssContentSize ?? null,
  };
}

/**
 * 截图
 * 返回 base64
 *
 * options:
 * - format: 'png' | 'jpeg' | 'webp'
 * - quality: jpeg/webp 可用
 * - clip: { x, y, width, height, scale }
 * - fromSurface: 默认 true
 * - captureBeyondViewport: 默认 false
 */
export async function captureScreenshot(targetId, options = {}) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const {
    format = 'png',
    quality,
    clip,
    fromSurface = true,
    captureBeyondViewport = false,
    optimizeForSpeed,
  } = options || {};

  const params = {
    format,
    fromSurface: !!fromSurface,
    captureBeyondViewport: !!captureBeyondViewport,
  };

  if (quality != null) {
    params.quality = quality;
  }

  if (clip) {
    params.clip = clip;
  }

  if (optimizeForSpeed != null) {
    params.optimizeForSpeed = !!optimizeForSpeed;
  }

  const res = await Page.captureScreenshot(params);
  return res.data ?? '';
}

/**
 * 截取整页
 * 通过 contentSize 自动生成 clip
 * 返回 base64
 */
export async function captureFullPageScreenshot(targetId, options = {}) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const metrics = await getLayoutMetrics(targetId);
  const size = metrics.cssContentSize || metrics.contentSize;

  if (!size) {
    throw new CliError(ERROR_CODE.INTERNAL_ERROR, 'failed to get page content size');
  }

  return captureScreenshot(targetId, {
    ...options,
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      scale: 1,
    },
  });
}

/**
 * 获取指定 frame 的资源内容
 */
export async function getResourceContent(targetId, frameId, url) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!frameId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing frameId');
  }

  if (!url) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing url');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  const res = await Page.getResourceContent({ frameId, url });

  return {
    content: res.content ?? '',
    base64Encoded: !!res.base64Encoded,
  };
}

/**
 * 获取页面源码（主文档 html）
 * 注意：
 * - 这是资源内容，不是“执行 JS 后的最新 DOM”
 * - 如果要拿运行时 DOM，应该走 Runtime.evaluate
 */
export async function getPageContent(targetId) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  const frameTree = await getResourceTree(targetId);

  if (!frameTree?.frame?.id || !frameTree?.frame?.url) {
    throw new CliError(ERROR_CODE.INTERNAL_ERROR, 'failed to resolve main frame');
  }

  const res = await getResourceContent(
    targetId,
    frameTree.frame.id,
    frameTree.frame.url,
  );

  return res.content;
}

/**
 * 等待页面加载完成
 *
 * event:
 * - 'loadEventFired'
 * - 'domContentEventFired'
 */
export async function waitPageEvent(targetId, event = 'loadEventFired', timeout = 10000) {
  if (!targetId) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing targetId');
  }

  if (!event) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing event');
  }

  const client = await getClient(targetId);
  const { Page } = client;

  await Page.enable();

  return new Promise((resolve, reject) => {
    let timer = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      Page[event]().then((off) => {
        if (typeof off === 'function') {
          off();
        }
      }).catch(() => {});
    };

    Page[event]((params) => {
      cleanup();
      resolve(params ?? null);
    }).catch(reject);

    timer = setTimeout(() => {
      cleanup();
      reject(
        new CliError(
          ERROR_CODE.TIMEOUT,
          `wait page event timeout: ${event}`,
          { event, timeout },
        ),
      );
    }, timeout);
  });
}

/**
 * 等待页面 load 完成
 */
export async function waitPageLoad(targetId, timeout = 10000) {
  return waitPageEvent(targetId, 'loadEventFired', timeout);
}

/**
 * 等待 DOMContentLoaded
 */
export async function waitDomContentLoaded(targetId, timeout = 10000) {
  return waitPageEvent(targetId, 'domContentEventFired', timeout);
}