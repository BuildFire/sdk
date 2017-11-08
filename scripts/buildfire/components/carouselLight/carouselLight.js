'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.carousel) == "undefined")
    buildfire.components.carousel = {};

(function () {
    var scripts = document.getElementsByTagName('script');
    var carouselScriptSrc = null;

    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.toLowerCase().indexOf('buildfire/components/carousellight/carousellight.js')) {
            carouselScriptSrc = scripts[i].src;
        }
    }

    if (carouselScriptSrc) {
        //inject lory script
        var loryScript = document.createElement('script');
        loryScript.src = carouselScriptSrc + '/../../../../lory/lory.min.js';

        //check if callback function exists; this function can be overridden and it's for knowing that lory.js has been loaded
        //this is useful when you are lazy loading  carouselLight.js
        if(typeof _lightCarouselLoaded != "function"){
            var _lightCarouselLoaded = function () {
                console.log('lory.js loaded');
            };
        }

        loryScript.onload = _lightCarouselLoaded;

        console.log(loryScript.src);
        document.head.appendChild(loryScript);

        //inject lory css
        var loryStyle = document.createElement('link');
        loryStyle.href = carouselScriptSrc + '/../../../../lory/lory.css';
        loryStyle.rel = 'stylesheet';
        document.head.appendChild(loryStyle);
    }
    else {
        throw ("carousellight components not found");
    }
})();

// This is the class that will be used in the mobile
//{selector:selector, items:items, layout:layout, speed:speed}
buildfire.components.carousel.view = function (options) {
    if (arguments && arguments.length > 1) {
        options = {selector: arguments[0], items: arguments[1], layout: arguments[2], speed: arguments[3]};
    }
    this.config = this.mergeSettings(options);
    this._initDimensions(this.config.layout);
    this.init();
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
        var userSttings = options;
        for (var attrname in userSttings) {
            settings[attrname] = userSttings[attrname];
        }
        return settings;
    },
    init: function () {
        this.selector = typeof this.config.selector === 'string' ? document.querySelector(this.config.selector) : this.config.selector;

        if (!this.selector) {
            throw ("selecter not found");
            return;
        }

        var self = this;

        function validateLauncherCarousel() {
            buildfire.getContext(function (err, result) {
                if (result && result.device && result.device.platform && result.device.platform.toLowerCase() == 'ios') {
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
        this.lorySlider.destroy();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    _applySlider: function () {
        this.lorySlider = lory(this.config.selector, {
            classNameSlideContainer: this.config.classNameSlideContainer || "js_slides",
            classNameFrame: this.config.classNameFrame || 'js_frame',
            ease: 'ease',
            rewindSpeed: 600,//ms
            slideSpeed: this.config.speed,//ms
            slidesToScroll: this.config.slidesToScroll || 1,
            infinite: this.config.infinite || 1,
            enableMouseEvents: true
        });

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
        var slide = document.createElement("li");
        slide.classList.add('js_slide');

        slide.addEventListener("click", function () {
            buildfire.actionItems.execute(item, function (err, result) {
                if (err) {
                    console.warn('Error openning slider action: ', err);
                }
            });
        });

        buildfire.imageLib.local.cropImage(item.iconUrl, {
            width: this.width,
            height: this.height
        }, function (err, result) {
            if (!err) {
                var image = document.createElement("img");
                image.src = result;
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
        else if (!(items instanceof Array) && typeof(items) == "object")
            items = [items];

        if (items && items instanceof Array && items.length) {
            for (var i = 0; i < items.length; i++) {
                this.items.push(items[i]);
            }

            var self = this;
            this._loadImages(items, function () {
                self._applySlider();
            });
        }
    },
    _initDimensions: function (layout) {
        this.width = window.innerWidth;
        layout = layout || "WideScreen";
        if (layout == "WideScreen") {
            this.height = Math.ceil(9 * this.width / 16);
        } else if (layout == "Square") {
            this.height = this.width;
        } else if (layout == "Cinema") {
            this.height = Math.ceil(1 * this.width / 2.39);
        } else if (layout == "MobileScreen") {
            this.height = (window.innerHeight / this.width) * this.width;
            this.width = this.width;
        }

        this.cssWidth = this.width + "px";
        if (this.height > 380) {
            this.cssHeight = '380px';
        } else {
            this.cssHeight = this.height + "px";
        }

        // Set Min height on carousel so doesn't push content down on load.
        this._minHeight = '180px';
        this._minHeight = this.cssHeight;
    }
};