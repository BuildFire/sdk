if (typeof buildfire == "undefined")
    throw "please add buildfire.js first to use buildfire components";

if (typeof buildfire.components == "undefined") buildfire.components = {};

buildfire.components.swipeableDrawer = {};

class SwipeableDrawer {
    constructor(options = {}) {
        this.options = {
            startingStep: "min",
            header: null,
            footer: null,
            content: null,
            transitionDuration: 300,
            mode: "free"
        }

        this.options = options ? Object.assign(this.options, options) : this.options;
        this.initialize();
    }
    _helpers = {
        topMargin: 135,
        calcBottomMargin: () => {
            const headerHasOptions = this.options.header && this.options.header.length;
            let margin = 54;
            if (headerHasOptions) {
                margin = 90;
            } else if (!headerHasOptions && document.querySelector('html').getAttribute('safe-area') === 'true') {
                margin = 70;
            }
            return margin;
        },
        calcPositions: () => {
            const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            return {
                max: screenHeight - this._helpers.topMargin,
                mid: (screenHeight / 2),
                min: this._helpers.calcBottomMargin()
            };
        },
        reset: () => {
            const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            const position = this.options.startingStep;
            const positions = this._helpers.calcPositions();
            const positionToAdjust = position ? position === "min" && !this.options.header ? positions[position] - 50 : positions[position] : positions.mid
            this._utils.drawerContainer.style.height = `${position ? positions[position] : positions.mid}px`;
            this._utils.drawerContainer.style.top = `${screenHeight - (positionToAdjust)}px`;
        },
        createUIElement: (...args) => {
            let elem = document.createElement(args[0]);
            elem.className = args[1];
            return elem;
        },
        checkHTMLTag: (tag) => {
            if (tag === "SELECT" || tag === "TEXTAREA" || tag === "INPUT" || tag === "BUTTON" || tag === "A") {
                return true;
            }
            return false;
        }
    };
    _utils = {
        drawerContainer: document.querySelector('.swipeable-drawer'),
        drawerHeader: document.querySelector('.swipeable-drawer-header'),
        drawerContent: document.querySelector('.swipeable-drawer-content'),
        drawerFooter: document.querySelector('.swipeable-drawer-content'),
        screenHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
        originalHeight: 0,
        originalY: 0,
        originalMouseY: 0,
        upperMargin: 115,
        adjustDrawer: (e) => {
            let targetTop;
            let targetHeight;
            const positions = this._helpers.calcPositions();
            const pageY = e.pageY || e.changedTouches[0]?.pageY;
            const pointsToExpanded = Math.abs(positions.max - (this._utils.screenHeight - pageY));
            const pointsToHalfExpanded = Math.abs(positions.mid - (this._utils.screenHeight - pageY));
            const pointsToCollapsed = Math.abs(positions.min - (this._utils.screenHeight - pageY));
            let positionToAdjust = null;
            if (pageY > this._utils.originalMouseY) {
                if (pointsToHalfExpanded > pointsToCollapsed) {
                    targetHeight = positions.min;
                    targetTop = this.options.header ? (this._utils.screenHeight - positions.min) : (this._utils.screenHeight - positions.min) + 50;
                    positionToAdjust = "min";
                } else {
                    targetHeight = positions.mid;
                    targetTop = this._utils.screenHeight - positions.mid;
                    positionToAdjust = "mid";
                }
            } else if (pageY < this._utils.originalMouseY) {
                if (pointsToExpanded > pointsToHalfExpanded) {
                    targetHeight = positions.mid;
                    targetTop = this._utils.screenHeight - positions.mid;
                    positionToAdjust = "mid";
                } else {
                    targetHeight = positions.max;
                    targetTop = this._utils.screenHeight - positions.max;
                    positionToAdjust = "max";
                }
            }

            this._utils.drawerContainer.className = `swipeable-drawer swipeable-drawer-${positionToAdjust}`;
            this._utils.drawerContainer.style.height = `${targetHeight}px`;
            this._utils.drawerContainer.style.top = `${targetTop}px`;

            buildfire.components.swipeableDrawer.onStepChange(positionToAdjust);
        },
        resize: (e) => {
            const pageY = e.pageY || e.changedTouches[0]?.pageY;
            const height = this._utils.originalHeight - (pageY - this._utils.originalMouseY);
            const lowerMargin = this._helpers.calcBottomMargin();
            if (height > lowerMargin && height < (this._utils.screenHeight - this._utils.upperMargin)) {
                this._utils.drawerContainer.style.height = `${height}px`;
                this._utils.drawerContainer.style.top = `${this._utils.originalY + (pageY - this._utils.originalMouseY)}px`;
            }
        },
        buildDrawer: () => {
            let drawerDiv = this._helpers.createUIElement("div", "swipeable-drawer"),
                drawerHeader = this._helpers.createUIElement("div", "swipeable-drawer-header"),
                drawerHeaderContent = this._helpers.createUIElement("div", "swipeable-drawer-header-content"),
                resizer = this._helpers.createUIElement("div", "swipeable-drawer-resizer"),
                drawerContent = this._helpers.createUIElement("div", "swipeable-drawer-content"),
                drawerFooter = this._helpers.createUIElement("div", "swipeable-drawer-footer");

            this.options.header ? this._utils.setContent(drawerHeaderContent, this.options.header) : drawerHeaderContent.classList.add("swipeable-drawer-hidden");;
            this.options.content ? this._utils.setContent(drawerContent, this.options.content) : drawerContent.classList.add("swipeable-drawer-hidden");
            this.options.footer ? this._utils.setContent(drawerFooter, this.options.footer) : drawerFooter.classList.add("swipeable-drawer-hidden");

            drawerHeader.insertBefore(resizer, drawerHeader.firstChild);
            drawerHeader.appendChild(drawerHeaderContent);

            drawerDiv.appendChild(drawerHeader);
            drawerDiv.appendChild(drawerContent);
            drawerDiv.appendChild(drawerFooter);

            document.body.appendChild(drawerDiv);

            this._utils.drawerContainer = drawerDiv;
            this._utils.drawerHeaderContent = drawerHeaderContent;
            this._utils.drawerContent = drawerContent;
            this._utils.drawerFooter = drawerFooter;
            this._utils.drawerContainer.style.transition = `all ${this.options.transitionDuration}ms`;

            this._helpers.reset();
        },
        setContent: (element, content, append = false) => {
            if (typeof content === 'object') {
                append ? element.innerHTML += content.innerHTML : element.innerHTML = content.innerHTML;
            }
            else if (typeof content === 'string')
                append ? element.innerHTML += content : element.innerHTML = content;
        }
    }

