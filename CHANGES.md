# CHANGES for `es-file-traverse`

## 0.11.0

**User-focused**

- Fix(npm): Allow `fs/promises` to be caught with `builtinModules` by
    dropping `builtin-modules` in favor of `is-builtin-module`
- License: Update badges
- npm: Update `@babel/eslint-parser` (minor), `file-fetch` (minor)

**Dev-focused**:
- Linting: As per latest ash-nazg
- npm: Restore `license-badges` script
- npm: Update devDeps.

## 0.10.0

**User-focused**

- Fix: Add argument for`traverseJSText` and `traverseJSFile` so can pass on
    per-instance `textSet` caching `Set`. May overly aggressively cache and
    reuse an existing Map involving the same file.

**Dev-focused**:

- Linting: As per latest ash-nazg
- npm: Update babel/eslint-parser (minor), globby (patch), htmlparser2 (minor)
- npm: update devDeps; package-lock

## 0.9.0

- Update: Change `parserOptions` to default to include
    `requireConfigFile: false` by default (for `@babel/eslint-parser`)
- Update: Per `htmlparser2` update
- npm: Update `babel-eslint` to `babel/eslint-parser`
- npm: Update builtin-modules (minor), htmlparser2 (major),
    eslint-import-resolver-typescript (minor), esquery (minor),
    file-fetch (minor), globby (patch), resolve (minor)
- Docs: Update CLI graphic

**Dev-focused**:

- Linting: As per latest `ash-nazg`
- Testing: Fix test per espree check
- npm: Use stable `mocha-multi-reporters`
- npm: Update devDeps, including switching to new peerDeps for ash-nazg

## 0.8.0

- Linting: As per latest ash-nazg
- Testing: Add test for erring typescript resolver to bring again to 100%
    coverage
- Testing: Bump timeout
- npm: Use stable `eslint-import-resolver-typescript`
- npm: Update devDeps/package-lock

## 0.7.0

- Enhancement: pass in `packageFilter` to `eslint-import-resolver-typescript`
    fork to allow preferring `module` to `types` (may make default for
    `--typescript`)
- Fix: Add `mainFields` defaults to `traverseJSFile` and `traverseJSText`

## 0.6.1

- Fix: Use stable `resolve` as has `packageFilter` option we can use

## 0.6.0

- Enhancement: Add `mainFields` option (defaulting to `['main']`) to allow
    `node` resolution to check `module`, `browser`, etc. as well.

## 0.5.2

- Fix: Proper absolute URL resolution
- Docs: Usage with `eslint-formatter-sourcemaps`

## 0.5.1

- Fix: Ensure always adding full path to results

## 0.5.0

- Enhancement: Add `excludePathExpression` blacklist option
- Enhancement: Add `excludePathEntryExpression` blacklist option
- Testing: Small fixes on CJS expectations

## 0.4.1

- Fix: Avoid chance for recursion on JS text
- Refactoring: Avoid special parsing for empty script tags

## 0.4.0

- Enhancement: Add `typescript` option for resolving by TypeScript
    [module resolution algorithm](https://www.typescriptlang.org/docs/handbook/module-resolution.html); currently auto-sets `defaultSourceType` to `module`.
- npm: Update devDep (eslint)

## 0.3.0

- Breaking change: `babelEslintOptions` -> `parserOptions`
- Enhancement: Add `parser` option to allow parsing with parsers other
    than the default `babel-eslint`.
- Enhancement: Add `"ts"` to file extensions for JavaScript (so will
    work by default when using a TypeScript parser)
- Enhancement: Add `pathExpression` regular expression option to allow
    limiting results to those paths matching the expression (e.g.,
    `node_modules`)
- npm: Update `globby` and devDeps.

## 0.2.0

- Enhancement: Add `ignoreResolutionErrors` option
- Docs: Update eslint-badge as per latest devDep. update
- Docs: Update badges per latest devDeps
- npm: Ensure `test` is linting and add `nyc` script for nyc only
- npm: Add caching to eslint and eslint badge scripts
- npm: Update devDeps.

## 0.1.2

- Fix: Ensure `serial` option works properly (needed to reduce promise
    functions, not promises)
- npm: Update to stable `cypress-multi-reporters` since presently maintained
- npm: Point to now merged `mocha-badge-generator`
- npm: Update devDeps.

## 0.1.1

- Linting (LGTM): LGTM-inspired linting or fixes (affects CLI help)
- Docs: Fix coverage badge path; remove extra badge, rename 3rd party
    eslint badge to hopefully trigger proper Github raw caching
- Docs: Use number of files in eslint dep. badge
- Docs: Usage with `eslint-formatter-badger`

## 0.1.0

- Initial version
