module.exports = {
  loadTest: {
    active: true,
    googleId: '### loadTestId ###',
    selectors: {
      browser: 'loadtest',
    },
    variants: [
      {
        name: 'V1',
        weight: 0.5,
      },
      {
        name: 'V2',
        weight: 0.3,
      },
      {
        name: 'V3',
        weight: 0.1,
      },
      {
        name: 'V4',
        weight: 0.05,
      },
      {
        name: 'V5',
        weight: 0.05,
      }
    ]
  },
  chromeTest: {
    active: false,
    googleId: '### chromeTestId ###',
    selectors: {
      browser: 'Chrome',
    },
    variants: [
      {
        name: 'V1',
        weight: 0.5,
      },
      {
        name: 'V6',
        weight: 0.3,
      },
      {
        name: 'V3',
        weight: 0.15,
      },
      {
        name: 'V4',
        weight: 0.05,
      },
    ]
  },
  firefoxTest: {
    active: true,
    googleId: '### firefoxTestId ###',
    selectors: {
      browser: 'Firefox',
    },
    variants: [
      {
        name: 'V1',
        weight: 0.1,
      },
      {
        name: 'V5',
        weight: 0.9,
      },
    ]
  }
};
