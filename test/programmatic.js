import {dirname} from 'path';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
  traverse as esFileTraverse,
  traverseJSFile, traverseJSText
} from '../src/index.js';
import resolve from '../src/resolve.js';

chai.use(chaiAsPromised);

describe('esFileTraverse', function () {
  it('esFileTraverse with `callback`', async function () {
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

describe('resolve', function () {
  // Shouldn't occur when used by `esFileTraverse` as user `file` must first
  //  be matched against real files by globby
  it('resolve', function () {
    return expect(resolve('../nonexistent')).to.be.rejectedWith(Error);
  });
});
