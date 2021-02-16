'use strict';

module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false
  },
  rules: {
    // Intrusive
    'no-global-assign': ['error'],

    // Vulnerable
    'no-eval': ['error']
  }
};
