const { CookieHandler } = require('../Errors');

const BaseExperiments = require('./BaseExperiments');



class ExpressExperiments extends BaseExperiments {
  constructor({ cookies, captureSelectors, experiments, experimentSelector, queryParam, requestKey, versions }) {
    super({ cookies, captureSelectors, experiments, experimentSelector, queryParam, requestKey, versions });

    this.capture = this.capture.bind(this);
  }

  /**
   * @param {Object} experiments
   * @param {String} [cookieName]
   * @param {Function} [captureSelectors]
   * @param {Function} [experimentSelector]
   * @returns {ExpressExperiments}
   */
  static init({ cookies, captureSelectors, experiments, experimentSelector, queryParam, requestKey, versions } = {}) {
    return new ExpressExperiments({ cookies, captureSelectors, experiments, experimentSelector, queryParam, requestKey, versions });
  }

  /**
   * @param {Object} req
   * @param {Object} req.cookies
   * @returns {Object|void}
   * @private
   */
  _getCookie(req) {
    try {
      const cookie = req.cookies[this._COOKIE_NAME];

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

    return this.isVersionsSupported(version) && version;
  }

  /**
   * @param {Object} req
   * @returns {Object}
   * @private
   */
  _getExperimentReq(req) {
    return req[this._REQUEST_KEY] || {};
  }

  /**
   * @param {Object} req
   * @returns {Object}
   * @private
   */
  _getRequestSelectors(req) {
    const { selectors } = this._getExperimentReq(req);
    return selectors || {};
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   * @private
   */
  _getRequestVersion(req) {
    const { version } = this._getExperimentReq(req);

    return this.isVersionsSupported(version) && version;
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   * @private
   */
  _getQueryVersion(req) {
    const version = req.query[this._QUERY_PARAM];

    return this.isVersionsSupported(version) && version;
  }

  /**
   * @param {Object} res
   * @param {Object} value
   * @param {Object} [options]
   * @returns {void}
   * @private
   */
  _setCookie(res, value, options = {}) {
    try {
      res.cookie(this._COOKIE_NAME, JSON.stringify(value), { ...this._COOKIES_DEFAULT_OPTIONS, ...options });
    } catch (e) {}
  }

  /**
   * @param {Object} req
   * @param {Object} state
   * @returns {Object|void}
   * @private
   */
  _setExperimentRequest(req, state = {}) {
    try {
      const previousState = this._getExperimentReq(req);
      const nextState = { ...previousState, ...state };
      req[this._REQUEST_KEY] = nextState;
      return nextState;
    } catch (e) {}
  }

  /**
   * @param {Object} res
   * @returns {void}
   * @private
   */
  _clearCookie(res) {
    res._clearCookie(this._COOKIE_NAME);
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   */
  getActiveVersion(req) {
    const requestVersion = this._getRequestVersion(req);

    if (requestVersion) {
      return requestVersion;
    }

    const queryVersion = this._getQueryVersion(req);

    if (queryVersion) {
      return queryVersion;
    }

    return this._getCookieVersion(req);
  }

  /**
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  capture(req, res, next) {
    const selectors = this._captureSelectors(req, res);
    const version = this.getActiveVersion(req);

    this._setExperimentRequest(req, { experiment: undefined, selectors, version });

    return next();
  }

  /**
   * @param {String} version
   * @param {Function} proceed
   * @returns {Function}
   */
  filterToVersion(version, proceed) {
    return (req, res, next) => {
      if (version === this.getActiveVersion(req)) {
        return proceed(req, res, next);
      }

      return next();
    }
  }
}

module.exports = ExpressExperiments;
