if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};


function ContentSliderStateManager() {
    this.currentIndex = 0;
}

buildfire.components.contentSlider = class ContentSlider {
    constructor(selector, options = {}) {
        if (!document.querySelector(selector)) throw new Error('Element not found!');

        this.selector = document.querySelector(selector);
        this.options = {
            settings: {
                showSubtitle: true,
                startingIndex: 0
            }
        };
        this.options.settings = options.settings ? Object.assign(this.options.settings, options.settings) : this.options.settings;

        if (options.items && options.items.length)
            this.items = options.items;
        else throw new Error('Items must be provided!');

        this._state = new ContentSliderStateManager();
        this._state.currentIndex = this.options.settings.startingIndex;
        this.init();
    }
    //================================================================================================            
    init() {
        this.selector.classList.add('content-slider-container');
        this._renderSlider(this.items[this.options.settings.startingIndex]);
    }

    _renderSlider(item = null) {
        let container = this.selector,
            leftArrow = this._createUIElement('i', 'bf-chevron-left'),
            rightArrow = this._createUIElement('i', 'bf-chevron-right'),
            sliderTitleHolder = this._createUIElement('div', 'content-slider-title');

        leftArrow.onclick = () => {
            let previousItem = this.previous();
            previousItem ? this.onPreviousClick({ item: previousItem }) : null;
        };

        rightArrow.onclick = () => {
            let nextItem = this.next();
            nextItem ? this.onNextClick({ item: nextItem }) : null;
        };

        container.appendChild(leftArrow);
        container.appendChild(sliderTitleHolder);
        container.appendChild(rightArrow);

        if (this._state.currentIndex <= 0)//disable left arrow if on first item
            leftArrow.classList.add('disabled');

        if (this.items.length <= 1)//disable right arrow if there is only one item
            rightArrow.classList.add('disabled');

        if (this._state.currentIndex == (this.items.length - 1))//disable right arrow if current index is equal to items length
            rightArrow.classList.add('disabled');

        this._renderItem(item ? item : this.items[0]);
    }

    _renderItem(item) {
        let container = this.selector.querySelector('.content-slider-title'),
            sliderTitle = this._createUIElement('span', null, item.title);

        let sliderTitleExists = container.querySelector('span');
        if (sliderTitleExists)
            container.replaceChild(sliderTitle, sliderTitleExists);
        else container.appendChild(sliderTitle);

        if (this.options.settings.showSubtitle) {
            let subtitle = this._createUIElement('div', 'content-slider-subtitle');
            subtitle.innerHTML = item.subtitle;

            let sliderSubtitleExists = container.querySelector('.content-slider-subtitle');
            if (sliderSubtitleExists)
                container.replaceChild(subtitle, sliderSubtitleExists);
            else
                container.appendChild(subtitle);
        }
    }
    //================================================================================================
    append(items) {
        if ((items instanceof Array)) this.items = items;
        else if ((items instanceof Object)) this.items = [items, ...this.items];
        else throw new Error('Invalid parameters!');
        this.refresh();
    }

    update(id, data) {
        let item = this.items.find(el => el.id === id);
        let index = this.items.indexOf(item);
        this.items[index] = data;

        if (index == this._state.currentIndex)
            this._renderItem(this.items[index]);
    }

    remove(id) {
        let item = this.items.find(el => el.id === id);
        let index = this.items.indexOf(item);

        if (index == this._state.currentIndex) {
            if (this._state.currentIndex == (this.items.length - 1)) {
                this.previous();
                this.disable('next');
            }
            else if (index <= 0) {
                this.next();
                this.disable('previous');
            }
            else {
                this.previous();
            }
        }

        this.items = this.items.filter(el => el.id !== id);
    }
    //================================================================================================
    getCurrentIndex() {
        return this._state.currentIndex;
    }

    setCurrentIndex(index) {
        this._state.currentIndex = index;
        this.selector.innerHTML = '';
        this._renderSlider(this.items[index]);
    }
    
    getCurrentIndex() {
      return this._state.currentIndex;
    }

    next() {
        let leftArrow = this._getLeftArrowElement(),
            rightArrow = this._getRightArrowElement();

        if (rightArrow.classList.contains('disabled')) return;
        if (leftArrow.classList.contains('disabled'))
            leftArrow.classList.remove('disabled');

        let nextItemIndex = this._state.currentIndex + 1;

        this._getSliderTitleElement().innerHTML = '';

        if (nextItemIndex == (this.items.length - 1)) {
            rightArrow.classList.add('disabled');
        }

        this._renderItem(this.items[nextItemIndex]);
        this._state.currentIndex++;

        return this.items[nextItemIndex];
    }

    previous() {
        let leftArrow = this._getLeftArrowElement(),
            rightArrow = this._getRightArrowElement();

        if (leftArrow.classList.contains('disabled')) return;

        if (rightArrow.classList.contains('disabled'))
            rightArrow.classList.remove('disabled');

        this._state.currentIndex--;

        this._getSliderTitleElement().innerHTML = '';

        if (this._state.currentIndex <= 0) {
            leftArrow.classList.add('disabled');
            this._renderItem(this.items[this._state.currentIndex]);
        }
        else {
            this._renderItem(this.items[this._state.currentIndex]);
        }

        return this.items[this._state.currentIndex]
    }

    enable(direction) {
        let element = direction === 'previous' ? this.selector.children[0] : this.selector.children[2];
        element.classList.remove('disabled');
    }

    disable(direction) {
        let element = direction === 'previous' ? this.selector.children[0] : this.selector.children[2];
        element.classList.add('disabled');
    }
    //================================================================================================
    refresh() {
        this.selector.innerHTML = '';
        let currentItem = this.items[this._state.currentIndex];
        this._renderSlider(currentItem);
    }
    //================================================================================================        
    onNextClick() { }

    onPreviousClick() { }
    //================================================================================================        
    _getLeftArrowElement() {
        return this.selector.querySelector('.bf-chevron-left');
    }

    _getSliderTitleElement() {
        return this.selector.querySelector('.content-slider-title');
    }

    _getRightArrowElement() {
        return this.selector.querySelector('.bf-chevron-right');
    }

    _createUIElement(tag, className, innerHTML = null, src = null) {
        let element = document.createElement(tag);

        className ? element.className = className : null;
        innerHTML ? element.innerHTML = innerHTML : null;
        if (tag == 'img') element.src = src;
        return element;
    }
};
