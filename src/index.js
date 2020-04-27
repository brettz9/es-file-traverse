'use strict';

const {createReadStream} = require('fs');
const {dirname, join} = require('path');

require('array-flat-polyfill');
const {parseForESLint} = require('babel-eslint');
const esquery = require('esquery');
const globby = require('globby');
// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');
const htmlparser2 = require('htmlparser2');
const packageJsonFinder = require('find-package-json');

const nodeResolve = require('./resolve');

// Decided againts @babel/traverse, in case might use ESLint AST
//  for ESLint rules

// `import * as b from './abc.js';`
// `import {b} from './abc.js';`
const importDeclaration = 'ImportDeclaration[source.value] > Literal';

// export {b} from './c.js';
const exportNamedDeclaration = 'ExportNamedDeclaration[source.value] > Literal';

// export * as b from './c.js';
const exportAllDeclaration = 'ExportAllDeclaration[source.value] > Literal';

const dynamicImport =
  ':matches(' +
    // `eslint-plugin-import` checks for this
    'CallExpression' +
      '[callee.type="import"][arguments.length=1] > Literal,' +
    'ImportExpression > Literal' +
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
  '[callee.type="Identifier"][callee.name="require"][arguments.length=1] ' +
    '> Literal';
  // From `eslint-plugin-import` for std::string?
  // ':has(Literal[value!="string"])';

const amdDefine = 'CallExpression' +
  '[callee.type="Identifier"]' +
    '[callee.name="define"][arguments.length=2]' +
    '> ArrayExpression > Literal';

const amdRequire = 'CallExpression' +
'[callee.type="Identifier"]' +
  '[callee.name="require"][arguments.length=2] >' +
    'ArrayExpression >' +
      'Literal:not(' +
        ':matches([value="string"],[value="require"],[value="exports"])' +
      ')';

const amd = `:matches(${amdDefine},${amdRequire})`;

const selectorMap = new Map([
  ['esm', esmImports],
  ['cjs', esquery.parse(cjs)],
  ['amd', esquery.parse(amd)]
]);

const serialOrParallel = (serial) => {
  return serial
    ? (proms) => {
      return proms.reduce(async (ret, prom) => {
        await ret;
        return prom;
      }, Promise.resolve());
    }
    : (proms) => Promise.all(proms);
};

/**
 * @param {string} file
 * @returns {"module"|"commonjs"|null}
 */
function findNearestPackageJsonType (file) {
  const {value} = packageJsonFinder(file).next();
  return (value && value.type) || null;
}

const browserResolver = (file, {basedir}) => {
  return new URL(file, `http://localhost${basedir}/`).pathname;
};
// For polymorphism with `resolve`
browserResolver.sync = (...args) => {
  return browserResolver(...args);
};

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<void>}
 */
async function traverseJSText ({
  text,
  babelEslintOptions,
  fullPath,
  callback,
  cwd,
  resolvedMap,
  serial,
  noEsm,
  cjs: cjsModules,
  amd: amdModules,
  node: nodeResolution
}) {
  const resolver = nodeResolution ? nodeResolve : browserResolver;

  const {ast} = parseForESLint(text, {
    filePath: fullPath,
    sourceType: babelEslintOptions.sourceType === 'module' ||
        (!noEsm && fullPath.endsWith('.mjs'))
      ? 'module'
      : babelEslintOptions.sourceType === 'script' ||
        (cjsModules && fullPath.endsWith('.cjs'))
        ? 'script'
        : undefined,

    ...babelEslintOptions
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
        const resolvedPath = resolver.sync(node.value, {
          basedir: dirname(fullPath)
        });

        resolvedSet.add(resolvedPath);

        proms.push(traverseJSFile({
          file: resolvedPath,
          cwd,
          node: nodeResolution,
          resolvedMap,
          babelEslintOptions,
          callback,
          serial,
          noEsm,
          cjs: cjsModules,
          amd: amdModules
        }));
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
    await serialOrParallel(serial)(proms);
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

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<Map>}
 */
async function traverseJSFile ({
  file,
  cwd,
  node: nodeResolution,
  babelEslintOptions,
  callback,
  serial,
  noEsm,
  cjs: cjsModules,
  amd: amdModules,
  resolvedMap = new Map()
}) {
  const resolver = nodeResolution ? nodeResolve : browserResolver;

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
    return resolvedMap;
  }

  const res = await fetch(fullPath);
  const text = await res.text();

  await traverseJSText({
    text,
    babelEslintOptions,
    fullPath,
    callback,
    cwd,
    resolvedMap,
    serial,
    noEsm,
    cjs: cjsModules,
    amd: amdModules,
    node: nodeResolution
  });

  return resolvedMap;
}

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<string[]>}
 */
