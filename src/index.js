'use strict';

const {createReadStream, writeFile: writeFileOrig} = require('fs');
const {dirname, join, resolve: pathResolve} = require('path');
const {promisify} = require('util');

// eslint-disable-next-line no-shadow
const crypto = require('crypto');

require('array-flat-polyfill');
const esquery = require('esquery');
const globby = require('globby');
// eslint-disable-next-line no-shadow
const fetch = require('file-fetch');
const {
  WritableStream: Htmlparser2WritableStream
} = require('htmlparser2/lib/WritableStream');
const packageJsonFinder = require('find-package-json');
const builtinModules = require('builtin-modules');

const typescriptResolve = require('./resolvers/typescriptResolve.js');
const nodeResolve = require('./resolvers/nodeResolve.js');

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
      '[callee.type="import"][arguments.length=1] > Literal, ' +
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

/**
 * @param {string} str
 * @returns {RegExp}
 */
function getRegexFromString (str) {
  // eslint-disable-next-line prefer-named-capture-group
  const withFlags = str.match(/^\/(.*)\/(\w*)$/u);
  return withFlags
    ? new RegExp(withFlags[1], withFlags[2])
    : new RegExp(str, 'u');
}

/**
* @callback PromiseReturner
* @returns {Promise<void>}
*/

/**
* @callback PromiseMethodHandler
* @param {PromiseReturner[]} promMethods
* @returns {Promise<void>}
*/

/**
 *
 * @param {boolean} serial
 * @returns {PromiseMethodHandler}
 */
const serialOrParallel = (serial) => {
  return serial
    ? (promMethods) => {
      return (async () => {
        for (const promMethod of promMethods) {
          // eslint-disable-next-line no-await-in-loop
          await promMethod();
        }
      })();
    }
    : (promMethods) => Promise.all(promMethods.map((promMethod) => {
      return promMethod();
    }));
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
  return join(basedir, new URL(
    file,
    // Just simulating a URL for path resolution only
    `http://localhost/`
  ).pathname);
};
// For polymorphism with `resolve`
browserResolver.sync = (...args) => {
  return browserResolver(...args);
};

/**
* @external PackageJson
*/

/**
* @callback ResolvePackageFilter
* @param {external:PackageJson} pkg
* @returns {external:PackageJson}
*/

/**
 * @param {string[]} mainFields
 * @returns {ResolvePackageFilter}
 */
function getPackageFilter (mainFields) {
  return function packageFilter (pkg) {
    const prop = mainFields.find((mainField) => {
      return pkg[mainField];
    });
    if (prop) {
      pkg.main = pkg[prop];
    }
    return pkg;
  };
}

/**
* @typedef {Map<string,Set<string>>} ResolvedMap
*/

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @returns {Promise<ResolvedMap>}
 */
