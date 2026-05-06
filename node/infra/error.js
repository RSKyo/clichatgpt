export const ERROR = {
  // existence
  REQUIRED: 'REQUIRED',

  // type
  NOT_STRING: 'NOT_STRING',
  NOT_NUMBER: 'NOT_NUMBER',
  NOT_BOOLEAN: 'NOT_BOOLEAN',
  NOT_ARRAY: 'NOT_ARRAY',
  NOT_OBJECT: 'NOT_OBJECT',
  NOT_FUNCTION: 'NOT_FUNCTION',

  // string
  BLANK_VALUE: 'BLANK_VALUE',     // '' / null / undefined / '   '
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID_PATTERN: 'INVALID_PATTERN',

  // number
  NOT_A_NUMBER: 'NOT_A_NUMBER',
  NOT_INTEGER: 'NOT_INTEGER',
  NOT_POSITIVE: 'NOT_POSITIVE',
  NOT_NEGATIVE: 'NOT_NEGATIVE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',

  // collection
  NOT_IN_ENUM: 'NOT_IN_ENUM',
  NOT_UNIQUE: 'NOT_UNIQUE',

  // format
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_URL: 'INVALID_URL',
  INVALID_DATE: 'INVALID_DATE',

  // fallback
  INVALID: 'INVALID',
  INTERNAL: 'INTERNAL',
};

export const ERROR_SCHEMA = {
  // existence
  REQUIRED: {
    code: ERROR.REQUIRED,
    message: '{field} is required',
  },

  // type
  NOT_STRING: {
    code: ERROR.NOT_STRING,
    message: '{field} must be a string',
  },
  NOT_NUMBER: {
    code: ERROR.NOT_NUMBER,
    message: '{field} must be a number',
  },
  NOT_BOOLEAN: {
    code: ERROR.NOT_BOOLEAN,
    message: '{field} must be a boolean',
  },
  NOT_ARRAY: {
    code: ERROR.NOT_ARRAY,
    message: '{field} must be an array',
  },
  NOT_OBJECT: {
    code: ERROR.NOT_OBJECT,
    message: '{field} must be an object',
  },
  NOT_FUNCTION: {
    code: ERROR.NOT_FUNCTION,
    message: '{field} must be a function',
  },

  // string
  BLANK_VALUE: {
    code: ERROR.BLANK_VALUE,
    message: '{field} must not be blank',
  },
  TOO_SHORT: {
    code: ERROR.TOO_SHORT,
    message: '{field} is too short (min: {min})',
  },
  TOO_LONG: {
    code: ERROR.TOO_LONG,
    message: '{field} is too long (max: {max})',
  },
  INVALID_PATTERN: {
    code: ERROR.INVALID_PATTERN,
    message: '{field} format is invalid',
  },

  // number
  NOT_A_NUMBER: {
    code: ERROR.NOT_A_NUMBER,
    message: '{field} must be a valid number',
  },
  NOT_INTEGER: {
    code: ERROR.NOT_INTEGER,
    message: '{field} must be an integer',
  },
  NOT_POSITIVE: {
    code: ERROR.NOT_POSITIVE,
    message: '{field} must be positive',
  },
  OUT_OF_RANGE: {
    code: ERROR.OUT_OF_RANGE,
    message: '{field} must be between {min} and {max}',
  },

  // collection
  NOT_IN_ENUM: {
    code: ERROR.NOT_IN_ENUM,
    message: '{field} must be one of [{values}]',
  },
  NOT_UNIQUE: {
    code: ERROR.NOT_UNIQUE,
    message: '{field} must be unique',
  },

  // format
  INVALID_EMAIL: {
    code: ERROR.INVALID_EMAIL,
    message: '{field} must be a valid email',
  },
  INVALID_URL: {
    code: ERROR.INVALID_URL,
    message: '{field} must be a valid URL',
  },
  INVALID_DATE: {
    code: ERROR.INVALID_DATE,
    message: '{field} must be a valid date',
  },

  // fallback
  INVALID: {
    code: ERROR.INVALID,
    message: '{field} is invalid',
  },
  INTERNAL: {
    code: ERROR.INTERNAL,
    message: 'internal error',
  },
};
export class ClientError extends Error {
  constructor(code, message, details = null) {
    super(message);
    // 在 JS 里，继承普通类通常没事，但继承一些内建对象时，尤其是 Error，有时实例的原型链不会完全按你预期工作。
    // err instanceof ClientError 可能判断不稳定
    // 把当前实例 this 的原型，设成 ClientError 的 prototype
    // new.target 被哪个构造函数 new 出来的，new ClientError(...) 就是 ClientError
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ClientError";
    this.code = code || ERROR.INTERNAL;
    this.details = details;
  }
}

