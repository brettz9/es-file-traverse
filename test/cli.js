import {resolve as pathResolve, dirname} from 'path';

import spawnPromise from './utilities/spawnPromise.js';

const dir = dirname(new URL(import.meta.url).pathname);
const cliPath = pathResolve(dir, '../bin/cli.js');

describe('CLI', function () {
  this.timeout(10000);

  it('esFileTraverse binary (help)', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--help'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('es-file-traverse');
  });

  it('esFileTraverse binary (file)', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/main.js',
      '--node',
      '--defaultSourceType', 'module'
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

  it('esFileTraverse binary (file) handles cyclic', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/cyclic1.js',
      '--node',
      '--defaultSourceType', 'module'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('filesArr');
    [
      '/test/fixtures/cyclic1.js',
      '/test/fixtures/cyclic2.js'
    ].forEach((expectedFile) => {
      expect(stdout).to.include(expectedFile);
    });
  });

  it('esFileTraverse binary (file) can load serially', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--serial',
      '--file', './test/fixtures/multi-imports.js',
      '--node',
      '--defaultSourceType', 'module'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('filesArr');
    const indexes = [];
    [
      '/test/fixtures/multi-imports.js',
      '/test/fixtures/file2.js',
      '/test/fixtures/file3.js',
      '/test/fixtures/file4.js',
      '/test/fixtures/file5.js',
      '/test/fixtures/file6.js'
    ].forEach((expectedFile, i) => {
      indexes.push(stdout.indexOf(expectedFile));
      expect(stdout).to.include(expectedFile);
      if (i > 0) {
        expect(indexes[i]).to.be.greaterThan(indexes[i - 1]);
      }
    });
  });

  it(
    'esFileTraverse binary (file) throws with bad file name',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './fixtures/has-bad-import.js',
        '--node',
        '--defaultSourceType', 'module'
      ]);
      expect(stderr).to.contain('Cannot find module');
      expect(stdout).to.equal('');
    }
  );

  it('esFileTraverse binary (file) with callback module', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/main.js',
      '--callback', './test/fixtures/callback.js',
      '--node',
      '--defaultSourceType', 'module'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('filesArr');
    expect(stdout).to.contain('enter');
    expect(stdout).to.contain('exit');
    // console.log('stdout', stdout);
    [
      '/test/fixtures/main.js',
      '/test/fixtures/file1.js',
      '/test/fixtures/file2.js'
    ].forEach((expectedFile) => {
      expect(stdout).to.include(expectedFile);
    });
  });
});
