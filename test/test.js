import {resolve as pathResolve} from 'path';
import esFileTraverse from '../src/index.js';
import spawnPromise from './utilities/spawnPromise.js';

const cliPath = pathResolve(__dirname, '../bin/cli.js');

describe('esFileTraverse', function () {
  it('esFileTraverse', async function () {
    const results = await esFileTraverse({
      file: './test/fixtures/main.js'
    });
    [
      '/test/fixtures/main.js',
      '/test/fixtures/file1.js',
      '/test/fixtures/file2.js'
    ].forEach((expectedFile) => {
      expect(results.some((path) => {
        return path.endsWith(expectedFile);
      })).to.be.true;
    });
  });
});

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
      '--file', 'index.js'
    ], 5000);
    expect(stderr).to.equal('');
    expect(stdout).to.contain('es-file-traverse');
  });
});
