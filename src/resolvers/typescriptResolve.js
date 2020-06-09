'use strict';

const {join} = require('path');
const importResolverTS = require('eslint-import-resolver-typescript');

const typescriptResolve = async (pth, opts) => {
  return await typescriptResolve.sync(pth, opts);
};

typescriptResolve.sync = (pth, opts = {basedir: process.cwd()}) => {
  const {found, path} = importResolverTS.resolve(
    pth,
    join(opts.basedir, '/es-file-traverse-dummy.ts'),
    {...opts, basedir: undefined}
  );
  if (!found) {
    throw new Error(`File not found: ${pth}`);
  }
  return path;
};

module.exports = typescriptResolve;
