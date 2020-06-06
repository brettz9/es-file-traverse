# CHANGES for `es-file-traverse`

## 0.4.0

- Enhancement: Add `typescript` option for resolving by TypeScript
    [module resolution algorithm](https://www.typescriptlang.org/docs/handbook/module-resolution.html); currently auto-sets `defaultSourceType` to `module`.

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
