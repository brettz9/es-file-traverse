import ashNazg from 'eslint-config-ash-nazg';

const rules = {
  'n/exports-style': 0,
  'no-process-exit': 0,

  'compat/compat': 0,
  'import/no-commonjs': 0,
  'import/unambiguous': 0,

  '@eslint-community/eslint-comments/require-description': 0
};

export default [
  {
    ignores: [
      'coverage'
    ]
  },
  ...ashNazg(['sauron', 'node']),
  // parser: '@babel/eslint-parser',
  {
    files: ['test/fixtures/**'],
    languageOptions: {
      globals: {
        define: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'no-shadow': ['error', {
        allow: ['chai']
      }],
      'import/extensions': 0,
      ...rules
    }
  },
  {
    files: ['test/*.js', 'test/utilities/*.js'],
    rules: {
      'n/no-unsupported-features/es-syntax': ['error', {
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
  },
  {
    rules: {
      ...rules
    }
  }
];
