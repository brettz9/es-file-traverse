[![npm](https://img.shields.io/npm/v/es-file-traverse.svg)](https://www.npmjs.com/package/es-file-traverse)
[![Dependencies](https://img.shields.io/david/brettz9/es-file-traverse.svg)](https://david-dm.org/brettz9/es-file-traverse)
[![devDependencies](https://img.shields.io/david/dev/brettz9/es-file-traverse.svg)](https://david-dm.org/brettz9/es-file-traverse?type=dev)

[![testing badge](https://raw.githubusercontent.com/brettz9/es-file-traverse/master/badges/tests-badge.svg?sanitize=true)](badges/tests-badge.svg)
[![coverage badge](https://raw.githubusercontent.com/brettz9/es-file-traverse/master/badges/coverage-badge.svg?sanitize=true)](badges/coverage-badge.svg)
<!--
[![Actions Status](https://github.com/brettz9/es-file-traverse/workflows/Coverage/badge.svg)](https://github.com/brettz9/es-file-traverse/actions)
-->

[![Known Vulnerabilities](https://snyk.io/test/github/brettz9/es-file-traverse/badge.svg)](https://snyk.io/test/github/brettz9/es-file-traverse)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/brettz9/es-file-traverse.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/brettz9/es-file-traverse/alerts)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/brettz9/es-file-traverse.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/brettz9/es-file-traverse/context:javascript)

<!--[![License](https://img.shields.io/npm/l/es-file-traverse.svg)](LICENSE-MIT.txt)-->
[![Licenses badge](https://raw.githubusercontent.com/brettz9/es-file-traverse/master/badges/licenses-badge.svg?sanitize=true)](badges/licenses-badge.svg)

(see also [licenses for dev. deps.](https://raw.githubusercontent.com/brettz9/es-file-traverse/master/badges/licenses-badge-dev.svg?sanitize=true))

[![issuehunt-to-marktext](https://issuehunt.io/static/embed/issuehunt-button-v1.svg)](https://issuehunt.io/r/brettz9/es-file-traverse)

# es-file-traverse

**This project is only minimally functional and is untested!**

<!--
## Installation

```shell
npm i es-file-traverse
```
-->

## Comparison to other projects

This project is similar to [imports-visitor](https://www.npmjs.com/package/imports-visitor),
but it uses `babel-eslint` so as to report ESTree (ESLint) AST.

## CLI

![doc-includes/cli.svg](doc-includes/cli.svg)

## To-dos

1. Testing: Add tests and get to 100% coverage
1. Docs: Add badges for testing, coverage, and linting (esp. for deps.)
    when done (dogfooding with linting badge)
1. Options
    1. Ensure has CLI (as well as programmatic) option to be able to pass list
        of files to `eslint`:
        <https://stackoverflow.com/questions/41405126/how-can-i-dynamically-pass-arguments-to-a-node-script-using-unix-commands>
    1. Option to give an error or report listing **files which were not
        traversed** but within a set of specified files.
    1. Add a **blacklist** so that not end up linting, e.g., `node_modules`
        (e.g., when linting non-security issues)
1. Iteration methods
    1. Make `require.resolve`'s avoid Node resolution for browser-only.
    1. Enable CJS and AMD.
    1. Handle **dynamic `require` or `import`** (or `define`?) (e.g., pass
        back the file name and expression)?
    1. Iterate **script tags** in HTML also, noting whether `type="module"`
        or not so could note whether there was a mismatch of export type in
        the discovered files).
    1. Support **transpiling** (e.g., Rollup with node-resolve and CJS plugins)
    1. **`fetch` or `XMLHttpRequest`** could be used with `eval` but that
        rule could not be readily used without a lot of complexity.
    1. Follow through with any **binaries** that are executed (e.g.,
        `child_process.spawn('node_mod_a')` ->
        `node_modules/.bin/node_mod_a` ->
        `node_modules/node_mod_a/cli/index.js`); could have linting to ensure
        though that instead of spawning raw `node_mod` which could conflict with
        a native `node_mod_a`, should use fixed paths for child processes.
        Could, however, whitelist certain trusted native executables, albeit
        with a potential risk of namespace conflicts.

    1. Ensure linters can lint any extension found for an imported/required
        file, not just those with `--ext` at command line.
        With a need to follow through the individual files anyways, we can
        also check along the way whether this is strict mode file or not,
        and lint that file accordingly, avoiding undue parsing failures.
        Can also avoid errors when the file type is detected as JSON
        (requiring a JSON file) or if the feature of registering a file
        type was used (then handling that as appropriate).
        1. Check source maps to refer back to source
            1. See also:
                1. <https://github.com/Bartvds/eslint-path-formatter>
                1. <https://github.com/a-x-/eslint-path-formatter2>
        1. Allow collecting whole modules in use rather than files, so
            can indicate desire to lint entire modules in use (e.g.,
            so as to report back problems across the whole repo)
    1. Utilize import maps, with either a callback or esquer(ies) for how
         to collect the data of interest on each page, then return that result
         with file name/path (and module type used, e.g., if multiple module types
         are being queried). For linting, we could just get files and then
         use `eslint-plugin-query` with the selectors there instead. Could have
         `strategies` option for built-in following of requires, but could also
         iterate based on following a function call which would need to
         track stacks, e.g., to follow dynamic imports in order or when only
         needing to check linting on a particular API.
1. Uses elsewhere:
    1. Propose this traversal mechanism as a **command line option for
        eslint itself**, esp. if get as a working demo (in place of, or in
        addition to, a set of whitelisted files).
        1. Perform linting (or if doing along the way, only perform linting
            once per discovered file). Traversal code should remain
            separate so can keep a useful generic traverser by
            import/require (dynamic or static) rather than becoming a linter.
    1. Use esp. for `eslint-plugin-privileges` (and `eslint-plugin-query`).
    1. Use for `eslint-plugin-jsdoc` in getting at defined variables
    1. **Validate JavaScript with JSDoc** alone (no TypeScript needed),
        e.g., function calls which are supplying the wrong type; added
        as `eslint-plugin-jsdoc` to-do
    1. Validate function signatures, etc., as with `eslint-plugin-jsdoc`,
        but finding the source of each `/** @type */` and subsituting
        its `@typedef`.
    1. Use for gathering info to use in **autocomplete** (not only import
        paths but variables/symbols)?
    1. Collect comments (which have no AST)
    1. See uses in `eslint-plugin-query` to-dos
    1. Note: if looking also for what is *exported*, e.g., to know what
        globals are, if non-module mode in browser, should look at `var`
        and even `const`/`let`; can then use, e.g., for
        `jsdoc/no-undefined-types`; as with `no-unrestricted-properties`,
        etc., we want to find out when `window` or other globals are used,
        but to collect the uses, rather than report them.
