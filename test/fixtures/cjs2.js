/* eslint-env node */
/* globals module */

require('./cjs3.js');

// Check builtins, ignored by default
require('path');

// Check JSON file, ignored by default
require('./package-json-script/package.json');

module.exports = {};
