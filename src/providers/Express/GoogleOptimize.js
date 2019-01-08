const inbound = require('inbound');
const useragent = require('express-useragent');

const { ExperimentError, RegisterExperimentError, UnregisterExperimentError } = require('../../Errors');

const BaseExpress = require('./Base');

const Experiment = require('./Experiment');

class GoogleOptimize extends BaseExpress {
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
    this.handle = this.handle.bind(this);
  }

  /**
   * @param {Object.<Experiment>} experiments
   * @param {BaseExperiment} options
   * @returns {GoogleOptimize}
   */
  static init({ experiments, ...options }) {
    return new GoogleOptimize({ experiments, ...options });
  }

  /**
   * @returns {Object.<Experiment>}
   */
  get experiments() {
    return this._experiments;
  }

  /**
   * @returns {Object.<Experiment>}
   */
  get activeExperiments() {
    return Object.entries(this.experiments)
      .reduce((experiments, [ name, experiment ]) => {
        if (experiment.isActive) {
          return {
            ...experiments,
            [name]: experiment,
          }
        }

        return experiments;
      }, {});
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
    const referrer = this._getRequestReferrer(req);
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
   * Enable experiment by name.
   * @param {String} name
   */
  enableExperiment(name) {
    if (!this._experiments[name]) {
      throw new ExperimentError(`Experiment with name ${name} is not registered.`);
    }

    this._experiments[name].enable();
  }

  /**
   * Dusabke exoeriment by name.
   * @param {String} name
   */
  disableExperiment(name) {
    if (!this._experiments[name]) {
      throw new ExperimentError(`Experiment with name ${name} is not registered.`);
    }

    this._experiments[name].disable();
  }

  /**
   * Register new experiment with `name` and `config`. If experiment already exists override its configuration.
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

    this._experiments[name] = new Experiment({ name, ...config }, {
      isVersionSupported: this.isVersionSupported,
    });
  }

  /**
   * @param {String} name
   */
  unregisterExperiment(name) {
    if (!name) {
      throw new UnregisterExperimentError('[name] parameter have to be defined during unregistering an experiment.');
    }

    this.disableExperiment(name);
    delete this._experiments[name];
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

      this._setRequestExperimentObject(req, { selectors, version });

      return next();
    } catch (e) {
      this._setRequestExperimentObject(req, { version });
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

  handle() {
    const preselect = (req, res, next) => {
      console.log('### PRESELECTING VERSION ###');
      return next();
    };

    const experiments = (req, res, next) => {
      const selectors = this._getRequestExperimentSelectors(req);

      const experiment = Object.values(this.activeExperiments).find(
        e => e.isMatchExperiment(selectors)
      );

      if (!experiment) {
        return next();
      }

      const variantId = experiment.getVariantId();

      if (variantId !== -1) {
        const version = experiment.getVersionByVariantId(variantId);

        console.log({ experiment, version, variantId });

        this._setExperiment(req, res, {
          experiment: experiment.name, googleId: experiment.googleId, variantId, version,
        });
      }


      return next();
    };

    return [ preselect, experiments ];
  }
}

module.exports = GoogleOptimize;