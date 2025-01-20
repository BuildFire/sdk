'use strict';

if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use carousel components');

if (typeof (buildfire.components) == 'undefined')
	buildfire.components = {};

if (typeof (buildfire.components.carousel) == 'undefined')
	buildfire.components.carousel = {};

buildfire.components.carousel._resizeImage = function (url, options) {
	if (!url) {
		return '';
	}
	else {
		return buildfire.imageLib.resizeImage(url, options);
	}
};

buildfire.components.carousel._cropImage = function (url, options) {
	if (!url) {
		return '';
	}
	else {
		return buildfire.imageLib.cropImage(url, options);
	}
};

buildfire.components.carousel._getDomSelector = function (selector) {
	if (selector && selector.nodeType && selector.nodeType === 1) {
		return selector;
	} else if (typeof (selector) === 'string') {
		selector = document.querySelector(selector);
		if (selector) {
			return selector;
		}
		throw 'selector is not a valid DOM selector';
	}
	throw 'selector is not a valid DOM element nor string selector';
};

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.carousel.editor = function (selector, items, speed, order, display) {
	// carousel editor requires Sortable.js
	if (typeof (Sortable) == 'undefined') throw ('please add Sortable first to use carousel components');
	this.settings=(speed)?{speed:speed,order:order,display:display}:null;
	this.selector = selector;
	this.items = [];
	this.init(selector);
	this.loadItems(items);
};


