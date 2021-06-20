/*
import nodeResolve from './nodeResolve.js';
await nodeResolve('tap', { basedir: __dirname });
*/

import _resolve from 'resolve';

const nodeResolve = (path, opts = {}) => {
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    _resolve(path, opts, (err, res, pkg) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

// eslint-disable-next-line unicorn/prefer-prototype-methods -- Fine here
nodeResolve.sync = _resolve.sync.bind(_resolve);

export default nodeResolve;
