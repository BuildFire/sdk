if (typeof buildfire == "undefined")
    throw "please add buildfire.js first to use buildfire components";

if (typeof buildfire.components == "undefined") buildfire.components = {};

let _swipeableDrawerState = {
    startingStep: "min",
    header: null,
    footer: null,
    content: null,
    transitionDuration: 125,
    mode: "free",
    minHeight: null,
    maxHeight: null
}

const _swipeableDrawerConstants = {
    topMargin: 135,
    screenHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
    originalHeight: 0,
    originalY: 0,
    originalMouseY: 0,
    upperMargin: 115
}

const _swipeableDrawerElements = {
    drawerContainer: document.querySelector('.swipeable-drawer'),
    drawerHeaderContent: document.querySelector('.swipeable-drawer-header'),
    drawerContent: document.querySelector('.swipeable-drawer-content'),
    drawerFooter: document.querySelector('.swipeable-drawer-footer')
}

const _swipeableDrawerUtils = {
    calcBottomMargin: () => {
        const headerHasOptions = _swipeableDrawerState.header && _swipeableDrawerState.header.length;

        let maxHeight = _swipeableDrawerConstants.screenHeight - _swipeableDrawerConstants.topMargin;
        let minHeight = _swipeableDrawerState.minHeight && _swipeableDrawerState.minHeight > maxHeight ? maxHeight : _swipeableDrawerState.minHeight
        let margin = minHeight ? minHeight : 54;
        if (headerHasOptions) {
            margin = minHeight ? minHeight : 90;
        } else if (!headerHasOptions && document.querySelector('html').getAttribute('safe-area') === 'true') {
            margin = minHeight ? minHeight : 70;
        }
        return margin;
    },
    calcMiddlePosition: () => {
        let defaultMaximumHeight = _swipeableDrawerConstants.screenHeight - _swipeableDrawerConstants.topMargin;
        if (!_swipeableDrawerState.minHeight && !_swipeableDrawerState.maxHeight)
            return (_swipeableDrawerConstants.screenHeight / 2);
        if (!_swipeableDrawerState.minHeight && _swipeableDrawerState.maxHeight) {
            return (_swipeableDrawerState.defaultMaximumHeight / 2);
        }
        if (_swipeableDrawerState.minHeight && !_swipeableDrawerState.maxHeight) {
            return Math.round((defaultMaximumHeight + _swipeableDrawerState.minHeight) / 2);
        }
        if (_swipeableDrawerState.minHeight && _swipeableDrawerState.maxHeight) {
            return Math.round((_swipeableDrawerState.maxHeight + _swipeableDrawerState.minHeight) / 2);
        }
    },
    calcPositions: () => {
        let maxHeight = _swipeableDrawerConstants.screenHeight - _swipeableDrawerConstants.topMargin;
        return {
            max: _swipeableDrawerState.maxHeight ? _swipeableDrawerState.maxHeight > maxHeight ? maxHeight : _swipeableDrawerState.maxHeight : maxHeight,
            mid: _swipeableDrawerUtils.calcMiddlePosition(),
            min: _swipeableDrawerUtils.calcBottomMargin()
        };
    },
    reset: () => {
        const position = _swipeableDrawerState.startingStep;
        const positions = _swipeableDrawerUtils.calcPositions();
        _swipeableDrawerElements.drawerContainer.style.height = `${position ? positions[position] : positions.mid}px`;
        _swipeableDrawerElements.drawerContainer.style.top = `${_swipeableDrawerConstants.screenHeight - (position ? positions[position] : positions.mid)}px`;
    },
    setContent: (element, content, append = false) => {
        if (typeof content === 'object') {
            append ? element.innerHTML += content.innerHTML : element.innerHTML = content.innerHTML;
        }
        else if (typeof content === 'string')
            append ? element.innerHTML += content : element.innerHTML = content;
    },
    adjustDrawer: (e) => {
        let targetTop;
        let targetHeight;
        const positions = _swipeableDrawerUtils.calcPositions();
        const pageY = e.pageY || e.changedTouches[0]?.pageY;
        const pointsToExpanded = Math.abs(positions.max - (_swipeableDrawerConstants.screenHeight - pageY));
        const pointsToHalfExpanded = Math.abs(positions.mid - (_swipeableDrawerConstants.screenHeight - pageY));
        const pointsToCollapsed = Math.abs(positions.min - (_swipeableDrawerConstants.screenHeight - pageY));
        let positionToAdjust = null;
        if (pageY > _swipeableDrawerConstants.originalMouseY) {
            if (pointsToHalfExpanded > pointsToCollapsed) {
                targetHeight = positions.min;
                targetTop = _swipeableDrawerConstants.screenHeight - positions.min;
                positionToAdjust = "min";
            } else {
                targetHeight = positions.mid;
                targetTop = _swipeableDrawerConstants.screenHeight - positions.mid;
                positionToAdjust = "mid";
            }
        } else if (pageY < _swipeableDrawerConstants.originalMouseY) {
            if (pointsToExpanded > pointsToHalfExpanded) {
                targetHeight = positions.mid;
                targetTop = _swipeableDrawerConstants.screenHeight - positions.mid;
                positionToAdjust = "mid";
            } else {
                targetHeight = positions.max;
                targetTop = _swipeableDrawerConstants.screenHeight - positions.max;
                positionToAdjust = "max";
            }
        }


        _swipeableDrawerElements.drawerContainer.style.height = `${targetHeight}px`;
        _swipeableDrawerElements.drawerContainer.style.top = `${targetTop}px`;

        if (positionToAdjust && buildfire.components.swipeableDrawer.onStepChange) {
            _swipeableDrawerElements.drawerContainer.classList.remove("swipeable-drawer-min");
            _swipeableDrawerElements.drawerContainer.classList.remove("swipeable-drawer-mid");
            _swipeableDrawerElements.drawerContainer.classList.remove("swipeable-drawer-max");
            _swipeableDrawerElements.drawerContainer.classList.add(`swipeable-drawer-${positionToAdjust}`);

            buildfire.components.swipeableDrawer.onStepChange(positionToAdjust);
        }

    },
    resize: (e) => {
        const pageY = e.pageY || e.changedTouches[0]?.pageY;
        const height = _swipeableDrawerConstants.originalHeight - (pageY - _swipeableDrawerConstants.originalMouseY);
        const lowerMargin = _swipeableDrawerUtils.calcBottomMargin();
        if (height > lowerMargin && height < (_swipeableDrawerConstants.screenHeight - _swipeableDrawerConstants.upperMargin)) {
            _swipeableDrawerElements.drawerContainer.style.height = `${height}px`;
            _swipeableDrawerElements.drawerContainer.style.top = `${_swipeableDrawerConstants.originalY + (pageY - _swipeableDrawerConstants.originalMouseY)}px`;
        }
    },
    createUIElement: (...args) => {
        let elem = document.createElement(args[0]);
        elem.className = args[1];
        return elem;
    },
    isDraggableElement: (tag) => {
        if (tag === "SELECT" || tag === "TEXTAREA" || tag === "INPUT" || tag === "BUTTON" || tag === "A") {
            return true;
        }
        return false;
    },
    findParentNode: (el, tag) => {
        while (el.parentNode) {
            if (el && el.classList && el.classList.contains(tag)) {
                return el;
            }

            el = el.parentNode;
            if (el && el.classList && el.classList.contains(tag)) {
                return el;
            }
        }
        return null;
    },
    buildDrawer: () => {
        let drawerDiv = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer"),
            drawerHeader = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer-header"),
            drawerHeaderContent = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer-header-content"),
            resizerHolder = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer-resizer-container"),
            resizer = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer-resizer"),
            drawerContent = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer-content"),
            drawerFooter = _swipeableDrawerUtils.createUIElement("div", "swipeable-drawer-footer");

        _swipeableDrawerState.header ? _swipeableDrawerUtils.setContent(drawerHeaderContent, _swipeableDrawerState.header) : drawerHeaderContent.classList.add("swipeable-drawer-hidden");;
        _swipeableDrawerState.content ? _swipeableDrawerUtils.setContent(drawerContent, _swipeableDrawerState.content) : drawerContent.classList.add("swipeable-drawer-hidden");
        _swipeableDrawerState.footer ? _swipeableDrawerUtils.setContent(drawerFooter, _swipeableDrawerState.footer) : drawerFooter.classList.add("swipeable-drawer-hidden");

        resizerHolder.appendChild(resizer);
        drawerHeader.insertBefore(resizerHolder, drawerHeader.firstChild);
        drawerHeader.appendChild(drawerHeaderContent);

        drawerDiv.appendChild(drawerHeader);
        drawerDiv.appendChild(drawerContent);
        drawerDiv.appendChild(drawerFooter);

        document.body.appendChild(drawerDiv);

        drawerDiv.classList.add("backgroundColorTheme");
        drawerDiv.classList.add("bodyTextTheme");

        _swipeableDrawerElements.drawerContainer = drawerDiv;
        _swipeableDrawerElements.drawerHeaderContent = drawerHeaderContent;
        _swipeableDrawerElements.drawerContent = drawerContent;
        _swipeableDrawerElements.drawerFooter = drawerFooter;
        _swipeableDrawerElements.drawerContainer.style.transition = `all ${_swipeableDrawerState.transitionDuration}ms`;

        _swipeableDrawerUtils.reset();
    }
}

