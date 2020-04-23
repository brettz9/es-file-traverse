'use strict';

/*
import resolve from './resolve.js';
await resolve('tap', { basedir: __dirname });
*/

const _resolve = require('resolve');

const resolve = (path, opts = {}) => {
  // eslint-disable-next-line promise/avoid-new, no-shadow
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

resolve.sync = _resolve.sync.bind(_resolve);

module.exports = resolve;
