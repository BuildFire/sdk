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
        if (scripts[i].src && (scripts[i].src.toLowerCase().indexOf('buildfire/components/carousellight/carousellight.js') || scripts[i].src.toLowerCase().indexOf('buildfire/components/carousellight/carousellight.min.js'))) {
            carouselScriptSrc = scripts[i].src;
        }
    }

    if (carouselScriptSrc) {
        if (typeof lory == 'undefined') {
            document.write('<script src="' + carouselScriptSrc + '/../../../../lory/lory.min.js"></script>');
        }

        //Add Lory CSS
        var style = document.getElementById("loryInjectedStyle");
        if (style) document.head.removeChild(style);

        style = document.createElement('style');
        style.id = "loryInjectedStyle";
        style.innerHTML += " .loryFrame {position: relative;font-size: 0; line-height: 0; overflow: hidden; white-space: nowrap;}";
        style.innerHTML += " .loryFrame li { position: relative; display: inline-block; height: 100%;}";
        style.innerHTML += " .lorySlides { display: inline-block;}";
        style.innerHTML += " .loryPercentage .lorySlides { display: block; padding: 0px;}";
        style.innerHTML += " .loryPercentage li {  width: 100%;}";

        if (style.innerHTML.length > 0)
            document.head.appendChild(style);
        //# Add Lory CSS
    }
    else {
        throw ("carousellight components not found");
    }
})();

// This is the class that will be used in the mobile
//{selector:selector, items:items, layout:layout, speed:speed}
buildfire.components.carousel.view = function (options) {
    if (options.items && options.items.length > 0) {
        /*
         if more than one image add carousel else add image directly to the carousel container
         */
        this._loadSettings(options, () => {
            this._createCarousel(options);
        });
    } else {
        options.selector.style.display = "none";
    }

};

