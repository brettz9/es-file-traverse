'use strict';

module.exports = {
  exclude: 'test/*/**',
  reporter: 'mocha-multi-reporters',
  'reporter-option': [
    'configFile=mocha-multi-reporters.json',
    'badge_output=doc-includes/tests-badge.svg'
  ],
  require: [
    'chai/register-expect'
  ]
};
