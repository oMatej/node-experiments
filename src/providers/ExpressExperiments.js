const { CookieHandler } = require('../Errors');

const BaseExperiments = require('./BaseExperiments');



class ExpressExperiments extends BaseExperiments {
  constructor({ cookies, captureSelector, experiments, experimentSelector, queryParam, requestKey, versions }) {
    super({ cookies, captureSelector, experiments, experimentSelector, queryParam, requestKey, versions });

    this.capture = this.capture.bind(this);
  }

  /**
   * @param {Object} experiments
   * @param {String} [cookieName]
   * @param {Function} [captureSelector]
   * @param {Function} [experimentSelector]
   * @returns {ExpressExperiments}
   */
  static init({ cookies, captureSelector, experiments, experimentSelector, queryParam, requestKey, versions } = {}) {
    return new ExpressExperiments({ cookies, captureSelector, experiments, experimentSelector, queryParam, requestKey, versions });
  }

  /**
   * @param {Object} req
   * @param {Object} req.cookies
   * @returns {Object|void}
   */
  getCookie(req) {
    try {
      const cookie = req.cookies[this._COOKIE_NAME];
      return cookie && JSON.parse(cookie);
    } catch (e) {}
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   */
  getCookieVersion(req) {
    const { version } = this.getCookie(req) || {};

    return this.isVersionsSupported(version) && version;
  }

  /**
   * @param {Object} req
   * @returns {Object}
   */
  getExperimentReq(req) {
    return req[this._REQUEST_KEY] || {};
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   */
  getRequestVersion(req) {
    const { version } = this.getExperimentReq(req);

    return this.isVersionsSupported(version) && version;
  }

  /**
   * @param {Object} req
   * @returns {Boolean|String}
   */
  getQueryVersion(req) {
    const version = req.query[this._QUERY_PARAM];

    return this.isVersionsSupported(version) && version;
  }

  /**
   * @param {Object} res
   * @param {Object} value
   * @param {Object} [options]
   * @returns {void}
   */
  setCookie(res, value, options = {}) {
    try {
      res.cookie(this._COOKIE_NAME, JSON.stringify(value), { ...this._COOKIES_DEFAULT_OPTIONS, ...options });
    } catch (e) {}
  }

  /**
   * @param {Object} req
   * @param {Object} state
   * @returns {Object|void}
   */
  setExperimentRequest(req, state = {}) {
    try {
      const previousState = this.getExperimentReq(req);
      const nextState = { ...previousState, ...state };
      req[this._REQUEST_KEY] = nextState;
      return nextState;
    } catch (e) {}
  }

  /**
   * @param {Object} res
   * @returns {void}
   */
  clearCookie(res) {
    res.clearCookie(this._COOKIE_NAME);
  }


  /**********************/

  /**
   * @middleware
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  capture(req, res, next) {
    const clientDetails = this._captureSelector(req, res);

    this.setCookie(res, { version: 'V2' });
    this.setExperimentRequest(req, { version: 'V3' });

    const queryVersion = this.getQueryVersion(req);
    const requestVersion = this.getRequestVersion(req);
    const cookieVersion = this.getCookieVersion(req);

    console.log({ clientDetails, queryVersion, requestVersion, cookieVersion });

    return next();
  }
}

module.exports = ExpressExperiments;