// Carousel editor methods
buildfire.components.carousel.editor.prototype = {
	// will be called to initialize the setting in the constructor
	init: function (selector) {
		this.selector = buildfire.components.carousel._getDomSelector(selector);
		this._renderTemplate();
		if(this.settings){
			this._appendSettings();
			this.setOptionSpeed(this.settings.speed);
			this.setOptionOrder(this.settings.order);
			this.setOptionDisplay(this.settings.display);
		}
		this.itemsContainer = this.selector.querySelector('.carousel-items');
		this._initEvents();
	},
	// This will be triggered when you edit existing item details
	onItemChange: function (item, index) {
		throw ('please handle onItemChange');
	},
	/* This will be triggered when the order of items changes
     Example: if you move the first item location to be the second this will return item object, 0, 1 */
	onOrderChange: function (item, oldIndex, newIndex) {
		console.warn('please handle onOrderChange', item, oldIndex, newIndex);
	},
	// This will be triggered when you add a new item, item index will be items.length
	onAddItems: function (items) {
		console.warn('please handle onAddItems', items);
	},
	onOptionSpeedChange:function (speed){
		console.warn('please handle onOptionSpeedChange', speed);
	},
	onOptionOrderChange:function (order){
		console.warn('please handle onOptionOrderChange', order);
	},
	onOptioDisplayChange:function (display){
		console.warn('please handle onOptioDisplayChange', display);
	},
	// This will be triggered when you delete an item
	onDeleteItem: function (item, index) {
		console.warn('please handle onDeleteItem', item);
	},
	setOptionSpeed: function (speed) {
		speed = (this.speedArray.map(el=>{return el.text;}).includes(speed))?this.speedArray.find(el=>el.text==speed).value:speed;
		this.settings.speed = (this.speedArray.map(el=>{return el.value;}).includes(Number(speed)))?speed:this.defaultSettings.speed;
		this.speedDropdownElements?._updateDropdownValue(Number(this.settings.speed));
	},
	setOptionOrder: function (order) {
		order = (this.orderArray.map(el=>{return el.text;}).includes(order))?this.orderArray.find(el=>el.text==order).value:order;
		this.settings.order = (this.orderArray.map(el=>{return el.value;}).includes(Number(order)))?order:this.defaultSettings.order;
		this.orderDropdownElements?._updateDropdownValue(Number(this.settings.order));
	},
	setOptionDisplay: function (display) {
		display = (this.displayArray.map(el=>{return el.text;}).includes(display))?this.displayArray.find(el=>el.text==display).value:display;
		this.settings.display = (this.displayArray.map(el=>{return el.value;}).includes(Number(display)))?display:this.defaultSettings.display;
		this.displayDropdownElements?._updateDropdownValue(Number(this.settings.display));
	},
	// this method allows you to replace the slider image or append to then if appendItems = true
	loadItems: function (items, appendItems) {
		if (items && items instanceof Array) {
			if (!appendItems && this.items.length !== 0) {
				// here we want to remove any existing items since the user of the component don't want to append items
				this._removeAll();
			}

			for (var i = 0; i < items.length; i++) {
				this.items.push(items[i]);
				this._appendItem(items[i]);
			}
		}
	},
	// allows you to append a single item or an array of items
	append: function (items) {
		if (!items)
			return;
		else if (!(items instanceof Array) && typeof(items) == 'object')
			items = [items];

		this.loadItems(items, true);
	},
	// remove all items in list
	clear: function () {
		this._removeAll();
		this.onDeleteItem();
	},
	// remove all the DOM element and empty the items array
	_removeAll: function () {
		this.items = [];
		var fc = this.itemsContainer.firstChild;
		while (fc) {
			this.itemsContainer.removeChild(fc);
			fc = this.itemsContainer.firstChild;
		}
	},
	// append new sortable item to the DOM
	_appendItem: function (item) {
		var me = this,
			// Create the required DOM elements
			listItem = document.createElement('div'),
			listItemDetails = document.createElement('div'),
			dragDropIcon = document.createElement('span'),
			listItemImageContainer = document.createElement('div'),
			image = document.createElement('img'),
			listItemTitle = document.createElement('span'),
			listItemActions = document.createElement('div'),
			addEditButton = document.createElement('div'),
			deleteButton = document.createElement('div');

		// Add the required classes to the elements
		listItem.className = 'd-item border-grey';
		listItemDetails.className = 'list-item-details';
		dragDropIcon.className = 'icon sdk-icon-drag';
		listItemImageContainer.className = 'media-holder';
		listItemTitle.className = 'title ellipsis';
		listItemActions.className = 'list-item-actions';
		addEditButton.className = (item.action && item.action != 'noAction') ? 'sdk-icon-edit' : 'sdk-icon-primary-add';
		deleteButton.className = 'sdk-icon-close';

		image.src = buildfire.components.carousel._resizeImage(item.iconUrl, {width: 48, height: 29});
		listItemTitle.innerHTML = item.title;

		// Append elements to the DOM
		listItemDetails.appendChild(dragDropIcon);
		listItemImageContainer.appendChild(image);
		listItemDetails.appendChild(listItemImageContainer);
		listItemDetails.appendChild(listItemTitle);

		listItemActions.appendChild(addEditButton);
		listItemActions.appendChild(deleteButton);

		listItem.appendChild(listItemDetails);
		listItem.appendChild(listItemActions);
		me.itemsContainer.appendChild(listItem);

		// initialize the required events on the current item
		(function () {
			addEditButton.addEventListener('click', function (e) {
				e.preventDefault();
				var itemIndex = me._getItemIndex(item);
				var currentTarget = e.target;
				var parentElement = currentTarget.parentNode.parentNode;
				me._openActionItem(item, function (actionItem) {
					me.items[itemIndex] = actionItem;
					item = actionItem;
					me.onItemChange(actionItem, itemIndex);
					parentElement.querySelector('img').src = buildfire.components.carousel._resizeImage(actionItem.iconUrl, {
						width: 48,
						height: 29
					});
					parentElement.querySelector('.title').innerHTML = actionItem.title;
					currentTarget.className = actionItem.action && actionItem.action != 'noAction' ? 'sdk-icon-edit' : 'sdk-icon-primary-add';
				});
			});

			deleteButton.addEventListener('click', function (e) {
				e.preventDefault();
				var itemIndex = me._getItemIndex(item),
					parent = this.parentNode.parentNode;
				if (itemIndex != -1) {
					me.items.splice(itemIndex, 1);
					parent.parentNode.removeChild(parent);
					me.onDeleteItem(item, itemIndex);
				}
			});
		})(item);
	},
	_appendSettings: function (){
		var me=this;
		me.speedArray = [{text:'Still',value:0},{text:'1 sec',value:1000},{text:'2 sec',value:2000},{text:'3 sec',value:3000},
			{text:'4 sec',value:4000},{text:'5 sec',value:5000},{text:'7 sec',value:7000},{text:'10 sec',value:10000},{text:'15 sec',value:15000}];
		me.orderArray = [{text:'In order',value:0},{text:'Random',value:1}];
		me.displayArray = [{text:'All images',value:0},{text:'One image',value:1}];

		me.defaultSettings={speed:me.speedArray[5].value,order:me.orderArray[0].value,display:me.displayArray[0].value};

		if(!me.settings)me.settings={speed:me.defaultSettings.speed,order:me.defaultSettings.order,display:me.defaultSettings.display};

		if(!me.settings.speed)me.settings.speed=me.defaultSettings.speed;
		if(!me.settings.order)me.settings.order=me.defaultSettings.order;
		if(!me.settings.display)me.settings.display=me.defaultSettings.display;

		let settingsContainer = me.selector.querySelector('.settings-container');
		let dropdownsContainer = document.createElement('div');
		settingsContainer.appendChild(dropdownsContainer);

		let speedDropdown = document.createElement('div');
		let speedDropdownLabel = document.createElement('span');
		let speedSelector = document.createElement('div');
		speedDropdown.appendChild(speedDropdownLabel);
		dropdownsContainer.appendChild(speedDropdown);
		speedDropdownLabel.innerHTML = 'Speed';
		speedDropdown.className='screen layouticon';
		speedDropdownLabel.className='labels medium';
		speedSelector.className = 'change-speed';
		speedDropdown.appendChild(speedSelector);
		let speedOptions = { dropdownValue: this.settings.speed, dropdownOptions: me.speedArray };
		this.speedDropdownElements = new carouselDropdown('.change-speed', speedOptions);
		this.speedDropdownElements.onDropdownValueChange = (value) => {
			me.onOptionSpeedChange(String(value)); // convert to string for backward compatibility
		};

		let orderDropdown = document.createElement('div');
		let orderDropdownLabel = document.createElement('span');
		let orderSelector = document.createElement('div');
		orderDropdown.appendChild(orderDropdownLabel);
		dropdownsContainer.appendChild(orderDropdown);
		orderDropdownLabel.innerHTML = 'Order';
		orderDropdown.className='screen layouticon';
		orderDropdownLabel.className='labels medium';
		orderSelector.className = 'change-random';
		orderDropdown.appendChild(orderSelector);
		let orderOptions = { dropdownValue: this.settings.order, dropdownOptions: me.orderArray };
		this.orderDropdownElements = new carouselDropdown('.change-random', orderOptions);
		this.orderDropdownElements.onDropdownValueChange = (value) => {
			me.onOptionOrderChange(String(value)); // convert to string for backward compatibility
		};

		let displayDropdown = document.createElement('div');
		let displayDropdownLabel = document.createElement('span');
		let displaySelector = document.createElement('div');
		displayDropdown.appendChild(displayDropdownLabel);
		dropdownsContainer.appendChild(displayDropdown);
		displayDropdownLabel.innerHTML = 'Display';
		displayDropdown.className='screen layouticon';
		displayDropdownLabel.className='labels medium';
		displaySelector.className = 'change-display';
		displayDropdown.appendChild(displaySelector);
		let displayOptions = { dropdownValue: this.settings.display, dropdownOptions: me.displayArray };
		this.displayDropdownElements = new carouselDropdown('.change-display', displayOptions);
		this.displayDropdownElements.onDropdownValueChange = (value) => {
			me.onOptionDisplayChange(String(value)); // convert to string for backward compatibility
		};
	},
	// render the basic template HTML
	_renderTemplate: function () {
		var carouselEditor = document.createElement('div');
		var carouselEditorTitle = document.createElement('span');
		var carouselEditorContent = document.createElement('div');
		var carouselEditorSettings = document.createElement('div');
		var addImageButton = document.createElement('a');
		var listItems = document.createElement('div');

		carouselEditor.className = 'item carousel-editor';
		carouselEditorTitle.innerHTML = 'Image Carousel';
		carouselEditorContent.className = 'main';
		carouselEditorSettings.className = 'settings-container';
		addImageButton.className = 'btn btn-success add-new-carousel btn-plus-icon-with-text';
		listItems.className = 'carousel-items hide-empty draggable-list-view margin-top-twenty margin-bottom-twenty border-radius-four';

		addImageButton.innerHTML = '+ Add Image';
        
		carouselEditor.appendChild(carouselEditorTitle);
		carouselEditorSettings.appendChild(addImageButton);
		carouselEditorContent.appendChild(carouselEditorSettings);
		carouselEditorContent.appendChild(listItems);
		carouselEditor.appendChild(carouselEditorContent);

		this.selector.appendChild(carouselEditor);
	},
	// initialize the generic events
	_initEvents: function () {
		var me = this;
		var oldIndex = 0;

		me.selector.querySelector('.add-new-carousel').addEventListener('click', function () {
			me._openImageLib(function (imageUrls) {
				var newItems = [], currentItem = null;
				for (var i = 0; i < imageUrls.length; i++) {
					currentItem = buildfire.actionItems.create(null, imageUrls[i], 'image');
					if (!currentItem.action) {
						currentItem.action = 'noAction';
					}

					newItems.push(currentItem);
					currentItem = null;
				}

				if (newItems.length) {
					me.loadItems(newItems, true);
					me.onAddItems(newItems);
				}
			});
		});

		// initialize the sort on the container of the items
		me.sortableList = Sortable.create(me.itemsContainer, {
			animation: 150,
			onUpdate: function (evt) {
				var newIndex = me._getSortableItemIndex(evt.item);
				var tmp = me.items[oldIndex];

				if (oldIndex < newIndex) {
					for (var i = oldIndex + 1; i <= newIndex; i++) {
						me.items[i - 1] = me.items[i];
					}
				} else {
					for (var i = oldIndex - 1; i >= newIndex; i--) {
						me.items[i + 1] = me.items[i];
					}
				}

				me.items[newIndex] = tmp;
				me.onOrderChange(tmp, oldIndex, newIndex);
			},
			onStart: function (evt) {
				oldIndex = me._getSortableItemIndex(evt.item);
			}
		});
	},
	// a wrapper method over buildfire showDialog
	_openActionItem: function (item, callback) {
		buildfire.actionItems.showDialog(item, {showIcon: true, allowNoAction: true}, function (err, actionItem) {
			if (err)
				console.error('Error getting item details: ', err);
			else {
				if (actionItem) {
					callback(actionItem);
				}
			}
		});
	},
	// a wrapper method over buildfire imageLib showDialog
	_openImageLib: function (callback) {
		buildfire.imageLib.showDialog({multiSelect: true, showIcons: false}, function (err, result) {
			if (err)
				console.error('Error getting images: ', err);
			else
				callback(result.selectedFiles);
		});
	},
	// get item index in the items array
	_getItemIndex: function (item) {
		return this.items.indexOf(item);
	},
	// get item index from the DOM sortable elements
	_getSortableItemIndex: function (item) {
		var index = 0;
		while ((item = item.previousSibling) != null) {
			index++;
		}
		return index;
	}
};

