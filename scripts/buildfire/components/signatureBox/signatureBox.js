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

/**
 * Inject required CSS classes and loads signature_pad.js
 */
(function () {
  const script = document.createElement('script');
  script.setAttribute('src', '/../../../scripts/buildfire/components/signatureBox/signature_pad.min.js');
  script.setAttribute('type', 'text/javascript');
  document.head.appendChild(script);

  script.onload = function () {
    console.info('Loaded signature_pad.min.js successfully');
  };

  script.onerror = function () {
    throw ('Failed to load signature_pad.min.js');
  };

  let style = document.getElementById('signatureBoxCSS');
  if (style) document.head.removeChild(style);

  style = document.createElement('style');
  style.type = 'text/css';
  style.id = 'signatureBoxCSS';

  style.innerHTML += ' #signatureScreen {width: 100vw;height: 100vh;display: flex;justify-content: center;position: fixed;top: 100vh;left: 0;z-index: 10;transition: all 0.2s ease-in-out;}';
  style.innerHTML += ' #signatureCanvas {border: 1px solid #ccc;}';
  style.innerHTML += ' .signature-footer {width: 400px;display: flex;align-items: center;flex-shrink: 0;height: 40px !important;position: absolute;top: calc(50% - 20px);right: calc(50% - 60px);transform: rotate(90deg) !important;}';
  style.innerHTML += ' .canvas-container {display: flex;justify-content: center;align-items: center;margin-left: 40px;flex-shrink: 0;}';
  style.innerHTML += ' .signature-header {width: 48px;height: 100%;display: flex;justify-content: center;align-items: center;flex-shrink: 0;}';
  style.innerHTML += ' .signature-header p {writing-mode: vertical-rl;text-orientation: mixed;}';

  document.head.appendChild(style);
}());

/**
 * Rotate image data 90 degree
 * @param {string} src - JS date
 * @param {function} cb - err or or base64 data URL
 * @private
 */
const _rotate90 = (src, cb) => {
  const img = new Image();
  img.src = src;
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = img.height;
    canvas.height = img.width;
    canvas.style.position = 'absolute';
    const ctx = canvas.getContext('2d');
    ctx.translate(0, canvas.height);
    ctx.rotate(Math.PI / -2);
    ctx.drawImage(img, 0, 0);
    cb(null, canvas.toDataURL());
  };
};

/**
 * Shows signature box
 * @param {object} options - optional width and height of the signature box
 * @param {function} cb - err or or base64 data URL
 */
buildfire.components.signatureBox.openDialog = function ({ width = '200', height = '400' } = {}, cb) {
  buildfire.appearance.getAppTheme((err, theme) => {
    // main container
    const signatureScreen = document.createElement('div');
    signatureScreen.id = 'signatureScreen';
    signatureScreen.style.background = theme.colors.backgroundColor;
    signatureScreen.style.top = '0';

    // box footer
    const footer = document.createElement('div');
    footer.className = 'signature-footer';
    footer.style.height = height.concat('px');

    const clearButton = document.createElement('button');
    clearButton.className = 'mdc-button mdc-button--outlined';
    clearButton.style.marginTop = '3rem';

    const clearButtonRipple = document.createElement('div');
    clearButtonRipple.className = 'mdc-button__ripple';
    clearButton.appendChild(clearButtonRipple);

    const clearButtonLabel = document.createElement('span');
    clearButtonLabel.className = 'mdc-button__label';
    clearButtonLabel.innerText = 'Clear';
    clearButton.appendChild(clearButtonLabel);

    const saveButton = document.createElement('button');
    saveButton.className = 'mdc-button mdc-button--raised';
    saveButton.style.marginTop = '3rem';

    const saveButtonRipple = document.createElement('div');
    saveButtonRipple.className = 'mdc-button__ripple';
    saveButton.appendChild(saveButtonRipple);

    const saveButtonLabel = document.createElement('span');
    saveButtonLabel.className = 'mdc-button__label';
    saveButtonLabel.innerText = 'Save';
    saveButton.appendChild(saveButtonLabel);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'mdc-button mdc-button--outlined';
    cancelButton.style.marginTop = '3rem';

    const cancelButtonRipple = document.createElement('div');
    cancelButtonRipple.className = 'mdc-button__ripple';
    cancelButton.appendChild(cancelButtonRipple);

    const cancelButtonLabel = document.createElement('span');
    cancelButtonLabel.className = 'mdc-button__label';
    cancelButtonLabel.innerText = 'Cancel';
    cancelButton.appendChild(cancelButtonLabel);

    footer.appendChild(clearButton);
    footer.appendChild(cancelButton);
    footer.appendChild(saveButton);
    signatureScreen.appendChild(footer);

    // Box
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';

    const canvas = document.createElement('canvas');
    canvas.id = 'signatureCanvas';
    canvas.width = Number(width);
    canvas.height = Number(height);

    canvasContainer.appendChild(canvas);
    signatureScreen.appendChild(canvasContainer);

    // header
    const header = document.createElement('div');
    header.className = 'signature-header';

    const headText = document.createElement('p');
    headText.innerText = 'Please sign the box below';
    header.appendChild(headText);

    signatureScreen.appendChild(header);

    document.body.appendChild(signatureScreen);

    const signaturePad = new SignaturePad(canvas);
    signaturePad.on();

    clearButton.addEventListener('click', () => { signaturePad.clear(); });
    saveButton.addEventListener('click', () => {
      _rotate90(signaturePad.toDataURL(), (error, dataUrl) => {
        const base64 = Uint8Array.from(atob(dataUrl.slice(22)), (c) => c.charCodeAt(0));
        if (cb) cb(null, { dataUrl, base64 });

        signatureScreen.style.top = '100vh';
        setTimeout(() => { document.body.removeChild(signatureScreen); }, 200, signatureScreen);
        buildfire.navigation.restoreBackButtonClick();
      });
    });

    buildfire.navigation.onBackButtonClick = () => {
      signatureScreen.style.top = '100vh';
      setTimeout(document.body.removeChild, 200, signatureScreen);
      buildfire.navigation.restoreBackButtonClick();
    };
  });
};
