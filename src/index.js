'use strict';

const {createReadStream, writeFile: writeFileOrig} = require('fs');
const {dirname, join, resolve: pathResolve} = require('path');
const {promisify} = require('util');

require('array-flat-polyfill');
const {parseForESLint} = require('babel-eslint');
const esquery = require('esquery');
const globby = require('globby');
// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');
const htmlparser2 = require('htmlparser2');
const packageJsonFinder = require('find-package-json');
const builtinModules = require('builtin-modules');

const nodeResolve = require('./resolve');

const writeFile = promisify(writeFileOrig);

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

const browserResolver = (file, {basedir, html}) => {
  if (!html && (/^[^/.]/u).test(file)) {
    throw new Error('Browser module imports must begin with `/` or `.`');
  }
  return new URL(
    file,
    // Just simulating a URL for path resolution only
    `http://localhost${basedir}/`
  ).pathname;
};
// For polymorphism with `resolve`
browserResolver.sync = (...args) => {
  return browserResolver(...args);
};

/**
* @typedef {Map<string,Set<string>>} ResolvedMap
*/

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<ResolvedMap>}
 */
async function traverseJSText ({
  text,
  babelEslintOptions = {},
  fullPath,
  callback,
  cwd,
  resolvedMap = new Map(),
  serial,
  noEsm,
  cjs: cjsModules,
  amd: amdModules,
  node: nodeResolution,
  html = false
}) {
  const resolver = nodeResolution ? nodeResolve : browserResolver;

  const sourceType = babelEslintOptions.sourceType === 'module' ||
      (nodeResolution && !noEsm && fullPath.endsWith('.mjs'))
    ? 'module'
    : babelEslintOptions.sourceType === 'script' ||
      (nodeResolution && cjsModules && fullPath.endsWith('.cjs'))
      ? 'script'
      : undefined;

  if (sourceType) {
    babelEslintOptions = {
      ...babelEslintOptions,
      sourceType
    };
  }

  const {ast} = parseForESLint(text, {
    filePath: fullPath,
    sourceType,

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

  const seriesOrParallel = serialOrParallel(serial);

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
        const resolvedPath = resolver.sync(
          node.value,
          nodeResolution
            ? {
              basedir: dirname(fullPath)
            }
            : {
              basedir: dirname(fullPath),
              html
            }
        );

        proms.push(traverseJSFile({
          // Don't use resolvedPath for non-Node as will be added there
          file: nodeResolution ? resolvedPath : node.value,
          cwd: dirname(fullPath),
          node: nodeResolution,
          resolvedSet,
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
    await seriesOrParallel(proms);
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

  return resolvedMap;
}

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<ResolvedMap>}
 */
async function traverseJSFile ({
  file,
  cwd,
  node: nodeResolution,
  html = false,
  babelEslintOptions = {},
  callback,
  serial,
  noEsm,
  cjs: cjsModules,
  amd: amdModules,
  resolvedSet,
  resolvedMap = new Map()
}) {
  const resolver = nodeResolution ? nodeResolve : browserResolver;

  /*
  // Was giving problems (due to `esm` testing?)
  const fullPath = require.resolve(file, {
    paths: [cwd]
  });
  */
  const fullPath = await resolver(
    file,
    nodeResolution
      ? {
        basedir: cwd
      }
      : {
        html,
        basedir: cwd
      }
  );
  // console.error('fullPath', cwd, '::', html, '::', file, '::', fullPath);

  if (resolvedMap.has(fullPath)) {
    return resolvedMap;
  }

  // Node module
  if (nodeResolution && cjs && builtinModules.includes(fullPath)) {
    const builtinSet = resolvedMap.get('builtin') || new Set();
    builtinSet.add(fullPath);
    resolvedMap.set('builtin', builtinSet);
    return resolvedMap;
  }
  const res = await fetch(fullPath);
  if (!res.ok) {
    throw new Error(`File not found: ${fullPath}`);
  }

  // JSON
  if (res.headers.get('content-type').includes('application/json')) {
    const jsonSet = resolvedMap.get('json') || new Set();
    jsonSet.add(fullPath);
    resolvedMap.set('json', jsonSet);
    return resolvedMap;
  }

  if (resolvedSet) {
    resolvedSet.add(file);
  }

  const text = await res.text();

  await traverseJSText({
    text,
    babelEslintOptions,
    fullPath,
    callback,
    cwd,
    node: nodeResolution,
    html,
    resolvedMap,
    serial,
    noEsm,
    cjs: cjsModules,
    amd: amdModules
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
  defaultSourceType = undefined,
  output = null,
  format = 'none',
  includeType = []
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
  async function traverseHTMLFile (htmlFile) {
    let lastName, lastScriptIsModule;
    const proms = [];
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve, reject) => {
      const parserStream = new htmlparser2.WritableStream(
        {
          // onopentagname(name), onattribute(name, value), onclosetag(name),
          //  onprocessinginstruction(name, data),
          //  oncomment, oncommentend, oncdatastart, oncdataend, onerror(err),
          //  onreset, onend
          onopentag (name, attribs) {
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

              const sourceType = isModule ? 'module' : 'script';
              proms.push(traverseJSFile({
                file: attribs.src,
                cwd: dirname(join(cwd, htmlFile)),
                node: false,
                html: true,
                babelEslintOptions: {
                  ...babelEslintOptions,
                  sourceType
                },
                callback,
                serial,
                noEsm,
                cjs: cjsModules,
                amd: amdModules,
                resolvedMap
              }));
            }
          },
          ontext (text) {
            if (lastName !== 'script') {
              return;
            }
            const sourceType = lastScriptIsModule ? 'module' : 'script';

            proms.push(traverseJSText({
              text,
              babelEslintOptions: {
                ...babelEslintOptions,
                sourceType
              },
              fullPath: join(cwd, htmlFile),
              callback,
              cwd: dirname(join(cwd, htmlFile)),
              resolvedMap,
              serial,
              noEsm,
              cjs: cjsModules,
              amd: amdModules,
              node: false,
              html: true
            }));
          },
          // This should only occur with a stream error
          // istanbul ignore next
          onerror (err) {
            // istanbul ignore next
            reject(err);
          }
        },
        {
          decodeEntities: true
        }
      );

      const htmlStream = createReadStream(htmlFile);
      htmlStream.pipe(parserStream).on('finish', () => {
        resolve();
      });
      return undefined;
    });
    await Promise.all(proms);
  }

  const seriesOrParallel = serialOrParallel(serial);
  await seriesOrParallel(
    files.map(async (file) => {
      const ext = file.split('.').pop();
      if (forceLanguage === 'html' ||
        (!forceLanguage && htmlExtension.includes(ext))
      ) {
        return await traverseHTMLFile(file);
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
  const values = [...resolvedMap.entries()].filter(([key]) => {
    switch (key) {
    case 'json': case 'builtin':
      return includeType.includes(key);
    default:
      return true;
    }
  }).map(([, value]) => {
    return value;
  });

  const filesArr = [...new Set(
    values.flatMap((set) => {
      return [...set];
    })
  )];

  if (output) {
    await writeFile(
      pathResolve(cwd, output), JSON.stringify(filesArr, null, 2)
    );
  }

  switch (format) {
  case 'strings':
    // eslint-disable-next-line no-console
    console.log(filesArr.join(' '));
    break;
  case 'json':
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(filesArr, null, 2));
    break;
  default: // "none"
    break;
  }
  return filesArr;
}

exports.traverseJSText = traverseJSText;
exports.traverseJSFile = traverseJSFile;
exports.traverse = traverse;