    _events = {
        stopResize: (e) => {
            e.preventDefault();
            document.removeEventListener('mousemove', this._utils.resize);
            document.removeEventListener('mouseup', this._events.stopResize);
            if (this.options.mode !== "free")
                this._utils.adjustDrawer(e);
        },
        stopTouchResize: (e) => {
            e.preventDefault();
            document.removeEventListener('touchmove', this._utils.resize);
            document.removeEventListener('touchend', this._events.stopTouchResize);
            if (this.options.mode !== "free")
                this._utils.adjustDrawer(e);
        },
        initialize: () => {
            this._utils.drawerContainer.addEventListener('mousedown', (e) => {
                if (this._helpers.checkHTMLTag(e.target.tagName)) return;
                this._utils.originalHeight = parseFloat(getComputedStyle(this._utils.drawerContainer, null).getPropertyValue('height').replace('px', ''));
                this._utils.originalY = this._utils.drawerContainer.getBoundingClientRect().top;
                this._utils.originalMouseY = e.pageY || e.changedTouches[0]?.pageY;
                document.addEventListener('mousemove', this._utils.resize);
                document.addEventListener('mouseup', this._events.stopResize);
            });

            document.addEventListener('touchstart', (e) => {
                this._utils.originalHeight = parseFloat(getComputedStyle(this._utils.drawerContainer, null).getPropertyValue('height').replace('px', ''));
                this._utils.originalY = this._utils.drawerContainer.getBoundingClientRect().top;
                this._utils.originalMouseY = e.pageY || e.changedTouches[0]?.pageY;
                document.addEventListener('touchmove', this._utils.resize);
                document.addEventListener('touchend', this._events.stopTouchResize);
            });
        },
        destroy: () => {
            this._utils.drawerContainer.removeEventListener('mousedown', () => { });
            document.removeEventListener('mousemove', () => { });
            document.removeEventListener('mouseup', () => { });

            document.removeEventListener('touchstart', () => { });
            document.removeEventListener('touchmove', () => { });
            document.removeEventListener('touchend', () => { });
        }
    }

