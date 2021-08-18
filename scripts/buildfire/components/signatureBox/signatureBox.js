'use strict';

if (typeof (buildfire) === 'undefined') {
  throw ('please add buildfire.js first to use signatureBox component');
}

if (typeof (buildfire.components) === 'undefined') {
  buildfire.components = {};
}

if (typeof (buildfire.components.signatureBox) === 'undefined') {
  buildfire.components.signatureBox = {};
}

(function () {
  var script = document.createElement('script');
  script.setAttribute('src', '/../../../scripts/buildfire/components/signatureBox/signature_pad.min.js');
  script.setAttribute('type', 'text/javascript');
  document.head.appendChild(script);

  script.onload = function () {
    console.info('Loaded signature_pad.min.js successfully');
  };

  script.onerror = function () {
    throw ('Failed to load signature_pad.min.js');
  };
})();

console.log('signatureBox initiated');
