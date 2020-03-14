'use strict';

const {dirname} = require('path');
const {parseForESLint} = require('babel-eslint');
const _resolve = require('resolve');

const requireResolve = (path, opts = {}) => {
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    _resolve(path, opts, (err, res, pkg) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');

/*
const defaultKeys = require('eslint-visitor-keys');
console.log('defaultKeys', defaultKeys);
*/

// Todo: Aggregate results into a file `Map`, and then perform linting (or
//  if doing along the way, only perform linting once per discovered file).
//  But ensure the traversal code is separated so we can have a useful
//  generic traverser by import/require (dynamic or static).

// Todo: can probably just use esquery instead for traversal?

// Note: if looking also for what is *exported*, e.g., to know what
//   globals are, if non-module mode in browser, should look at `var` and
//   even `const`/`let`; can then use, e.g., for `jsdoc/no-undefined-types`;
//   as with `no-unrestricted-properties`, etc., we want to find out when
//   `window` or other globals are used, but to collect the uses, rather than
//   report them.

// Could have generic API for whether to traverse through ESM, CJS, whether
//  `import`, `require` or possibly `define` (and HTML script tags even,
//  noting whether type=module or not, so could note whether there was a
//  mismatch of export type in the discovered files), utilizing import maps,
//  with either a callback or esquer(ies) for how
//  to collect the data of interest on each page, then return that result
//  with file name/path (and module type used, e.g., if multiple module types
//  are being queried). For linting, we could just get files and then
//  use `eslint-plugin-query` with the selectors there instead. Could have
//  `strategies` option for built-in following of requires, but could also
//  iterate based on following a function call which would need to
//  track stacks, e.g., to follow dynamic imports in order or when only
//  needing to check linting on a particular API.

// Add a CLI (as well as programmatic) API to build a list of files and
// add that to CLI args to `eslint`:
// https://stackoverflow.com/questions/41405126/how-can-i-dynamically-pass-arguments-to-a-node-script-using-unix-commands

// Could propose this traversal mechanism as a command line option for
//  eslint itself, esp. if get as a working demo (in place of, or in
//  addition to, a set of whitelisted files). Could also have an option to give
//  an error or report listing files which were not traversed but
//  within a set of specified files. Could also have a blacklist so that
//  not end up linting, e.g., `node_modules` (e.g., when linting
//  non-security issues)

// Could adapt https://github.com/benmosher/eslint-plugin-import/blob/master/utils/moduleVisitor.js#L4-L13

// Decided againts @babel/traverse, in case might use ESLint AST
//  for ESLint rules
const Traverser = require('eslint/lib/shared/traverser.js');

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<string[]>}
 */
async function traverse ({
  file,
  cwd = process.cwd()
}) {
  const fullPath = await requireResolve(file, {basedir: cwd});
  const res = await fetch(fullPath);
  const text = await res.text();

  const result = parseForESLint(text);

  // console.log('result', result.ast);

  // Todo: Could try esquery(result.ast, 'ImportDeclaration') to get AST nodes

  const resolvedArr = [];
  Traverser.traverse(result.ast, {
    enter (node /* , parent */) {
      // console.log('node', node.type);
      switch (node.type) {
      case 'ImportDeclaration': {
        resolvedArr.push(requireResolve(
          node.source.value, {basedir: dirname(fullPath)}
        ));

        // // eslint-disable-next-line no-console
        // console.log('import declaration', node, node.source.value);
        break;
      } default:
        break;
      }
    }
    // visitorKeys: []
    // leave (node, parent)
  }, {});

  // Todo: Need to recurse on the contents of these
  return [...new Set(await Promise.all(resolvedArr))];
}

module.exports = traverse;