    initialize() {
        this._utils.buildDrawer();
        this._events.initialize();
    };

    setBodyContent(content) {
        this.options.content = content;
        this._utils.drawerContent.classList.remove("swipeable-drawer-hidden");
        this._utils.setContent(this._utils.drawerContent, content);
    }
    appendBodyContent(content) {
        this._utils.setContent(this._utils.drawerContent, content, true);
    }
    clearBodyContent() {
        this._utils.drawerContent.innerHTML = "";
    }

    setHeaderContent(content) {
        this.options.header = content;
        this._utils.drawerHeaderContent.classList.remove("swipeable-drawer-hidden");
        this._utils.setContent(this._utils.drawerHeaderContent, content);
        if (this.options.startingStep === "min")
            this._helpers.reset();
    }
    setFooterContent(content) {
        this.options.footer = content;
        this._utils.drawerFooter.classList.remove("swipeable-drawer-hidden");
        this._utils.setContent(this._utils.drawerFooter, content);
    }

    setStep(step) {
        this.options.startingStep = step;
        this._helpers.reset();
    }

    show() {
        this._utils.drawerContainer.classList.remove("swipeable-drawer-hidden");
    }
    hide() {
        this._utils.drawerContainer.classList.add("swipeable-drawer-hidden");
    }

    destroy() {
        this._events.destroy();
        this._utils.drawerContainer.remove();
    }

    onStepChange() {}
}

buildfire.components.swipeableDrawer.initialize = (options = {}, callback = null) => {
    if (buildfire.components.swipeableDrawer._manager)
        buildfire.components.swipeableDrawer._manager.destroy();

    buildfire.components.swipeableDrawer._manager = new SwipeableDrawer(options);
    callback();
};
buildfire.components.swipeableDrawer.setBodyContent = (content) => {
    buildfire.components.swipeableDrawer._manager.setBodyContent(content);
};
buildfire.components.swipeableDrawer.appendBodyContent = (content) => {
    buildfire.components.swipeableDrawer._manager.appendBodyContent(content);
};
buildfire.components.swipeableDrawer.clearBodyContent = (content) => {
    buildfire.components.swipeableDrawer._manager.clearBodyContent(content);
};
buildfire.components.swipeableDrawer.setHeaderContent = (content) => {
    buildfire.components.swipeableDrawer._manager.setHeaderContent(content);
};
buildfire.components.swipeableDrawer.setFooterContent = (content) => {
    buildfire.components.swipeableDrawer._manager.setFooterContent(content);
};
buildfire.components.swipeableDrawer.setStep = (step) => {
    buildfire.components.swipeableDrawer._manager.setStep(step);
};
buildfire.components.swipeableDrawer.show = () => {
    buildfire.components.swipeableDrawer._manager.show();
};
buildfire.components.swipeableDrawer.hide = () => {
    buildfire.components.swipeableDrawer._manager.hide();
};
buildfire.components.swipeableDrawer.destroy = () => {
    buildfire.components.swipeableDrawer._manager.destroy();
};