const { ExperimentError } = require('../../Errors');

/**
 * @typedef {Object} Experiment
 * @property {Boolean} active
 * @property {String} googleId
 * @property {String} name
 * @property {Object} selectors
 * @property {Array.<{ name: String, weight: Number }>} variants
 * @property {String[]} versions
 */

class Experiment {
  /**
   * @param {Experiment} options
   */
  constructor({ active, googleId, name, selectors, variants, versions }) {
    this._name = name;
    this._googleId = googleId;
    this._selectors = selectors;
    this._variants = variants;
    this._middleware = undefined;

    this._isActive = active || false;
    this._supportedVersions = versions;
  }

  get name() {
    return this._name;
  }

  get googleId() {
    return this._googleId;
  }

  get middleware() {
    return this._middleware;
  }

  get selectors() {
    return this._selectors;
  }

  get variants() {
    return this._variants;
  }

  /**
   * @param {Object} selectors
   * @returns {Boolean}
   * @private
   */
  _isMatchExperiment(selectors) {
    return Object.entries(this._selectors)
      .findIndex(([ key, value ]) => !selectors[key] || selectors[key] !== value) === -1;
  }

  /**
   * @param {Number} weight
   * @returns {Boolean}
   * @private
   */
  _isWeightDefined(weight) {
    return typeof weight === 'number' && weight >= 0 && weight <= 1;
  }

  /**
   * @param {String} version
   * @returns {Boolean}
   * @private
   */
  _isVersionSupported(version) {
    return version && this._supportedVersions.findIndex(v => v === version) !== -1;
  }

  /**
   * @returns {Number}
   * @private
   */
  _selectVariant() {
    const EXP = { RANDOM: Math.random(), WEIGHT: 0 };

    return this._variants
      .findIndex(({ name, weight }) => {
        if (this._isWeightDefined(weight) && this._isVersionSupported(name)) {
          EXP.WEIGHT += weight;
          return EXP.RANDOM <= EXP.WEIGHT;
        }

        return false;
      });
  }

  enable() {
    this._isActive = true;
  }

  disable() {
    this._isActive = false;
  }

  /**
   * @param {Function} clearCookie
   * @param {Function} getSelectors
   * @param {Function} setExperiment
   * @returns {Function}
   */
  createMiddleware({ clearCookie, getSelectors, setExperiment }) {
    if (!getSelectors || !setExperiment) {
      throw new ExperimentError('[getSelectors] and [setExperiment] parameters have to be defined.');
    }

    this._middleware = (req, res, next) => {
      const selectors = getSelectors(req);

      // Skip selecting version if current request does not match an experiment.
      if (!this._isMatchExperiment(selectors)) {
        return next('route');
      }

      // Skip selecting version if current experiment have been disabled.
      if (!this._isActive) {
        clearCookie(res);
        return next('route');
      }

      // Select variant from an experiment.
      const variantId = this._selectVariant();

      // If a variant was correctly selected set proper version.
      if (variantId !== -1) {
        const { name: version } = this._variants[variantId];
        setExperiment(req, res, { experiment: this._name, googleId: this._googleId, variantId, version });
      }

      return next('route');
    }
  }
}

module.exports = Experiment;
