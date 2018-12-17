const COOKIE_KEY = 'AB_EXPERIMENT';
const QUERY_KEY = 'v';
const REQUEST_KEY = 'EXPERIMENTS';

const COOKIES_DEFAULT_OPTIONS = {
  maxAge: 1000 * 60 * 60 * 14,
  path: '/',
};

/**
 * @typedef {Object} BaseExperiment
 * @property {Object} cookies
 * @property {String} defaultVersion
 * @property {Object} request
 * @property {Object} query
 * @property {Array} versions
 */

class Base {
  /**
   * @property {BaseExperiment} options
   */
  constructor({ cookies, defaultVersion, query, request, versions }) {
    const { key: cookieKey, ...otherCookieOptions } = cookies || {};
    const { key: queryKey } = query || {};
    const { key: requestKey } = request || {};

    this._COOKIE_KEY = cookieKey || COOKIE_KEY;
    this._QUERY_KEY = queryKey || QUERY_KEY;
    this._REQUEST_KEY = requestKey || REQUEST_KEY;

    this._COOKIES_OPTIONS = otherCookieOptions || COOKIES_DEFAULT_OPTIONS;
    this._COOKIES_DEFAULT_OPTIONS = COOKIES_DEFAULT_OPTIONS;

    this._VERSIONS = versions || [];
    this._DEFAULT_VERSION = defaultVersion;

    this.isVersionSupported = this.isVersionSupported.bind(this);
  }

  /**
   * @param {Object} request
   * @returns {Boolean}
   * @protected
   */
  _getCookieVersion(request) {
    return false;
  }

  /**
   * @param {Object} request
   * @returns {Boolean}
   * @protected
   */
  _getQueryVersion(request) {
    return false;
  }

  /**
   * @param {Object} request
   * @returns {Boolean}
   * @protected
   */
  _getRequestVersion(request) {
    return false;
  }

  /**
   * @param {String} version
   * @returns {Boolean}
   */
  isVersionSupported(version) {
    return version && this._VERSIONS.findIndex(v => v === version) !== -1;
  }

  /**
   * @param {Object} request
   * @returns {Boolean|String}
   */
  getVersion(request) {
    const requestVersion = this._getRequestVersion(request);

    if (requestVersion) {
      return requestVersion;
    }

    const queryVersion = this._getQueryVersion(request);

    if (queryVersion) {
      return queryVersion;
    }

    return this._getCookieVersion(request);
  }
}

module.exports = Base;
