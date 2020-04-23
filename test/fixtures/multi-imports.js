import './file2.js';
import './file3.js';

// Todo[eslint-plugin-chai-friendly@>0.5.0]: Remove next line's disabling if this is merged: https://github.com/ihordiachenko/eslint-plugin-chai-friendly/pull/12
// eslint-disable-next-line chai-friendly/no-unused-expressions
import('./file4.js');

export {named} from './file5.js';

export * as b from './file6.js';
