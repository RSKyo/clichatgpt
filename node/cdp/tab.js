// ========================
// CDP tab operations
// ========================

import CDP from 'chrome-remote-interface';
import { HOST, PORT, ERROR_CODE, CliError } from '../core/protocol.js';

async function listTabs() {
  return await CDP.List({ host: HOST, port: PORT });
}

export async function openTab(url, { activate = true } = {}) {
  if (!url) throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing url');

  const target = await CDP.New({
    url,
    host: HOST,
    port: PORT,
  });

  const tabId = target.id;

  // activate 控制是否切换到前台
  if (activate) {
    await CDP.Activate({
      id: tabId,
      host: HOST,
      port: PORT,
    });
  }

  return tabId;
}

// export async function findTab(keyword, idOnly) {
//   if (!keyword) throw new Error('missing keyword');

//   const tabs = await listTabs();

//   const tab = tabs.find(t =>
//     (t.url && t.url.includes(keyword)) ||
//     (t.title && t.title.includes(keyword))
//   );

//   if (!tab) {
//     throw new Error('tab not found');
//   }

//   if (idOnly) {
//     respondOk(tab.id);
//   } else {
//     respondOk({
//       id: tab.id,
//       type: tab.type ?? '',
//       title: tab.title ?? '',
//       url: tab.url ?? '',
//     });
//   }
// }


