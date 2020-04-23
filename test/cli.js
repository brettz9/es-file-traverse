import {resolve as pathResolve, dirname} from 'path';

import spawnPromise from './utilities/spawnPromise.js';

const dir = dirname(new URL(import.meta.url).pathname);
const cliPath = pathResolve(dir, '../bin/cli.js');

describe('CLI', function () {
  it('esFileTraverse binary (help)', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--help'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('es-file-traverse');
  });

  it('esFileTraverse binary (file)', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/main.js'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('filesArr');
    [
      '/test/fixtures/main.js',
      '/test/fixtures/file1.js',
      '/test/fixtures/file2.js'
    ].forEach((expectedFile) => {
      expect(stdout).to.include(expectedFile);
    });
  });
});
