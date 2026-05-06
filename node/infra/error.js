const ERROR_DEFS = {
  // existence
  required: "{field} is required",

  // type
  notString: "{field} must be a string",
  notNumber: "{field} must be a number",
  notBoolean: "{field} must be a boolean",
  notArray: "{field} must be an array",
  notObject: "{field} must be an object",
  notFunction: "{field} must be a function",

  // string
  blankValue: "{field} must not be blank",
  tooShort: "{field} is too short (min: {min})",
  tooLong: "{field} is too long (max: {max})",
  invalidPattern: "{field} format is invalid",

  // number
  notANumber: "{field} must be a valid number",
  notInteger: "{field} must be an integer",
  notPositive: "{field} must be positive",
  notNegative: "{field} must be negative",
  outOfRange: "{field} must be between {min} and {max}",

  // collection
  notInEnum: "{field} must be one of [{values}]",
  notUnique: "{field} must be unique",

  // format
  invalidEmail: "{field} must be a valid email",
  invalidUrl: "{field} must be a valid URL",
  invalidDate: "{field} must be a valid date",

  // fallback
  invalid: "{field} is invalid",
  internal: "internal error",
};

export const ERROR_CODE = Object.fromEntries(
  Object.keys(ERROR_DEFS).map((code) => [code, code]),
);

class ClientError extends Error {
  constructor(code, message, details = null) {
    super(message);
    // 在 JS 里，继承普通类通常没事，但继承一些内建对象时，尤其是 Error，有时实例的原型链不会完全按你预期工作。
    // err instanceof ClientError 可能判断不稳定
    // 把当前实例 this 的原型，设成 ClientError 的 prototype
    // new.target 被哪个构造函数 new 出来的，new ClientError(...) 就是 ClientError
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ClientError";
    this.code = code || ERROR_CODE.internal;
    this.details = details;
  }
}

export function _format(template, ...values) {
  let index = 0;

  return String(template).replace(
    /\{[^}]*\}/g,
    match => {
      const value = values[index++];

      return value == null
        ? match
        : String(value);
    }
  );
}

export function createError(
  code,
  message = null,
  details = null,
  ...values
) {
  code ??= ERROR_CODE.internal;

  const template =
    message ??
    ERROR_DEFS[code] ??
    '';

  return new ClientError(
    code,
    interpolate(template, ...values),
    details
  );
}

// -------------------------------
// Normalize
// -------------------------------

export function normalizeError(error, options = {}) {
  const { includeStack = false } = options;

  if (error instanceof ClientError) {
    return {
      code: error.code || ERROR_CODE.internal,
      message: error.message || "unknown error",
      details: error.details ?? null,
      ...(includeStack && { stack: error.stack }),
    };
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODE.internal,
      message: error.message || "unknown error",
      details: null,
      ...(includeStack && { stack: error.stack }),
    };
  }

  return {
    code: ERROR_CODE.internal,
    message: String(error ?? "unknown error"),
    details: null,
  };
}
