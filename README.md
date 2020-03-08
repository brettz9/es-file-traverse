# es-file-traverse

**This project is not yet functional!**

## CLI

![doc-includes/cli.svg](doc-includes/cli.svg)

## To-dos

1. Add a CLI (as well as programmatic) API to build a list of files and
    add that to CLI args to `eslint`:
    <https://stackoverflow.com/questions/41405126/how-can-i-dynamically-pass-arguments-to-a-node-script-using-unix-commands>
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