async function traverse ({
  file: fileArray,
  noGlobs,
  serial = false,
  callback = null,
  cwd = process.cwd(),
  babelEslintOptions = {},
  node: nodeResolution = false,
  forceLanguage = null,
  jsExtension = ['js', 'cjs', 'mjs'],
  htmlExtension = ['htm', 'html'],
  noEsm = false,
  cjs: cjsModules = false,
  amd: amdModules = false,
  noCheckPackageJson,
  defaultSourceType = 'script'
}) {
  if (noEsm && !cjsModules && !amdModules) {
    throw new Error(
      'You must specify `noEsm` as `true` or set `cjs` or `amd` to true'
    );
  }

  if (typeof babelEslintOptions === 'string') {
    babelEslintOptions = JSON.parse(babelEslintOptions);
  }

  const resolvedMap = new Map();
  if (typeof callback === 'string') {
    // eslint-disable-next-line node/global-require, import/no-dynamic-require
    callback = require(join(cwd, callback));
  }

  const files = noGlobs
    ? fileArray
    : await globby(fileArray, {
      cwd
    });

  /**
   * @param {string} htmlFile
   * @returns {Promise<void>}
   */
  function traverseHTMLFile (htmlFile) {
    let lastName, lastScriptIsModule;
    // eslint-disable-next-line promise/avoid-new
    return new Promise((resolve, reject) => {
      const parserStream = new htmlparser2.WritableStream(
        {
          // onopentagname(name), onattribute(name, value), onclosetag(name),
          //  onprocessinginstruction(name, data),
          //  oncomment, oncommentend, oncdatastart, oncdataend, onerror(err),
          //  onreset, onend
          async onopentag (name, attribs) {
            lastName = name;
            lastScriptIsModule = false;
            if (name === 'script') {
              const hasSource = {}.hasOwnProperty.call(attribs, 'src');
              const isScript = !attribs.type ||
                attribs.type === 'text/javascript';
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

              await traverseJSFile({
                file: attribs.src,
                cwd,
                node: false,
                babelEslintOptions: {
                  ...babelEslintOptions,
                  sourceType: isModule ? 'module' : 'script'
                },
                callback,
                serial,
                noEsm,
                cjs: cjsModules,
                amd: amdModules,
                resolvedMap
              });
            }
          },
          async ontext (text) {
            if (lastName !== 'script') {
              return;
            }
            const sourceType = lastScriptIsModule ? 'module' : 'script';
            await traverseJSText({
              text,
              babelEslintOptions: {
                ...babelEslintOptions,
                sourceType
              },
              fullPath: htmlFile,
              callback,
              cwd,
              resolvedMap,
              serial,
              noEsm,
              cjs: cjsModules,
              amd: amdModules,
              node: false
            });
          },
          onerror (err) {
            reject(err);
          },
          onend () {
            resolve();
          }
        },
        {
          decodeEntities: true
        }
      );
      const htmlStream = createReadStream(htmlFile);
      htmlStream.pipe(parserStream).on('finish', () => {
        // eslint-disable-next-line no-console
        console.log('done');
      });
    });
  }

  await serialOrParallel(serial)(
    files.map(async (file) => {
      const ext = file.split('.').pop();
      if (forceLanguage === 'html' ||
        (!forceLanguage && htmlExtension.includes(ext))
      ) {
        return traverseHTMLFile(file);
      }
      if (forceLanguage === 'js' ||
        (!forceLanguage && jsExtension.includes(ext))
      ) {
        let possibleSourceType;
        if (!noCheckPackageJson) {
          const packageJsonType = await findNearestPackageJsonType(file);
          possibleSourceType = {
            sourceType: packageJsonType === 'module'
              ? 'module'
              : packageJsonType === 'commonjs'
                ? 'script'
                : defaultSourceType
          };
        }
        return traverseJSFile({
          file,
          cwd,
          node: nodeResolution,
          resolvedMap,
          babelEslintOptions: {
            ...babelEslintOptions,
            ...possibleSourceType
            // Todo: Add override of sourceType if detecting package.json `type`
          },
          callback,
          noEsm,
          cjs: cjsModules,
          amd: amdModules
        });
      }
      return undefined;
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
