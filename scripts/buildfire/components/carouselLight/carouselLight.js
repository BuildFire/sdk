'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.carousel) == "undefined")
    buildfire.components.carousel = {};

var myObjects = new Array();
var defaultCarousel = {
    settings: { speed: 5000, order: 0, display: 0 },
    text: { visible: false, background: true, fontSize: 24, position: 1, alignment: 1 },
};
var defaultCarouselImages = [{
    "action": "noAction",
    "iconUrl": "http://buildfire.imgix.net/b55ee984-a8e8-11e5-88d3-124798dea82d/7ef5f050-134f-11e6-bd0b-2511d1715baa.jpeg",
    "title": "image"
}, {
    "action": "noAction",
    "iconUrl": "http://buildfire.imgix.net/b55ee984-a8e8-11e5-88d3-124798dea82d/7e028fa0-134f-11e6-b7ce-51a0b9ba84fd.jpg",
    "title": "image"
}];

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

    setInterval(function () {
        myObjects.forEach(el => {
            if (el.control && el.control.settings.display == 0 && el.config && el.config.items && el.config.items.length > 1)
                if (el.control.settings.speed > 0) {
                    el.on = el.on + 1;
                    if ((el.on * 1000) >= el.control.settings.speed) {
                        el.on = 0;
                        if (el.lorySlider)
                            el.lorySlider.next();
                    }
                }
        });
    }, 1000);
})();

// This is the class that will be used in the mobile
//{selector:selector, items:items, layout:layout, speed:speed}
buildfire.components.carousel.view = function (options) {
    if (typeof options.name === "string") {
        if (/^[a-zA-Z]+$/.test(options.name)) {
            if (options.name.length < 20)
                this.name = options.name;
            else throw "Carousel name is too long!";
        } else throw "Carousel name must contain only letters!";
    };
    this._loadSettings(options, () => {
        let send = this;
        if (options.items && options.items.length > 0) {
            this._createCarousel(options);
        }
        if (send.selector) {
            send.on = 0;
            myObjects = myObjects.filter(e => e.selector !== options.selector).map(el => { el.on = 0; return el; });
            myObjects.push(send);
        }
    });

};

