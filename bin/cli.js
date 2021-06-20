#!/usr/bin/env node
import {fileURLToPath} from 'url';
import {join, dirname} from 'path';

import {cliBasics} from 'command-line-basics';
import {traverse as mainScript} from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const optionDefinitions = await cliBasics(
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
  await mainScript({
    format: 'strings', // (Overridable) default for CLI only
    ...optionDefinitions
  });
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
}
})();
