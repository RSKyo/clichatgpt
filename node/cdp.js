import CDP from 'chrome-remote-interface';

const HOST = '127.0.0.1';
const PORT = 9222;

async function connect() {
  return CDP({ host: HOST, port: PORT });
}

async function listTabs() {
  return CDP.List({ host: HOST, port: PORT });
}

async function cmdTest() {
  let client;

  try {
    client = await connect();

    const { Runtime } = client;

    const result = await Runtime.evaluate({
      expression: 'navigator.userAgent',
      returnByValue: true,
    });

    console.log('connected');
    console.log(result.result.value);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function cmdTabs() {
  const tabs = await listTabs();

  for (const tab of tabs) {
    console.log([
      tab.id ?? '',
      tab.type ?? '',
      tab.title ?? '',
      tab.url ?? '',
    ].join('\t'));
  }
}

async function main() {
  const cmd = process.argv[2];

  if (!cmd) {
    console.error('usage: node cdp.js <test|tabs>');
    process.exit(1);
  }

  try {
    switch (cmd) {
      case 'test':
        await cmdTest();
        break;

      case 'tabs':
        await cmdTabs();
        break;

      default:
        console.error(`unknown command: ${cmd}`);
        process.exit(1);
    }
  } catch (err) {
    console.error('cdp error:', err?.message || String(err));
    process.exit(1);
  }
}

await main();