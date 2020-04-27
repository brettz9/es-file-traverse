#!/usr/bin/env node
'use strict';

const {join} = require('path');
const {cliBasics} = require('command-line-basics');
const {traverse: mainScript} = require('../src/index.js');

const optionDefinitions = cliBasics(
  join(__dirname, '../src/optionDefinitions.js'), {
    commandLineArgsOptions: {
      camelCase: true
    }
  }
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

(async () => {
try {
  const filesArr = await mainScript(optionDefinitions);
  // eslint-disable-next-line no-console
  console.log('filesArr', filesArr);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
}
})();
