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
    name: 'cwd', type: String,
    descpription: 'Current working directory; defaults to `process.cwd()`',
    typeLabel: '{underline path}'
  },
  {
    name: 'help', alias: 'h', type: Boolean,
    description: 'Display this help guide'
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
