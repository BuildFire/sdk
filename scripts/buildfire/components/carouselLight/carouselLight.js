'use strict';

if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use carousel components');

if (typeof (buildfire.components) == 'undefined')
	buildfire.components = {};

if (typeof (buildfire.components.carousel) == 'undefined')
	buildfire.components.carousel = {};

(function () {
	if (typeof lory == 'undefined') {
		document.write('<script src="' + '../../../scripts/lory/lory.min.js"></script>');
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
	style.innerHTML += ' .loryPercentage li { width: 100%;}';
	style.innerHTML += ' .blurred-background-image { filter: blur(30px); position: absolute; top: 0 }';
	style.innerHTML += ' .js_slide { text-align: center; position: relative; max-height: 380px; }';
	style.innerHTML += ' .js_slide img { max-height: 380px; width: auto !important; margin: 0 auto }';
	style.innerHTML += ' .js_slide.static_slide { display: none }';
	style.innerHTML += ' .js_slide.static_slide.active { display: block }';

	document.head.appendChild(style);
})();
// This is the class that will be used in the mobile
//{selector:selector, items:items, layout:layout, speed:speed}
buildfire.components.carousel.view = function (options) {
	let self = this;
	this.config = this.mergeSettings(options);
	this._initDimensions(self.config.layout);
	this.selector = typeof this.config.selector === 'string' ? document.querySelector(this.config.selector) : this.config.selector;
	this._attachEventListeners();
	if (options.items && options.items.length > 0) {
		this._applyConfigurations(options, (err, result) => {
			if (result.shouldInitializeLory) { // loryCarousel
				self.init();
			} else {
				self._renderStaticSlides(options.items);
			}
		});
		if (options.selector) {
			options.selector.style.display = '';
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
buildfire.components.carousel.view.lastCarouselTimer = null;
// Carousel view methods
buildfire.components.carousel.view.prototype = {
	lastImage: null,
    _applyConfigurations: function(options, callback) {
		let self = this;
		let { items, autoInterval, order, display } = options;
		if (buildfire.components.carousel.view.lastCarouselTimer) {
			clearInterval(buildfire.components.carousel.view.lastCarouselTimer);
			buildfire.components.carousel.view.lastCarouselTimer = null;
		}
		let isHome = buildfire.getFrameType() == 'LAUNCHER_PLUGIN';
		let storagePlace = (isHome) ? "carouselLastImageHome" : "carouselLastImage";
		if (order == 0 && display == 1 && items.length > 1) {
			buildfire.localStorage.getItem(storagePlace, function(err, res) {
				let images = items;
				let sendIndex = 0;
				let item = null;
				if (res == null) {
					item = items[0];
				} else {
					let index = Number(res);
					if (index == -1 || index == items.length - 1) item = items[0];
					else {item = items[index + 1]; sendIndex = index + 1;}
				}
				self.lastImage = item;
				buildfire.localStorage.setItem(storagePlace, sendIndex, function(e, r) {
					if (autoInterval != 0) buildfire.components.carousel.view.lastCarouselTimer = setInterval(self._changeImage.bind(self), self.config.autoInterval, images, false);
				});
				callback(null, {shouldInitializeLory: false});
			});
		} else if (order == 1 && display == 1 && items.length > 1) {
			if (autoInterval != 0) {
				buildfire.components.carousel.view.lastCarouselTimer = setInterval(this._changeImage.bind(this), this.config.autoInterval, items, true);
			}
			item = items[Math.floor(Math.random() * items.length)];
			this.lastImage = item;
			buildfire.localStorage.removeItem(storagePlace);
			callback(null, {shouldInitializeLory: false});
		} else if (order == 1 && display == 0 && items.length > 1) {
			this._randomizeArray(items);
			buildfire.localStorage.removeItem(storagePlace);
			callback(null, {shouldInitializeLory: true});
		} else if (display == 1) {
			callback(null, {shouldInitializeLory: false});
		} else {
			callback(null, {shouldInitializeLory: true});
		}
	},
	_randomizeArray: function (images) {
        this._shuffle(images, null, null);
        let imagesCopy = Array.from(images);
        this._shuffle(imagesCopy, null, images[images.length -  1]);
        images.push(...imagesCopy);
        this._shuffle(imagesCopy, images[0], images[images.length - 1]);
        images.push(...imagesCopy);
    },
	_shuffle: function (images, first, last) {
        let j, x, i;
        for (i = images.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = images[i];
            images[i] = images[j];
            images[j] = x;
        }
        if (last == images[0] || first == images[images.length - 1]) return this._shuffle(images, first, last);
        else return images;
    },
	_changeImage: function (carouselImages, random) {
        let self = this;
		let carouselImage = null;
        if (random) {
                this._changeStaticSlides(carouselImages, true);
        } else {
            let index = carouselImages.indexOf(this.lastImage);
            let sendIndex = 0;
            if (index == -1 || index == carouselImages.length - 1) {
				carouselImage = carouselImages[0];
			} else {
				carouselImage = carouselImages[index + 1]; 
				sendIndex = index + 1;
			}
            this.lastImage = carouselImage;
            let isHome = buildfire.getFrameType() == 'LAUNCHER_PLUGIN';
            let storagePlace = (isHome) ? "carouselLastImageHome" : "carouselLastImage";
            buildfire.localStorage.setItem(storagePlace, sendIndex, function(e, r) {
                self._changeStaticSlides(carouselImages);
            });
        }
    },
	_changeStaticSlides: function (carouselImages, random) {
		let activeSlide = document.querySelector('.js_slide.static_slide.active');
		let siblingSlide = activeSlide.nextSibling;
		if (random) {
			let nextSlide = document.querySelectorAll('.js_slide.static_slide')[Math.floor(Math.random() * carouselImages.length)];
			if (nextSlide.children[0].src == activeSlide.children[0].src) {
				this._changeStaticSlides(carouselImages, true);
			} else {
				activeSlide.classList.remove('active');
				nextSlide.classList.add('active');
			}
		} else {
			activeSlide.classList.remove('active');
			if (siblingSlide) {
				siblingSlide.classList.add('active');
			} else {
				document.querySelector('.js_slide.static_slide').classList.add('active');
			}
		}
	},
	_renderStaticSlides: function (carouselImages) {
		let self = this;
		this.selector.innerHTML = '';
		carouselImages.forEach((carouselImage, index) => {
			let slide = document.createElement('div');
			slide.classList.add('js_slide', 'static_slide');
			if (index == 0 && !self.lastImage) {
				slide.classList.add('active');
			} else if (self.lastImage && self.lastImage.iconUrl == carouselImage.iconUrl) {
				slide.classList.add('active');
			}
			slide.addEventListener('click', function () {
				buildfire.actionItems.execute(carouselImage, function (err, result) {
					if (err) {
						console.warn('Error opening slider action: ', err);
					}
				});
			});

			let options = {
				item: carouselImage,
				slide: slide
			}
			self._cropImage(options, (err, result) => {
				if (err)  console.error('Error occurred while cropping image: ', err);
				self.selector.appendChild(slide);
			});
		});
		let activeSlide = document.querySelector('.js_slide.static_slide.active');
		if (!activeSlide) {
			document.querySelector('.js_slide.static_slide').classList.add('active');
		}
	},
	mergeSettings: function (options) {
		var settings = {
			selector: '.js_percentage',
			items: [],
			layout: null,
			speed: 200,
			loop: true,
			autoInterval: 5 * 1000,
			display: 0,
			order: 0
		};
		var userSettings = options;
		for (var attrName in userSettings) {
			settings[attrName] = userSettings[attrName];
		}
		return settings;
	},
	init: function () {
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
				infinite: this.config.items.length > 1 ? 1 : 0,
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
		let self = this;
		let slide = document.createElement('li');
		slide.classList.add('js_slide');

		slide.addEventListener('click', function () {
			if (self.preventClicks) {
				return;
			}
			buildfire.actionItems.execute(item, function (err, result) {
				if (err) {
					console.warn('Error opening slider action: ', err);
				}
			});
		});

		let options = { item, slide }
		this._cropImage(options, (err, result) => {
			if (err)  console.error('Error occurred while cropping image: ', err);
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
			if (this.config.display == 0) {
				this.slideContainer.innerHTML = '';
				this._loadImages(this.config.items, function () {
					if (self.config.items.length > 1 && !self.timerInterval) {
						self.lorySlider = null;
						self._applySlider();
					} else {
						self.lorySlider.setup();
					}
				});
			} else {
				this._renderStaticSlides(this.config.items);
			}
		}
	},
	loadItems: function (items, appendItems) {
		if (appendItems) {
			this.append(items);
		} else {
			let self = this;
			this.config.items = items;
			if (this.config.display == 0) {
				if (this.config.order == 1) {
					this._randomizeArray(items);
				}
				this.slideContainer.innerHTML = '';
				this._loadImages(items, function () {
					if (items.length > 1 && !self.timerInterval) {
						self.lorySlider = null;
						self._applySlider();
					} else if (items.length <= 1 && self.timerInterval) {
						self._destroySlider();
						self.lorySlider = null;
						self._applySlider();
					} else {
						self.lorySlider.setup();
					}
				});
			} else {
				if (buildfire.components.carousel.view.lastCarouselTimer) {
					clearInterval(buildfire.components.carousel.view.lastCarouselTimer);
					buildfire.components.carousel.view.lastCarouselTimer = null;
				}
				this._renderStaticSlides(items);
				if (items.length > 1) {
					buildfire.components.carousel.view.lastCarouselTimer = setInterval(this._changeImage.bind(this), this.config.autoInterval, items, this.config.order);
				}
			}
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
	},
	_cropImage: function(options, callback) {
		let self = this;
		let { item, slide } = options;
		buildfire.imageLib.local.cropImage(item.iconUrl, {
			width: this.width,
			height: this.height,
			aspect: this.aspect,
			size: 'full_width',
		}, function (err, result) {
			if (!err) {
				let image = document.createElement('img');
				let backgroundImage = document.createElement('img');
				image.src = backgroundImage.src = result;
				image.alt = backgroundImage.alt = item.title || '';
				backgroundImage.className = 'blurred-background-image';
				backgroundImage.setAttribute('style', `width: 100% !important; transform: scale(1.2) !important;`);
				slide.style.overflow = 'hidden';
				image.style.transform = 'translateZ(0)';
				if (self.height > 380) {
					slide.appendChild(backgroundImage);
				}
				slide.appendChild(image);
				callback(null, result);
			} else {
				callback(err, null);
			}
		});
	},
	_attachEventListeners: function() {
		let self = this;
		// add event listeners to prevent immediate click event after scrolling 
		this.selector.addEventListener('on.lory.touchmove', function () {
			if (!self.preventClicks) {
				self.preventClicks = true;
			}
		});
		this.selector.addEventListener('on.lory.touchend', function () {
			setTimeout(() => {
				self.preventClicks = false;
			}, 0);
		});
	}
};
