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

  it('esFileTraverse binary (file) and explicit modules', async function () {
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

  it(
    'esFileTraverse binary (file) and modules by file extension',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/import.mjs',
        '--node'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/import.mjs',
        '/test/fixtures/import2.mjs'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) and cjs by file extension',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs.cjs',
        '--node',
        '--cjs'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/cjs.cjs',
        '/test/fixtures/cjs2.cjs'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) and html',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/entry.html'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/script1.js',
        '/test/fixtures/file1.js',
        '/test/fixtures/file2.js',
        '/test/fixtures/script2.js',
        '/test/fixtures/import.mjs',
        '/test/fixtures/import2.mjs'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) and cjs by file extension (and `--noEsm`)',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs.cjs',
        '--node',
        '--cjs',
        '--no-esm'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/cjs.cjs',
        '/test/fixtures/cjs2.cjs'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it('esFileTraverse binary (file) with glob', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/ma*.js',
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

  it('esFileTraverse binary (file) with no glob', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/main.js',
      '--node',
      '--noGlobs',
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

  it(
    'esFileTraverse binary (file) erring given use of glob with `noGlobs`',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/ma*.js',
        '--node',
        '--noGlobs',
        '--defaultSourceType', 'module'
      ], 5000);
      expect(stderr).to.contain('Cannot find module');
      expect(stdout).to.equal('');
    }
  );

  it(
    'esFileTraverse binary (file) - relying on browser algorithm',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
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
    }
  );

  it(
    'esFileTraverse binary (file) - cjs',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs.js',
        '--cjs'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/cjs.js',
        '/test/fixtures/cjs2.js',
        '/test/fixtures/cjs3.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs relying on package-json for type',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/package-json-script/cjs.js',
        '--cjs'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/package-json-script/cjs.js',
        '/test/fixtures/package-json-script/cjs2.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - relying on package-json for module type',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/package-json-module/import.js'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/package-json-module/import.js',
        '/test/fixtures/package-json-module/import2.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - amd relying on browser algorithm',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/amd-define.js',
        '--amd'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr');
      [
        '/test/fixtures/amd-define.js',
        '/test/fixtures/amd2.js',
        '/test/fixtures/amd3.js',
        '/test/fixtures/amd4.js',
        '/test/fixtures/amd5.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - relying on `babelEslintOptions.sourceType`',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
        '--no-check-package-json',
        '--babelEslintOptions', '{"sourceType":"module"}'
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
    }
  );

  it(
    'esFileTraverse binary (file) with `jsExtension` and no matches',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
        '--node',
        '--jsExtension', 'ajs',
        '--defaultSourceType', 'module'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('filesArr []');
    }
  );

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

  it(
    'should err with import paths that would work as scripts but ' +
      'are not valid imports',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './fixtures/bad-esm-import.js',
        '--defaultSourceType', 'module'
      ]);
      expect(stderr).to.contain('Browser module imports must begin with');
      expect(stdout).to.equal('');
    }
  );

  it(
    'esFileTraverse binary (file) throws with bad module combinations',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './test/fixtures/main.js',
        '--no-esm'
      ]);
      expect(stderr).to.contain('You must specify `noEsm` as `true` or ');
      expect(stdout).to.equal('');
    }
  );

  it(
    'esFileTraverse binary (file) throws with bad file URL',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './fixtures/has-bad-import.js',
        '--defaultSourceType', 'module'
      ]);
      expect(stderr).to.contain('File not found');
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
