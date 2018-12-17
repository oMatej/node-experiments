const inbound = require('inbound');
const useragent = require('express-useragent');

const { RegisterExperimentError, UnregisterExperimentError } = require('../../Errors');

const BaseExpress = require('../BaseExpress');

const Experiment = require('./Experiment');

class GoogleOptimizeExperiments extends BaseExpress {
  /**
   * @param {Object.<Experiment>} experiments
   * @param {BaseExperiment} options
   */
  constructor({ experiments, ...options }) {
    super(options);

    /**
     * @type {Object.<Experiment>}
     * @private
     */
    this._experiments = {};

    this._initialize(experiments);

    this.capture = this.capture.bind(this);
  }

  /**
   * @param {Object.<Experiment>} experiments
   * @param {BaseExperiment} options
   * @returns {GoogleOptimizeExperiments}
   */
  static init({ experiments, ...options }) {
    return new GoogleOptimizeExperiments({ experiments, ...options });
  }

  /**
   * @returns {Object.<Experiment>}
   */
  get experiments() {
    return this._experiments;
  }

  /**
   * @returns {Function[]}
   */
  get middlewares() {
    return Object.values(this._experiments)
      .map(experiment => experiment.middleware);
  }

  _initialize(experiments) {
    Object.entries(experiments)
      .forEach(([ name, config ]) => this.registerExperiment(name, config))
  }

  /**
   * @param {Object} req
   * @returns {Promise<any>}
   * @private
   */
  _parseReferrer(req) {
    const href = this._getRequestUrl(req);
    const referrer = this._getReferrer(req);
    return new Promise((resolve, reject) => inbound.referrer.parse(href, referrer, (e, details) => {
      if (e) {
        return reject(e);
      }

      return resolve(details);
    }));
  }

  /**
   * @param {Object} req
   * @returns {Object}
   * @private
   */
  _parseUserAgent(req) {
    try {
      const userAgent = this._getRequestUserAgent(req);
      const { source, ...ua } = useragent.parse(userAgent);
      return ua;
    } catch (e) {
      return {}
    }
  }

  /**
   * @param {String} name
   * @param {Object} config
   */
  registerExperiment(name, config) {
    if (!name) {
      throw new RegisterExperimentError('[name] parameter have to be defined during registering an experiment.');
    }

    if (!config || typeof config !== 'object') {
      throw new RegisterExperimentError('[config] parameter have to be defined as an object during registering an experiment.');
    }

    const options = {
      clearCookie: this._clearCookie,
      getSelectors: this._getRequestSelectors,
      setExperiment: this._setExperiment
    };

    const experiment = new Experiment({ name, versions: this._VERSIONS, ...config });
    experiment.createMiddleware(options);

    this._experiments[name] = experiment;
  }

  /**
   * @param {String} name
   */
  unregisterExperiment(name) {
    if (!name) {
      throw new UnregisterExperimentError('[name] parameter have to be defined during unregistering an experiment.');
    }

    if (!this._experiments[name]) {
      throw new UnregisterExperimentError(`Experiment with name ${name} is not registered.`);
    }

    this._experiments[name].disable();
  }

  /**
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  async capture(req, res, next) {
    const version = this.getVersion(req) || this._DEFAULT_VERSION;
    try {
      const selectors = await this.captureSelector(req, res);

      this._setExperimentRequest(req, { selectors, version });

      return next();
    } catch (e) {
      this._setExperimentRequest(req, { version });
      return next();
    }
  }

  /**
   * @param {Object} req
   * @param {Object} res
   * @returns {Promise<Object>}
   */
  async captureSelector(req, res) {
    try {
      const { referrer, campaign } = await this._parseReferrer(req);
      const userAgent = this._parseUserAgent(req);
      return { ...referrer, ...campaign, ...userAgent };
    } catch (e) {
      return {};
    }
  }

  /**
   * @param {Object} app
   */
  enableExperiments(app) {
    this.middlewares.forEach(
      middleware => app.all('*', middleware)
    );
  }
}

module.exports = GoogleOptimizeExperiments;