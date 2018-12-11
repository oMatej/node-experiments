const { CorruptedExperimentsConfig } = require('../Errors');

const COOKIE_NAME = 'AB_EXPERIMENT';
const QUERY_PARAM = 'v';
const REQUEST_KEY = 'EXPERIMENTS';

const COOKIES_DEFAULT_OPTIONS = {
  maxAge: 1000 * 60 * 60 * 14,
  path: '/',
};

class BaseExperiments {
  /**
   * @param experiments
   * @param cookies
   * @param captureSelector
   * @param experimentSelector
   * @param requestKey
   * @param queryParam
   * @param versions
   */
  constructor({ cookies, captureSelector, experiments, experimentSelector, queryParam, requestKey, versions }) {
    if (!experiments) {
      throw new CorruptedExperimentsConfig('Experiments configuration object have to be passed.');
    }

    const { name, ...otherCookieOptions } = cookies || {};

    this._COOKIE_NAME = name || COOKIE_NAME;
    this._QUERY_PARAM = queryParam || QUERY_PARAM;
    this._REQUEST_KEY = requestKey || REQUEST_KEY;

    this._COOKIES_OPTIONS = otherCookieOptions || COOKIES_DEFAULT_OPTIONS;
    this._COOKIES_DEFAULT_OPTIONS = COOKIES_DEFAULT_OPTIONS;

    this._VERSIONS = versions || [];

    this._experiments = experiments;
    this._captureSelector = captureSelector;
  }

  _initialize(experiments) {
    experiments
      .forEach(({ name, ...config }) => {
        if (!name) {
          throw new CorruptedExperimentsConfig('Each experiment have to contain `name` parameter.');
        }
      })
  }

  /**
   * @param {String} version
   * @returns {Boolean}
   */
  isVersionsSupported(version) {
    return version && this._VERSIONS.findIndex(v => v === version) !== -1;
  }
}

module.exports = BaseExperiments;
