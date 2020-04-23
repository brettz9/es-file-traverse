'use strict';

/**
 * @todo Should really get this built along with the schema below from a common
 * origin file.
 * @typedef {PlainObject} ESFileTraverseOptionDefinitions
 * @property {string} file
 * @property {boolean} help
 */

const optionDefinitions = [
  {
    name: 'file', alias: 'f', type: String, defaultOption: true,
    multiple: true,
    description: 'File entry glob to process for beginning traversal. ' +
      'Required.',
    typeLabel: '{underline file-path}'
  },
  {
    name: 'callback', type: String,
    description: 'Require path to be passed intermediate AST. Passed ' +
      '"enter" or "exit" and an object with `fullPath`, `text`, and ' +
      '`ast` (and in "exit" mode, also "proms" with array of traversal ' +
      'Promises and `resolvedSet` with resolved imports for that file). ' +
      'Default is none.',
    typeLabel: '{underline require path}'
  },
  {
    name: 'serial', type: Boolean,
    description: 'Whether to iterate serially and ensure consistent order ' +
      'in visiting files. Default is `false` as less performant.'
  },
  {
    name: 'cwd', type: String,
    descpription: 'Current working directory; defaults to `process.cwd()`',
    typeLabel: '{underline path}'
  }
];

const cliSections = [
  {
    header: 'es-file-traverse',
    // Add italics: `{italic textToItalicize}`
    // eslint-disable-next-line node/global-require
    content: require('../package.json').description
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
];

exports.sections = cliSections;
exports.definitions = optionDefinitions;
