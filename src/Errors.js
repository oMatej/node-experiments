const Errors = module.exports = exports = {};

Errors.CorruptedExperimentsConfig = class CorruptedExperimentsConfig extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'CorruptedExperimentsConfig';
    this.message = message;
  }
};

Errors.ExperimentError = class ExperimentError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'ExperimentError';
    this.message = message;
  }
};

Errors.RegisterExperimentError = class RegisterExperimentError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'RegisterExperimentError';
    this.message = message;
  }
};

Errors.UnregisterExperimentError = class UnregisterExperimentError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'UnregisterExperimentError';
    this.message = message;
  }
};
