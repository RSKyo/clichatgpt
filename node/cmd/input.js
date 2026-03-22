// ========================
// Input command dispatcher
// ========================

import { ERROR_CODE, CliError } from '../core/protocol.js';
import { inputText } from '../page/input.js';

export async function dispatchInputCmd(cmd, args) {
  switch (cmd) {
    case 'input': {
      const [pageId, text, selector] = args;
      return await inputText(pageId, text, selector);
    }

    default:
      throw new CliError(ERROR_CODE.INVALID_ARGS, `unsupported input command: ${cmd}`);
  }
}