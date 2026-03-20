
import { ERROR_CODE, CliError, run } from './core/protocol.js';
import { dispatchTabCmd } from './cmd/tab.js';

run(async () => {
  const [, , cmd, ...args] = process.argv;

  if (!cmd) throw new CliError(ERROR_CODE.INVALID_ARGS, 'missing cmd');

  switch (cmd) {
    case 'open-tab':
    case 'active-tab':
    case 'find-tab':
      return await dispatchTabCmd(cmd, args);

    default:
      throw new CliError(ERROR_CODE.INVALID_ARGS, `unknown command: ${cmd}`);
  }
});

