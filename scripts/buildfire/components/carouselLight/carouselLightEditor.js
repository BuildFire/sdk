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
buildfire.components.carousel.editor = function (selector, items, speed, order, display) {//added
	// carousel editor requires Sortable.js
	if (typeof (Sortable) == 'undefined') throw ('please add Sortable first to use carousel components');
	this.settings=(speed)?{speed:speed,order:order,display:display}:null;//added
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
	onOptionSpeedChange:function (speed){//added
		console.warn('please handle onOptionSpeedChange', speed);//added
	},//added
	onOptionOrderChange:function (order){//added
		console.warn('please handle onOptionOrderChange', order);//added
	},//added
	onOptioDisplayChange:function (display){//added
		console.warn('please handle onOptioDisplayChange', display);//added
	},//added
	// This will be triggered when you delete an item
	onDeleteItem: function (item, index) {
		console.warn('please handle onDeleteItem', item);
	},
	setOptionSpeed: function (speed) {//added
		if(!this.settings)this._appendSettings();//added

		speed=(this.speedArray.map(el=>{return el.text;}).includes(speed))?this.speedArray.find(el=>el.text==speed).value:speed;
		this.settings.speed=(this.speedArray.map(el=>{return el.value;}).includes(Number(speed)))?speed:this.defaultSettings.speed;//added

		var speedSelect=this.selector.querySelector('.change-speed');//added
		speedSelect.value=Number(this.settings.speed);//added
	},//added
	setOptionOrder: function (order) {//added
		if(!this.settings)this._appendSettings();

		order=(this.orderArray.map(el=>{return el.text;}).includes(order))?this.orderArray.find(el=>el.text==order).value:order;
		this.settings.order=(this.orderArray.map(el=>{return el.value;}).includes(Number(order)))?order:this.defaultSettings.order;//added

		var orderSelect=this.selector.querySelector('.change-random');//added
		orderSelect.value=Number(this.settings.order);//added
	},//added
	setOptionDisplay: function (display) {//added
		if(!this.settings)this._appendSettings();

		display=(this.displayArray.map(el=>{return el.text;}).includes(display))?this.displayArray.find(el=>el.text==display).value:display;
		this.settings.display=(this.displayArray.map(el=>{return el.value;}).includes(Number(display)))?display:this.defaultSettings.display;//added

		var displaySelect=this.selector.querySelector('.change-display');//added
		displaySelect.value=Number(this.settings.display);//added
	},//added
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
			wrapper = document.createElement('div'),
			moveHandle = document.createElement('span'),
			mediaHolder = document.createElement('div'),
			image = document.createElement('img'),
			details = document.createElement('div'),
			title = document.createElement('span'),
			actionsWrapper = document.createElement('div'),
			editButton = document.createElement('a'),
			deleteButton = document.createElement('span');

		// Add the required classes to the elements
		wrapper.className = 'd-item';
		moveHandle.className = 'icon icon-menu pull-left';
		mediaHolder.className = 'media-holder pull-left';
		details.className = 'copy pull-right';
		title.className = 'title ellipsis';
		actionsWrapper.className = 'pull-right';
		editButton.className = 'text-primary text';
		deleteButton.className = 'btn-icon btn-delete-icon btn-danger transition-third';

		image.src = buildfire.components.carousel._resizeImage(item.iconUrl, {width: 80, height: 40});
		title.innerHTML = item.title;
		editButton.innerHTML = (item.action && item.action != 'noAction') ? 'Edit Action/Link' : 'Add Action/Link';

		// Append elements to the DOM
		wrapper.appendChild(moveHandle);
		wrapper.appendChild(mediaHolder);
		mediaHolder.appendChild(image);
		details.appendChild(title);

		actionsWrapper.appendChild(editButton);
		actionsWrapper.appendChild(deleteButton);

		details.appendChild(actionsWrapper);

		wrapper.appendChild(details);
		me.itemsContainer.appendChild(wrapper);

		// initialize the required events on the current item
		(function () {
			editButton.addEventListener('click', function (e) {
				e.preventDefault();
				var itemIndex = me._getItemIndex(item);
				var currentTarget = e.target;
				var parentElement = currentTarget.parentNode.parentNode.parentNode;
				me._openActionItem(item, function (actionItem) {
					me.items[itemIndex] = actionItem;
					item = actionItem;
					me.onItemChange(actionItem, itemIndex);
					parentElement.querySelector('img').src = buildfire.components.carousel._resizeImage(actionItem.iconUrl, {
						width: 80,
						height: 40
					});
					parentElement.querySelector('.title').innerHTML = actionItem.title;
					currentTarget.innerHTML = actionItem.action && actionItem.action != 'noAction' ? 'Edit Action' : 'Add Action';
				});
			});

			deleteButton.addEventListener('click', function (e) {
				e.preventDefault();
				var itemIndex = me._getItemIndex(item),
					parent = this.parentNode.parentNode.parentNode;
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
		me.orderArray = [{text:'In order',value:0},{text:'Random',value:1}];//added
		me.displayArray = [{text:'All images',value:0},{text:'One image',value:1}];//added

		me.defaultSettings={speed:me.speedArray[5].value,order:me.orderArray[0].value,display:me.displayArray[0].value};

		if(!me.settings)me.settings={speed:me.defaultSettings.speed,order:me.defaultSettings.order,display:me.defaultSettings.display};

		if(!me.settings.speed)me.settings.speed=me.defaultSettings.speed;
		if(!me.settings.order)me.settings.order=me.defaultSettings.order;
		if(!me.settings.display)me.settings.display=me.defaultSettings.display;

		var editContainer = document.createElement('div');//added

		var speedDropDown = document.createElement('div');// added
		var speedDropDownLabel = document.createElement('span');//added
		var selector =  document.createElement('select');//added

		me.speedArray.forEach(el=>{//added
			var opt = document.createElement('option');//added
			opt.value = el.value;//added
			opt.innerHTML = el.text;//added
			selector.appendChild(opt);//added
		});

		var orderDropDown = document.createElement('div');// added
		var orderDropDownLabel = document.createElement('span');//added
		var orderSelector =  document.createElement('select');//added
        
		me.orderArray.forEach(el=>{//added
			var opt = document.createElement('option');//added
			opt.value = el.value;//added
			opt.innerHTML = el.text;//added
			orderSelector.appendChild(opt);//added
		});

		var displayDropDown = document.createElement('div');// added
		var displayDropDownLabel = document.createElement('span');//added
		var displaySelector =  document.createElement('select');//added
        
		me.displayArray.forEach(el=>{//added
			var opt = document.createElement('option');//added
			opt.value = el.value;//added
			opt.innerHTML = el.text;//added
			displaySelector.appendChild(opt);//added
		});

		speedDropDown.className='screen layouticon pull-left';//added
		selector.className='form-control dropdown margin-left-zero change-speed';//added
		speedDropDownLabel.className='labels pull-left medium';//added

		editContainer.setAttribute('style','margin-left:94px;');//added
		speedDropDownLabel.setAttribute('style','font-size:13px!important; margin-right:4px; margin-left: 1px; margin-top:7px;');//added
		selector.setAttribute('style','padding-left:0px; padding-right:0px; appearance:auto; font-size: 12px; width:62px ; -moz-appearance: menulist; -webkit-appearance: menulist;');//added

		orderDropDown.className='screen layouticon pull-left';//added
		orderSelector.className='form-control dropdown margin-left-zero change-random';//added
		orderDropDownLabel.className='labels pull-left medium';//added

		orderDropDownLabel.setAttribute('style','font-size:13px!important; margin-right:4px; margin-left:4px; margin-top:7px;');//added
		orderSelector.setAttribute('style','padding-left:0px; padding-right:0px; appearance:auto; font-size: 12px; width:70px; -moz-appearance: menulist; -webkit-appearance: menulist;');//added


		displayDropDown.className='screen layouticon pull-left';//added
		displaySelector.className='form-control dropdown margin-left-zero change-display';//added
		displayDropDownLabel.className='labels pull-left medium';//added

		displayDropDownLabel.setAttribute('style','font-size:13px!important; margin-right:4px; margin-left:4px; margin-top:7px;');//added
		displaySelector.setAttribute('style','padding-left:0px; padding-right:0px; appearance:auto; font-size: 12px; width:84px; -moz-appearance: menulist; -webkit-appearance: menulist;');//added

		displayDropDownLabel.innerHTML = 'Display';//added

		orderDropDownLabel.innerHTML = 'Order';//added

		speedDropDownLabel.innerHTML = 'Speed';//added

		var container = me.selector.querySelector('.settings-container');
		container.appendChild(editContainer);//added

		editContainer.appendChild(speedDropDownLabel);//added
		editContainer.appendChild(speedDropDown);//added
		speedDropDown.appendChild(selector);//added

		editContainer.appendChild(orderDropDownLabel);//added
		editContainer.appendChild(orderDropDown);//added
		orderDropDown.appendChild(orderSelector);//added

		editContainer.appendChild(displayDropDownLabel);//added
		editContainer.appendChild(displayDropDown);//added
		displayDropDown.appendChild(displaySelector);//added
        
		// initialize add new item button
		var speedSelect=me.selector.querySelector('.change-speed');//added
		speedSelect.addEventListener('change', function () {//added
			me.onOptionSpeedChange(speedSelect.options[speedSelect.selectedIndex].value);//added
		});//added
		var randomSelect=me.selector.querySelector('.change-random');//added
		randomSelect.addEventListener('change', function () {//added
			me.onOptionOrderChange(randomSelect.options[randomSelect.selectedIndex].value);//added
		});//added
		var displaySelect=me.selector.querySelector('.change-display');//added
		displaySelect.addEventListener('change', function () {//added
			me.onOptionDisplayChange(displaySelect.options[displaySelect.selectedIndex].value);//added
		});//added
	}
	,
	// render the basic template HTML
	_renderTemplate: function () {
		var componentContainer = document.createElement('div');
		var componentName = document.createElement('span');
		var contentContainer = document.createElement('div');
		var buttonContainer = document.createElement('div');
		var button = document.createElement('a');
		var sliderContainer = document.createElement('div');

		componentContainer.className = 'item clearfix row';
		componentName.className = 'labels col-md-3 padding-right-zero pull-left';
		componentName.innerHTML = 'Image Carousel';
		contentContainer.className = 'main col-md-9 pull-right';
		buttonContainer.className = 'clearfix settings-container';
		button.className = 'btn btn-success pull-left add-new-carousel';
		sliderContainer.className = 'carousel-items hide-empty draggable-list-view margin-top-twenty border-radius-four border-grey';

		button.innerHTML = 'Add Image';
		button.classList.add('btn-plus-icon-with-text');
        
		componentContainer.appendChild(componentName);
		buttonContainer.appendChild(button);
		contentContainer.appendChild(buttonContainer);
		contentContainer.appendChild(sliderContainer);
		componentContainer.appendChild(contentContainer);

		this.selector.appendChild(componentContainer);
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