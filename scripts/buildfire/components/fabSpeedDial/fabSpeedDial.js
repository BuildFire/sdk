if (typeof buildfire == 'undefined')
	throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

buildfire.components.fabSpeedDial = class FabSpeedDial {
	constructor(selector, options = {}) {
		if (!document.querySelector(selector)) throw new Error('Element not found!');

		this.selector = document.querySelector(selector);
		this.options = Object.assign({
			showOverlay: true,
			mainButton: {
				content: '',
				type: 'default',
			},
			buttons: [],
		}, options);


		if (this.options.buttons.length <= 1 || this.options.buttons.length > 6) {
			this.options.buttons = [];
			console.error('The number of buttons should be between 2 to 6');
		}

		if (typeof this.options.showOverlay !== 'boolean') {
			throw new Error('showOverlay value must be of type boolean');
		}

		this._onButtonClickCallbacks = [];
		// initialize the state
		this._state = this.getDefaultState;
    	this._onMainBtnClick = this._onMainBtnClick.bind(this);
    	this._onOverlayClick = this._onOverlayClick.bind(this);

		this._init();
	}

	/**
	 * Get state default values
	 */
	get getDefaultState() {
		return {
			mainFabBtnElement: null,
			isOpen: false,
			overlayElement: null,
			bodyTextColor: '#000000',
		};
	}

	static ACTIVE_CLASS_NAME = 'active';

	/**
	 * Initialize component's instance
	 * @private
	 */
	_init() {
		this.selector.classList.add('speed-dial-container'); // todo class name
		this._state.bodyTextColor = getComputedStyle(document.documentElement)
			.getPropertyValue('--bf-theme-body-text')
			.trim();
    	this._buildOverlay();
		this._buildMainButton();
		this._buildButtons();
	}

	/**
	 * Close speed dial buttons
	 * @function
	 * @public
	 */
	close(e) {
        if (!this.selector) return;

        this.selector.classList.remove(FabSpeedDial.ACTIVE_CLASS_NAME);
        this._state.overlayElement.classList.add('fade-out');
        this._state.overlayElement.classList.remove('fade-in');
        setTimeout(() => {
            this._state?.overlayElement.classList.add('hidden');
        }, 200);
        this._state.isOpen = false;

        document.querySelectorAll('.fab-button-container').forEach((el) => {
            setTimeout(() => {
                el.classList.add('hidden');
            }, 200);
        });
	}

	/**
	 * Open speed dial buttons
	 * @function
	 * @public
	 */
	open(e) {
    if (!this.selector) return;
		this.selector.classList.add(FabSpeedDial.ACTIVE_CLASS_NAME);
		document.querySelectorAll('.fab-button-container').forEach((el) => el.classList.remove('hidden'));

		this._state.overlayElement.classList.remove('fade-out', 'hidden');
		this._state.overlayElement.classList.add('fade-in');
		this._state.isOpen = true;
	}

	/**
	 * Handler to be used upon speed dial main speed dial button click
	 * @function
	 * @public
	 */
	onMainButtonClick(event){}

	/**
	 * Handler to be used upon speed dial buttons click
	 * @function
	 * @public
	 */
    onButtonClick(callback) {
        if (typeof callback === 'function') {
            this._onButtonClickCallbacks.push(callback);
        } else if (Array.isArray(callback)) {
            this._onButtonClickCallbacks =
                this._onButtonClickCallbacks.concat(callback);
        }
    }

	/**
	 * Handler to be used upon main button open
	 * @function
	 * @public
	 */
	onOpen() {}

	/**
	 * Handler to be used upon main button closed
	 * @function
	 * @public
	 */
	onClose() {}

	/**
	 * Check if speed dial buttons are opened
	 * @function
	 * @public
	 * @return boolean
	 */
	isOpen() {
		if (!this.selector) throw 'speedDial instance destroyed';
		return this._state.isOpen;
	}

	/**
	 * Destroys target speed dial component and remove its elements from the DOM as well as their
	 * listeners
	 * @function
	 * @public
	 */
	destroy() {
		if (!this.selector) throw 'speedDial instance destroyed';

    	this._state.mainFabBtnElement.removeEventListener('click', this._onMainBtnClick);
		this._state.overlayElement.removeEventListener('click', this._onOverlayClick);
		this._state.overlayElement.remove();
		this.selector.innerHTML = '';
		delete this.options;
		delete this._state;
		delete this.selector;
		delete this.onButtonClick;
    }

    /**
     * Build main button
     * @function
     * @private
     */
    _buildMainButton() {
		this._state.mainFabBtnElement = this._createUIElement(
			'button',
			this.selector,
			this.options.mainButton.content
				? this.options.mainButton.content
				: this._defaultMainBtnContent(),
			['fab-button', 'main-fab-button', this.options.mainButton.type + '-bg']
		);
		this._state.mainFabBtnElement.style.boxShadow = `0px 4px 5px rgba(${this._colorToRGBA(
				this._state.bodyTextColor,
				0.1
			)}),0px 1px 10px rgba(${this._colorToRGBA(this._state.bodyTextColor, 0.1)})
		  `;

		this._state.mainFabBtnElement.addEventListener('click', this._onMainBtnClick);
	}

  /**
   * Toggle the speed dial opened or closed
   * @function
   * @private
   */
	_onMainBtnClick() {
		if(this.options.buttons.length){
			if (!this._state.isOpen) {
				this.open();
				this.onOpen();
			} else {
				this.close();
				this.onClose();
			}
		}else{
			this.onMainButtonClick(this.options.mainButton);
		}
	}

  /**
  * Build speed dial buttons
  * @function
  * @private
  */
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

			if (element.label?.trim()) {
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
			)})`;

			actionButton.style.animationDelay = `${(idx + 1) / 50}s`;
			actionButton.style.webkitAnimationDelay = `${(idx + 1) / 50}s`;

            actionContainer.onclick = (e) => {
                if (element.onClick && typeof element.onClick === 'function') {
                    element.onClick();
                }
                e.stopPropagation();
                if (this._onButtonClickCallbacks.length) {
                    this._onButtonClickCallbacks.forEach(function (callback) {
                        callback(element);
                    });
                } else {
                    this.onButtonClick(element);
                }
                this.close();
            };
        });
    }

    /**
     * Build overlay
     * @function
     * @private
     */
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
        this._state.overlayElement.addEventListener('click',this._onOverlayClick);
    }

	/**
     * Handle on overlay clicked
     * @function
     * @private
     */
    _onOverlayClick() {
        this.close();
    }

    /**
     * Create a dom element
     * @function
     * @private
     */
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

    /**
     * Build main button content
     * @function
     * @private
     * @return element
     */
	_defaultMainBtnContent() {
		const contentButtonContainer = document.createElement('i');
		contentButtonContainer.classList.add('icon', 'default');
		const contentButtonSVG = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		contentButtonSVG.setAttribute('width', '15');
		contentButtonSVG.setAttribute('height', '15');
		contentButtonSVG.setAttribute('viewBox', '0 0 14 14');
		const contentButtonSVGPath = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'path'
		);
		contentButtonContainer.appendChild(contentButtonSVG);
		contentButtonSVGPath.setAttribute('fill-rule', 'evenodd');
		contentButtonSVGPath.setAttribute('clip-rule', 'evenodd');
		contentButtonSVGPath.setAttribute('d', 'M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z');
		contentButtonSVG.appendChild(contentButtonSVGPath);
		return contentButtonContainer;
	}

    /**
     * convert HEX color to RGBA color
     * @function
     * @private
     * @return RGBA color
     */
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
};
