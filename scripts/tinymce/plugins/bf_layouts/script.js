let layouts;
let selectedLayout;
let targetExpressionInput;
const state = {
	get isRepeaterTurnedOn () {
		return document.getElementById('switchButton').checked;
	},
	get wasLinkDataPageOpened () {
		return document.getElementById('linkDataPage').style.display == 'block';
	}
};

let originalLayoutData;
let currentLayoutHtml;
let repeaterReplacementExpression;
let mainContainer = document.getElementById('main');

const queryString = window.location.search;
if (queryString) {
	const urlParams = new URLSearchParams(queryString);
	const data = urlParams.get('data');
	originalLayoutData = JSON.parse(data).layoutData;
}

fetch('./layouts.json')
	.then(response => response.json())
	.then((data) => {
		layouts = data;
		render(data);
		if (originalLayoutData) { // that is mean we are editing
			window.parent.postMessage({
				mceAction: 'getLayoutElement',
				data: {}
			}, origin);
		}
	})
	.catch(error => console.error(error));

function render(layouts) {
	if (originalLayoutData) {
		layouts = layouts.filter((layout) => {
			return layout.htmlUrl === originalLayoutData.htmlUrl;
		});
	}
	let rowDiv = document.createElement('div');
	layouts.forEach((item, index) => {
		let imageDiv = document.createElement('div');
		if (index === 0 && !originalLayoutData) {
			selectedLayout = item;
			imageDiv.classList.add('active');
		} else if (originalLayoutData) {
			if (originalLayoutData.id === item.id) {
				selectedLayout = item;
				imageDiv.classList.add('active');
			}
		}
		if (selectedLayout?.expressionFields) {
			let linkDataButton = document.getElementById('linkDataButton');
			linkDataButton.style.display = 'flex';
			linkDataButton.style.opacity = '1';
		}
		imageDiv.classList.add('imageDiv');
		let image = document.createElement('img');
		image.src = item.imageUrl;
		image.onclick = () => {
			let linkDataButton = document.getElementById('linkDataButton');
			document.getElementsByClassName('active')[0].classList.remove('active');
			imageDiv.classList.add('active');
			selectLayout(item.id);
			if (selectedLayout.expressionFields) {
				linkDataButton.style.display = 'flex';
				setTimeout(() => { linkDataButton.style.opacity = '1'; }, 0);
			} else {
				linkDataButton.style.opacity = '0';
				setTimeout(() => { linkDataButton.style.display = 'none'; }, 300);
			}
		};
		imageDiv.appendChild(image);
		if (index != 0 && index % 3 === 0) {
			mainContainer.appendChild(rowDiv);
			rowDiv = document.createElement('div');
			rowDiv.appendChild(imageDiv);
		} else {
			rowDiv.appendChild(imageDiv);
		}
	});
	mainContainer.appendChild(rowDiv);
}

function selectLayout(layoutId) {
	selectedLayout = layouts.find((layout) => {
		return layoutId === layout.id;
	});
}
window.addEventListener('message', function (event) {
	if (event.data.message === 'getLayout') {
		if (state.wasLinkDataPageOpened) {
			checkRepeatersErrors();
			let linkDataPage = document.getElementById('linkDataPage');
			let linkDataPageInputs = linkDataPage.querySelectorAll('input[type="text"]');
			linkDataPageInputs.forEach((linkDataPageInput) => {
				linkDataPageInput.schemaData.value = linkDataPageInput.value;
			});
			selectedLayout.hasLinkData = true;
			selectedLayout.wasLinkDataPageOpened = true;
			selectedLayout.isRepeaterTurnedOn = state.isRepeaterTurnedOn;
			selectedLayout.repeaterReplacementExpression = repeaterReplacementExpression;
		} else {
			if (originalLayoutData?.wasDataLinked) { // means that the edited layout has a linked data
				selectedLayout.hasLinkData = true;
				selectedLayout.wasLinkDataPageOpened = state.wasLinkDataPageOpened;
				selectedLayout.isRepeaterTurnedOn = currentLayoutHtml?.includes('buildfire-repeat');
				selectedLayout.repeaterReplacementExpression = originalLayoutData.repeaterReplacementExpression;
			}
		}
		Promise.all([
			fetch(selectedLayout.cssUrl),
			fetch(selectedLayout.htmlUrl)
		]).then(function (responses) {
			return Promise.all(responses.map(function (response) {
				return response.text();
			}));
		}).then(function (data) {
			selectedLayout.cssContent = data[0];
			selectedLayout.htmlContent = data[1];
			window.parent.postMessage({
				mceAction: 'insertLayout',
				data: {
					content: selectedLayout
				}
			}, origin);
		}).catch(function (error) {
			console.error(error);
		});
	} else if (event.data.message === 'insertExpression') {
		targetExpressionInput.value = event.data.expression;
		if (!state.isRepeaterTurnedOn) {
			checkRepeaterStatus(event.data.expression);
		}
		checkRepeatersErrors();
	} else if (event.data.message === 'sendLayoutHtml') {
		currentLayoutHtml = event.data.layoutElement;
	}
});
// eslint-disable-next-line no-unused-vars
const openLinkDataPage = () => {
	renderLinkDataPage();
	document.getElementById('selectLayoutPage').style.display = 'none';
	document.getElementById('linkDataPage').style.display = 'block';
};
const renderLinkDataPage = () => {
	let linkDataPage = document.getElementById('linkDataPage');
	let layoutRepeater = document.createElement('div');
	layoutRepeater.id = 'layoutRepeater';
	linkDataPage.appendChild(layoutRepeater);
	
	let layoutImage = document.createElement('img');
	layoutImage.src = selectedLayout.imageUrl;
	layoutRepeater.appendChild(layoutImage);

	let layoutExpressionsContainer = buildExpressionsContainer();
	layoutRepeater.appendChild(layoutExpressionsContainer);
};

