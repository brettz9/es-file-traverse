'use strict';

const rules = {
  'node/exports-style': 0,
  'no-process-exit': 0,

  'compat/compat': 0,
  'import/no-commonjs': 0,
  'import/unambiguous': 0,

  'eslint-comments/require-description': 0
};

module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false
  },
  extends: [
    'ash-nazg/sauron-node-script-overrides',
    'plugin:import/typescript'
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
    files: 'test/fixtures/**',
    globals: {
      require: true
    },
    extends: 'ash-nazg/sauron-node',
    rules: {
      'no-shadow': ['error', {
        allow: ['chai']
      }],
      'import/extensions': 0,
      ...rules
    }
  }, {
    files: ['test/*.js', 'test/utilities/*.js'],
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
      'ash-nazg/sauron-node',
      'plugin:@fintechstudios/eslint-plugin-chai-as-promised/recommended',
      'plugin:chai-expect-keywords/recommended',
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
    files: ['*.md/*.js'],
    rules: {
    },
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module'
    }
  }],
  rules: {
    ...rules
  }
};
