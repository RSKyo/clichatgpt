import CDP from 'chrome-remote-interface';

const HOST = '127.0.0.1';
const PORT = 9222;

async function __listTabs() {
  return await CDP.List({ host: HOST, port: PORT });
}

async function __ensureTab(tabId) {
  const tabs = await __listTabs();
  const tab = tabs.find(t => t.id === tabId);

  if (!tab) {
    throw new Error(`tab not found: ${tabId}`);
  }

  return tab;
}

// ⚠️ internal only
async function __getClient(tabId) {
  await __ensureTab(tabId);
  return CDP({ target: tabId, host: HOST, port: PORT });
}

async function __cdpEvalRaw(tabId, expression) {
  const client = await __getClient(tabId);
  const { Runtime, Page } = client;

  try {
    await Runtime.enable();
    await Page.enable();

    return await Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
      // 允许触发某些受限 API（clipboard / focus）
      userGesture: true,
    });

  } finally {
    await client.close();
  }
}

function __cdpValue(raw) {
  const { result, exceptionDetails } = raw

  if (exceptionDetails) {
    const msg =
      exceptionDetails.text ||
      exceptionDetails.exception?.description ||
      'evaluation failed';
    throw new Error(msg);
  }

  if (!result) return undefined;

  return 'value' in result
    ? result.value
    : result.description;
}

function __safeSerialize(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({
      ok: false,
      error: 'failed to serialize result',
    });
  }
}

function __printSuccess(value) {
  console.log(__safeSerialize({
    ok: true,
    value: value ?? null,
  }));
}

function __printError(err) {
  console.log(__safeSerialize({
    ok: false,
    error: err?.message || String(err) || 'unknown error',
  }));
}

async function __runCmd(fn) {
  try {
    await fn();
  } catch (err) {
    __printError(err)
    process.exit(1);
  }
}

async function cmdFindTab(keyword, idOnly) {
  if (!keyword) throw new Error('missing keyword');

  const tabs = await __listTabs();

  const tab = tabs.find(t =>
    (t.url && t.url.includes(keyword)) ||
    (t.title && t.title.includes(keyword))
  );

  if (!tab) {
    throw new Error('tab not found');
  }

  if (idOnly) {
    __printSuccess(tab.id);
  } else {
    __printSuccess({
      id: tab.id,
      type: tab.type ?? '',
      title: tab.title ?? '',
      url: tab.url ?? '',
    });
  }
}

async function cmdEval(tabId, expression) {
  if (!tabId) throw new Error('missing tabId');
  if (!expression) throw new Error('missing expression');

  const raw = await __cdpEvalRaw(tabId, expression);
  const value = __cdpValue(raw);

  __printSuccess(value);
}

async function cmdText(tabId, selector) {
  if (!tabId) throw new Error('missing tabId');
  if (!selector) throw new Error('missing selector');

  const expression = `
    (function () {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      return el.innerText.trim();
    })()
  `;

  const raw = await __cdpEvalRaw(tabId, expression);
  const value = __cdpValue(raw);

  if (value === null) 
    throw new Error('element not found');

  __printSuccess(value);
}

async function main() {
  const [, , cmd, ...args] = process.argv;

  if (!cmd) {
    __printError(new Error('missing cmd'))
    process.exit(1);
  }

  switch (cmd) {
    case 'find-tab': {
      const keyword = args[0];
      const idOnly = args.includes('--id-only');
      await __runCmd(() => cmdFindTab(keyword, idOnly));
      break;
    }

    case 'eval': {
      const [tabId, expression] = args;
      await __runCmd(() => cmdEval(tabId, expression));
      break;
    }

    case 'text': {
      const [tabId, selector] = args;
      await __runCmd(() => cmdText(tabId, selector));
      break;
    }

    default:
      __printError(new Error(`unknown command: ${cmd}`))
      process.exit(1);
  }

}

await main();