const _swipeableDrawerEvents = {
    stopResize: (e) => {
        e.preventDefault();
        document.removeEventListener('mousemove', _swipeableDrawerUtils.resize);
        document.removeEventListener('mouseup', _swipeableDrawerEvents.stopResize);
        if (_swipeableDrawerState.mode !== "free")
            _swipeableDrawerUtils.adjustDrawer(e);
    },
    stopTouchResize: (e) => {
        e.preventDefault();
        document.removeEventListener('touchmove', _swipeableDrawerUtils.resize);
        document.removeEventListener('touchend', _swipeableDrawerEvents.stopTouchResize);
        if (_swipeableDrawerState.mode !== "free")
            _swipeableDrawerUtils.adjustDrawer(e);
    },
    initialize: () => {
        _swipeableDrawerElements.drawerContainer.addEventListener('mousedown', (e) => {
            if (_swipeableDrawerUtils.isDraggableElement(e.target.tagName)) return;

            _swipeableDrawerConstants.originalHeight = parseFloat(getComputedStyle(_swipeableDrawerElements.drawerContainer, null).getPropertyValue('height').replace('px', ''));
            _swipeableDrawerConstants.originalY = _swipeableDrawerElements.drawerContainer.getBoundingClientRect().top;
            _swipeableDrawerConstants.originalMouseY = e.pageY || e.changedTouches[0]?.pageY;
            document.addEventListener('mousemove', _swipeableDrawerUtils.resize);
            document.addEventListener('mouseup', _swipeableDrawerEvents.stopResize);
        });

        document.addEventListener('touchstart', (e) => {
            if (!_swipeableDrawerUtils.findParentNode(e.target, "swipeable-drawer-header")) return;

            _swipeableDrawerConstants.originalHeight = parseFloat(getComputedStyle(_swipeableDrawerElements.drawerContainer, null).getPropertyValue('height').replace('px', ''));
            _swipeableDrawerConstants.originalY = _swipeableDrawerElements.drawerContainer.getBoundingClientRect().top;
            _swipeableDrawerConstants.originalMouseY = e.pageY || e.changedTouches[0]?.pageY;
            document.addEventListener('touchmove', _swipeableDrawerUtils.resize);
            document.addEventListener('touchend', _swipeableDrawerEvents.stopTouchResize);
        });
    },
    destroy: () => {
        _swipeableDrawerElements.drawerContainer.removeEventListener('mousedown', () => { });
        document.removeEventListener('mousemove', () => { });
        document.removeEventListener('mouseup', () => { });

        document.removeEventListener('touchstart', () => { });
        document.removeEventListener('touchmove', () => { });
        document.removeEventListener('touchend', () => { });
    }
}