// Carousel view methods
buildfire.components.carousel.view.prototype = {
    mergeSettings: function (options) {
        // var interval = (!this.control || !this.control.settings || !this.control.settings.speed) ? 5000: this.control.settings.speed;
        // var loopInterval = (!this.control || !this.control.settings || this.control.settings.speed > 0) ? true : false;
        var settings = {
            selector: '.js_percentage',
            items: [],
            layout: null,
            speed: 200,
            // loop: loopInterval,
            // autoInterval: interval
        };
        var userSttings = options;
        for (var attrname in userSttings) {
            if (attrname != "autoInterval" && attrname != "loop")
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
                if (result && result.device && result.device.platform && result.device.platform.toLowerCase() == 'ios' && buildfire.getFrameType() == "LAUNCHER_PLUGIN") {
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
        //if (!this.lorySlider) {
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
        //}

        this._moveTimer();
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
    _getHoverTextStyles: function (callback) {
        var spanStyle, textStyle;
        buildfire.appearance.getAppTheme((err, theme) => {
            let text = "white";
            /*if (!err && theme.colors && theme.colors.backgroundColor)
                background = theme.colors.backgroundColor;
            if (!err && theme.colors && theme.colors.bodyText)
                text = theme.colors.bodyText;*/
            spanStyle = `position: absolute; width:100%;`;
            textStyle = `height:13px; opacity:0.6; font-size:100%; padding:3.5% 2% 3.5% 2%; max-width: 95% !important; display: inline-block; 
            border-radius: 5px; text-overflow: ellipsis; overflow: hidden; color:`+ text + `;`;

            if (this.control.text.alignment == 0) { spanStyle += " text-align:left; left:3%;"; textStyle += " text-align:left;"; }
            else if (this.control.text.alignment == 2) { spanStyle += " text-align:right; right:3%;"; textStyle += " text-align:right;"; }
            else { spanStyle += " text-align:center;"; textStyle += " text-align:center;"; }

            if (this.control.text.position == 0) { spanStyle += " top:calc(2% + 8px);"; textStyle += " background-image:linear-gradient(black, #7f7f7f);" }
            else if (this.control.text.position == 2) { spanStyle += " bottom:calc(2% + 8px);"; textStyle += " background-image:linear-gradient(#7f7f7f, black);" }
            else { spanStyle += " top:calc(50% - 8px);"; textStyle += " background-image:linear-gradient(#7f7f7f, black, #7f7f7f);"; }

            if (!this.control.text.visible) spanStyle += " visibility:hidden;"
            else spanStyle += " visibility:visible;"
            callback({ span: spanStyle, text: textStyle });
        });
    },
    _moveTimer: function () {
        if (this.control.settings.display != 0 || this.control.settings.speed ==0 ) {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }
        if (this.control.settings.display == 0 && this.control.settings.speed !=0 && this.config.items && this.config.items.length > 1) {
            var self = this;
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }

            this.timerInterval = setInterval(function () {
                self.lorySlider.next();
            }, this.control.settings.speed);
        }
    },
    _loadSettings: function (options, callback) {
        let me = this;
        buildfire.datastore.get('carouselSettings', function (err, response) {
            if (err || !response || !response.data || !response.data.text)
                response = {
                    data: {
                        settings: { speed: 5000, order: 0, display: 0 },
                        text: { visible: false, position: 1, alignment: 1 }
                    }
                };
            me.control = response.data;
            callback();
        });
        if (!me.store)
            me.store = buildfire.datastore.onUpdate(function (event) {
                if (event.tag == "carouselSettings") {
                    me.control = event.data;
                    var container = document.getElementsByClassName("textContainer");
                    var text = document.getElementsByClassName("containerText");
                    if (event.data.text.visible) {
                        me._getHoverTextStyles(styles => {
                            for (let el of container) {
                                el.style.visibility = "visible";
                                el.setAttribute("style", styles.span);
                            }
                            for (let el of text)
                                el.setAttribute("style", styles.text);
                        });
                    } else {
                        for (let el of container)
                            el.style.visibility = "hidden";
                    }

                    me.config.autoInterval = me.control.settings.speed;
                    me.config.loop = (me.control.settings.speed > 0);
                    me._createCarousel(me.config);
                    // me._moveTimer();
                } else buildfire.datastore.onUpdate(event);
            }, true);

    },
    _shuffle: function (a, first, last) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        if (last == a[0] || first == a[a.length - 1]) return this._shuffle(a, first, last);
        else return a;
    },
    _setOneImage(image) {
        //add image directly to carousel container without adding the carousel lib
        //append image tag
        var div = document.createElement('div');
        div.setAttribute("style", "white-space:nowrap; position:relative; line-height:0;");
        div.classList.add('js_slide');
        var img = document.createElement('img');
        img.setAttribute("src", buildfire.imageLib.cropImage(image.iconUrl, {
            size: 'full_width',
            aspect: '16:9',
            width: window.innerWidth,
            height: Math.ceil(9 * (window.innerWidth) / 16)
        }));
        img.alt = "Carousel Image";
        this._addTextToItem(image, div);
        div.appendChild(img);
        this.config.selector.appendChild(div);
        div.removeEventListener("click", function () { });
        div.addEventListener("click", function () {
            buildfire.actionItems.execute(image, function (err, result) {
                if (err) {
                    console.warn('Error openning slider action: ', err);
                }
            });
        });
    },
    _randomizeArray: function (sent) {
        let newArray = [...sent];
        this._shuffle(newArray, null, null);
        var dup = Array.from(newArray);
        this._shuffle(dup, null, newArray[newArray.length - 1]); newArray.push(...dup);
        this._shuffle(dup, newArray[0], newArray[newArray.length - 1]); newArray.push(...dup);
        return newArray;
    },
    _changeImage(carouselImages, self, random) {
        var oldState = carouselImages;
        if (random) {
            carouselImages = [carouselImages[Math.floor(Math.random() * carouselImages.length)]];
            if (carouselImages[0] != self.lastImage[0]) {
                self.lastImage = carouselImages;
                self.config.selector.innerHTML = '';
                self._setOneImage(carouselImages[0]);
            } else self._changeImage(oldState, self, random);
        } else {
            var index = carouselImages.indexOf(self.lastImage[0]);
            var sendIndex = 0;
            if (index == -1 || index == carouselImages.length - 1) carouselImages = [carouselImages[0]];
            else { carouselImages = [carouselImages[index + 1]]; sendIndex = index + 1; }
            self.lastImage = carouselImages;
            var isHome = buildfire.getFrameType() === 'LAUNCHER_PLUGIN';
            var storagePlace = (isHome) ? "carouselLastImageHome" : "carouselLastImage";
            buildfire.localStorage.setItem(storagePlace, sendIndex, function (e, r) {
                self.config.selector.innerHTML = '';
                self._setOneImage(carouselImages[0]);
            });
        }

    },
    _setByOrderAndDisplay: function (items) {
        var isHome = buildfire.getFrameType() === 'LAUNCHER_PLUGIN';
        var storagePlace = (isHome) ? "carouselLastImageHome" : "carouselLastImage";
        var self = this;
        if (self.changeTimer) clearInterval(self.changeTimer);
        if (self.control.settings.order == 0 && self.control.settings.display == 1 && items.length > 0) {//order one image
            buildfire.localStorage.getItem(storagePlace, (e, r) => {
                var images = items;
                var sendIndex = 0;
                if (r == null) {
                    items = [items[0]];
                } else {
                    var index = Number(r);
                    if (index == -1 || index == items.length - 1) items = [items[0]];
                    else { items = [items[index + 1]]; sendIndex = index + 1; }
                }
                sendIndex = 1;
                buildfire.localStorage.setItem(storagePlace, sendIndex, function (e, r) {
                    self.lastImage = items;
                    if (self.control.settings.speed != 0) self.changeTimer = setInterval(self._changeImage, self.control.settings.speed, images, self, false);
                });
            });
        } else if (self.control.settings.order == 1 && self.control.settings.display == 1 && items.length > 0) {//random one image
            if (self.control.settings.speed != 0) {
                self.changeTimer = setInterval(self._changeImage, self.control.settings.speed, items, self, true);
            }
            items = [items[Math.floor(Math.random() * items.length)]];
            self.lastImage = items;
            buildfire.localStorage.removeItem(storagePlace);
        }
        else if (self.control.settings.order == 1 && self.control.settings.display == 0 && items.length > 0) {//random,in order
            items = self._randomizeArray(items);
            buildfire.localStorage.removeItem(storagePlace);
        }

        return items;
    },
    _addTextToItem: function (item, slide) {
        this._getHoverTextStyles((styles) => {
            var container = document.createElement("span");
            container.setAttribute("style", styles.span);
            container.classList = "textContainer";
            var text = document.createElement("a");
            text.classList = "containerText";
            text.setAttribute("style", styles.text);
            text.innerHTML = item.title;
            container.appendChild(text);
            slide.appendChild(container);
        });
    },
    _createCarousel: function (options) {
        let itemCopy = [...options.items];
        options.items = this._setByOrderAndDisplay(options.items);
        this.config = this.mergeSettings(options);
        this.config.selector.innerHTML = '';
        if (options.items.length > 1) {
            this._initDimensions(this.config.layout);
            this.init();
        } else {
            this._setOneImage(options.items[0]);
        }
        this.config.items = itemCopy;
        options.selector.style.display = "";
    },
    _appendItem: function (item, callback) {
        var slide = document.createElement("li");
        slide.classList.add('js_slide');
        this._addTextToItem(item, slide);
        slide.addEventListener("click", function () {
            buildfire.actionItems.execute(item, function (err, result) {
                if (err) {
                    console.warn('Error openning slider action: ', err);
                }
            });
        });

        buildfire.imageLib.local.cropImage(item.iconUrl, {
            aspect: this.aspect,
            size: 'full_width',
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
        else if (!(items instanceof Array) && typeof (items) == "object")
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
            this.aspect = '16:9';
        } else if (layout == "Square") {
            this.height = this.width;
            this.aspect = '1:1';
        } else if (layout == "Cinema") {
            this.height = Math.ceil(1 * this.width / 2.39);
            this.aspect = '2.39:1';
        } else if (layout == "MobileScreen") {
            this.height = (window.innerHeight / this.width) * this.width;
            this.width = this.width;
            this.aspect = '9:16';
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
