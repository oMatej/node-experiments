const Errors = module.exports = exports = {};

Errors.CorruptedExperimentsConfig = class CorruptedExperimentsConfig extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'CorruptedExperimentsConfig';
    this.message = message;
  }
};

Errors.CookieHandler = class CookieHandler extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'CookieHandler';
    this.message = message;
  }
};
