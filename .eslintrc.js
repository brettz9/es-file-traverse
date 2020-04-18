'use strict';

module.exports = {
  parser: 'babel-eslint',
  extends: [
    'ash-nazg/sauron-node',
    'plugin:node/recommended-script'
  ],
  env: {
    node: true,
    es6: true
  },
  settings: {
    polyfills: [
      'Promise'
    ]
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  overrides: [{
    files: ['test/**'],
    extends: [
    ],
    env: {
      mocha: true
    },
    globals: {
      expect: true
    }
  }, {
    files: ['test/**'],
    extends: [
      'plugin:node/recommended-module'
    ],
    env: {
      node: true
    },
    globals: {
      require: true,
      __dirname: true
    }
  }, {
    files: ['*.md'],
    rules: {
    },
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module'
    }
  }],
  rules: {
    'node/exports-style': 0,
    'no-process-exit': 0,

    'import/no-commonjs': 0,
    'import/unambiguous': 0
  }
};
