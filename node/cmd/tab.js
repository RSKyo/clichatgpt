// ========================
// Tab command dispatcher
// ========================

import { ERROR_CODE, CliError } from '../core/protocol.js';
import { openTab } from '../cdp/tab.js';
import { parseBool } from '../core/parse.js';



export async function dispatchTabCmd(cmd, args) {
  switch (cmd) {
    case 'open-tab': {
      const [url, activateRaw] = args;
      return await openTab(url, { activate: parseBool(activateRaw, true) });
    }

    // case 'active-tab': {
    //   return await activeTab();
    // }

    // case 'find-tab': {
    //   const [keyword, idOnlyRaw] = args;
    //   const idOnly = idOnlyRaw === 'true';

    //   return await findTab(keyword, idOnly);
    // }

    default:
      throw new CliError(ERROR_CODE.INVALID_ARGS, `unsupported tab command: ${cmd}`);
  }
}