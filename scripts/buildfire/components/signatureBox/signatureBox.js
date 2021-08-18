'use strict';

if (typeof (buildfire) === 'undefined') {
  throw ('please add buildfire.js first to use signatureBox component');
}

if (typeof (buildfire.components) === 'undefined') {
  buildfire.components = {};
}

if (typeof (buildfire.components.signatureBox) == 'undefined') {
  buildfire.components.signatureBox = {};
}

console.log('signatureBox initiated');