async function traverseJSText ({
  text,
  parserOptions = {
    requireConfigFile: false
  },
  parser = '@babel/eslint-parser',
  fullPath,
  callback,
  cwd,
  resolvedMap = new Map(),
  textSet = new Set(),
  serial,
  excludePathEntryExpression,
  ignoreResolutionErrors,
  noEsm,
  cjs: cjsModules,
  amd: amdModules,
  node: nodeResolution,
  mainFields = ['main'],
  typescript: typescriptResolution,
  html = false
}) {
  const resolver = typescriptResolution
    ? typescriptResolve
    : nodeResolution
      ? nodeResolve
      : browserResolver;

  const packageFilter = getPackageFilter(mainFields);

  // Todo: We could make the `sourceType` depend on which of `mainFields`
  //   is resolved.

  const sourceType = parserOptions.sourceType === 'module' ||
      (nodeResolution && !noEsm && fullPath.endsWith('.mjs'))
    ? 'module'
    : parserOptions.sourceType === 'script' ||
      (nodeResolution && cjsModules && fullPath.endsWith('.cjs'))
      ? 'script'
      : undefined;

  if (sourceType) {
    parserOptions = {
      ...parserOptions,
      sourceType
    };
  }

  // eslint-disable-next-line import/no-dynamic-require, node/global-require
  const parserObj = require(parser);

  const parseForESLintMethod = {}.hasOwnProperty.call(
    parserObj, 'parseForESLint'
  );

  // Avoid bulking up memory use with full text
  const hash = crypto.createHash('md5').update(fullPath + text).digest('hex');
  if (textSet.has(hash)) {
    return resolvedMap;
  }
  textSet.add(hash);

  const result = parserObj[
    parseForESLintMethod
      // @babel/eslint-parser, @typescript-eslint/parser
      ? 'parseForESLint'
      // esprima, espree
      : 'parse'
  ](text, {
    filePath: fullPath,
    sourceType,

    ...parserOptions
    // babelOptions: {
    //   cwd, root, rootMode, envName, configFile, babelrc, babelrcRoots,
    //   extends, env, overrides, test, include, exclude, ignore, only
    // },
    // ecmaVersion: 2018,
    // ecmaFeatures: {},
    // allowImportExportEverywhere: false,

    // parse.js : https://github.com/babel/babel/blob/master/eslint/babel-eslint-parser/src/index.js
    // requireConfigFile,

    // analyze-scope.js : https://github.com/babel/babel/blob/master/eslint/babel-eslint-parser/src/analyze-scope.js
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
  const ast = parseForESLintMethod ? result.ast : result;
  // console.log('ast', ast);

  if (callback) {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line promise/prefer-await-to-callbacks, node/no-callback-literal, node/callback-return
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
        let resolvedPath;
        try {
          resolvedPath = resolver.sync(
            node.value,
            nodeResolution || typescriptResolution
              ? {
                // Todo: use `resolve`'s `extensions`? (here and for async)
                packageFilter,
                basedir: dirname(fullPath)
              }
              : {
                basedir: dirname(fullPath),
                html
              }
          );
        } catch (err) {
          if (ignoreResolutionErrors) {
            return;
          }
          throw err;
        }

        promMethods.push(() => traverseJSFile({
          // Don't use resolvedPath for non-Node as will be added there
          file: nodeResolution ? resolvedPath : node.value,
          cwd: dirname(fullPath),
          node: nodeResolution,
          mainFields,
          typescript: typescriptResolution,
          resolvedSet,
          resolvedMap,
          textSet,
          parser,
          parserOptions,
          callback,
          serial,
          excludePathEntryExpression,
          ignoreResolutionErrors,
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
      // eslint-disable-next-line promise/prefer-await-to-callbacks, node/no-callback-literal, node/callback-return
      await callback('exit', {
        fullPath,
        text,
        ast,
        type,
        promMethods,
        resolvedSet
      });
    }
    await seriesOrParallel(promMethods);
  }

  const resolvedSet = new Set();
  resolvedSet.add(fullPath);
  const promMethods = [];
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
 * @throws {Error} File not found
 * @returns {Promise<ResolvedMap>}
 */
async function traverseJSFile ({
  file,
  cwd,
  node: nodeResolution,
  mainFields = ['main'],
  typescript: typescriptResolution,
  html = false,
  parser,
  parserOptions = {
    requireConfigFile: false
  },
  callback,
  serial,
  excludePathEntryExpression,
  ignoreResolutionErrors,
  noEsm,
  cjs: cjsModules,
  amd: amdModules,
  resolvedSet,
  resolvedMap = new Map(),
  textSet = new Set()
}) {
  const resolver = typescriptResolution
    ? typescriptResolve
    : nodeResolution
      ? nodeResolve
      : browserResolver;

  const packageFilter = getPackageFilter(mainFields);

  /*
  // Was giving problems (due to `esm` testing?)
  const fullPath = require.resolve(file, {
    paths: [cwd]
  });
  */
  let fullPath;
  try {
    fullPath = await resolver(
      file,
      nodeResolution || typescriptResolution
        ? {
          packageFilter,
          basedir: cwd
        }
        : {
          html,
          basedir: cwd
        }
    );
  } catch (err) {
    if (ignoreResolutionErrors) {
      return resolvedMap;
    }
    throw err;
  }

  if (resolvedMap.has(fullPath)) {
    return resolvedMap;
  }

  if (excludePathEntryExpression) {
    const blacklistEntryRegex = getRegexFromString(excludePathEntryExpression);
    if (blacklistEntryRegex.test(fullPath)) {
      return resolvedMap;
    }
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
    if (ignoreResolutionErrors) {
      return resolvedMap;
    }
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
    resolvedSet.add(fullPath);
  }

  const text = await res.text();

  await traverseJSText({
    text,
    parser,
    parserOptions,
    fullPath,
    callback,
    cwd,
    node: nodeResolution,
    mainFields,
    typescript: typescriptResolution,
    html,
    resolvedMap,
    textSet,
    serial,
    excludePathEntryExpression,
    ignoreResolutionErrors,
    noEsm,
    cjs: cjsModules,
    amd: amdModules
  });

  return resolvedMap;
}

/**
 * @param {ESFileTraverseOptionDefinitions} config
 * @throws {Error} `noEsm` as `true` or set `cjs` or `amd` to true'
 * @returns {Promise<string[]>}
 */
async function traverse ({
  file: fileArray,
  noGlobs,
  serial = false,
  callback = null,
  cwd = process.cwd(),
  excludePathEntryExpression,
  pathExpression,
  excludePathExpression,
  parser,
  parserOptions = {
    requireConfigFile: false
  },
  node: nodeResolution = false,
  mainFields = ['main'],
  typescript: typescriptResolution = false,
  forceLanguage = null,
  jsExtension = ['js', 'cjs', 'mjs', 'ts'],
  htmlExtension = ['htm', 'html'],
  ignoreResolutionErrors,
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

  if (typeof parserOptions === 'string') {
    parserOptions = JSON.parse(parserOptions);
  }

  const textSet = new Set();

  const resolvedMap = new Map();
  if (typeof callback === 'string') {
    // eslint-disable-next-line import/no-dynamic-require, node/global-require
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
    const promMethods = [];
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve, reject) => {
      const parserStream = new Htmlparser2WritableStream(
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
              promMethods.push(() => traverseJSFile({
                file: attribs.src,
                cwd: dirname(join(cwd, htmlFile)),
                node: false,
                html: true,
                parser,
                parserOptions: {
                  ...parserOptions,
                  sourceType
                },
                callback,
                serial,
                excludePathEntryExpression,
                ignoreResolutionErrors,
                noEsm,
                cjs: cjsModules,
                amd: amdModules,
                resolvedMap,
                textSet
              }));
            }
          },
          ontext (text) {
            if (lastName !== 'script') {
              return;
            }
            const sourceType = lastScriptIsModule ? 'module' : 'script';
            if (!text.trim()) {
              return;
            }

            promMethods.push(() => traverseJSText({
              text,
              parser,
              parserOptions: {
                ...parserOptions,
                sourceType
              },
              fullPath: join(cwd, htmlFile),
              callback,
              cwd: dirname(join(cwd, htmlFile)),
              resolvedMap,
              textSet,
              serial,
              excludePathEntryExpression,
              ignoreResolutionErrors,
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
    });
    await seriesOrParallel(promMethods);
  }

  const seriesOrParallel = serialOrParallel(serial);
  await seriesOrParallel(
    files.map((file) => {
      const ext = file.split('.').pop();
      if (forceLanguage === 'html' ||
        (!forceLanguage && htmlExtension.includes(ext))
      ) {
        return async () => await traverseHTMLFile(file);
      }
      if (forceLanguage === 'js' ||
        (!forceLanguage && jsExtension.includes(ext))
      ) {
        return async () => {
          let possibleSourceType;
          if (!noCheckPackageJson) {
            const packageJsonType = await findNearestPackageJsonType(file);
            possibleSourceType = {
              sourceType: packageJsonType === 'module'
                ? 'module'
                : packageJsonType === 'commonjs'
                  ? 'script'
                  : typescriptResolution
                    ? 'module'
                    : defaultSourceType
            };
          }

          return traverseJSFile({
            file,
            cwd,
            node: nodeResolution,
            mainFields,
            typescript: typescriptResolution,
            resolvedMap,
            textSet,
            parser,
            parserOptions: {
              ...parserOptions,
              ...possibleSourceType
              // Todo: Add override of sourceType if detecting
              //   package.json `type`
            },
            serial,
            callback,
            excludePathEntryExpression,
            ignoreResolutionErrors,
            noEsm,
            cjs: cjsModules,
            amd: amdModules
          });
        };
      }
      return () => {
        // No-op
      };
    })
  );

  let whitelistRegex, blacklistRegex;
  if (pathExpression) {
    whitelistRegex = getRegexFromString(pathExpression);
  }
  if (excludePathExpression) {
    blacklistRegex = getRegexFromString(excludePathExpression);
  }

  // Todo: We could instead use (or return) a single set but gathering
  //   per file currently, so avoiding building a separate `Set` for now.
  const values = [...resolvedMap.entries()].filter(([key]) => {
    switch (key) {
    case 'json': case 'builtin':
      return includeType.includes(key);
    default: {
      return true;
    }
    }
  }).map(([, value]) => {
    return value;
  });

  const filesArr = [...new Set(
    values.flatMap((set) => {
      return [...set];
    })
  )].filter((file) => {
    const include = whitelistRegex ? file.match(whitelistRegex) : true;
    const exclude = blacklistRegex ? file.match(blacklistRegex) : false;
    return include && !exclude;
  });

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
