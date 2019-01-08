const { ExperimentError } = require('../../Errors');

const defaultFunction = () => false;

/**
 * @typedef {Object} Experiment
 * @property {Boolean} [active = false]
 * @property {String} name
 * @property {String} googleId
 * @property {Object} selectors
 * @property {Array.<{ name: String, weight: Number }>} variants
 */

class Experiment {
  /**
   * @param {Experiment} options
   * @param {Object} methods
   * @param methods.clearCookie
   * @param methods.getSelectors
   * @param methods.isVersionSupported
   * @param methods.setExperiment
   */
  constructor(
    { active = false, googleId, name, selectors, variants },
    {
      isVersionSupported = defaultFunction,
    },
  ) {
    if (!name || !googleId || !selectors || !variants) {
      throw new ExperimentError('Parameters [name], [googleId], [selectors] and [variants] have to be defined.');
    }

    this._name = name;
    this._googleId = googleId;
    this._selectors = selectors;
    this._variants = variants;
    this._isActive = active;

    this._isVersionSupported = isVersionSupported;

    this.isMatchExperiment = this.isMatchExperiment.bind(this);
    this.getVariantId = this.getVariantId.bind(this);
  }

  // Getters

  get isActive() {
    return this._isActive;
  }

  get name() {
    return this._name;
  }

  get googleId() {
    return this._googleId;
  }

  get selectors() {
    return this._selectors;
  }

  get variants() {
    return this._variants;
  }

  // Private

  /**
   * @param {Number} weight
   * @returns {Boolean}
   * @private
   */
  _isWeightDefined(weight) {
    return typeof weight === 'number' && weight >= 0 && weight <= 1;
  }

  // Public

  /**
   * @param {String} id
   * @returns {String}
   */
  getVersionByVariantId(id) {
    const { name } = this.variants[id];
    return name;
  }

  /**
   * Set `isActive` parameter to true.
   */
  enable() {
    this._isActive = true;
    return this;
  }

  /**
   * Set `isActive` parameter to false.
   */
  disable() {
    this._isActive = false;
  }
  /**
   * Check if experiment selectors matches selectors passed as argument.
   * @param {Object} selectors
   * @returns {Boolean}
   */
  isMatchExperiment(selectors) {
    console.log('### isMatchExperiment', this._name);
    return Object.entries(this.selectors)
      .findIndex(([ key, value ]) => !selectors[key] || selectors[key] !== value) === -1;
  }

  /**
   * @returns {Object}
   */
  getVariantId() {
    const EXP = {RANDOM: Math.random(), WEIGHT: 0};

    return this.variants
      .findIndex(({name, weight}) => {
        if (this._isWeightDefined(weight) && this._isVersionSupported(name)) {
          EXP.WEIGHT += weight;
          return EXP.RANDOM <= EXP.WEIGHT;
        }

        return false;
      });
  }
}

module.exports = Experiment;
