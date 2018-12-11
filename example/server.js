const express = require('express');
const cookieParser = require('cookie-parser');

const { ExpressExperiments } = require('../src');

const app = express();

const experiments = ExpressExperiments.init({
  experiments: {},
  captureSelectors: (req, res) => ({ originalUrl: req.originalUrl }),
  versions: [ 'V1', 'V2', 'V3' ]
});

app.use(cookieParser());
app.use(experiments.capture);

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

app.use(experiments.filterToVersion('V2', (req, res, next) => {
  console.log('I am V2 Router.');
  return next();
}));


app.get('/', (req, res) => res.send({ success: true }));

app.listen(3000);