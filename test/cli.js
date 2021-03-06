import {readFile as readFileOrig} from 'fs';
import {resolve as pathResolve, dirname} from 'path';
import {promisify} from 'util';

import spawnPromise from './utilities/spawnPromise.js';

const readFile = promisify(readFileOrig);

const dir = dirname(new URL(import.meta.url).pathname);
const cliPath = pathResolve(dir, '../bin/cli.js');
const outputFile = pathResolve(dir, './results/output.json');

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
    [
      '/test/fixtures/main.js',
      '/test/fixtures/file1.js',
      '/test/fixtures/file2.js'
    ].forEach((expectedFile) => {
      expect(stdout).to.include(expectedFile);
    });
  });

  it(
    'esFileTraverse binary (file) and explicit modules, with format "json"',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
        '--node',
        '--defaultSourceType', 'module',
        '--format', 'json'
      ], 5000);
      expect(stderr).to.equal('');
      [
        '/test/fixtures/main.js',
        '/test/fixtures/file1.js',
        '/test/fixtures/file2.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(`${expectedFile}"`);
      });
    }
  );

  it(
    'esFileTraverse binary (file) and explicit modules, outputting to file ' +
    'and with `format`: "none"',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
        '--node',
        '--defaultSourceType', 'module',
        '--output', outputFile,
        '--format', 'none'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.equal('');
      const results = JSON.parse(await readFile(outputFile, 'utf8'));
      [
        '/test/fixtures/main.js',
        '/test/fixtures/file1.js',
        '/test/fixtures/file2.js'
      ].forEach((expectedFile) => {
        expect(results.some((result) => {
          return result.endsWith(expectedFile);
        })).to.be.true;
      });
    }
  );

  it(
    'esFileTraverse binary (file) and modules by file extension',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/import.mjs',
        '--node'
      ], 5000);
      expect(stderr).to.equal('');
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
    'esFileTraverse binary (file) silently ignoring use of glob with ' +
      '`noGlobs` when `ignoreResolutionErrors` set',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/ma*.js',
        '--node',
        '--noGlobs',
        '--defaultSourceType', 'module',
        '--ignoreResolutionErrors'
      ], 5000);
      expect(stderr).to.equal('');
      expect(stdout).to.equal('\n');
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
        '--node',
        '--cjs'
      ], 5000);
      expect(stderr).to.equal('');
      [
        '/test/fixtures/cjs.js',
        '/test/fixtures/cjs2.js',
        '/test/fixtures/cjs3.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
      [
        'path',
        '/test/fixtures/package-json-script/package.json'
      ].forEach((unexpectedItem) => {
        expect(stdout).to.not.include(unexpectedItem);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs with `pathExpression` filter',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs-3rdparty.cjs',
        '--node',
        '--cjs',
        '--pathExpression', 'node_modules'
      ], 5000);
      expect(stderr).to.equal('');
      [
        'node_modules'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
      [
        /\spath\s/u,
        /\/test\/fixtures\/cjs-3rdparty\.cjs/u,
        /\/test\/fixtures\/cjs2\.cjs/u
      ].forEach((unexpectedItem) => {
        expect(stdout).to.not.match(unexpectedItem);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs with `pathExpression` filter ' +
      'using flags',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs-3rdparty.cjs',
        '--node',
        '--cjs',
        '--pathExpression', '/node_modules/i'
      ], 5000);
      expect(stderr).to.equal('');
      [
        'node_modules'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
      [
        /\spath\s/u,
        /\/test\/fixtures\/cjs-3rdparty\.cjs/u,
        /\/test\/fixtures\/cjs2\.cjs/u
      ].forEach((unexpectedItem) => {
        expect(stdout).to.not.match(unexpectedItem);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs with `excludePathExpression` filter',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs-3rdparty.cjs',
        '--node',
        '--cjs',
        '--excludePathExpression', 'node_modules'
      ], 5000);
      expect(stderr).to.equal('');
      [
        'node_modules'
      ].forEach((expectedFile) => {
        expect(stdout).to.not.include(expectedFile);
      });
      [
        /\/test\/fixtures\/cjs-3rdparty\.cjs/u,
        /\/test\/fixtures\/cjs2\.cjs/u
      ].forEach((unexpectedItem) => {
        expect(stdout).to.match(unexpectedItem);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs with `excludePathEntryExpression`' +
      ' filter',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs-3rdparty.cjs',
        '--node',
        '--cjs',
        '--excludePathEntryExpression', 'node_modules|cjs2\\.cjs'
      ], 5000);
      expect(stderr).to.equal('');
      [
        /node_modules/u,
        /\/test\/fixtures\/cjs2\.cjs/u
      ].forEach((expectedFile) => {
        expect(stdout).to.not.match(expectedFile);
      });
      [
        /\/test\/fixtures\/cjs-3rdparty\.cjs/u
      ].forEach((unexpectedItem) => {
        expect(stdout).to.match(unexpectedItem);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs, including builtins and JSON',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/cjs.js',
        '--node',
        '--cjs',
        '--includeType', 'json',
        '--includeType', 'builtin'
      ], 5000);
      expect(stderr).to.equal('');
      [
        '/test/fixtures/cjs.js',
        '/test/fixtures/cjs2.js',
        '/test/fixtures/cjs3.js',
        'path',
        '/test/fixtures/package-json-script/package.json'
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
      [
        '/test/fixtures/package-json-script/cjs.js',
        '/test/fixtures/package-json-script/cjs2.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs relying on default for type',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/package-json-empty/cjs.js',
        '--cjs'
      ], 5000);
      expect(stderr).to.equal('');
      [
        '/test/fixtures/package-json-empty/cjs.js',
        '/test/fixtures/package-json-empty/cjs2.js'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - cjs relying on default for type',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/package-json-empty/cjs.cjs',
        '--node',
        '--cjs'
      ], 5000);
      expect(stderr).to.equal('');
      [
        '/test/fixtures/package-json-empty/cjs.cjs',
        '/test/fixtures/package-json-empty/cjs2.cjs'
      ].forEach((expectedFile) => {
        expect(stdout).to.include(expectedFile);
      });
    }
  );

  it(
    'esFileTraverse binary (file) - TypeScript',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/package-json-empty/ts1.ts',
        '--typescript',
        '--parser', '@typescript-eslint/parser'
      ], 5000);
      expect(stderr).to.equal('');
      [
        '/test/fixtures/package-json-empty/ts1.ts',
        '/test/fixtures/package-json-empty/ts2.ts',
        '/test/fixtures/package-json-empty/ts/index.ts',
        '/test/fixtures/package-json-empty/ts/ts3.ts'
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
    'esFileTraverse binary (file) - relying on `parserOptions.sourceType`',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
        '--no-check-package-json',
        '--parserOptions',
        '{"sourceType":"module", "requireConfigFile": false}'
      ], 5000);
      expect(stderr).to.equal('');
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
    'esFileTraverse binary (file) - relying on `parserOptions.sourceType` ' +
    'and using non-default parser',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--file', './test/fixtures/main.js',
        '--no-check-package-json',
        '--parser', 'espree',
        '--parserOptions', '{"sourceType":"module", "ecmaVersion": 2015}'
      ], 5000);
      expect(stderr).to.equal('');
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
      // Logged with empty string
      expect(stdout).to.equal('\n');
    }
  );

  it('esFileTraverse binary (file) handles cyclic', async function () {
    const {stdout, stderr} = await spawnPromise(cliPath, [
      '--file', './test/fixtures/cyclic1.js',
      '--node',
      '--defaultSourceType', 'module'
    ], 5000);
    expect(stderr).to.equal('');
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
    'should silently ginore import paths that would work as scripts but ' +
      'are not valid imports when `ignoreResolutionErrors` is on.',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './fixtures/bad-esm-import.js',
        '--defaultSourceType', 'module',
        '--ignoreResolutionErrors'
      ]);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('bad-esm-import.js');
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

  it(
    'esFileTraverse binary (file) throws with bad file URL (typescript)',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './fixtures/has-bad-import.js',
        '--defaultSourceType', 'module',
        '--typescript'
      ]);
      expect(stderr).to.contain('File not found');
      expect(stdout).to.equal('');
    }
  );

  it(
    'esFileTraverse binary (file) silently ignores bad file URL ' +
      'with `ignoreResolutionErrors`',
    async function () {
      const {stdout, stderr} = await spawnPromise(cliPath, [
        '--cwd', dirname(new URL(import.meta.url).pathname),
        '--file', './fixtures/has-bad-import.js',
        '--defaultSourceType', 'module',
        '--ignoreResolutionErrors'
      ]);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('has-bad-import.js');
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
