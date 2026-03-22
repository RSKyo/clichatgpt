import { run } from './infra/protocol.js';
import { parseCliCommand } from './infra/parse.js';
import { TARGET_COMMANDS } from './cmd/target.js';

// 一级命令分组
const GROUP_COMMANDS = {
  action: ACTION_COMMANDS,
  dom: DOM_COMMANDS,
  emu: EMU_COMMANDS,
  input: INPUT_COMMANDS,
  page: PAGE_COMMANDS,
  target: TARGET_COMMANDS,
  wait: WAIT_COMMANDS,
};

run(async () => {
  const { handler, args } = parseCliCommand(process.argv, GROUP_COMMANDS);
  return await handler(args);
});