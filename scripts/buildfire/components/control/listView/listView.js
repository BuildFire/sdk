if (typeof buildfire == "undefined")
    throw "please add buildfire.js first to use buildfire components";

if (typeof buildfire.components == "undefined") buildfire.components = {};
if (typeof buildfire.components.control == "undefined") buildfire.components.control = {};

buildfire.components.control.listView = class ControlListView {
    constructor(selector, options = {}) {
        if (!document.querySelector(selector)) throw new Error("Element not found!");

        this.selector = document.querySelector(selector);

        this._state = {
            selector: selector,
            items: [],
            headerContainer: null,
            searchBarContainer: null,
            actionsContainer: null,
            itemsContainer: null,
            currentSortOption: null,
            searchValue: null,
            itemActionsPresets: [
                { actionId: "toggle" },
                { actionId: "custom" },
                { actionId: "edit", icon: "icon-pencil", theme: "primary" },
                { actionId: "delete", icon: "icon-cross2", theme: "danger" },
            ],
            sortOptionsPresets: [
                { title: "Title A-Z" },
                { title: "Title Z-A" },
                { title: "Newest" },
                { title: "Oldest" },
            ],
            iconPresets: {
                bubble: "icon-bubble",
                graph: "icon-graph",
                calendar: "icon-calendar-full",
                copy: "icon-copy",
                download: "icon-download2",
                upload: "icon-upload2",
                link: "icon-link2",
                user: "icon-user",
                star: "icon-star",
                mapMarker: "icon-map-marker",
                edit: "icon-pencil",
                delete: "icon-cross2",
                chart: "icon-chart-growth"
            },
            contentMappingDefault: {
                idKey: "id",
                columns: []
            },
            showDragAndDrop: true,
            paginationOptions : {
                page: 0,
                pageSize: 10
            },
            hasMoreData : true,
        }

        this.options = {
            appearance: {
                title: null,
                info: null,
                addButtonText: "Add Item",
                addButtonStyle: "filled",
                itemImage: "square",
                itemImageEditable: true
            },
            settings: {
                showSearchBar: false,
                showSortOptions: false,
                showAddButton: false,
                allowDragAndDrop: true,
                showEditButton: true,
                showDeleteButton: true,
                paginationEnabled: false,
                paginationOptions: null,
            },
            contentMapping: {
                idKey: "id",
                columns: []
            },
            addButtonOptions: [],
            sortOptions: options.sortOptions ? options.sortOptions : this._state.sortOptionsPresets,
        }

        this.options.appearance = options.appearance ?
            Object.assign(this.options.appearance, options.appearance) : this.options.appearance;
        this.options.settings = options.settings ?
            Object.assign(this.options.settings, options.settings) : this.options.settings;
        this.options.settings.contentMapping = options.settings && options.settings.contentMapping ?
            Object.assign(this._state.contentMappingDefault, options.settings.contentMapping) : this._state.contentMappingDefault;
        this.options.addButtonOptions = options.addButtonOptions ?
            Object.assign(this.options.addButtonOptions, options.addButtonOptions) : this.options.addButtonOptions;
        this.options.settings.paginationOptions = options.settings && options.settings.paginationOptions ?
        Object.assign(this._state.paginationOptions, options.settings.paginationOptions) : this._state.paginationOptions;
        this.items = [];
        this.init();
    }

    init() {
        this.selector.className = "sortable-list";

        this._initializeHeader();
        this._initializeSearchBar();
        this._initializeActions();

        this._state.itemsContainer = this._createUIElement("div", "sortable-list-container");
        this.selector.appendChild(this._state.itemsContainer);

        
        setTimeout(() => {
            if (this.onDataRequest) {
                this._state.itemsContainer.addEventListener("scroll", this._handleScroll.bind(this));
                this._triggerOnDataRequested();
            } else {
                this._initSortableList();
                this._toggleSortableList();
            }
        }, 0);
    }
    //=======================================================================================
    _handleScroll(e) {
        if (this._state.hasMoreData && this._isScrolledToBottom(e)) {
            // Load more data when scrolled to the bottom
            this.options.settings.paginationOptions.page++;
            this._loadMoreData();
        }
    }

    _isScrolledToBottom(e) {
        const container = e.target;
        const scrollHeight = container.scrollHeight;
        const scrollTop = container.scrollTop || document.body.scrollTop;
        const clientHeight = container.clientHeight;

        return scrollTop + clientHeight >= scrollHeight - 200;
    }
    
    _loadMoreData() {
        this._state.hasMoreData  = false;
        this._triggerOnDataRequested();
    }


    //=======================================================================================
    _triggerOnDataRequested() {
        let callbackOptions = {};

        if (this.options.settings.showSearchBar)
            callbackOptions.searchValue = this._state.searchValue;

        if (this.options.settings.showSortOptions)
            callbackOptions.sort = this._state.currentSortOption;

        if (this.options.settings.paginationEnabled){
            callbackOptions.page = this.options.settings.paginationOptions.page;
            callbackOptions.pageSize = this.options.settings.paginationOptions.pageSize;
        }

        this.onDataRequest(callbackOptions, (items) => {

            if (this._state.page !== 0){
                this._state.hasMoreData  = true;
				this.items = [...this.items, ...items];
            }else{
                this._state.itemsContainer.innerHTML = "";
                this.items = items;
            }
            items.forEach((item, index) => {
                this._renderItem(item, index);
            });

            if (!this._state.sortableList && this.options.settings.allowDragAndDrop) {
                this._initSortableList();
                this._toggleSortableList();
            }
        });
    }

    _initSortableList() {
        let oldIndex = 0;
        this._state.sortableList = Sortable.create(this._state.itemsContainer, {
            animation: 150,
            handle: '.icon-menu',
            filter: '.disable-drag',
            onUpdate: (evt) => {
                let newIndex = this._getSortableItemIndex(evt.item);
                let tmp = this.items.splice(oldIndex, 1)[0];
                this.items.splice(newIndex, 0, tmp);
                if (this.options.settings.contentMapping.manualOrderKey) {
                    let manualOrderKey = this.options.settings.contentMapping.manualOrderKey.split(".").pop();
                    this.items = this.items.map((item, index) => {
                        return this._setMappingKeyValue(item, manualOrderKey, index);
                    });
                }
                this._reIndexRows();
                this.onOrderChange({ items: this.items, oldIndex, newIndex });
            },
            onStart: (evt) => {
                this._changeActionIconPointerEvents('none');
                oldIndex = this._getSortableItemIndex(evt.item);
            },
            onEnd: () => {
                this._changeActionIconPointerEvents('all');
            },
        });
    }
    // _changeActionIconPointerEvents is using to prevent filtered items to be draged
    _changeActionIconPointerEvents(enablePointer) {
        const actionIcons = Array.from(this._state.itemsContainer.querySelectorAll('.sortable-list-item-actions .btn--icon'));
        actionIcons.forEach((icon) => {
            icon.style.pointerEvents = enablePointer;
        });
    }

    _toggleSortableList() {
        if (this._state.currentSortOption && this._state.currentSortOption.title.toLowerCase() !== "manual") {
            this._state.sortableList.option("disabled", true);
        }
        else {
            this._state.sortableList.option("disabled", false);
        }
    }

    _reIndexRows() {
        let i = 0;
        this._state.itemsContainer.childNodes.forEach(e => {
            e.setAttribute("arrayIndex", i);
            i++;
        });
    }

    _getSortableItemIndex(item) {
        var index = 0;
        while ((item = item.previousSibling) != null) {
            index++;
        }
        return index;
    }
    //=======================================================================================
    onOrderChange() { }

    onAddButtonClick() { }

    onItemClick() { }

    onItemActionClick() { }

    onItemRender() { }

    onSearchInput() { }

    onSortOptionChange() { }
    //=======================================================================================
    _initializeHeader(refresh = false) {
        let header = this._createUIElement("div", "sortable-list-header");

        if (this.options.appearance.title) {
            let title = this._createUIElement("h1", "section-title", this.options.appearance.title, null);
            header.appendChild(title);
        }

        if (this.options.appearance.info) {
            let info = this._createUIElement("p", "info-note", this.options.appearance.info, null);
            header.appendChild(info);
        }

        if (this.options.appearance.title || this.options.appearance.info) {
            if (refresh && this._state.headerContainer) this._state.headerContainer.innerHTML = header.innerHTML;
            else {
                this.selector.insertBefore(header, this.selector.firstChild);
                this._state.headerContainer = header;
            }
        }
    }

    _initializeSearchBar(refresh = false) {
        if (this.options.settings.showSearchBar) {
            let searchBar = this._createUIElement("div", "sortable-list-search-container");

            let input = document.createElement("input"),
                button = this._createUIElement("button", "btn btn-info"),
                icon = this._createUIElement("div", "search-icon")

            input.type = "text";
            input.placeholder = "Search";

            button.onclick = () => {
                this._state.searchValue = input.value && input.value !== "" ? input.value : null;
                if (this.onDataRequest){
                    this.clear();
                    this.options.settings.paginationOptions.page = 0;
                    this._triggerOnDataRequested();
                }
                else if (this.onSearchInput)
                    this.onSearchInput(this._state.searchValue);
            }

            input.addEventListener("keyup", this._debounce(() => button.onclick(), 300));

            button.appendChild(icon);
            searchBar.appendChild(input);
            searchBar.appendChild(button);

            if (refresh) {
                this.selector.replaceChild(searchBar, this.selector.querySelector(".sortable-list-search-container"));
                this._state.searchBarContainer = searchBar;
                this._state.searchBarContainer.classList.remove("sortable-list-hidden");
            }
            else {
                this.selector.appendChild(searchBar);
                this._state.searchBarContainer = searchBar;
            }
        } else if (this._state.searchBarContainer) {
            this._state.searchBarContainer.classList.add("sortable-list-hidden");
        }
    }

    _initializeActions(refresh = false) {
        let actions = this._createUIElement("div", "sortable-list-actions-container");
        if (this.options.settings.showSortOptions) {
            let optionsDiv = this._initializeSortOptions();
            optionsDiv ? actions.appendChild(optionsDiv) : null;
        }
        if (this.options.settings.showAddButton) {
            actions.appendChild(this._initializeAddButton());
        }

        if (refresh) {
            this.selector.replaceChild(actions, this.selector.querySelector(".sortable-list-actions-container"));
            this._state.actionsContainer = actions;
            this._state.actionsContainer.classList.remove("sortable-list-hidden");
        }
        else {
            this.selector.appendChild(actions);
            this._state.actionsContainer = actions;
        }
        if (!this.options.settings.showSortOptions && !this.options.settings.showAddButton) {
            this._state.actionsContainer.classList.add("sortable-list-hidden");
        }
            
    }

    _initializeAddButton() {
        if (this.options.addButtonOptions.length) {
            let dropdown = this._createUIElement("div", "dropdown sortable-list-add-button", null, null),
                btn = this._createUIElement("button", `btn btn-primary ${this.options.appearance.addButtonStyle === "outlined" ? "btn-outlined" : ""} btn-primary-add`, `<span class="pull-left">${this.options.appearance.addButtonText}</span><span class="chevron icon-chevron-down pull-right"></span>`, null),
                list = this._createUIElement("ul", "dropdown-menu extended", null, null);

            list.role = "menu";

            btn.onclick = () => {
                if (dropdown.classList.contains("open")) {
                    dropdown.classList.remove("open");
                } else
                    dropdown.classList.add("open");
            }

            btn.setAttribute("data-toggle", "dropdown");
            btn.setAttribute("dropdown-toggle", true);
            btn.setAttribute("aria-expanded", true);

            this.options.addButtonOptions.forEach(element => {
                let li = this._createUIElement("li", null, `<a>${element.title}</a>`, null);
                li.onclick = () => {
                    this.onAddButtonClick({ option: element });
                    dropdown.classList.remove("open");
                };
                list.appendChild(li);
            });

            dropdown.appendChild(btn);
            dropdown.appendChild(list);
            return dropdown;
        } else {
            let dropdown = this._createUIElement("div", "sortable-list-add-button", null, null);
            let button = this._createUIElement("button", `btn btn-primary ${this.options.appearance.addButtonStyle === "outlined" ? "btn-outlined" : ""} btn-primary-add`, `<span>${this.options.appearance.addButtonText}</span>`, null);
            button.onclick = () => {
                this.onAddButtonClick();
            }
            dropdown.appendChild(button);
            return dropdown;
        }
    }

    _initializeSortOptions() {
        if (!this.options.sortOptions.length) return null;

        let defaultOption = this.options.sortOptions.find(el => el.default);

        if (!this.options.settings.allowDragAndDrop)
            this.options.sortOptions = this.options.sortOptions.filter(el => el.title.toLowerCase() !== "manual");

        if (this.options.settings.allowDragAndDrop && !this.options.sortOptions.find(el => el.title.toLowerCase() == "manual"))
            this.options.sortOptions.unshift({ title: "Manual", default: defaultOption ? false : true });


        if (!defaultOption) this.options.sortOptions[0].default = true;

        this._state.currentSortOption = defaultOption ? defaultOption : this.options.sortOptions[0];

        if (this.options.settings.allowDragAndDrop && this._state.currentSortOption.title.toLowerCase() !== "manual")
            this._state.showDragAndDrop = false;

        let dropdown = this._createUIElement("div", "dropdown", null, null),
            btn = this._createUIElement("button", "btn btn-default dropdown-toggle sort-dropdown", `<span class="pull-left">${this._state.currentSortOption.title}</span><span class="chevron icon-chevron-down pull-right"></span>`, null),
            list = this._createUIElement("ul", "dropdown-menu extended", null, null);

        btn.onclick = () => {
            dropdown.classList.contains("open") ? dropdown.classList.remove("open") : dropdown.classList.add("open")
        };

        btn.setAttribute("data-toggle", "dropdown");
        btn.setAttribute("dropdown-toggle", true);
        btn.setAttribute("aria-expanded", true);

        this.options.sortOptions.forEach(element => {
            let li = this._createUIElement("li", null, `<a>${element.title}</a>`, null);
            li.onclick = () => {
                this._state.currentSortOption = element;
                btn.innerHTML = `<span class="pull-left">${this._state.currentSortOption.title}</span><span class="chevron icon-chevron-down pull-right"></span>`;
                dropdown.classList.remove("open");

                if (this.options.settings.allowDragAndDrop) {
                    this._state.showDragAndDrop = element.title.toLowerCase() !== "manual" ? false : true;
                    this._toggleSortableList();
                    this._resetList();
                }

                if (this.onDataRequest){
                    this.clear();
                    this.options.settings.paginationOptions.page = 0;
                    this._triggerOnDataRequested();
                }
                else if (this.onSortOptionChange)
                    this.onSortOptionChange(this._state.currentSortOption);
            };
            list.appendChild(li);
        });

        dropdown.appendChild(btn);
        dropdown.appendChild(list);
        return dropdown;
    }
    //=======================================================================================
    _renderItem(item, index, appendToTop = false) {
        let preferences = this.onItemRender({ item: item });
        let rowExists = this._state.itemsContainer.querySelector(`#item_${encodeURI(this._getMappingKeyValue(item, this.options.settings.contentMapping.idKey))}`),
            itemRow = null;

        if (rowExists) {
            itemRow = rowExists;
            itemRow.innerHTML = "";
        } else {
            itemRow = document.createElement("div");
        }

        itemRow.id = `item_${this._getMappingKeyValue(item, this.options.settings.contentMapping.idKey)}`;
        itemRow.setAttribute("arrayIndex", index);
        itemRow.className = "sortable-list-item clearfix";

        let sortableMenuClasses = 'icon icon-menu cursor-grab';
        if (preferences && preferences.presetOptions && preferences.presetOptions.disableManualSorting) {
            sortableMenuClasses += ' disabled';
            itemRow.className += ' disable-drag';
        }
        let dragHandle = this._createUIElement("span", sortableMenuClasses);
        if (this.options.settings.allowDragAndDrop && this._state.showDragAndDrop)
            itemRow.appendChild(dragHandle);

        const createImage = (key, index) => {
            const getClassName = (initial) => {
                let className = initial;
                !this.options.appearance.itemImageEditable ? className += " disabled" : null;
                this.options.appearance.itemImage !== "square" ? className += " rounded" : null;
                return className;
            }

            const getDefaultImage = () => {
                switch (this.options.appearance.itemImage) {
                    case "square":
                    case "circle":
                        return "../../../../styles/media/holder-1x1.png";
                    case "avatar":
                        return "../../../../styles/media/avatar-placeholder.png"
                }
            }

            let image = this._getMappingKeyValue(item, key);
            if (!this.options.appearance.itemImageEditable && !image) {
                image = getDefaultImage();
            }

            let isImage = image && (image.startsWith("http") || image.startsWith("https") || image.startsWith("../../"));

            if (image && isImage) {
                if (!image.startsWith("../../"))
                    image = buildfire.imageLib.cropImage(image, { size: "xs", aspect: "1:1" })
                let img = this._createUIElement("img", getClassName("sortable-list-item-image"), null, image);
                img.setAttribute("data-key", "imageKey");
                img.setAttribute("data-columnIndex", index);
                img.setAttribute("loading", "lazy");
                columnsDiv.appendChild(img);
            } else {
                let div = this._createUIElement("div", getClassName("sortable-list-item-icon-holder")),
                    span = null;

                if (image && !isImage) {
                    span = this._createUIElement("div", image);
                    div.appendChild(span);
                } else {
                    span = this._createUIElement("div", "add-icon text-success", "+");
                    !this.options.appearance.itemImageEditable ? null : div.appendChild(span);
                }

                div.setAttribute("data-key", "imageKey");
                div.setAttribute("data-columnIndex", index);
                columnsDiv.appendChild(div);
            }
        }

        const createToggle = (key, index) => {
            let toggle = this._createUIElement("div", "button-switch"),
                input = this._createUIElement("input", null),
                label = this._createUIElement("label", "label-success");
            input.type = "checkbox";
            input.id = "toggle_" + this._getMappingKeyValue(item, this.options.settings.contentMapping.idKey);
            label.setAttribute("for", "toggle_" + this._getMappingKeyValue(item, this.options.settings.contentMapping.idKey));
            input.setAttribute("data-key", "toggleKey");
            toggle.setAttribute("data-columnIndex", index);
            input.checked = this._getMappingKeyValue(item, key) ? this._getMappingKeyValue(item, key) : false;

            toggle.appendChild(input);
            toggle.appendChild(label);
            actionsDiv.appendChild(toggle);
        }

        itemRow.onclick = (e) => {
            let columnIndex = e.target.parentNode.dataset.columnindex ? e.target.parentNode.dataset.columnindex : e.target.dataset.columnindex;
            let columnKey = e.target.parentNode.dataset.key ? e.target.parentNode.dataset.key : e.target.dataset.key;

            if (e.target && columnKey)
                this.onItemClick({ item, column: this.options.settings.contentMapping.columns[columnIndex], targetKey: columnKey });
            else if (e.target && e.target.dataset.actionid)
                this.onItemActionClick({ item: item, actionId: e.target.dataset.actionid });
        }

        let columnsDiv = this._createUIElement("div", "sortable-list-columns");

        const renderColumns = () => {
            this.options.settings.contentMapping.columns.forEach((column, index) => {
                if (column["imageKey"]) {
                    if (Object.keys(column).length > 1)
                        throw new Error("imageKey cannot be used in combination with any other");
                    createImage(column["imageKey"], index);
                }
                else if (column["toggleKey"]) {
                    if (Object.keys(column).length > 1)
                        throw new Error("toggleKey cannot be used in combination with any other");
                    createToggle(column["toggleKey"], index);
                }
                else {
                    const buildColumn = (key, value, div = null) => {
                        if (key == "anchorKey") {
                            div = this._createUIElement("a", "sortable-list-item-anchor ellipsis", this._getMappingKeyValue(item, value), null);
                        }
                        else {
                            let className = key == "titleKey" ? "sortable-list-item-title-bold ellipsis" : "ellipsis";
                            let text = key == "dateKey" ?
                                new Date(this._getMappingKeyValue(item, value)).toDateString() : this._getMappingKeyValue(item, value);
                            div = this._createUIElement("div", className, null, null, text);
                        }
                        div.setAttribute("data-key", key);
                        div.setAttribute("data-columnIndex", index);
                        return div;
                    }

                    const firstColumn = {
                        key: Object.keys(column)[0],
                        value: Object.values(column)[0]
                    }
                    const secondColumn = {
                        key: Object.keys(column)[1],
                        value: Object.values(column)[1]
                    }

                    let columnElement = this._createUIElement("div", "sortable-list-column");
                    columnElement.setAttribute("data-columnIndex", index);
                    let firstColumnDiv = buildColumn(firstColumn.key, firstColumn.value);
                    columnElement.appendChild(firstColumnDiv);
                    secondColumn.key && secondColumn.value ? columnElement.appendChild(buildColumn(secondColumn.key, secondColumn.value)) : null;
                    columnsDiv.appendChild(columnElement);
                }
            });
            itemRow.appendChild(columnsDiv);
        }

        let actionsDiv = document.createElement("div");
        actionsDiv.className = "sortable-list-item-actions";

        const renderActions = () => {
            this._state.itemActionsPresets.forEach((element) => {
                if (element.actionId == "custom" && preferences && preferences.actions && preferences.actions.length) {
                    preferences.actions.forEach((element) => {
                        let icon = this._state.iconPresets[element.icon] ? this._state.iconPresets[element.icon] : null
                        let button = this._createUIElement("button", `btn btn--icon icon ${element.theme} ${icon ?? ""}`, null, null);
                        button.disabled = element.disabled;
                        button.setAttribute("data-actionId", element.actionId);
                        
                        if (element.tooltipText) {
                            const tooltipSpan = this._createUIElement("span", "listview-action-tooltip border-radius-four", null, null, element.tooltipText);
                            button.appendChild(tooltipSpan);
                        }
                        
                        actionsDiv.appendChild(button);
                    });
                }
                else if (element.actionId == "edit" && this.options.settings.showEditButton) {
                    let button = this._createUIElement("button", "btn btn--icon icon primary " + element.icon, null, null);
                    button.disabled = preferences && preferences.presetOptions && preferences.presetOptions.disableEdit ? true : false;
                    button.setAttribute("data-actionId", element.actionId);
                    
                    if (preferences && preferences.presetOptions && preferences.presetOptions.editButtonTooltip) {
                        const tooltipSpan = this._createUIElement("span", "listview-action-tooltip border-radius-four", null, null, preferences.presetOptions.editButtonTooltip);
                        button.appendChild(tooltipSpan);
                    }
                    
                    actionsDiv.appendChild(button);
                }
                else if (element.actionId == "delete" && this.options.settings.showDeleteButton) {
                    let button = this._createUIElement("button", "btn btn--icon icon danger " + element.icon, null, null);
                    button.disabled = preferences && preferences.presetOptions && preferences.presetOptions.disableDelete ? true : false;
                    button.setAttribute("data-actionId", element.actionId);
                    
                    if (preferences && preferences.presetOptions && preferences.presetOptions.deleteButtonTooltip) {
                        const tooltipSpan = this._createUIElement("span", "listview-action-tooltip border-radius-four", null, null, preferences.presetOptions.deleteButtonTooltip);
                        button.appendChild(tooltipSpan);
                    }
                    
                    actionsDiv.appendChild(button);
                }
            });
        }

        this.options.settings.contentMapping.columns.length && renderColumns();

        renderActions();
        itemRow.appendChild(actionsDiv);

        if (rowExists) {
            this._state.itemsContainer.replaceChild(rowExists, itemRow);
        } else {
            if (appendToTop)
                this._state.itemsContainer.insertBefore(itemRow, this._state.itemsContainer.firstChild);
            else
                this._state.itemsContainer.appendChild(itemRow);
        }
    }
    //=======================================================================================
    clear() {
        this._state.itemsContainer.innerHTML = "";
        this.items = [];
    }

    refresh() {
        this._initializeHeader(true);
        this._initializeSearchBar(true);
        this._initializeActions(true);
    }

    reset() {
        let items = this.items;
        if (this.onDataRequest) {
            this.selector.innerHTML = "";
            this.options.settings.paginationOptions = {page : 1, pageSize: 10}
            this.init();
        }else{
            this.refresh();
            this.clear();
            this.items = items;
            this._resetList();
        }
    }

    _resetList() {
        this._state.itemsContainer.innerHTML = "";
        this.items.forEach((item, index) => this._renderItem(item, index));
    }
    //=======================================================================================
    append(items, appendToTop = false) {
        if ((items instanceof Array)) this.items = appendToTop ? [...items, ...this.items] : [...this.items, ...items];
        else if ((items instanceof Object)) this.items = appendToTop ? [items, ...this.items,] : [...this.items, items];
        else throw new Error("Invalid parameters!");
        this.items.forEach((item, index) => {
            this._renderItem(item, index, appendToTop);
        });
    }
    update(id, data) {
        let item = this.items.find(el => this._getMappingKeyValue(el, this.options.settings.contentMapping.idKey) === id);
        let index = this.items.indexOf(item);
        this.items[index] = data;
        this._renderItem(this.items[index], index);
    }
    remove(id) {
        this.items = this.items.filter(el => this._getMappingKeyValue(el, this.options.settings.contentMapping.idKey) !== id);
        let node = this._state.itemsContainer.querySelector(`#item_${id}`);
        if (node) node.remove();
        this._reIndexRows();
    }
    //=======================================================================================
    _createUIElement(tag, className, innerHTML = null, src = null, textContent = null) {
        let element = document.createElement(tag);
        className ? element.className = className : null;
        innerHTML && !textContent ? element.innerHTML = innerHTML : null;
        textContent ? element.textContent = textContent : null;
        if (tag == "img") element.src = src;
        return element;
    }

    _debounce(func, wait) {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    _setMappingKeyValue(obj, key, value) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (prop === key) {
                    obj[prop] = value;
                } else if (typeof obj[prop] === "object") {
                    this._setMappingKeyValue(obj[prop], key, value);
                }
            }
        }
        return obj;
    }

    _getMappingKeyValue(item, key) {
        if (!key) return null;
        let sequence = key.split(".");

        for (let i = 0; i < sequence.length; i++) {
            if (item[sequence[i]])
                item = item[sequence[i]];
            else
                return null;
        }
        return item;
    }
}