'use strict';

module.exports = {
  exclude: 'test/*/**',
  reporter: 'cypress-multi-reporters',
  'reporter-option': [
    'configFile=mocha-multi-reporters.json',
    'badge_output=doc-includes/tests-badge.svg'
  ],
  require: [
    'esm', 'chai/register-expect'
  ]
};