let carouselDropdown = function(selector, options) {
	this.selector = buildfire.components.carousel._getDomSelector(selector);
	this.options = options;
	this.init();
};

carouselDropdown.prototype = {
	init: function() {
		let self = this;
		const { dropdownValue, dropdownOptions } = this.options;
		const dropdown = document.createElement('div');
		dropdown.className = 'btn-group margin-right-fifteen';

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'btn btn-default dropdown-toggle dropdown-button';
		button.setAttribute('data-toggle', 'dropdown');
		button.setAttribute('aria-haspopup', 'true');
		button.setAttribute('aria-expanded', 'false');
		button.onclick = (e) => {
			e.stopPropagation();
			self._toggleDropdown(dropdown);
			document.body.addEventListener('click', function() {
				self._toggleDropdown(dropdown, true);
			}, { once: true });
		};

		const buttonText = document.createElement('span');
		buttonText.className = 'dropdown-text';
		const selectedOption = dropdownOptions.find(option => option.value === dropdownValue);
		buttonText.textContent = selectedOption ? selectedOption.text : dropdownOptions[0].text;
		const arrowContainer = document.createElement('span');
		const caret = document.createElement('span');
		caret.className = 'caret';
		arrowContainer.appendChild(caret);

		button.appendChild(buttonText);
		button.appendChild(arrowContainer);

		// Create the ul element
		const ul = document.createElement('ul');
		ul.className = 'dropdown-menu';
		ul.setAttribute('role', 'menu');

		dropdownOptions.forEach((option) => {
			const li = document.createElement('li');
			const a = document.createElement('a');
			a.onclick = () => {
				self.onDropdownValueChange(option.value);
				buttonText.textContent = option.text;
			};
			a.textContent = option.text;
			li.appendChild(a);
			ul.appendChild(li);
		});

		dropdown.appendChild(button);
		dropdown.appendChild(ul);

		this.selector.appendChild(dropdown);
	},
	onDropdownValueChange: (value) => {
		console.warn('please handle onDropdownValueChange', value);
	},
	_updateDropdownValue: function(dropdownValue) {
		const selectedOption = this.options.dropdownOptions.find(option => option.value === dropdownValue);
		this.selector.querySelector('.dropdown-text').textContent = selectedOption.text;
	},
	_toggleDropdown: function(dropdownElement, forceClose) {
		if (!dropdownElement) {
			return;
		}
		if (dropdownElement.classList.contains('open') || forceClose) {
			dropdownElement.classList.remove('open');
			dropdownElement.querySelector('button').blur(); // remove the focus effect on the button
		} else {
			document.body.click(); // close any other open dropdowns
			dropdownElement.classList.add('open');
		}
	}
};