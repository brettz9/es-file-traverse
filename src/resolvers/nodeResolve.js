'use strict';

/*
import nodeResolve from './nodeResolve.js';
await nodeResolve('tap', { basedir: __dirname });
*/

const _resolve = require('resolve');

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

nodeResolve.sync = _resolve.sync.bind(_resolve);

module.exports = nodeResolve;
