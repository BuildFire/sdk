'use strict';

if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use carousel components');

if (typeof (buildfire.components) == 'undefined')
	buildfire.components = {};

if (typeof (buildfire.components.carousel) == 'undefined')
	buildfire.components.carousel = {};

(function () {
		if (typeof lory == 'undefined') {
			throw ('lory library not found');
		}

		//Add Lory CSS
		var style = document.getElementById('loryInjectedStyle');
		if (style) document.head.removeChild(style);

		style = document.createElement('style');
		style.id = 'loryInjectedStyle';
		style.innerHTML += ' .loryFrame {position: relative;font-size: 0; line-height: 0; overflow: hidden; white-space: nowrap;}';
		style.innerHTML += ' .loryFrame li { position: relative; display: inline-block; height: 100%;}';
		style.innerHTML += ' .lorySlides { display: inline-block;}';
		style.innerHTML += ' .loryPercentage .lorySlides { display: block; padding: 0px;}';
		style.innerHTML += ' .loryPercentage li {  width: 100%;}';

		document.head.appendChild(style);
})();

// This is the class that will be used in the mobile
//{selector:selector, items:items, layout:layout, speed:speed}
buildfire.components.carousel.view = function (options) {
	if (options.items && options.items.length > 0) {
			this.config = this.mergeSettings(options);
			this._initDimensions(this.config.layout);
			this.init();
		if (options.selector) {
			options.selector.style.display= '';
		} else {
			console.error('Selector element should be provided');
		}
		
	} else {
		if (options.selector) {
			options.selector.style.display = 'none';
		} else {
			console.error('Selector element should be provided');
		}
	}
};

