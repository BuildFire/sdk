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
					i.classList?.contains('bf-skeleton-container')
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
		if (!color) throw new Error('MISSING COLOR VALUE');
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

		const colorNameToHex = (color) =>
		{
			var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
				"beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
				"cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
				"darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
				"darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
				"darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
				"firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
				"gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
				"honeydew":"#f0fff0","hotpink":"#ff69b4",
				"indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
				"lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
				"lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
				"lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
				"magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
				"mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
				"navajowhite":"#ffdead","navy":"#000080",
				"oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
				"palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
				"rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
				"saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
				"tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
				"violet":"#ee82ee",
				"wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
				"yellow":"#ffff00","yellowgreen":"#9acd32"};

			if (typeof colors[color.toLowerCase()] != 'undefined')
				return colors[color.toLowerCase()];

			return null;
		}

		const hexToRGB = (hex) =>
		{
			const chunkSize = Math.floor((hex.length - 1) / 3);
			const hexArr = getChunksFromString(hex.slice(1), chunkSize);
			const [r, g, b] = hexArr.map(convertHexUnitTo256);
			return `${r}, ${g}, ${b}`;
		}

		if (isHexColor(color)) {
			return hexToRGB(color);
		} else if (isRGBColor(color)) {
			return color.replace(/[^\d,]/g, '');
		} else if (isRGBaColor(color)) {
			let rgba = color.replace(/[^\d,]/g, '');
			return rgba.slice(0, rgba.lastIndexOf(','));
		} else {
			const hex = colorNameToHex(color);
			if (hex) {
				return hexToRGB(hex);
			}
			throw new Error(`INVALID COLOR VALUE: ${color}`);
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
