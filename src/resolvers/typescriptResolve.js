import {join} from 'path';
import importResolverTS from 'eslint-import-resolver-typescript';

const typescriptResolve = async (pth, opts) => {
  return await typescriptResolve.sync(pth, opts);
};

typescriptResolve.sync = (pth, opts) => {
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

export default typescriptResolve;
