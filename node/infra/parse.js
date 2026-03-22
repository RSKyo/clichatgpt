import { ERROR_CODE, CliError } from './protocol.js';

export function parseCliCommand(argv, groupCommands) {
  const [, , group, cmd, ...args] = argv;

  const groupNames = Object.keys(groupCommands).join(', ');

  if (!group) {
    throw new CliError(
      ERROR_CODE.MISSING_CMD,
      `missing command group, expected one of: ${groupNames}`
    );
  }

  if (!Object.hasOwn(groupCommands, group)) {
    throw new CliError(
      ERROR_CODE.INVALID_CMD,
      `unknown command group: ${group}, expected one of: ${groupNames}`
    );
  }

  const commands = groupCommands[group];
  const cmdNames = Object.keys(commands).join(', ');

  if (!cmd) {
    throw new CliError(
      ERROR_CODE.MISSING_CMD,
      `missing command, expected one of: ${cmdNames}`
    );
  }

  if (!Object.hasOwn(commands, cmd)) {
    throw new CliError(
      ERROR_CODE.INVALID_CMD,
      `unknown command: ${cmd}, expected one of: ${cmdNames}`
    );
  }

  return {
    group,
    cmd,
    args,
    commands,
    handler: commands[cmd],
  };
}

export function parseBool(value, defaultValue = true) {
  if (value == null || value === '') return defaultValue;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
  
    throw new CliError(ERROR_CODE.INVALID_ARGS, `invalid boolean: ${value}`);
}

export function parseInt(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, `invalid ${name}`);
  }

  return n;
}

export function parseFloat(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new CliError(ERROR_CODE.INVALID_ARGS, `invalid ${name}`);
  }

  return n;
}