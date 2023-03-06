if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};


class ContentSliderStateManager {
    constructor() {
        this.currentIndex = 0;
        this.items = [];
    }
}

buildfire.components.contentSlider = class ContentSlider {
    #state;

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

        if (!this.#state) {
            this.#state = new ContentSliderStateManager();
        }
        this.#state.currentIndex = this.options.settings.startingIndex;

        if (options.items && options.items.length)
            this.#state.items = options.items;
        else throw new Error('Items must be provided!');

        this.init();
    }
    //================================================================================================            
    init() {
        this.selector.classList.add('content-slider-container');
        this._renderSlider(this.#state.items[this.options.settings.startingIndex]);
    }

    _renderSlider(item = null) {
        this._startLoading();

        let container = this.selector,
            leftArrow = this._createUIElement('i', 'bf-chevron-left'),
            rightArrow = this._createUIElement('i', 'bf-chevron-right'),
            sliderTitleHolder = this._createUIElement('div', 'content-slider-title');

        leftArrow.onclick = () => {
            let previousItem = this.previous();
            previousItem ? this.onPrevious({ item: previousItem }) : null;
        };

        rightArrow.onclick = () => {
            let nextItem = this.next();
            nextItem ? this.onNext({ item: nextItem }) : null;
        };

        container.appendChild(leftArrow);
        container.appendChild(sliderTitleHolder);
        container.appendChild(rightArrow);

        if (this.#state.currentIndex <= 0)//disable left arrow if on first item
            leftArrow.classList.add('disabled');

        if (this.#state.items.length <= 1)//disable right arrow if there is only one item
            rightArrow.classList.add('disabled');

        if (this.#state.currentIndex == (this.#state.items.length - 1))//disable right arrow if current index is equal to items length
            rightArrow.classList.add('disabled');

        this._renderItem(item ? item : this.#state.items[0]);

        setTimeout(() => {
            this._stopLoading();
        }, 300);
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
    prepend(items, callback) {
        let options = {
            index: 0,
            position: 'before'
        };

        if ((items instanceof Array))
            options.items = items;
        else if ((items instanceof Object))
            options.item = items;

        else throw new Error('Invalid parameters!');

        this.insertAt(options, () => {
            this.refresh();
            callback();
        });
    }


    insertAt(options, callback) {
        if (!(this.#state.items[options.index])) throw new Error('Invalid parameters!');

        if (options.items && options.item)
            throw new Error('You can not pass item and items at the same time!');
        if (!options.items && !options.item)
            throw new Error('Item or items are required!');

        let items = options.items ? options.items : [options.item];

        if (options.position === 'before') {
            this.#state.items.splice(options.index, 0, ...items);
        } else if (options.position === 'after') {
            this.#state.items.splice(options.index + 1, 0, ...items);
        }

        this.refresh();
        callback();
    }

    append(items, callback) {
        let options = {
            index: this.#state.items.length - 1,
            position: 'after'
        };

        if ((items instanceof Array))
            options.items = items;
        else if ((items instanceof Object))
            options.item = items;

        else throw new Error('Invalid parameters!');

        this.insertAt(options, () => {
            this.refresh();
            callback();
        });
    }

    update(id, data) {
        let item = this.#state.items.find(el => el.id === id);
        let index = this.#state.items.indexOf(item);
        this.#state.items[index] = data;

        if (index == this.#state.currentIndex)
            this._renderItem(this.#state.items[index]);
    }

    remove(id) {
        let item = this.#state.items.find(el => el.id === id);
        let index = this.#state.items.indexOf(item);

        if (index == this.#state.currentIndex) {
            if (this.#state.currentIndex == (this.#state.items.length - 1)) {
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

        this.#state.items = this.#state.items.filter(el => el.id !== id);
    }
    //================================================================================================
    getCurrent(callback) {
        if (this.#state.items[this.#state.currentIndex])
            callback({
                index: this.#state.currentIndex,
                item: this.#state.items[this.#state.currentIndex]
            });
        else throw new Error("Item not found!");
    }

    setCurrent(options) {
        if (options.id && options.index)
            throw new Error('You can not pass id and index at the same time!');
        if (!options.id && !options.index)
            throw new Error('Id or index is required!');

        let item = null;
        if (options.id) {
            item = this.#state.items.find(el => el.id === options.id);
            this.#state.currentIndex = this.#state.items.indexOf(item);
        }
        else if (options.index) {
            this.#state.currentIndex = index;
            item = this.#state.items[index];
        }

        this.selector.innerHTML = '';
        this._renderSlider(item);
    }

    next() {
        let leftArrow = this._getLeftArrowElement(),
            rightArrow = this._getRightArrowElement();

        if (rightArrow.classList.contains('disabled')) return;
        if (leftArrow.classList.contains('disabled'))
            leftArrow.classList.remove('disabled');

        let nextItemIndex = this.#state.currentIndex + 1;

        this._getSliderTitleElement().innerHTML = '';

        if (nextItemIndex == (this.#state.items.length - 1)) {
            rightArrow.classList.add('disabled');
        }

        this._renderItem(this.#state.items[nextItemIndex]);
        this.#state.currentIndex++;
        return this.#state.items[nextItemIndex];
    }

    previous() {
        let leftArrow = this._getLeftArrowElement(),
            rightArrow = this._getRightArrowElement();

        if (leftArrow.classList.contains('disabled')) return;

        if (rightArrow.classList.contains('disabled'))
            rightArrow.classList.remove('disabled');

        this.#state.currentIndex--;

        this._getSliderTitleElement().innerHTML = '';

        if (this.#state.currentIndex <= 0) {
            leftArrow.classList.add('disabled');
            this._renderItem(this.#state.items[this.#state.currentIndex]);
        }
        else {
            this._renderItem(this.#state.items[this.#state.currentIndex]);
        }

        return this.#state.items[this.#state.currentIndex]
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
        let currentItem = this.#state.items[this.#state.currentIndex];
        this._renderSlider(currentItem);
    }
    //================================================================================================        
    onNext() { }

    onPrevious() { }
    //================================================================================================        
    _startLoading() {
        this.selector.classList.add('bf-slider-loading');
    }

    _stopLoading() {
        this.selector.classList.remove('bf-slider-loading');
    }
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
