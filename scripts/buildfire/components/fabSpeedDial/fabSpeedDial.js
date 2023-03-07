if (typeof buildfire == 'undefined')
  throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

function State() {
  this.mainFabBtnElement = null;
  this.isOpen = false;
  this.overlayElement = null;
  this.bodyTextColor = '#000000';
}

buildfire.components.speedDialFab = class SpeedDialFab {
  constructor(selector, options) {
    if (!document.querySelector(selector))
      throw new Error('Element not found!');

    this.selector = document.querySelector(selector);
    this.options = {
      showOverlay: true,
      mainButton: {
        content: '',
        type: 'default',
      },
      buttons: [],
    };

    if (options.mainButton) {
      options.mainButton.content
        ? options.mainButton.content
        : (options.mainButton.content = this.options.mainButton.content);
      options.mainButton.type
        ? options.mainButton.type
        : (options.mainButton.type = this.options.mainButton.type);

      this.options.mainButton = options.mainButton;
    }

    if (options.buttons) {
      if (options.buttons.length > 2 && options.buttons.length <= 6) {
        this.options.buttons = options.buttons
          ? options.buttons
          : this.options.buttons;
      } else {
        throw new Error('The number of buttons should be between 2 to 6');
      }
    }

    if (options.showOverlay === true || options.showOverlay === false) {
      this.options.showOverlay = options.showOverlay;
    }

    this._state = new State();
    this.init();
  }

  static ACTIVE_CALSS_NAME = 'active';

  init() {
    this.selector.classList.add('speedDial-container');
    this._state.bodyTextColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--bf-theme-body-text')
      .trim();
    this._buildMainButton();
    this._buildButtons();
    this._buildOverlay();
  }

  _buildMainButton() {
    this._state.mainFabBtnElement = this._createUIElement(
      'button',
      this.selector,
      this.options.mainButton.content
        ? this.options.mainButton.content
        : this._defualtMainBtnContent(),
      ['fab-button', 'main-fab-button', this.options.mainButton.type + '-bg']
    );
    this._state.mainFabBtnElement.style.boxShadow = `0px 4px 5px rgba(${this._colorToRGBA(
      this._state.bodyTextColor,
      0.1
    )}),0px 1px 10px rgba(${this._colorToRGBA(this._state.bodyTextColor, 0.1)})
		  `;

    this._state.mainFabBtnElement.addEventListener('click', (e) => {
      if (!this._state.isOpen) {
        this.open();
        this.onOpen({ isOpen: this._state.isOpen });
      } else {
        this.close();
        this.onClose({ isOpen: this._state.isOpen });
      }
    });
  }

  _buildButtons() {
    const buttonsContainer = this._createUIElement('div', this.selector, '', [
      'fab-button-container',
      'hidden',
    ]);

    this.options.buttons.forEach((element, idx) => {
      const actionContainer = this._createUIElement(
        'div',
        buttonsContainer,
        '',
        ['action-container']
      );
      if (element.label && element.label.trim() !== '') {
        const actionLabel = this._createUIElement(
          'label',
          actionContainer,
          element.label,
          ['extended-button-label']
        );
        actionLabel.style.animationDelay = `${(idx + 1) / 50}s`;
        actionLabel.style.webkitAnimationDelay = `${(idx + 1) / 50}s`;
      }
      const actionButton = this._createUIElement(
        'button',
        actionContainer,
        element.content,
        [
          'fab-button',
          'extended-button',
          element.type ? element.type + '-bg' : 'bg',
        ]
      );
      actionButton.style.boxShadow = `0px 4px 5px rgba(${this._colorToRGBA(
        this._state.bodyTextColor,
        0.1
      )}),0px 1px 10px rgba(${this._colorToRGBA(
        this._state.bodyTextColor,
        0.1
      )})
			  `;

      actionButton.style.animationDelay = `${(idx + 1) / 50}s`;
      actionButton.style.webkitAnimationDelay = `${(idx + 1) / 50}s`;
      actionButton.id = `fabBtn${idx + 1}`;

      actionContainer.onclick = (e) => {
        if (element.onClick && typeof element.onClick === 'function') {
          element.onClick();
        }
        e.stopPropagation();
        this.onButtonClick(element);
        this.close();
      };
    });
  }

  _buildOverlay() {
    this._state.overlayElement = this._createUIElement(
      'div',
      document.querySelector('body'),
      '',
      ['expanded-fab-overlay', 'hidden', 'fade-in']
    );
    if (!this.options.showOverlay) {
      this._state.overlayElement.style.backgroundColor = 'transparent';
    }
    this._state.overlayElement.addEventListener('click', (e) => {
      if (!e.target.closest('.main-fab-button')) {
        this.close();
      }
      this.close();
    });
  }

  _createUIElement(
    elementType,
    appendTo = null,
    innerHTML = null,
    classNameArray = [],
    id = null
  ) {
    let e = document.createElement(elementType);

    if (typeof innerHTML === 'string') {
      e.innerHTML = innerHTML;
    } else if (typeof innerHTML === 'object') {
      e.appendChild(innerHTML);
    }
    if (Array.isArray(classNameArray))
      classNameArray.forEach((c) => e.classList.add(c));
    if (appendTo) appendTo.appendChild(e);
    if (id) e.setAttribute('id', id);
    return e;
  }

  _defualtMainBtnContent() {
    const contentButtonContainer = document.createElement('i');
    contentButtonContainer.classList.add('icon', 'default');
    const contentbuttonSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    contentbuttonSvg.setAttribute('width', '14');
    contentbuttonSvg.setAttribute('height', '14');
    contentbuttonSvg.setAttribute('viewBox', '0 0 14 14');
    const contentbuttonSvgPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    contentButtonContainer.appendChild(contentbuttonSvg);
    contentbuttonSvgPath.setAttribute('fill-rule', 'evenodd');
    contentbuttonSvgPath.setAttribute('clip-rule', 'evenodd');
    contentbuttonSvgPath.setAttribute('d', 'M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z');
    contentbuttonSvg.appendChild(contentbuttonSvgPath);
    return contentButtonContainer;
  }

  _colorToRGBA(color, opacity = 1) {
    const isHexColor = (color) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(color);
    const getChunksFromString = (st, chunkSize) =>
      st.match(new RegExp(`.{${chunkSize}}`, 'g'));
    const convertHexUnitTo256 = (hexStr) =>
      parseInt(hexStr.repeat(2 / hexStr.length), 16);

    if (isHexColor(color)) {
      const chunkSize = Math.floor((color.length - 1) / 3);
      const hexArr = getChunksFromString(color.slice(1), chunkSize);
      const [r, g, b] = hexArr.map(convertHexUnitTo256);
      return `${r}, ${g}, ${b},${opacity}`;
    }
  }

  close() {
    if (this.selector) {
      this.selector.classList.remove(SpeedDialFab.ACTIVE_CALSS_NAME);

      this._state.overlayElement.classList.add('fade-out');
      this._state.overlayElement.classList.remove('fade-in');
      setTimeout(() => {
        this._state.overlayElement.classList.add('hidden');
      }, 200);
      document.querySelectorAll('.fab-button-container').forEach((el) => {
        setTimeout(() => {
          el.classList.add('hidden');
        }, 200);
      });

      this._state.isOpen = false;
    }
  }
  open() {
    if (this.selector) {
      this.selector.classList.add(SpeedDialFab.ACTIVE_CALSS_NAME);
      document.querySelectorAll('.fab-button-container').forEach((el) => {
        el.classList.remove('hidden');
      });

      this._state.overlayElement.classList.remove('fade-out');
      this._state.overlayElement.classList.add('fade-in');
      this._state.overlayElement.classList.remove('hidden');
      this._state.isOpen = true;
    }
  }

  onButtonClick() {}

  onOpen() {}

  onClose() {}

  isOpen() {
    if (this.selector) {
      return this._state.isOpen;
    } else {
      return console.warn('no selector');
    }
  }

  destroy() {
    if (this.selector) {
      this.selector.innerHTML = '';
      this._state.overlayElement.remove();
      delete this.options;
      delete this._state;
      delete this.selector;
      delete this.onButtonClick;
    }
  }
};