buildfire.components.swipeableDrawer = {
    initialize(options, callback) {
        _swipeableDrawerState = options ? Object.assign(_swipeableDrawerState, options) : _swipeableDrawerState;
        if (_swipeableDrawerElements.drawerContainer) {
            this.destroy();
        }
        _swipeableDrawerConstants.screenHeight =  window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
        _swipeableDrawerUtils.buildDrawer();
        _swipeableDrawerEvents.initialize();
        callback();
    },
    setBodyContent(content) {
        _swipeableDrawerState.content = content;
        _swipeableDrawerElements.drawerContent.classList.remove("swipeable-drawer-hidden");
        _swipeableDrawerUtils.setContent(_swipeableDrawerElements.drawerContent, content);
    },
    appendBodyContent(content) {
        _swipeableDrawerUtils.setContent(_swipeableDrawerElements.drawerContent, content, true);
    },
    clearBodyContent() {
        _swipeableDrawerElements.drawerContent.innerHTML = "";
    },
    setHeaderContent(content) {
        _swipeableDrawerState.header = content;
        _swipeableDrawerElements.drawerHeaderContent.classList.remove("swipeable-drawer-hidden");
        _swipeableDrawerUtils.setContent(_swipeableDrawerElements.drawerHeaderContent, content);
        if (_swipeableDrawerState.startingStep === "min")
            _swipeableDrawerUtils.reset();
    },
    setFooterContent(content) {
        _swipeableDrawerState.footer = content;
        _swipeableDrawerElements.drawerFooter.classList.remove("swipeable-drawer-hidden");
        _swipeableDrawerUtils.setContent(_swipeableDrawerElements.drawerFooter, content);
    },
    setStep(step) {
        _swipeableDrawerState.startingStep = step;
        _swipeableDrawerUtils.reset();
    },
    show() {
        _swipeableDrawerEvents.initialize();
        _swipeableDrawerElements.drawerContainer.classList.remove("swipeable-drawer-hidden");
    },
    hide() {
        _swipeableDrawerElements.drawerContainer.classList.add("swipeable-drawer-hidden");
    },
    destroy() {
        _swipeableDrawerEvents.destroy();
        _swipeableDrawerElements.drawerContainer.remove();
    },
    onStepChange() { }
};