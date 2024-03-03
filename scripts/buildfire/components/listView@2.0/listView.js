if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

buildfire.components.listView = class ListView {
	constructor(selector, options = {}) {
		if (!document.querySelector(selector)) throw new Error('Element not found!');

		this.selector = document.querySelector(selector);
		this.options = {
			settings: {
				showSearchBar: true,
				itemImage: 'none',
				headerContent: null,
				paginationEnabled: false,
				paginationOptions: null,
				contentMapping: null,
				customListAction: null,
				enableReadMore: true,
				maxHeight: null
			},
			translations: {
				readMore: 'Read More',
				readLess: 'Read Less',
				emptyStateMessage: 'No Items Yet',
				searchInputPlaceholder: 'Search'
			},
		};
		this._state = {
			listViewSearchBarContainer: null,
			listViewItemsContainer: null,
			searchValue: null,
			page: null,
			fetchNextPage: true,
			contentMappingDefault: {
				idKey: 'id',
				imageKey: 'imageUrl',
				titleKey: 'title',
				subtitleKey: 'subtitle',
				descriptionKey: 'description'
			},
			paginationOptions: {
				page: 0,
				pageSize: 10
			},
			busy: false,
		};
		this.options.settings = options.settings ? Object.assign(this.options.settings, options.settings) : this.options.settings;
		this.options.translations = options.translations ? Object.assign(this.options.translations, options.translations) : this.options.translations;
		this.options.settings.contentMapping = options.settings && options.settings.contentMapping ?
			Object.assign(this._state.contentMappingDefault, options.settings.contentMapping) : this._state.contentMappingDefault;
		this.options.settings.paginationOptions = options.settings && options.settings.paginationOptions ?
			Object.assign(this._state.paginationOptions, options.settings.paginationOptions) : this._state.paginationOptions;
		this.options.settings.customListAction = options.settings && options.settings.customListAction ?
			options.settings.customListAction : null;

		this.items = [];

		this.init();
	}
	//================================================================================================            
	init() {
		this._state.listViewItemsContainer = this._createUIElement('div', 'listView-items');
		this.selector.classList.add('listView-container');
		if (this.options.settings.maxHeight) this.selector.style.height = this.options.settings.maxHeight + 'vh';

		this.selector.appendChild(this._state.listViewItemsContainer);

		this._initializeSearchBar();
		this._initializeHeaderContent();
		this._loadDrawerScript('../../../scripts/buildfire/components/drawer/drawer.js');
		this._loadSkeletonScript('../../../scripts/buildfire/components/skeleton/skeleton.js');

		if (this.options.settings.paginationEnabled) {
			this._state.page = this.options.settings.paginationOptions.page;
		}

		setTimeout(() => {
			if (this.onDataRequest) {
				this._triggerOnDataRequested();
			} else this._updateEmptyState();
		}, 0);
	}


	_initializeHeaderContent() {
		if (this.options.settings.headerContent) {
			this._state.listViewHeaderContainer = this._createUIElement('div', 'listView-header-content', this.options.settings.headerContent);
			this.selector.insertBefore(this._state.listViewHeaderContainer, this._state.listViewItemsContainer);
		}
	}

	_initializeSearchBar() {
		if (this.options.settings.showSearchBar) {
			this._state.listViewSearchBarContainer = this._createUIElement('div', 'listView-search-container', null);

			let searchHolder = this._createUIElement('div', 'listView-search'),
				searchIcon = this._createUIElement('label', 'bf-search listView-icons'),
				searchInput = document.createElement('input');

			searchInput.type = 'text';
			searchInput.placeholder = this.options.translations.searchInputPlaceholder;

			searchHolder.appendChild(searchIcon);
			searchHolder.appendChild(searchInput);

			['keyup', 'change'].forEach(evt =>
				searchInput.addEventListener(evt, this._debounce((e) => {
					this._state.searchValue = e.target.value && e.target.value !== '' ? e.target.value : null;
					this._state.page = 0;
					this._state.fetchNextPage = true;
					if (this.onDataRequest) {
						this._triggerOnDataRequested();
					} else if (this.onSearchInput)
						this.onSearchInput(this._state.searchValue);
				}, 250))
			);

			this._state.listViewSearchBarContainer.appendChild(searchHolder);
			this.selector.insertBefore(this._state.listViewSearchBarContainer, this.selector.firstChild);
		}
	}
	_hideEmptyState() {
		this._state.listViewItemsContainer.classList.remove('empty_state');
	}

	_updateEmptyState() {
		if (!this.options.settings.headerContent && !this.items.length) {
			this._state.listViewItemsContainer.setAttribute('data-text', this.options.translations.emptyStateMessage);
			this._state.listViewItemsContainer.classList.add('empty_state');
		} else this._state.listViewItemsContainer.classList.remove('empty_state');
	}

	_showSkeletons() {
		let skeletonContainer = this._createUIElement('div', 'bf-skeleton-container');
		let squareImageClass = this.options.settings.itemImage == 'square' ? 'square' : '';

		for (let i = 0; i < this.options.settings.paginationOptions.pageSize; i++) {
			skeletonContainer.innerHTML += `
			<div class="skeleton-list-item-avatar-three-line">
			<span class="bf-skeleton-loader skeleton-avatar ${squareImageClass}"></span>
				<div class="skeleton-paragraph">
					<span class="bf-skeleton-loader skeleton-text"></span>
					<span class="bf-skeleton-loader skeleton-text"></span>
					<span class="bf-skeleton-loader skeleton-text"></span>
				</div>
			</div>`;
		}

		this._state.listViewItemsContainer.appendChild(skeletonContainer);
	}

	_hideSkeletons() {
		let node = this._state.listViewItemsContainer.querySelector('.bf-skeleton-container');
		if (node) node.remove();
	}

	_triggerOnDataRequested() {
		if (!this.onDataRequest) return;
		if (!this._state.fetchNextPage) return;
		if (this._state.busy) return;

		if (this._state.searchValue) buildfire.spinner.show();
		else {
			this._hideEmptyState();
			this._showSkeletons();
		}
		this._state.busy = true;

		let callbackOptions = { searchValue: this._state.searchValue };
		if (this.options.settings.paginationEnabled && this.options.settings.paginationOptions) {
			callbackOptions.page = this._state.page;
			callbackOptions.pageSize = this.options.settings.paginationOptions.pageSize;
		}
		this.onDataRequest(callbackOptions, (items) => {
			if (items.length < this.options.settings.paginationOptions.pageSize)
				this._state.fetchNextPage = false;

			if (this._state.searchValue) buildfire.spinner.hide();
			else this._hideSkeletons();

			if (this._state.page !== 0)
				this.items = [...this.items, ...items];
			else {
				this.items = items;
				this._state.listViewItemsContainer.innerHTML = '';
			}
			this._state.busy = false;
			this._renderItems(items);
		});
	}

	_renderItems(items, appendToTop = false) {
		let containers = [];
		items.forEach(el => {
			containers.push(this._renderItem(el, appendToTop));
		});
		this.onRenderEnd({ items: items, containers: containers });

		this._updateEmptyState();
		if (this.options.settings.paginationEnabled && this.items.length > 0 && this.onDataRequest) {
			const observer = new IntersectionObserver((payload) => {
				if (!payload[0].isIntersecting) return;

				observer.unobserve(this._state.listViewItemsContainer.lastElementChild);
				this._state.page++;
				this._triggerOnDataRequested();
			}, {
				root: document.body,
				threshold: 1
			});

			observer.observe(this._state.listViewItemsContainer.lastElementChild);
		}
	}

	_showActionsDrawer(item, actions) {
		buildfire.components.drawer.open({ listItems: actions },
			(err, result) => {
				if (err) return console.error(err);
				this.onItemActionClick({ item: item, action: result });
				buildfire.components.drawer.closeDrawer();
			});
	}

	_getMappingKeyValue(item, key) {
		if (!key) return null;
		let sequence = key.split('.');

		for (let i = 0; i < sequence.length; i++) {
			if (item[sequence[i]])
				item = item[sequence[i]];
			else
				return null;
		}
		return item;
	}

	_renderItem(item, appendToTop = false) {
		let itemHolder = this._state.listViewItemsContainer.querySelector(`[data-id="${encodeURI(this._getMappingKeyValue(item, this.options.settings.contentMapping.idKey))}"`),
			shouldAppend = false;

		if (itemHolder) {
			itemHolder.innerHTML = '';
		} else {
			itemHolder = this._createUIElement('div', 'listView-item');
			itemHolder.setAttribute('data-id', encodeURI(this._getMappingKeyValue(item, this.options.settings.contentMapping.idKey)));
			shouldAppend = true;
		}
		//this is for image section===============================================================================================
		if (this.options.settings.itemImage !== 'none') {
			let imageHolder = this._createUIElement('div', 'listView-item-image');
			let itemImage = this._getMappingKeyValue(item, this.options.settings.contentMapping.imageKey) ?
				buildfire.imageLib.cropImage(
					this._getMappingKeyValue(item, this.options.settings.contentMapping.imageKey), { size: 'xs', aspect: '1:1' }
				) : null;
			let itemEmptyStateImage = this.options.settings.itemImage == 'circle' || this.options.settings.itemImage == 'square' ?
				'../../../styles/media/holder-1x1.png'
				: '../../../styles/media/avatar-placeholder.png';

			let image = this._createUIElement('img', null, null, itemImage ? itemImage : itemEmptyStateImage);
			image.alt = this._getMappingKeyValue(item, this.options.settings.contentMapping.titleKey);

			this.options.settings.itemImage == 'circle' || this.options.settings.itemImage == 'avatar' ?
				image.classList.add('circle') : this.options.settings.itemImage == 'square' ? image.classList.add('square') : null;

			imageHolder.appendChild(image);
			itemHolder.appendChild(imageHolder);
		}
		//this is for title & subtitle section===============================================================================================
		let itemInfoHolder = this._createUIElement('div', 'listView-item-info'),
			itemTitleHolder = this._createUIElement('div', 'listView-item-title'),
			itemTitle = this._createUIElement('span', null, this._getMappingKeyValue(item, this.options.settings.contentMapping.titleKey));

		itemTitleHolder.appendChild(itemTitle);

		itemTitle.onclick = () => {
			this.onItemClick({ item: item, target: 'title' });
		};

		if (this._getMappingKeyValue(item, this.options.settings.contentMapping.subtitleKey)) {
			let itemSubtitle = this._createUIElement('div', 'listView-item-subtitle', this._getMappingKeyValue(item, this.options.settings.contentMapping.subtitleKey));
			itemTitleHolder.appendChild(itemSubtitle);
			itemSubtitle.onclick = () => {
				this.onItemClick({ item: item, target: 'subtitle' });
			};
		}
		itemInfoHolder.appendChild(itemTitleHolder);

		//this is for description section===============================================================================================
		let description = this._getMappingKeyValue(item, this.options.settings.contentMapping.descriptionKey);
		if (description) {
			if (description.length > 150 && this.options.settings.enableReadMore) {
				let readMore = this._createUIElement('a', null, this.options.translations.readMore);
				let itemDescription = this._createUIElement('div', 'listView-item-description', description.substring(0, 149) + '... ');
				itemDescription.appendChild(readMore);
				itemInfoHolder.appendChild(itemDescription);
				readMore.onclick = () => {
					itemDescription.innerHTML = description;
					let readLess = this._createUIElement('a', null, this.options.translations.readLess);
					readLess.style.display = 'block';
					readLess.onclick = () => {
						itemDescription.innerHTML = description.substring(0, 149) + '... ';
						itemDescription.appendChild(readMore);
					};
					itemDescription.appendChild(readLess);
				};
			}
			else {
				let itemDescription = this._createUIElement('div', 'listView-item-description', description);
				itemInfoHolder.appendChild(itemDescription);
			}
		} else {
			itemTitleHolder.classList.add('no-margin');
		}

		//this is for actions section===============================================================================================
		let preferences = this.onItemRender({ item: item });
		itemHolder.appendChild(itemInfoHolder);

		if (this.options.settings.customListAction) {
			if (!this.options.settings.customListAction.html) throw new Error('You need to provide html content!');

			let itemActions = this._createUIElement('div', 'listView-item-actions');
			itemActions.innerHTML = this.options.settings.customListAction.html;
			itemTitleHolder.appendChild(itemActions);

			itemActions.onclick = (event) => {
				event.stopPropagation();
				this.onItemClick({ item: item, target: 'action' });
			};
		}
		else if (preferences && preferences.actions && preferences.actions.length) {
			let itemActions = this._createUIElement('div', 'listView-item-actions'),
				itemActionsIcon = this._createUIElement('i', 'bf-more-alt');

			itemActions.appendChild(itemActionsIcon);
			itemTitleHolder.appendChild(itemActions);

			itemActions.onclick = (event) => {
				event.stopPropagation();
				this._showActionsDrawer(item, preferences.actions);
			};
		}

		//this is for custom content section===============================================================================================
		let customContentDiv = null;
		if (preferences && preferences.customContent) {
			customContentDiv = this._createUIElement('div', 'listView-item-customContent', preferences.customContent);
			itemInfoHolder.appendChild(customContentDiv);
		}

		if (shouldAppend) {
			if (appendToTop)
				this._state.listViewItemsContainer.insertBefore(itemHolder, this._state.listViewItemsContainer.firstChild);
			else
				this._state.listViewItemsContainer.appendChild(itemHolder);
		}
		else
			this._state.listViewItemsContainer.replaceChild(itemHolder, itemHolder);

		if (this.onItemRendered) this.onItemRendered({ item: item, html: customContentDiv });
		return itemHolder;
	}

	//================================================================================================            
	append(items, appendToTop = false) {
		if ((items instanceof Array)) this.items = items;
		else if ((items instanceof Object)) this.items = [items, ...this.items,];
		else throw new Error('Invalid parameters!');
		this._renderItems(this.items, appendToTop);
	}

	update(id, data) {
		let item = this.items.find(el => this._getMappingKeyValue(el, this.options.settings.contentMapping.idKey) === id);
		let index = this.items.indexOf(item);
		this.items[index] = data;
		let itemHolder = this._renderItem(this.items[index]);
		this.onRenderEnd({ items: [item], containers: [itemHolder] });
	}

	remove(id) {
		this.items = this.items.filter(el => this._getMappingKeyValue(el, this.options.settings.contentMapping.idKey) !== id);
		let node = this._state.listViewItemsContainer.querySelector(`[data-id="${encodeURI(id)}"`);
		if (node) node.remove();
	}
	//================================================================================================            
	onItemRender() { }

	onItemClick() { }

	onItemActionClick() { }

	onItemRendered() { }

	onRenderEnd() { }
	//================================================================================================     
	refresh() {
		if (this._state.listViewHeaderContainer) this._state.listViewHeaderContainer.remove();
		if (this._state.listViewSearchBarContainer) this._state.listViewSearchBarContainer.remove();

		this._initializeSearchBar();
		this._initializeHeaderContent();
		this._updateEmptyState()
	}

	reset() {
		let items = this.items;
		this.refresh();
		this.clear();
		this.items = items;
		this._renderItems(items);
	}


	reload() {
		if (this._state.listViewHeaderContainer) this._state.listViewHeaderContainer.remove();
		if (this._state.listViewSearchBarContainer) this._state.listViewSearchBarContainer.remove();
		this._initializeSearchBar();
		this._initializeHeaderContent();

		const items = this.items;
		if (this.onDataRequest) {
			this.onDataRequest({ searchValue: '', page: this.options?.settings?.paginationOptions?.page || 0, pageSize: this.options?.settings?.paginationOptions?.pageSize || 10 }, (items) => {
				this.clear();
				debugger
				this.items = items;
				this._renderItems(items);
			});
		} else {
			this.clear();
			this.items = items;
			this._renderItems(items);
		}
	}

	rebuild() {
		if (this._state.listViewHeaderContainer) this._state.listViewHeaderContainer.remove();
		if (this._state.listViewSearchBarContainer) this._state.listViewSearchBarContainer.remove();
		this._initializeSearchBar();
		this._initializeHeaderContent();
		this.clear();
	}

	clear() {
		this._state.listViewItemsContainer.innerHTML = '';
		this.items = [];
		this._updateEmptyState();
	}

	_createUIElement(tag, className, innerHTML = null, src = null) {
		let element = document.createElement(tag);

		className ? element.className = className : null;
		innerHTML ? element.innerHTML = innerHTML : null;
		if (tag == 'img') element.src = src;
		return element;
	}

	_loadDrawerScript(url) {
		if (!document.head)
			throw new Error('please add head element to the document first to use Drawer component');

		if (typeof (buildfire.components) == 'undefined' || typeof (buildfire.components.drawer) == 'undefined') {
			let head = document.head,
				script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = url;
			script.onload = () => {
				console.info('loaded drawer component successfully');
			};
			script.onerror = () => {
				console.error('failed to load drawer component');
			};
			head.appendChild(script);
		}
	}
	_loadSkeletonScript(url) {
		if (!document.head)
			throw new Error('please add head element to the document first to use Drawer component');

		if (typeof (buildfire.components) == 'undefined' || typeof (buildfire.components.skeleton) == 'undefined') {
			let head = document.head,
				script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = url;
			script.onload = () => {
				let head = document.head;
				let link = document.createElement('link');
				link.rel = 'stylesheet';
				link.type = 'text/css';
				link.href = '../../../styles/components/skeleton.css';
				head.appendChild(link);
				console.info('loaded skeleton component successfully');
			};
			script.onerror = () => {
				console.error('failed to load drawer component');
			};
			head.appendChild(script);
		}
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
};
