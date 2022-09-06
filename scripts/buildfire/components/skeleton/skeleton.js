if (typeof buildfire == 'undefined')
	throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

buildfire.components.skeleton = class SkeletonLoader {
	constructor(containersSelector, options = {}) {
		this.rootContainers = Array.from(
			document.querySelectorAll(containersSelector)
		).filter(
			(c) =>
				![...c.childNodes].some((i) =>
					i.classList.contains('bf-skeleton-container')
				)
		);

		this.options = options;
		this.options.hideContent =
			typeof options.hideContent !== 'undefined' ? options.hideContent : true;

		if (!this.rootContainers?.length) {
			this._log(`Invalid selector given: ${containersSelector}`, 'error');
		} else if (!options.type) {
			this._log('skeleton type param is not provided', 'error');
		} else {
			this.init();
		}
	}

	init() {
		this.containers = [];
		Array.from(this.rootContainers).forEach((c) => {
			const container = document.createElement('div');
			container.classList.add('bf-skeleton-container');
			c.appendChild(container);
			this.containers.push(container);
		});
	}

	start() {
		if (!this.containers?.length) {
			this.init();
		}

		if (!this.options.type) {
			return this._log('cannot start without providing a type');
		}

		this._hideNonSkeletons();
		this._append(this.options.type);
		return this;
	}

	stop() {
		this.containers.forEach((c) => c.remove());
		this._showNonSkeletons();
		this.containers = null;
	}

	_hideNonSkeletons() {
		if (this.options.hideContent) {
			this.rootContainers.forEach((r) => r.classList.add('bf-skeleton-root'));
		}
	}

	_showNonSkeletons() {
		if (this.options.hideContent) {
			this.rootContainers.forEach((r) =>
				r.classList.remove('bf-skeleton-root')
			);
		}
	}

	_append(items) {
		const itemsList = items.replace(/\s/g, '').split(',');

		itemsList.forEach((i) => {
			const type = i.replace(/-/g, '_').toUpperCase();
			if (SkeletonLoader.CompositeTypes[type]) {
				return this._append(SkeletonLoader.CompositeTypes[type]);
			} else if (SkeletonLoader.Types[type]) {
				const item = this._generateSkeleton(type);
				this.containers.forEach((c) => c.appendChild(item.cloneNode(true)));
			} else {
				throw `Invalid type given: ${i}`;
			}
		});
	}

	_generateSkeleton(type) {
		const _type = type.replace(/-/g, '_').toUpperCase();
		const item = SkeletonLoader.Types[_type];
		const parent = this._createElement({
			tagName: item.parent.tagName,
			className: item.parent.className,
		});

		if (item.children?.length) {
			item.children.forEach((i) => {
				if (i.isSkeleton) {
					parent.appendChild(this._generateSkeleton(i.typeName));
				} else {
					this._createElement({
						tagName: i.tagName,
						className: i.className,
						parent,
					});
				}
			});
		}

		return parent;
	}

	_createElement(options) {
		const { tagName, className, parent } = options;
		const el = document.createElement(tagName);
		el.className = className;

		if (parent) parent.appendChild(el);
		return el;
	}

	static _colorToRGB(color) {
		const isHexColor = (color) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(color);
		const isRGBColor = (color) =>
			/^rgb[(](?:\s*0*(?:\d\d?(?:\.\d+)?(?:\s*%)?|\.\d+\s*%|100(?:\.0*)?\s*%|(?:1\d\d|2[0-4]\d|25[0-5])(?:\.\d+)?)\s*(?:,(?![)])|(?=[)]))){3}[)]$/gm.test(
				color
			);
		const isRGBaColor = (color) =>
			/^rgba[(](?:\s*0*(?:\d\d?(?:\.\d+)?(?:\s*%)?|\.\d+\s*%|100(?:\.0*)?\s*%|(?:1\d\d|2[0-4]\d|25[0-5])(?:\.\d+)?)\s*,){3}\s*0*(?:\.\d+|1(?:\.0*)?)\s*[)]$/gm.test(
				color
			);
		const getChunksFromString = (st, chunkSize) =>
			st.match(new RegExp(`.{${chunkSize}}`, 'g'));
		const convertHexUnitTo256 = (hexStr) =>
			parseInt(hexStr.repeat(2 / hexStr.length), 16);

		if (isHexColor(color)) {
			const chunkSize = Math.floor((color.length - 1) / 3);
			const hexArr = getChunksFromString(color.slice(1), chunkSize);
			const [r, g, b] = hexArr.map(convertHexUnitTo256);
			return `${r}, ${g}, ${b}`;
		} else if (isRGBColor(color)) {
			return color.replace(/[^\d,]/g, '');
		} else if (isRGBaColor(color)) {
			let rgba = color.replace(/[^\d,]/g, '');
			return rgba.slice(0, rgba.lastIndexOf(','));
		} else {
			throw new Error('INVALID COLOR VALUE');
		}
	}

	_log(message, type = 'warn') {
		if (type === 'error') {
			throw new Error(message);
		} else {
			console[type](`skeleton.js: ${message}`);
		}
	}

	static get Types() {
		return {
			TEXT: {
				parent: {
					tagName: 'span',
					className: 'bf-skeleton-loader skeleton-text',
				},
			},
			HEADING: {
				parent: {
					tagName: 'span',
					className: 'bf-skeleton-loader skeleton-heading',
				},
			},
			BUTTON: {
				parent: {
					tagName: 'span',
					className: 'bf-skeleton-loader skeleton-button',
				},
			},
			BUTTON_FULL: {
				parent: {
					tagName: 'span',
					className: 'bf-skeleton-loader skeleton-button--full-width',
				},
			},
			IMAGE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-image bf-skeleton-loader',
				},
			},
			AVATAR: {
				parent: {
					tagName: 'span',
					className: 'bf-skeleton-loader skeleton-avatar',
				},
			},
			CHIP: {
				parent: {
					tagName: 'span',
					className: 'bf-skeleton-loader skeleton-chip',
				},
			},
			CARD_HEADING: {
				parent: {
					tagName: 'span',
					className:
						'bf-skeleton-loader skeleton-heading skeleton-card-heading',
				},
			},
			ACTIONS: {
				parent: {
					tagName: 'div',
					className: 'skeleton-actions',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'button',
					},
					{
						isSkeleton: true,
						typeName: 'button',
					},
				],
			},
			PARAGRAPH: {
				parent: {
					tagName: 'div',
					className: 'skeleton-paragraph',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'text',
					},
					{
						isSkeleton: true,
						typeName: 'text',
					},
					{
						isSkeleton: true,
						typeName: 'text',
					},
				],
			},
			SENTENCE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-sentences',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'text',
					},
					{
						isSkeleton: true,
						typeName: 'text',
					},
				],
			},
			ARTICLE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-article',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'heading',
					},
					{
						isSkeleton: true,
						typeName: 'paragraph',
					},
				],
			},
			LIST_ITEM: {
				parent: {
					tagName: 'div',
					className: 'skeleton-list-item',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'text',
					},
				],
			},
			LIST_ITEM_TWO_LINE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-list-item-two-line',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'sentence',
					},
				],
			},
			LIST_ITEM_THREE_LINE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-list-item-three-line',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'paragraph',
					},
				],
			},
			LIST_ITEM_AVATAR: {
				parent: {
					tagName: 'div',
					className: 'skeleton-list-item-avatar',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'avatar',
					},
					{
						isSkeleton: true,
						typeName: 'text',
					},
				],
			},
			LIST_ITEM_AVATAR_TWO_LINE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-list-item-avatar-two-line',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'avatar',
					},
					{
						isSkeleton: true,
						typeName: 'sentence',
					},
				],
			},
			LIST_ITEM_AVATAR_THREE_LINE: {
				parent: {
					tagName: 'div',
					className: 'skeleton-list-item-avatar-three-line',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'avatar',
					},
					{
						isSkeleton: true,
						typeName: 'paragraph',
					},
				],
			},
			CARD_AVATAR: {
				parent: {
					tagName: 'div',
					className: 'skeleton-card-avatar',
				},
				children: [
					{
						isSkeleton: true,
						typeName: 'image',
					},
					{
						isSkeleton: true,
						typeName: 'list-item-avatar',
					},
				],
			},
		};
	}

	static get CompositeTypes() {
		return {
			CARD: 'image, card-heading',
		};
	}
};

window.onload = function () {
	const bodyTextColor = getComputedStyle(document.documentElement)
		.getPropertyValue('--bf-theme-body-text')
		.trim();
	const backgroundColor = getComputedStyle(document.documentElement)
		.getPropertyValue('--bf-theme-background')
		.trim();
	document.documentElement.style.setProperty(
		'--bf-theme-body-text-rgb',
		buildfire.components.skeleton._colorToRGB(bodyTextColor)
	);
	document.documentElement.style.setProperty(
		'--bf-theme-background-rgb',
		buildfire.components.skeleton._colorToRGB(backgroundColor)
	);
};