const buildExpressionsContainer = () => {
	let currentLayoutRootElement;
	if (currentLayoutHtml) {
		currentLayoutRootElement = document.createElement('div');
		currentLayoutRootElement.innerHTML = currentLayoutHtml;
	}

	let layoutExpressionsContainer = document.createElement('div');
	layoutExpressionsContainer.id = 'layoutExpressionsContainer';

	selectedLayout.expressionFields.forEach((expressionField) => {
		let layoutInput = document.createElement('div');
		layoutInput.className = 'layout-expr-field';
		let layoutInputLabel = document.createElement('div');
		layoutInputLabel.className = 'layout-expr-field-label';
		let label = buildInputLabel(expressionField);
		layoutInputLabel.appendChild(label);
		layoutInput.appendChild(layoutInputLabel);

		let inputDiv = document.createElement('div');
		inputDiv.className = 'input';
		let inputElement = document.createElement('input');
		inputElement.type = 'text';
		if (currentLayoutHtml) {
			let targetElement = currentLayoutRootElement.querySelector(expressionField.selector);
			if (targetElement) {
				if (expressionField.attribute) {
					let value;
					if (expressionField.attribute == 'src' && targetElement.nodeName == 'IMG' && targetElement.dataset.exprSrc) { 
						value = targetElement.dataset.exprSrc;
					} else {
						value = targetElement.getAttribute(expressionField.attribute);
					}
					if (originalLayoutData.repeaterReplacementExpression) {
						value = value?.replaceAll('layoutItem', originalLayoutData.repeaterReplacementExpression);
					}
					inputElement.value = value || '';
				} else {
					let value = targetElement.innerHTML;
					if (originalLayoutData.repeaterReplacementExpression) {
						value = value?.replaceAll('layoutItem', originalLayoutData.repeaterReplacementExpression);
					}
					inputElement.value = value || '';
				}
			}
		} else {
			if (expressionField.attribute == 'src' && expressionField.type == 'img') {
				// replace the relative image path to be absolute (pointing to prod) in all environment
				inputElement.value = expressionField.defaultValue.replace('../../../..', 'https://d335ljseg2f9ry.cloudfront.net');
			} else {
				inputElement.value = expressionField.defaultValue;
			}
		}
		
		inputElement.schemaData = expressionField;
		inputElement.onblur = () => {
			if (!state.isRepeaterTurnedOn) checkRepeaterStatus(inputElement.value);
			checkRepeatersErrors();
		};
		inputDiv.appendChild(inputElement);

		let puzzleBox = buildPuzzleBox();
		inputDiv.appendChild(puzzleBox);
		layoutInput.appendChild(inputDiv);

		layoutExpressionsContainer.appendChild(layoutInput);
	});

	let switchButtonDiv = buildSwitchButtonDiv();
	let errorMessageDiv = buildErrorMessageDiv();
	
	layoutExpressionsContainer.appendChild(switchButtonDiv);
	layoutExpressionsContainer.appendChild(errorMessageDiv);

	return layoutExpressionsContainer;
};
const buildInputLabel = (field) => {
	let label = document.createElement('span');
	label.innerText = field.name;

	let labelTip = document.createElement('div');
	labelTip.className = 'bf-tooltip';

	let tooltipIcon = document.createElement('div');
	tooltipIcon.className = 'tooltip-icon';
	tooltipIcon.innerText = 'i';

	let tooltipContent  = document.createElement('div');
	tooltipContent.className = 'tooltip-content';
	tooltipContent.innerHTML = field.info;

	labelTip.appendChild(tooltipIcon);
	labelTip.appendChild(tooltipContent);
	label.appendChild(labelTip);

	return label;
};

