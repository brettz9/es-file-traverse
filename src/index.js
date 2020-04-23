'use strict';

const {dirname} = require('path');

require('array-flat-polyfill');
const {parseForESLint} = require('babel-eslint');
const esquery = require('esquery');
const globby = require('globby');
// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');

// Todo: adapt the following for CJS and AMD:
//  https://github.com/benmosher/eslint-plugin-import/blob/master/utils/moduleVisitor.js#L4-L13

// Decided againts @babel/traverse, in case might use ESLint AST
//  for ESLint rules

// `import * as b from 'abc';`
// `import {b} from 'abc';`
const importDeclaration = 'ImportDeclaration[source.value]';

// export {b} from 'c';
const exportNamedDeclaration = 'ExportNamedDeclaration[source.value]';

// export * as b from c;
const exportAllDeclaration = 'ExportAllDeclaration[source.value]';

const esmDeclarations = esquery.parse(
  `:matches(${
    importDeclaration
  },${
    exportNamedDeclaration
  },${
    exportAllDeclaration
  })`
);

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<string[]>}
 */
async function traverse ({
  file: fileArray,
  cwd = process.cwd()
}) {
  const resolvedMap = new Map();

  /**
   * @param {string} file
   * @returns {Promise<void>}
   */
  async function traverseFile (file) {
    const fullPath = require.resolve(file, {
      paths: [cwd]
    });
    if (resolvedMap.has(fullPath)) {
      return;
    }

    const res = await fetch(fullPath);
    const text = await res.text();

    const result = parseForESLint(text);
    // console.log('result', result.ast);

    const resolvedSet = new Set();
    resolvedSet.add(fullPath);
    const proms = [];
    esquery.traverse(
      result.ast,
      esmDeclarations,
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
    await Promise.all(proms);
  }

  const files = await globby(fileArray);
  // Todo: Add option to run serially (use `reduce`)
  await Promise.all(
    files.map((item) => {
      return traverseFile(item);
    })
  );

  // Todo: Allow generic callback within, e.g., for collecting comments
  //  which have no AST
  return [...new Set(
    (await Promise.all([...resolvedMap.values()])).flatMap((set) => {
      return [...set];
    })
  )];
}

module.exports = traverse;
