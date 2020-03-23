[![npm](https://img.shields.io/npm/v/es-file-traverse.svg)](https://www.npmjs.com/package/es-file-traverse)
[![Dependencies](https://img.shields.io/david/brettz9/es-file-traverse.svg)](https://david-dm.org/brettz9/es-file-traverse)
[![devDependencies](https://img.shields.io/david/dev/brettz9/es-file-traverse.svg)](https://david-dm.org/brettz9/es-file-traverse?type=dev)

[![Actions Status](https://github.com/brettz9/es-file-traverse/workflows/Node%20CI/badge.svg)](https://github.com/brettz9/es-file-traverse/actions)
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

**This project is not yet functional!**

## CLI

![doc-includes/cli.svg](doc-includes/cli.svg)

## To-dos

1. Iterate through files for `require`, `import` (dynamic or static), and maybe
    `define` (`fetch` or `XMLHttpRequest` could be used with `eval` but that
    rule could not be readily used without a lot of complexity). Ensure can
    check any extension found for an imported/required file, not
    just those at command line. Use <https://www.npmjs.com/package/resolve>
    to find the next file (for `env: "node"`); also follow through
    any binaries that are executed (e.g.,
    `child_process.spawn('node_mod_a')` ->
    `node_modules/.bin/node_mod_a` ->
    `node_modules/node_mod_a/cli/index.js`); could have linting to ensure
    though that instead of spawning raw `node_mod` which could conflict with
    a native `node_mod_a`, should use fixed paths for child processes.
    Could, however, whitelist certain trusted native executables, albeit
    with a potential risk of namespace conflicts.
    With a need to follow through the individual files anyways, we can
    also check along the way whether this is strict mode file or not,
    and lint that file accordingly, avoiding undue parsing failures.
    Can also avoid errors when the file type is detected as JSON
    (requiring a JSON file) or if the feature of registering a file
    type was used (then handling that as appropriate).
1. Use esp. for `eslint-plugin-privileges` (and `eslint-plugin-query`),
    though really could file to become part of eslint core.
1. Use for `eslint-plugin-jsdoc` in getting at defined variables
1. Use for **autocomplete**?