// Carousel view methods
buildfire.components.carousel.view.prototype = {
	mergeSettings: function (options) {
		var settings = {
			selector: '.js_percentage',
			items: [],
			layout: null,
			speed: 200,
			loop: true,
			autoInterval: 5 * 1000
		};
		var userSettings = options;
		for (var attrName in userSettings) {
			settings[attrName] = userSettings[attrName];
		}
		return settings;
	},
	init: function () {
		this.selector = typeof this.config.selector === 'string' ? document.querySelector(this.config.selector) : this.config.selector;

		if (!this.selector) {
			throw ('selector not found');
			return;
		}
		// Add min-height to carousel to prevent it from pushing content down
		this.selector.style['min-height'] = this._minHeight;

		var self = this;

		function validateLauncherCarousel() {
			buildfire.getContext(function (err, result) {
				if (result && result.device && result.device.platform && result.device.platform.toLowerCase() == 'ios' && buildfire.getFrameType() == 'LAUNCHER_PLUGIN') {
					buildfire.navigation.onAppLauncherActive(function () {
						self._applySlider();
					}, true);
					buildfire.navigation.onAppLauncherInactive(function () {
						self._destroySlider();
					}, true);
				}
			});
		}

		if (this.config.items && this.config.items.length > 0) {
			this._renderHTMLItems(function () {
				self._applySlider();
				validateLauncherCarousel();
			});
		} else {
			self._applySlider();
			validateLauncherCarousel();
		}
	},
	_destroySlider: function () {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	},
	_applySlider: function () {
		if (!this.lorySlider) {
			this.lorySlider = lory(this.config.selector, {
				classNameSlideContainer: this.config.classNameSlideContainer || 'js_slides',
				classNameFrame: this.config.classNameFrame || 'js_frame',
				ease: 'ease',
				rewindSpeed: 600,//ms
				slideSpeed: this.config.speed,//ms
				slidesToScroll: this.config.slidesToScroll || 1,
				infinite: this.config.infinite || 1,
				enableMouseEvents: true
			});
		}

		if (this.config.loop && this.config.items && this.config.items.length > 1) {
			var self = this;

			if (this.timerInterval) {
				clearInterval(this.timerInterval);
				this.timerInterval = null;
			}

			this.timerInterval = setInterval(function () {
				self.lorySlider.next();
			}, this.config.autoInterval);
		}
	},
	_renderHTMLItems: function (callback) {
		var self = this;

		while (this.selector.firstChild) {
			this.selector.removeChild(this.selector.firstChild);
		}

		this.sliderFrame = document.createElement('div');
		['loryFrame', 'js_frame'].forEach(function (cname) {
			self.sliderFrame.classList.add(cname);
		});

		this.slideContainer = document.createElement('ul');
		['lorySlides', 'js_slides'].forEach(function (cname) {
			self.slideContainer.classList.add(cname);
		});

		this._loadImages(this.config.items, function () {
			['slider', 'js_percentage', 'loryPercentage'].forEach(function (cname) {
				self.selector.classList.add(cname);
			});

			self.sliderFrame.appendChild(self.slideContainer);
			self.selector.appendChild(self.sliderFrame);

			callback();
		});
	},
	_loadImages: function (items, callback) {
		var self = this;

		var itemsLength = items.length;
		var pending = itemsLength;

		if (itemsLength == 0) {
			callback();
		}

		for (var i = 0; i < itemsLength; i++) {
			this._appendItem(items[i], function (itemSlide) {
				pending--;
				self.slideContainer.appendChild(itemSlide);

				if (pending == 0) {
					callback();
				}
			});
		}
	},
	_appendItem: function (item, callback) {
		var slide = document.createElement('li');
		slide.classList.add('js_slide');

		slide.addEventListener('click', function () {
			buildfire.actionItems.execute(item, function (err, result) {
				if (err) {
					console.warn('Error opening slider action: ', err);
				}
			});
		});

		let me = this;
		buildfire.imageLib.local.cropImage(item.iconUrl, {
			aspect: this.aspect,
			size: 'full_width',
			width: this.width,
			height: this.height
		}, function (err, result) {
			if (!err) {
				var image = document.createElement('img');
				var backgroundImage = document.createElement('img');
				image.src = backgroundImage.src = result;
				image.alt = backgroundImage.alt = item.title || '';
				backgroundImage.className = 'blurred-background-image';
				backgroundImage.setAttribute('style', `width: 100% !important; transform: scale(1.2) !important;`);
				slide.style.overflow = 'hidden';
				image.style.transform = 'translateZ(0)';
				if (me.height > 380) {
					slide.appendChild(backgroundImage);
				}
				slide.appendChild(image);
			}
			else
				console.log('Error occurred while cropping image: ', err);

			callback(slide);
		});
	},
	// allows you to append a single item or an array of items
	append: function (items) {
		if (!items)
			return;
		else if (!(items instanceof Array) && typeof(items) == 'object')
			items = [items];

		if (items && items instanceof Array && items.length) {
			for (var i = 0; i < items.length; i++) {
				this.config.items.push(items[i]);
			}
			var self = this;
			self.slideContainer.innerHTML = '';
			this._loadImages(this.config.items, function () {
				self.lorySlider.setup();
			});
		}
	},
	_initDimensions: function (layout) {
		this.width = window.innerWidth;
		layout = layout || 'WideScreen';
		if (layout == 'WideScreen') {
			this.height = Math.ceil(9 * this.width / 16);
			this.aspect = '16:9';
		} else if (layout == 'Square') {
			this.height = this.width;
			this.aspect = '1:1';
		} else if (layout == 'Cinema') {
			this.height = Math.ceil(1 * this.width / 2.39);
			this.aspect = '2.39:1';
		} else if (layout == 'MobileScreen') {
			this.height = (window.innerHeight / this.width) * this.width;
			this.aspect = '9:16';
		}

		this.cssWidth = this.width + 'px';
		if (this.height > 380) {
			this.cssHeight = '380px';
		} else {
			this.cssHeight = this.height + 'px';
		}

		// Set Min height on carousel so doesn't push content down on load.
		this._minHeight = this.cssHeight;
	}
};
