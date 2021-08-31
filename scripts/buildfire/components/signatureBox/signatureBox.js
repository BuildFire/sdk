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
 * Inject signaturePad and loads signature_pad.js
 *  @param {function} cb - callback function
 *  @private
 */
const _injectScript = (cb) => {
  let script = document.getElementById('signaturePadScript');
  if (script) return cb();
  if (!document.head) {
    return cb(new Error('please add head element to the document first to use signatureBox component'));
  }

  script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', '/../../../scripts/buildfire/components/signatureBox/signature_pad.min.js');
  script.id = 'signaturePadScript';

  document.head.appendChild(script);

  script.onload = function () {
    cb();
    console.info('Loaded signature_pad.min.js successfully');
  };
  script.onerror = function () {
    cb(new Error('Failed to load signature_pad.min.js'));
    console.error('Failed to load signature_pad.min.js');
  };
}
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
 * Inject needed CSS into the DOM
 * @param {object} theme - buildfire app theme
 * @private
 */
const _injectCSS = (theme) => {
  if (!document.head) {
    throw new Error('please add head element to the document first to use signatureBox component');
  }
  const { colors } = theme;
  let style = document.getElementById('signatureBoxCSS');
  if (style) document.head.removeChild(style);

  style = document.createElement('style');
  style.type = 'text/css';
  style.id = 'signatureBoxCSS';

  style.innerHTML += ' #signatureScreen {width: 100vw;height: 100vh;display: flex;justify-content: center;position: fixed;top: 100vh;left: 0;z-index: 1001;transition: all 0.2s ease-in-out;}';
  style.innerHTML += ` #signatureCanvas {border: 1px solid ${colors.primaryTheme};background-color: #ffffff;}`;
  style.innerHTML += ' .signature-footer {width: 400px;display: flex;align-items: center;flex-shrink: 0;height: 40px !important;position: absolute;top: calc(50% - 20px);right: calc(50% - 75px);transform: rotate(90deg) !important;}';
  style.innerHTML += ' .canvas-container {display: flex;justify-content: center;align-items: center;margin-left: 60px;flex-shrink: 0;}';
  style.innerHTML += ` .signature-header {font-size: 14px;width: 48px;height: 100%;display: flex;justify-content: center;align-items: center;flex-shrink: 0; color: ${colors.bodyText};}`;
  style.innerHTML += ' .signature-header p {writing-mode: vertical-rl;text-orientation: mixed;}';
  style.innerHTML += ` .signature-btn {-moz-osx-font-smoothing: grayscale;-webkit-font-smoothing: antialiased;font-size: 12px;line-height: 2.25rem;font-weight: 500;height: 36px;letter-spacing: .0892857143em;text-decoration: none;text-transform: uppercase;padding: 0 8px 0 8px;box-sizing: border-box;min-width: 64px;border: none;outline: none;-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;-webkit-appearance: none;overflow: visible;vertical-align: middle;border-radius: 4px;background-color: transparent;cursor: pointer;font-family: Architects Daughter, sans-serif !important;color: ${colors.primaryTheme};border-color: ${colors.primaryTheme};}`;
  style.innerHTML += ' .signature-btn--outlined {border-style: solid;padding: 0 15px 0 15px;border-width: 1px;}';
  style.innerHTML += ` .signature-btn--primary {color: #FFFFFF;background-color: ${colors.primaryTheme};box-shadow: 0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%);transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);padding: 0 16px 0 16px;}`;

  document.head.appendChild(style);
};

/**
 * Shows signature box
 * @param {object} options - optional width and height of the signature box
 * @param {function} cb - err or or base64 data URL
 */
buildfire.components.signatureBox.openDialog = function ({ width = '200', height = '400' } = {}, cb) {
  _injectScript((injectError) => {
    if (injectError) return cb(injectError);
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
      clearButton.className = 'signature-btn signature-btn--outlined';
      clearButton.innerText = 'Clear';


      const saveButton = document.createElement('button');
      saveButton.className = 'signature-btn--primary signature-btn';
      saveButton.style.marginLeft = '12.75px';
      saveButton.innerText = 'Save';

      const cancelButton = document.createElement('button');
      cancelButton.className = 'signature-btn signature-btn--outlined';
      cancelButton.style.marginLeft = 'auto';
      cancelButton.innerText = 'Cancel';

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

      _injectCSS(theme);
      document.body.appendChild(signatureScreen);

      const signaturePad = new SignaturePad(canvas);
      signaturePad.on();

      clearButton.addEventListener('click', () => { signaturePad.clear(); });
      cancelButton.addEventListener('click', () => {
        signatureScreen.style.top = '100vh';
        setTimeout(() => { document.body.removeChild(signatureScreen); }, 200, signatureScreen);
        buildfire.navigation.restoreBackButtonClick();
        cb();
      });
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
        cb();
      };
    });
  });
};
