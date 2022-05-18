if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

buildfire.components.listView = class ListView {
	constructor(containerId, options) {
		this.container = document.getElementById(containerId);
		if (!this.container) throw 'Cant find container';
		this.container.classList.add('listViewContainer', 'full-width');
		this.options = options || {};
		this.container.innerHTML = '';
		this.items = [];
	}

	clear() {
		this.container.innerHTML = '';
		this.items = [];
	}
	loadListViewItems(items) {
		this.items = [];
		if (this.container.innerHTML == '') {
			if (this.options.enableAddButton) {
				let addButton = document.createElement('button');
				addButton.classList = 'listViewAddButton btn btn--add btn--fab btn-primary';
				addButton.innerHTML = '<span></span>';
				this.container.appendChild(addButton);

				addButton.onclick = this.onAddButtonClicked;
			}
		}
		items.forEach(item => this.addItem(item));
	}

	addItem(item) {
		let t = this;
		if (!(item instanceof ListViewItem)) item = new ListViewItem(item);
		item.render(this.container);

		item.onClick = e => {
			t.onItemClicked(item, e);
		};
		item.onActionClicked = e => {
			t.onItemActionClicked(item, e);
		};
		this.items.push(item);
	}

	onAddButtonClicked() {
		console.log('Add Button Clicked');
	}

	onItemClicked(item) {
		console.log('Item Clicked', item);
	}

	onItemActionClicked(item) {
		console.log('Item Action Clicked', item);
	}
};

class ListViewItem {
	constructor(obj = {}) {
		this.id = obj.id;
		this.title = obj.title;
		this.imageUrl = obj.imageUrl;
		this.subtitle = obj.subtitle;
		this.description = obj.description;
		this.action = obj.action;
		this.data = obj.data;
	}

	toRawData() {
		return {
			id: this.id,
			title: this.title,
			imageUrl: this.imageUrl,
			subtitle: this.subtitle,
			description: this.description,
			action: this.action,
			data: this.data
		};
	}

	render(container, card) {
		this.container = container;

		if (card) {
			card.innerHTML = '';
		} else {
			card = document.createElement('div');
			card.className = 'listViewItem';
			container.appendChild(card);
		}

		this.card = card;

		let imgContainer = document.createElement('div');
		imgContainer.className = 'listViewItemImgContainer';
		this.card.appendChild(imgContainer);

		if (this.imageUrl) {
			let img = document.createElement('img');
			img.className = 'listViewItemImg';
			imgContainer.appendChild(img);

			if (this.imageUrl.indexOf('http') == 0) img.src = buildfire.imageLib.cropImage(this.imageUrl, { width: 128, height: 128 });
			else img.src = this.imageUrl;

			let i = document.createElement('i');
			i.className = 'listViewItemIcon';
			imgContainer.appendChild(i);
		}

		let listViewItemCopy = document.createElement('div');
		listViewItemCopy.className = 'listViewItemCopy ellipsis padded padded--m';
		this.card.appendChild(listViewItemCopy);

		let title = document.createElement('h5');
		title.className = 'listViewItemTitle ellipsis margin--0';
		title.innerHTML = this.title;
		listViewItemCopy.appendChild(title);

		if (this.subtitle) {
			let subtitle = document.createElement('p');
			subtitle.className = 'listViewItemSubtitle ellipsis margin--0';
			subtitle.innerHTML = this.subtitle;
			listViewItemCopy.appendChild(subtitle);
		}

		let t = this;

		if (this.description) {
			let description = document.createElement('p');
			description.className = 'listViewItemDescription ellipsis margin--0';
			description.innerHTML = this.description;
			listViewItemCopy.appendChild(description);
		}

		if (this.action) {
			const actionHolder = document.createElement('div');
			actionHolder.classList = 'action-holder';

			const actionIcon = document.createElement('span');
			actionIcon.classList = this.action.icon || 'icon glyphicon glyphicon-star-empty';
			actionHolder.appendChild(actionIcon);

			// if (this.action.actionItem) {
			// 	actionIcon.onclick = () => {
			// 		buildfire.actionItems.execute(this.action.actionItem);
			// 	};
			// }
			actionIcon.onclick = () => {
				this.onActionClicked();
			};

			this.card.appendChild(actionHolder);
		}

		listViewItemCopy.onclick = () => this.onClick(this);

		return card;
	}

	onClick() {
		console.log('Handle Item Click');
	}

	onActionClicked() {
		console.log('Handle Action Click');
	}

	update() {
		this.render(this.container, this.card);
	}
}