const buildSwitchButtonDiv = () => {
	let switchButtonDiv = document.createElement('div');
	switchButtonDiv.id = 'switchButtonDiv';
	let switchLabelMessage = '<div style="max-width: 12rem">Toggle ON if you want to repeat the layout for every block of data when adding data from data sources. You can only repeat data from the same data source.<div>';
	let switchLabel = buildInputLabel({ name: 'Repeat Layout', info: switchLabelMessage });
	switchButtonDiv.appendChild(switchLabel);

	let switchButton = document.createElement('input');
	switchButton.id = 'switchButton';
	switchButton.type = 'checkbox';
	if (currentLayoutHtml?.includes('buildfire-repeat')) {
		switchButton.checked = true;
	}
	switchButton.onclick = () => {
		checkRepeatersErrors();
	};

	let switchButtonLabel = document.createElement('label');
	switchButtonLabel.setAttribute('for', 'switchButton');
	switchButtonDiv.appendChild(switchButton);
	switchButtonDiv.appendChild(switchButtonLabel);

	return switchButtonDiv;
};

const buildErrorMessageDiv = () => {
	let errorMessageDiv = document.createElement('div');
	errorMessageDiv.id = 'errorMessageDiv';

	return errorMessageDiv;
};

const buildPuzzleBox = () => {
	let puzzleBox = document.createElement('div');
	puzzleBox.className = 'puzzle-box';
	puzzleBox.innerHTML = '<span class="icon-puzzle"></span>';
	puzzleBox.onclick = (e) => {
		document.getElementById('errorMessageDiv').style.display = 'none';
		if (e.target.className === 'puzzle-box') {
			targetExpressionInput = e.target.previousElementSibling;	
		} else if (e.target.className === 'icon-puzzle') {
			targetExpressionInput = e.target.parentElement.previousElementSibling;	
		}

		window.parent.postMessage({
			mceAction: 'showExpressionBuilder',
			data: {
				string: targetExpressionInput.value
			}
		}, origin);
	};

	let tooltipContent  = document.createElement('div');
	tooltipContent.className = 'tooltip-content';
	tooltipContent.innerText = 'Expression Builder';
	puzzleBox.appendChild(tooltipContent);

	return puzzleBox;
};
const showRepeaterMessageError = (options) => {
	let { message } = options;
	let errorMessageDiv = document.getElementById('errorMessageDiv');
	errorMessageDiv.innerHTML = message;
	errorMessageDiv.style.display = 'block';
};
const checkForRepeater = (expression) => {
	let wasRepeaterFound = false;
	let repeaterArray = '';
	expression.match(/\${[^{}]*}/g)?.forEach((exp) => {
		if (exp.search(/\[[0-9]+\]/) > -1 && !wasRepeaterFound) {
			wasRepeaterFound = true;
			repeaterArray = getRepeaterArray(exp);
		}
	});
	return {wasRepeaterFound, repeaterArray};
};
const getRepeaterArray = (expression) => {
	// clean the expression from the default expression character
	let expressionBody = expression.replace(/[${}]/g, '').trim();

	if (!expressionBody) return '';
	let cleanedExpression = expressionBody.replace(/[?]/g, '').replace(/\.\[/g, '[');
	let squareBracketIndex = cleanedExpression.search(/\[[0-9]+\]/);
	let repeaterArray = cleanedExpression.slice(0, squareBracketIndex);

	let closedBracketIndex = expressionBody.indexOf(']');
	repeaterReplacementExpression = repeaterReplacementExpression || expressionBody.slice(0, closedBracketIndex + 1);

	return repeaterArray;
};
const checkRepeatersErrors = () => {
	repeaterReplacementExpression = '';
	if (state.isRepeaterTurnedOn) {
		let wasRepeaterFound = false;
		let isThereMultipleRepeaters = false;
		let repeaterArray = '';
		let linkDataPage = document.getElementById('linkDataPage');
		let linkDataPageInputs = linkDataPage.querySelectorAll('input[type="text"]');
		linkDataPageInputs.forEach((linkDataPageInput) => {
			let repeater = checkForRepeater(linkDataPageInput.value);
			if (repeaterArray && repeater.repeaterArray && repeaterArray != repeater.repeaterArray) {
				let lastDotIndex = repeaterArray.lastIndexOf('.');
				let repeaterArrayName = repeaterArray.slice(lastDotIndex + 1);
				isThereMultipleRepeaters = true;
				showRepeaterMessageError({message: `Repeatable expressions cannot be merged. Only data from "${repeaterArrayName}" expression will be repeated.`});
				return;
			}
			wasRepeaterFound = wasRepeaterFound || repeater.wasRepeaterFound;
			repeaterArray = repeaterArray || repeater.repeaterArray;
		});
		if (!wasRepeaterFound) {
			showRepeaterMessageError({message: 'No repeating expression detected. There is nothing to repeat.'});
		} else if (wasRepeaterFound && !isThereMultipleRepeaters) {
			document.getElementById('errorMessageDiv').style.display = 'none';
		}
	} else {
		document.getElementById('errorMessageDiv').style.display = 'none';
	}
};

const checkRepeaterStatus = (expression) => {
	expression.match(/\${[^{}]*}/g)?.forEach((exp) => {
		if (exp.search(/\[[0-9]+\]/) > -1 && !state.isRepeaterTurnedOn) {
			document.getElementById('switchButton').click();
		}
	});
};