// Carousel view methods
buildfire.components.carousel.view.prototype = {
    mergeSettings: function (options) {
        var settings = {
            selector: '.js_percentage',
            items: [],
            layout: null,
            speed: defaultCarousel.settings.speed,
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
        this.lorySlider = lory(this.config.selector, {
            classNameSlideContainer: this.config.classNameSlideContainer || "js_slides",
            classNameFrame: this.config.classNameFrame || 'js_frame',
            ease: 'ease',
            rewindSpeed: 600,//ms
            slideSpeed: 200,//ms
            slidesToScroll: this.config.slidesToScroll || 1,
            infinite: this.config.infinite || 1,
            enableMouseEvents: true
        });
    },
    _renderHTMLItems: function (callback) {
        var self = this;

        if (this.selector)
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
        var background, gradient, spanStyle, textStyle;
        background = { position: "absolute", width: "100%", height: "100%" };
        spanStyle = { position: "absolute", width: "100%" };
        textStyle = {
            height: (this.control.text.fontSize) + "px", width: "95%", padding: (this.control.text.fontSize / 1.5) + "px 2% " + (this.control.text.fontSize / 1.5) + "px 2%", maxWidth: "95% !important"
            , display: "inline-block", borderRadius: "5px", textOverflow: "ellipsis", overflow: "hidden", color: "white", fontSize: this.control.text.fontSize + "px"
        };

        if (this.control.text.alignment == 0) { spanStyle.textAlign = "left"; spanStyle.left = "3%"; textStyle.textAlign = "left"; }
        else if (this.control.text.alignment == 2) { spanStyle.textAlign = "right"; spanStyle.right = "3%"; textStyle.textAlign = "right"; }
        else { spanStyle.textAlign = "center"; textStyle.textAlign = "center"; }

        if (this.control.text.position == 0) {
            spanStyle.top = "calc(2% + 8px)";
            gradient = " background-image:linear-gradient(to top,rgba(255,0,0,0), black);background-image:-webkit-linear-gradient(to top,rgba(255,0,0,0), black);background-image:-moz-linear-gradient(to top,rgba(255,0,0,0), black);background-image:-o-linear-gradient(to top,rgba(255,0,0,0), black);"
        }
        else if (this.control.text.position == 2) {
            spanStyle.bottom = "calc(2% + 8px)";
            gradient = " background-image:linear-gradient(to bottom,rgba(255,0,0,0), black);background-image:-webkit-linear-gradient(to bottom,rgba(255,0,0,0), black);background-image:-moz-linear-gradient(to bottom,rgba(255,0,0,0), black);background-image:-o-linear-gradient(to bottom,rgba(255,0,0,0), black);"
        }
        else {
            spanStyle.top = "calc(50% - " + (this.control.text.fontSize / 1.5) + "px)";
            background.backgroundColor = "rgba(0,0,0,0.5)";
        }

        if (!this.control.text.visible) background.visibility = "hidden";
        else background.visibility = "visible";

        if (!this.control.text.background) background.background = "none";
        callback({ background: background, gradient: gradient, span: spanStyle, text: textStyle });
    },
    _loadSettings: function (options, callback) {
        var me = this;
        var filter, saving = false;
        if ((!options.name || 0 === options.name.length)) filter = {};
        else { filter = { filter: { "$json.name": options.name } }; saving = true; }
        buildfire.datastore.search(filter, 'carouselSettings', function (err, response) {
            var first = response[0];
            if (err || !first || !first.data || !first.data.text) {
                buildfire.datastore.getWithDynamicData((err, obj) => {
                    if (err || !obj || !obj.data || !obj.data.content) {
                        first = {
                            data: defaultCarousel
                        };
                    } else {
                        first = {
                            data: {
                                settings: {
                                    speed: (!obj.data.content.speed) ? defaultCarousel.settings.speed : obj.data.content.speed,
                                    order: (!obj.data.content.order) ? defaultCarousel.settings.order : obj.data.content.order,
                                    display: (!obj.data.content.display) ? defaultCarousel.settings.display : obj.data.content.display
                                },
                                text: defaultCarousel.text
                            }
                        };
                    }
                    if (first && first.data && first.data.items && saving) options.items = first.data.items;
                    else if (saving) {
                        first.data.items = defaultCarouselImages;
                        options.items = first.data.items;
                    }
                    me.control = first.data;
                    callback();
                });
            } else {
                if (first && first.data && first.data.items && saving) options.items = first.data.items;
                me.control = first.data;
                callback();
            }
        });
        if (!me.store)
            me.store = buildfire.datastore.onUpdate(function (event) {
                if (event.tag == "carouselSettings" && (event.data.name == me.name || me.name.length == 0)) {
                    me.control = event.data;
                    let textBCRS = "textBCRS" + ((me.name) ? me.name : ""),
                        textCCRS = "textCCRS" + ((me.name) ? me.name : ""),
                        containerTCRS = "containerTCRS" + ((me.name) ? me.name : "");
                    var background = document.getElementsByClassName(textBCRS);
                    var container = document.getElementsByClassName(textCCRS);
                    var text = document.getElementsByClassName(containerTCRS);
                    if (event.data.text.visible) {
                        me._getHoverTextStyles(styles => {
                            for (let el of background) {
                                el.setAttribute("style", styles.gradient);
                                Object.assign(el.style, styles.background);
                            }
                            for (let el of container) {
                                el.style.visibility = "visible";
                                Object.assign(el.style, styles.span);
                            }
                            for (let el of text)
                                Object.assign(el.style, styles.text);
                        });
                    } else {
                        for (let el of background)
                            el.style.visibility = "hidden";
                    }
                    if (me.name && me.name.length != 0) {
                        if (event.data && event.data.items && me.name && me.name.length != 0 && me.config) me.config.items = event.data.items;
                        if (me.config) me.config.selector.innerHTML = "";
                        if ((me.name && me.name.length != 0 && event.data.items && event.data.items.length > 0) || (!me.name || me.name.length == 0)) {
                            if (me.config) {
                                me.config.selector.style.display = "block";
                                me._createCarousel(me.config);
                            }
                        } else {
                            if (me.config) {
                                me.config.items = [];
                                me.config.selector.style.display = "none";
                            }
                        }
                    }
                    myObjects = myObjects.filter(e => e.selector !== me.config.selector).map(el => { el.on = 0; return el; });
                    myObjects.push(me);
                }
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
            var storagePlace = (isHome) ? "carouselLastImageHome" + ((self.name) ? self.name : "") : "carouselLastImage" + ((self.name) ? self.name : "");
            buildfire.localStorage.setItem(storagePlace, sendIndex, function (e, r) {
                self.config.selector.innerHTML = '';
                self._setOneImage(carouselImages[0]);
            });
        }

    },
    _setByOrderAndDisplay: function (items) {
        var isHome = buildfire.getFrameType() === 'LAUNCHER_PLUGIN';
        var storagePlace = (isHome) ? "carouselLastImageHome" + ((this.name) ? this.name : "") : "carouselLastImage" + ((this.name) ? this.name : "");
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
        var me = this;
        this._getHoverTextStyles((styles) => {
            var background = document.createElement("span");
            let textBCRS = "textBCRS" + ((me.control.name) ? me.control.name : ""),
                textCCRS = "textCCRS" + ((me.control.name) ? me.control.name : ""),
                containerTCRS = "containerTCRS" + ((me.control.name) ? me.control.name : "");
            background.setAttribute("style", styles.gradient);
            Object.assign(background.style, styles.background);
            background.classList = textBCRS;
            var container = document.createElement("span");
            Object.assign(container.style, styles.span);
            container.classList = textCCRS;
            var text = document.createElement("a");
            text.classList = containerTCRS;
            Object.assign(text.style, styles.text);
            text.innerHTML = item.title;
            container.appendChild(text);
            background.appendChild(container);
            slide.appendChild(background);
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
        } else if (options.items.length == 1) {
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
