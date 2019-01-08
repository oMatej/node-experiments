const BaseExperiments = require('../Base');

class Base extends BaseExperiments {
  /**
   * @param {BaseExperiment} options
   */
  constructor(options) {
    super(options);

    this._clearCookie = this._clearCookie.bind(this);
    this._getRequestExperimentSelectors = this._getRequestExperimentSelectors.bind(this);
    this._setExperiment = this._setExperiment.bind(this);
  }

  /**
   * @param {Object} req
   * @param {Object} req.cookies
   * @returns {Object}
   * @private
   */
  _getCookie(req) {
    try {
      const cookie = req.cookies[this._COOKIE_KEY];

      if (cookie) {
        return JSON.parse(cookie);
      }

      return {};
    } catch (e) {
      return {};
    }
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   * @private
   */
  _getCookieVersion(req) {
    const { version } = this._getCookie(req);

    return this.isVersionSupported(version) && version;
  }

  /**
   * @param {Object} req
   * @returns {Object}
   * @private
   */
  _getRequestExperimentObject(req) {
    return req[this._REQUEST_KEY] || {};
  }

  /**
   * @param {Object} req
   * @returns {Object}
   * @protected
   */
  _getRequestExperimentSelectors(req) {
    const { selectors } = this._getRequestExperimentObject(req);
    return selectors || {};
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   * @private
   */
  _getQueryVersion(req) {
    const version = req.query[this._QUERY_KEY];

    return this.isVersionSupported(version) && version;
  }

  /**
   * @param {Object} req
   * @returns {String}
   * @protected
   */
  _getRequestReferrer(req) {
    return req.get('Referrer') || req.get('Referer') || '';
  }

  /**
   * @param {Object} req
   * @returns {String}
   * @protected
   */
  _getRequestUrl(req) {
    return req.url;
  }

  /**
   * @param {Object} req
   * @returns {Headers | string | HeadersInit | * | string[]}
   * @protected
   */
  _getRequestUserAgent(req) {
    return req.headers && req.headers['user-agent'];
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   * @private
   */
  _getRequestVersion(req) {
    const { version } = this._getRequestExperimentObject(req);

    return this.isVersionSupported(version) && version;
  }

  /**
   * @param {Object} res
   * @param {Function} res.cookie
   * @param {Object} value
   * @param {Object} [options]
   * @returns {void}
   * @private
   */
  _setCookie(res, value, options = this._COOKIES_OPTIONS) {
    try {
      const mergedOptions = { ...this._COOKIES_DEFAULT_OPTIONS, ...options };

      res.cookie(this._COOKIE_KEY, JSON.stringify(value), mergedOptions);
    } catch (e) {}
  }

  /**
   * @param {Object} req
   * @param {Object} res
   * @param {Object} options
   * @param {String} experiment
   * @param {String} version
   * @protected
   */
  _setExperiment(req, res, { experiment, version = this._DEFAULT_VERSION, ...options }) {
    this._setRequestExperimentObject(req, { experiment, version, ...options });
    this._setCookie(res, { experiment, version });
  }

  /**
   * @param {Object} req
   * @param {Object} state
   * @returns {Object|void}
   * @protected
   */
  _setRequestExperimentObject(req, state = {}) {
    try {
      const previousState = this._getRequestExperimentObject(req);
      const nextState = { ...previousState, ...state };

      req[this._REQUEST_KEY] = nextState;

      return nextState;
    } catch (e) {}
  }

  /**
   * @param {Object} req
   * @returns {void}
   * @private
   */
  _clearExperimentRequest(req) {
    req[this._REQUEST_KEY] = undefined;
  }

  /**
   * @param {Object} res
   * @returns {void}
   * @protected
   */
  _clearCookie(res) {
    res.clearCookie(this._COOKIE_KEY);
  }

  /**
   * @param {Object} req
   * @param {Object} res
   * @returns {void}
   */
  clearExperiment(req, res) {
    this._clearExperimentRequest(req);
    this._clearCookie(res);
  }

  /**
   * @param {String} version
   * @param {Function} proceed
   * @returns {Function}
   */
  filterToVersion(version, proceed) {
    return (req, res, next) => {
      if (version === this.getVersion(req)) {
        return proceed(req, res, next);
      }

      return next();
    }
  }
}

module.exports = Base;
