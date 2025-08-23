#!/usr/bin/env node

import {cliBasics} from 'command-line-basics';
import {traverse as mainScript} from '../src/index.js';

const optionDefinitions = await cliBasics(
  import.meta.dirname + '/../src/optionDefinitions.js',
  {
    packageJsonPath: import.meta.dirname + '/../package.json',
    commandLineArgsOptions: {
      camelCase: true
    }
  }
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

try {
  await mainScript({
    format: 'strings', // (Overridable) default for CLI only
    ...optionDefinitions
  });
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
}
