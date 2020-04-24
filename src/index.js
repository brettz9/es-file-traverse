'use strict';

const {dirname, join} = require('path');

require('array-flat-polyfill');
const {parseForESLint} = require('babel-eslint');
const esquery = require('esquery');
const globby = require('globby');
// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');
const htmlparser2 = require('htmlparser2');

const resolve = require('./resolve');

// Decided againts @babel/traverse, in case might use ESLint AST
//  for ESLint rules

// `import * as b from './abc.js';`
// `import {b} from './abc.js';`
const importDeclaration = 'ImportDeclaration[source.value]';

// export {b} from './c.js';
const exportNamedDeclaration = 'ExportNamedDeclaration[source.value]';

// export * as b from './c.js';
const exportAllDeclaration = 'ExportAllDeclaration[source.value]';

const dynamicImport =
  ':matches(' +
    // `eslint-plugin-import` checks for this
    'CallExpression' +
      '[callee.type="import"][arguments.length=1],' +
    'ImportExpression' +
  // From `eslint-plugin-import` for std::string?
  // ':has(Literal[value!="string"])';
  ')';

const esmImports = esquery.parse(
  `:matches(${
    [
      importDeclaration, exportNamedDeclaration,
      exportAllDeclaration, dynamicImport
    ].join(',')
  })`
);

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

const selectorMap = new Map([
  ['esm', esmImports],
  ['cjs', cjs],
  ['amd', amd]
]);

const browserResolver = (file, {basedir}) => {
  return new URL(file, basedir).href;
};
// For polymorphism with `resolve`
browserResolver.sync = (...args) => {
  return browserResolver(...args);
};

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<string[]>}
 */
async function traverse ({
  file: fileArray,
  serial = false,
  callback = null,
  cwd = process.cwd(),
  babelESLintOptions = {},
  node: nodeResolution = false,
  noEsm = false,
  cjs: cjsModules = false,
  amd: amdModules = false
}) {
  if (noEsm && !cjsModules && !amdModules) {
    throw new Error(
      'You must specify `noEsm` as `true` or set `cjs` or `amd` to true'
    );
  }
  const resolver = nodeResolution ? resolve : browserResolver;

  const resolvedMap = new Map();
  if (typeof callback === 'string') {
    // eslint-disable-next-line node/global-require, import/no-dynamic-require
    callback = require(join(cwd, callback));
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
  async function traverseJSFile (file) {
    /*
    // Was giving problems (due to `esm` testing?)
    const fullPath = require.resolve(file, {
      paths: [cwd]
    });
    */
    const fullPath = await resolver(file, {
      basedir: cwd
    });
    if (resolvedMap.has(fullPath)) {
      return;
    }

    const res = await fetch(fullPath);
    const text = await res.text();

    if (typeof babelESLintOptions === 'string') {
      babelESLintOptions = JSON.parse(babelESLintOptions);
    }

    const {ast} = parseForESLint(text, {
      filePath: fullPath,
      sourceType: fullPath.endsWith('.mjs')
        ? 'module'
        : fullPath.endsWith('.cjs')
          ? 'script'
          : undefined,

      ...babelESLintOptions
      // babelOptions: {
      //   cwd, root, rootMode, envName, configFile, babelrc, babelrcRoots,
      //   extends, env, overrides, test, include, exclude, ignore, only
      // },
      // ecmaVersion: 2018,
      // ecmaFeatures: {},
      // allowImportExportEverywhere: false,

      // parse.js : https://github.com/babel/babel-eslint/blob/master/lib/parse.js
      // requireConfigFile,

      // analyze-scope.js : https://github.com/babel/babel-eslint/blob/master/lib/analyze-scope.js
      // ignoreEval: true,
      // optimistic: false,
      // directive: false,
      /*
      nodejsScope: ast.sourceType === "script" &&
        (parserOptions.ecmaFeatures &&
          parserOptions.ecmaFeatures.globalReturn) === true,
      */
      // impliedStrict: false,
      // fallback
    });
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

    /**
     * @param {"esm"|"cjs"|"amd"} type
     * @returns {Promise<void>}
     */
    async function esqueryTraverse (type) {
      const selector = selectorMap.get(type);
      esquery.traverse(
        ast,
        selector,
        (node, parent, ancestry) => {
          // // eslint-disable-next-line no-console
          // console.log('esquery node', node);
          /*
          const resolvedPath = require.resolve(
            node.source.value, {
              paths: [dirname(fullPath)]
            }
          );
          */
          const resolvedPath = resolver.sync(node.source.value, {
            basedir: dirname(fullPath)
          });

          resolvedSet.add(resolvedPath);

          proms.push(traverseJSFile(resolvedPath));
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
          type,
          proms,
          resolvedSet
        });
      }
      await serialOrParallel(proms);
    }

    const resolvedSet = new Set();
    resolvedSet.add(fullPath);
    const proms = [];
    if (!noEsm) {
      await esqueryTraverse('esm');
    }
    if (cjsModules) {
      await esqueryTraverse('cjs');
    }
    if (amdModules) {
      await esqueryTraverse('amd');
    }
  }

  const files = await globby(fileArray, {
    cwd
  });

  let lastName, lastScriptIsModule;
  const parser = new htmlparser2.Parser(
    {
      // onopentagname(name), onattribute(name, value), onclosetag(name),
      //  onprocessinginstruction(name, data),
      //  oncomment, oncommentend, oncdatastart, oncdataend, onerror(err),
      //  onreset, onend
      async onopentag (name, attribs) {
        lastName = name;
        lastScriptIsModule = false;
        if (name === 'script') {
          // Todo: Ensure auto-resolving in browser mode
          const hasSource = {}.hasOwnProperty.call(attribs, 'src');
          const isScript = !attribs.type || attribs.type === 'text/javascript';
          const isModule = attribs.type === 'module';
          const isJS = isScript || isModule;
          if (
            !isJS ||
            // Handle later
            !hasSource
          ) {
            lastScriptIsModule = isModule;
            return;
          }

          await traverse({
            file: attribs.src,
            babelESLintOptions: {
              ...babelESLintOptions,
              sourceType: isModule ? 'module' : 'script'
            },
            serial,
            callback,
            cwd,
            noEsm,
            node: nodeResolution,
            cjs: cjsModules,
            amd: amdModules
          });
        }
      },
      async ontext (text) {
        if (lastName !== 'script') {
          return;
        }
        await traverse({
          file: htmlFile,
          babelESLintOptions: {
            ...babelESLintOptions,
            sourceType: lastScriptIsModule ? 'module' : 'script'
          },
          serial,
          callback,
          cwd,
          noEsm,
          node: nodeResolution,
          cjs: cjsModules,
          amd: amdModules
        });
      }
    },
    {decodeEntities: true}
  );
  parser.write(
    'Xyz <script type="text/javascript">var foo = "<<bar>>";</ script>'
  );
  parser.end();

  await serialOrParallel(
    files.map((file) => {
      return traverseJSFile(file);
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
