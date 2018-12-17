const express = require('express');
const cookieParser = require('cookie-parser');

const { GoogleOptimizeExperiments } = require('../src');

const experiments = require('./experiments.config');

const app = express();

const COUNTERS = {
  V1: 0,
  V2: 0,
  V3: 0,
  V4: 0,
  V5: 0,
};

const experimentsService = GoogleOptimizeExperiments.init({
  defaultVersion: 'V1',
  experiments,
  versions: [ 'V1', 'V2', 'V3', 'V4', 'V5' ],
});

app.use(cookieParser());

/**
 * Collect data about request.
 */

app.use(experimentsService.capture);

/**
 * Enable Express middlewares for each experiment.
 */

experimentsService.enableExperiments(app);

/**
 * EXPERIMENTS object stored inside Express req.
 */

app.use((req, res, next) => {
  const { EXPERIMENTS } = req;
  console.log({ EXPERIMENTS });
  return next();
});

/**
 * Filtering middleware / Express Router to specific version.
 */

app.use(experimentsService.filterToVersion('V2', (req, res, next) => {
  console.log('I am version V2.');
  return next();
}));

/**
 * Disabling experiments during application lifecycle.
 */

app.get('/disable/:name', (req, res) => {
  const { name } = req.params;
  experimentsService.unregisterExperiment(name);
  return res.sendStatus(200);
});

app.get('/', (req, res) => {
  const { EXPERIMENTS: { experiment, googleId, variantId, version} } = req;

  if (experiment && googleId && typeof variantId !== 'undefined') {
    COUNTERS[version] += 1;
  }

  return res.json({
    experiment,
    googleId,
    variantId,
    version,
    COUNTERS,
  });
});

app.listen(3000);