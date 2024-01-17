import {dirname} from 'path';

// eslint-disable-next-line no-shadow -- Overrides
import * as chai from 'chai';

// eslint-disable-next-line import/no-unresolved -- Bug: https://github.com/import-js/eslint-plugin-import/issues/2703
import chaiAsPromised from '@rvagg/chai-as-promised';

import {
  traverse as esFileTraverse,
  traverseJSFile, traverseJSText
} from '../src/index.js';
import nodeResolve from '../src/resolvers/nodeResolve.js';
import typescriptResolve from '../src/resolvers/typescriptResolve.js';

// eslint-disable-next-line no-shadow -- Not added
const {expect} = chai;

chai.use(chaiAsPromised);

describe('esFileTraverse', function () {
  it('esFileTraverse with `callback`', async function () {
    this.timeout(5000);
    let callbackRan = false;
    const results = await esFileTraverse({
      cwd: dirname(new URL(import.meta.url).pathname),
      callback () {
        callbackRan = true;
      },
      file: './fixtures/main.js',
      node: true,
      defaultSourceType: 'module'
    });
    expect(callbackRan).to.be.true;
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

  it('throws with bad file name', function () {
    return expect(esFileTraverse({
      cwd: dirname(new URL(import.meta.url).pathname),
      file: './fixtures/has-bad-import.js',
      node: true,
      defaultSourceType: 'module'
    })).to.be.rejectedWith(Error, /Cannot find module/u);
  });
});

describe('traverseJSFile', function () {
  it('traverseJSFile', async function () {
    const map = await traverseJSFile({
      cwd: dirname(new URL(import.meta.url).pathname),
      file: './fixtures/main.js',
      node: true,
      defaultSourceType: 'module'
    });
    expect(map).to.be.a('Map');
  });
});

describe('traverseJSText', function () {
  it('traverseJSText', async function () {
    const map = await traverseJSText({
      cwd: dirname(new URL(import.meta.url).pathname),
      fullPath:
        `${dirname(new URL(import.meta.url).pathname)}/fixtures/main.js`,
      text: `
      import './file1.js';

      require('path');
      `,
      node: true,
      defaultSourceType: 'module'
    });
    expect(map).to.be.a('Map');
  });
});

describe('`nodeResolve`', function () {
  // Shouldn't occur when used by `esFileTraverse` as user `file` must first
  //  be matched against real files by globby
  it('`nodeResolve`', function () {
    return expect(nodeResolve('../nonexistent')).to.be.rejectedWith(Error);
  });
});

describe('`typescriptResolve`', function () {
  it('`typescriptResolve`', function () {
    return expect(
      typescriptResolve('../nonexistent')
    ).to.be.rejectedWith(Error);
  });
});