export function normalizeError(err, options = {}) {
  const { includeStack = false } = options;

  // 已经是我们自己的错误
  if (err instanceof ClientError) {
    return {
      code: err.code || ERROR.INTERNAL,
      message: err.message || "unknown error",
      details: err.details ?? null,
      ...(includeStack && { stack: err.stack }),
    };
  }

  // 普通对象（尽量保留信息）
  if (err && typeof err === "object") {
    const message =
      typeof err.message === "string"
        ? err.message
        : JSON.stringify(err);

    return {
      code: err.code || ERROR.INTERNAL,
      message: message || "unknown error",
      details: err.details ?? err,
    };
  }

  // 字符串 / 其他
  return {
    code: ERROR.INTERNAL,
    message: String(err ?? "unknown error"),
    details: null,
  };
}

function format(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] ?? `{${key}}`;
  });
}

export function createClientError(errorKey, params = {}, details = null) {
  const def = ERROR_SCHEMA[errorKey] || ERROR_SCHEMA.INTERNAL;

  return new ClientError(
    def.code,
    format(def.message, params),
    details
  );
}

export const errors = {
  // existence
  required: (field, details) =>
    createClientError(ERROR.REQUIRED, { field }, details),

  // type
  notString: (field, details) =>
    createClientError(ERROR.NOT_STRING, { field }, details),

  notNumber: (field, details) =>
    createClientError(ERROR.NOT_NUMBER, { field }, details),

  notBoolean: (field, details) =>
    createClientError(ERROR.NOT_BOOLEAN, { field }, details),

  notArray: (field, details) =>
    createClientError(ERROR.NOT_ARRAY, { field }, details),

  notObject: (field, details) =>
    createClientError(ERROR.NOT_OBJECT, { field }, details),

  notFunction: (field, details) =>
    createClientError(ERROR.NOT_FUNCTION, { field }, details),

  // string
  blankValue: (field, details) =>
    createClientError(ERROR.BLANK_VALUE, { field }, details),

  tooShort: (field, min, details) =>
    createClientError(ERROR.TOO_SHORT, { field, min }, details),

  tooLong: (field, max, details) =>
    createClientError(ERROR.TOO_LONG, { field, max }, details),

  invalidPattern: (field, details) =>
    createClientError(ERROR.INVALID_PATTERN, { field }, details),

  // number
  notANumber: (field, details) =>
    createClientError(ERROR.NOT_A_NUMBER, { field }, details),

  notInteger: (field, details) =>
    createClientError(ERROR.NOT_INTEGER, { field }, details),

  notPositive: (field, details) =>
    createClientError(ERROR.NOT_POSITIVE, { field }, details),

  notNegative: (field, details) =>
    createClientError(ERROR.NOT_NEGATIVE, { field }, details),

  outOfRange: (field, { min, max } = {}, details) =>
    createClientError(ERROR.OUT_OF_RANGE, { field, min, max }, details),

  // collection
  notInEnum: (field, values, details) =>
    createClientError(
      ERROR.NOT_IN_ENUM,
      {
        field,
        values: Array.isArray(values) ? values.join(', ') : values,
      },
      details
    ),

  notUnique: (field, details) =>
    createClientError(ERROR.NOT_UNIQUE, { field }, details),

  // format
  invalidEmail: (field, details) =>
    createClientError(ERROR.INVALID_EMAIL, { field }, details),

  invalidUrl: (field, details) =>
    createClientError(ERROR.INVALID_URL, { field }, details),

  invalidDate: (field, details) =>
    createClientError(ERROR.INVALID_DATE, { field }, details),

  // fallback
  invalid: (field, details) =>
    createClientError(ERROR.INVALID, { field }, details),

  internal: (details) =>
    createClientError(ERROR.INTERNAL, {}, details),
};