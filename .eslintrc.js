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
    env: {
      mocha: true,
      node: true
    },
    globals: {
      require: true,
      __dirname: true,
      expect: true
    },
    extends: [
      'plugin:@fintechstudios/eslint-plugin-chai-as-promised/recommended',
      'plugin:chai-expect-keywords/recommended',
      'plugin:node/recommended-module',
      'plugin:chai-friendly/recommended',
      'plugin:chai-expect/recommended'
    ],
    rules: {
      'node/no-unsupported-features/es-syntax': ['error', {
        ignores: ['dynamicImport', 'modules']
      }],
      'compat/compat': 0,
      'chai-expect-keywords/no-unsupported-keywords': [
        'error', {
          // allowChaiDOM: true,
          allowChaiAsPromised: true
        }
      ]
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
