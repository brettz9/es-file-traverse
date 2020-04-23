'use strict';

const {dirname} = require('path');

require('array-flat-polyfill');
const {parseForESLint} = require('babel-eslint');
const esquery = require('esquery');
const globby = require('globby');
// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');

// Decided againts @babel/traverse, in case might use ESLint AST
//  for ESLint rules

// `import * as b from 'abc';`
// `import {b} from 'abc';`
const importDeclaration = 'ImportDeclaration[source.value]';

// export {b} from 'c';
const exportNamedDeclaration = 'ExportNamedDeclaration[source.value]';

// export * as b from c;
const exportAllDeclaration = 'ExportAllDeclaration[source.value]';

const dynamicImport = 'CallExpression' +
  '[callee.type="import"][arguments.length=1]';
  // From `eslint-plugin-import` for std::string?
  // ':has(Literal[value!="string"])';

const esmImports = esquery.parse(
  `:matches(${
    [
      importDeclaration, exportNamedDeclaration,
      exportAllDeclaration, dynamicImport
    ].join(',')
  })`
);

// Todo: Reenable CJS and AMD
/*
// Inspired by: https://github.com/benmosher/eslint-plugin-import/blob/master/utils/moduleVisitor.js#L4-L13
const cjs = 'CallExpression' +
  '[callee.type="Identifier"][callee.name="require"][arguments.length=1]';
  // From `eslint-plugin-import` for std::string?
  // ':has(Literal[value!="string"])';

const amdDefine = 'CallExpression' +
  '[callee.type="Identifier"]' +
    '[callee.name="define"][arguments.length=2]' +
    ':has(ArrayExpression)';

const amdRequire = 'CallExpression' +
'[callee.type="Identifier"]' +
  '[callee.name="require"][arguments.length=2]' +
    ':has(' +
      'ArrayExpression:has(' +
        'Literal:not(' +
          ':matches([value="string"],[value="require"],[value="exports"])' +
        ')' +
      ')' +
    ')';

const amd = `:matches(${amdDefine},${amdRequire})`;
*/

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<string[]>}
 */
async function traverse ({
  file: fileArray,
  serial = false,
  callback = null,
  cwd = process.cwd()
}) {
  const resolvedMap = new Map();
  if (typeof callback === 'string') {
    // eslint-disable-next-line node/global-require, import/no-dynamic-require
    callback = require(callback);
  }

  const serialOrParallel = serial
    ? (proms) => {
      return proms.reduce(async (ret, prom) => {
        await ret;
        return prom;
      }, Promise.resolve());
    }
    : (proms) => Promise.all(proms);

  /**
   * @param {string} file
   * @returns {Promise<void>}
   */
  async function traverseFile (file) {
    // Todo: Make these `require.resolve`'s avoid Node resolution
    //   for browser-only
    const fullPath = require.resolve(file, {
      paths: [cwd]
    });
    if (resolvedMap.has(fullPath)) {
      return;
    }

    const res = await fetch(fullPath);
    const text = await res.text();

    const {ast} = parseForESLint(text);
    // console.log('ast', ast);

    if (callback) {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line promise/prefer-await-to-callbacks, standard/no-callback-literal, node/callback-return
      await callback('enter', {
        fullPath,
        text,
        ast
      });
    }

    const resolvedSet = new Set();
    resolvedSet.add(fullPath);
    const proms = [];
    esquery.traverse(
      ast,
      esmImports,
      (node, parent, ancestry) => {
        // // eslint-disable-next-line no-console
        // console.log('esquery node', node);
        const resolvedImport = require.resolve(
          node.source.value, {
            paths: [dirname(fullPath)]
          }
        );
        resolvedSet.add(resolvedImport);

        proms.push(traverseFile(resolvedImport));
      }
    );
    resolvedMap.set(
      fullPath,
      resolvedSet
    );

    if (callback) {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line promise/prefer-await-to-callbacks, standard/no-callback-literal, node/callback-return
      await callback('exit', {
        fullPath,
        text,
        ast,
        proms,
        resolvedSet
      });
    }
    await serialOrParallel(proms);
  }

  const files = await globby(fileArray, {
    cwd
  });

  await serialOrParallel(
    files.map((file) => {
      return traverseFile(file);
    })
  );

  // Todo: We could instead use (or return) a single set but gathering
  //   per file currently, so avoiding building a separate `Set` for now.
  return [...new Set(
    [...resolvedMap.values()].flatMap((set) => {
      return [...set];
    })
  )];
}

module.exports = traverse;
