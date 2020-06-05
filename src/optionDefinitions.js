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
    name: 'noGlobs', type: Boolean,
    description: '`file` files will be treated by default as globs. Set this ' +
      'to `true` to disable. Defaults to `false`.'
  },
  {
    name: 'callback', type: String,
    description: 'Require path to be passed intermediate AST. Passed ' +
      '"enter" or "exit" and an object with `fullPath`, `text`, and ' +
      '`ast` (and in "exit" mode, also "type" ("exit", unlike "enter", ' +
      'is run once for each module type, whether "esm", "cjs", or "amd"), ' +
      '"proms" with array of traversal Promises, and `resolvedSet` with ' +
      'resolved imports for that file). Default is none.',
    typeLabel: '{underline require path}'
  },
  {
    name: 'serial', type: Boolean,
    description: 'Whether to iterate serially and ensure consistent order ' +
      'in visiting files. Default is `false` as less performant.'
  },
  {
    name: 'cwd', type: String,
    description: 'Current working directory; defaults to `process.cwd()`',
    typeLabel: '{underline path}'
  },
  {
    name: 'node', type: Boolean,
    description: 'If assuming a Node.js environment (or one otherwise using ' +
      'the Node resolution algorithm). Will not be used on html files. ' +
      'Defaults to `false`.'
  },
  {
    name: 'no-check-package-json', type: Boolean,
    description: 'If set will not perform the normal checks for non-HTML ' +
      'JavaScript files of the `type` in the nearest `package.json` to ' +
      'determine source type. Defaults to `false`.'
  },
  {
    name: 'defaultSourceType', type: String,
    description: 'When checking non-HTML JavaScript files (and ' +
      '`no-check-package-json` is not set), and no `package.json` `type` ' +
      'is found, this will determine the source type. Overrides ' +
      '`parserOptions.sourceType` (as does presence of "mjs" or ' +
      '"cjs" extension with `node`) for such files unless ' +
      '`no-check-package-json` is set. Defaults to ' +
      '`undefined`, but is overridden by "cjs" or "mjs" extensions ' +
      '`with `node`.',
    typeLabel: '{underline "module"|"script"}'
  },
  {
    name: 'no-esm', type: Boolean,
    description: 'Whether ES Modules imports should not be followed (and ' +
      'whether mjs files should not be treated as ESM).' +
      'Defaults to `false` (imports will be followed).'
  },
  {
    name: 'cjs', type: Boolean,
    description: 'Whether to check Node/CommonJS modules (and treat ".cjs" ' +
      'files as CommonJS). Defaults to `false`. Assumes a ' +
      'non-overwritten `require`.'
  },
  {
    name: 'amd', type: Boolean,
    description: 'Whether to check AMD modules. Note that this will ' +
      'ultimately depend on an `XMLHttpRequest` or `fetch` implementation ' +
      'in the browser. Defaults to `false`. Assumes a non-overwritten ' +
      '`require` and `define`.'
  },
  {
    name: 'forceLanguage', type: String,
    description: 'Whether to force treatment of files as a file type (e.g., ' +
      '"js" for JavaScript even if possessing an `.htm`/`.html` extension. ' +
      'Defaults to not being used.',
    typeLabel: '{underline "js"|"html"}'
  },
  {
    name: 'htmlExtension', type: String, multiple: true,
    description: 'Extension(s) to be treated as (static) HTML. Defaults ' +
      'to "htm" and "html".',
    typeLabel: '{underline extension string}'
  },
  {
    name: 'jsExtension', type: String, multiple: true,
    description: 'Extension(s) to be treated as JavaScript. Defaults to ' +
      '"js", "mjs", and "cjs".',
    typeLabel: '{underline extension string}'
  },
  {
    name: 'pathExpression', type: String,
    description: 'Regular expression to match paths to include. By default, ' +
      'this whitelist will not be in effect. Set, for example to ' +
      '`"/node_modules/"` to restrict results to dependencies. If no ' +
      'slashes are used (for flags), will default to using the `u` flag only.',
    typeLabel: '{underline regular expression for path matching}'
  },
  {
    name: 'parser', type: String,
    description: 'Indicates the parser to use. Unless using `babel-eslint` ' +
      '(the default), you will need to be sure the parser is added to your ' +
      'dependencies.',
    typeLabel: '{underline "babel-eslint"|"espree"|"esprima"|' +
      '"@typescript-eslint/parser"}'
  },
  {
    name: 'parserOptions', type: String,
    description: 'Options (including `babelOptions` if desired) to pass to ' +
      'the parser (`babel-eslint` is the one built-in by default). Defaults ' +
      'to an object with only an auto-determined ' +
      '`filePath` being passed in and `sourceType` set to "module" by ' +
      'default if the file extension ends in "mjs" or to "script" if it ' +
      'ends in "cjs" (you can manually set this as desired to force the ' +
      'type when the type is not set by the HTML script type). Note that ' +
      'passing in HTML files will cause `sourceType` to be auto-set ' +
      'depending on whether it is specified as a script or module.',
    typeLabel: '{underline options-as-JSON-object}'
  },
  {
    name: 'output', type: String, alias: 'o',
    description: 'File path to which to save output (as JSON). Defaults ' +
      'to not being used.',
    typeLabel: '{underline path}'
  },
  {
    name: 'format', type: String,
    description: 'Format to log to console. "strings" may be piped ' +
      'into ESLint. "none" may be desired when `output` is used. ' +
      'Defaults to "strings" in CLI and "none" in programmatic usage.',
    typeLabel: '{underline "strings"|"json"|"none"}'
  },
  {
    name: 'includeType', type: String,
    multiple: true,
    description: 'Opt in to include non-JS types in results (built-in ' +
      'Node modules or JSON). Default is not to use (only JS files are ' +
      'included as needed when passing to ESLint without such as a JSON ' +
      'processor plugin).',
    typeLabel: '{underline "json"|"builtin"}'
  },
  {
    name: 'ignoreResolutionErrors', type: Boolean,
    description: 'If a file cannot be found (e.g., because it is only to ' +
      'be present and required in local testing), this will prevent the ' +
      'operation from failing.'
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
