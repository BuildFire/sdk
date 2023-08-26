tinymce.PluginManager.add('bf_layouts', function (editor, url) {
	let selectedLayout;
	let dialogHeight = window.innerHeight > 600 ? 600 : window.innerHeight - 20;
	editor.ui.registry.addButton('bf_edit_layout', {
		icon: 'edit-block',
		tooltip: 'Edit layout',
		onAction: function () {
			showDialog(true);
		},
	});
	editor.ui.registry.addContextToolbar('editBfLayout', {
		predicate: function (node) {
			if (node.dataset.bfLayout) {
				selectedLayout = node;
			}
			return node.dataset.bfLayout;
		},
		items: 'bf_edit_layout',
		position: 'node',
		scope: 'node'
	});
	editor.ui.registry.addMenuItem('bf_insertLayout', {
		text: 'Insert layout',
		onAction: function() {
			showDialog(false);                                   
		}
	});
	editor.ui.registry.addMenuItem('bf_editLayout', {
		text: 'Edit layout',
		icon: 'edit-block',
		onAction: function() {
			showDialog(true);
		}
	});
	editor.ui.registry.addMenuItem('bf_copyLayout', {
		text: 'Copy layout',
		icon: 'copy',
		onAction: function() {
			editor.execCommand('mceSelectNode', false, selectedLayout);
			editor.execCommand('Copy');        
		}
	});
	editor.ui.registry.addMenuItem('bf_deleteLayout', {
		text: 'Delete layout',
		icon: 'remove',
		onAction: function() {
			selectedLayout.parentNode.removeChild(selectedLayout);
			editor.isNotDirty = false;
			editor.fire('change');
		}
	});
	editor.ui.registry.addMenuItem('bf_insertBeforeLayout', {
		text: 'Insert before layout',
		icon: 'chevron-left',
		onAction: function() {
			selectedLayout.insertAdjacentHTML('beforebegin', '<p><br></p>');
		}
	});
	editor.ui.registry.addMenuItem('bf_insertAfterLayout', {
		text: 'Insert after layout',
		icon: 'chevron-right',
		onAction: function() {
			selectedLayout.insertAdjacentHTML('afterend', '<p><br></p>');
		}
	});
	editor.ui.registry.addContextMenu('bf_customLayouts', {
		update: function (element) {
			if (element.dataset.bfLayout) {
				selectedLayout = element;
				return 'bf_editLayout bf_copyLayout bf_deleteLayout bf_insertBeforeLayout bf_insertAfterLayout';
			} else {
				while(element.dataset.bfLayout || element.nodeName !== 'BODY') {
					element = element.parentElement;
					if (element && element.dataset) {
						if (element.dataset.bfLayout) {
							selectedLayout = element;
							return 'bf_editLayout bf_copyLayout bf_deleteLayout bf_insertBeforeLayout bf_insertAfterLayout';
						}
					} else {
						return '';
					}
				}
			}
			return '';
		}
	});
  
	function showDialog(isEditing) {
		let querystring = '';
		let title = 'Select Layout';
		let cancelButton = {text: 'Cancel', type: 'cancel'};
		let insertLayoutButton = {text: 'Insert', name: 'Insert Layout', type: 'custom', primary : true};
		let changeLayoutButton = {text: 'Save', name: 'Change Layout', type: 'custom', primary : true};
		let buttons = [cancelButton, insertLayoutButton];
		if (isEditing) {
			title = 'Edit Layout';
			buttons = [cancelButton, changeLayoutButton];
			let data = { 
				layoutData: JSON.parse(unescape(selectedLayout.dataset.bfLayout)),
			};
			let stringifiedData = JSON.stringify(data);
			querystring = `?data=${encodeURIComponent(stringifiedData)}`;
		}
		editor.windowManager.openUrl({
			title,
			url: `${url}/dialog.html${querystring}`,
			width: 500,
			height: dialogHeight,
			buttons,
			onAction: (dialogApi, details) => {
				if (details.name === 'Insert Layout' || details.name === 'Change Layout') {
					dialogApi.sendMessage({
						message: 'getLayout'
					});
				}
			},
			onMessage: (dialogApi, details) => {
				let layout = details.data.content;
				let mceAction = details.mceAction;
				if (layout && mceAction === 'insertLayout') {
					let layoutStyles = layout.cssContent;
					let existedStyle = editor.dom.doc.body.querySelector('style[data-layout-name='+ layout.id + ']');
					if (!isEditing) {
						let layoutHtml = layout.htmlContent;
						let layoutDiv = document.createElement('div');
						layoutDiv.id = layout.id;
						layoutDiv.innerHTML = layoutHtml;
						layoutDiv.querySelectorAll('img').forEach((image) => {
							// this is just a way to convert the relative image path url to an absolute url
							image.setAttribute('src', image.src);
						});
						if (layout.hasLinkData) {
							setLayoutData({layoutData: layout, layoutWrapperElement: layoutDiv});
						}

						let data = {};
						data.id = layout.id;
						data.cssUrl = layout.cssUrl;
						data.htmlUrl = layout.htmlUrl;
						data.wasDataLinked = layout.hasLinkData;
						data.repeaterReplacementExpression = layout.repeaterReplacementExpression;
						let stringifiedData = escape(JSON.stringify(data));
						layoutDiv.setAttribute('data-bf-layout', stringifiedData);
						layoutDiv.setAttribute('data-layout-name', layout.id);
						editor.insertContent(layoutDiv.outerHTML + '&nbsp;');
					} else {
						if (!layout.isRepeaterTurnedOn) {
							if (selectedLayout.hasAttribute('buildfire-repeat')) {
								selectedLayout.removeAttribute('buildfire-repeat');
							} else if (selectedLayout.querySelector('[buildfire-repeat]')) {
								selectedLayout.querySelector('[buildfire-repeat]').removeAttribute('buildfire-repeat');
							}
						}
						selectedLayout.id = layout.id;
						if (layout.hasLinkData && layout.wasLinkDataPageOpened) {
							setLayoutData({layoutData: layout, layoutWrapperElement: selectedLayout});
						}
						let data = {};
						data.id = layout.id;
						data.cssUrl = layout.cssUrl;
						data.htmlUrl = layout.htmlUrl;
						data.wasDataLinked = layout.hasLinkData;
						data.repeaterReplacementExpression = layout.repeaterReplacementExpression;
						let stringifiedData = escape(JSON.stringify(data));
						selectedLayout.setAttribute('data-bf-layout', stringifiedData);
						selectedLayout.setAttribute('data-layout-name', layout.id);
						editor.isNotDirty = false;
						editor.fire('change');
					}
					if (!existedStyle) {
						let styleElement = document.createElement('style');
						styleElement.setAttribute('data-layout-name', layout.id);
						styleElement.innerHTML = layoutStyles;
						editor.dom.doc.body.appendChild(styleElement);
					} else if (existedStyle && isEditing){
						existedStyle.innerHTML = layoutStyles;
					}
					dialogApi.close();
				} else if (mceAction === 'showExpressionBuilder') {
					let options = {
						string: details.data.string
					};
					buildfire.dynamic.expressions.showDialog(options, (err, res) => {
						if (err) return console.error(err);
						if (res) {
							dialogApi.sendMessage({
								message: 'insertExpression',
								expression: res
							});
						}
					});
				} else if (mceAction === 'getLayoutElement') {
					dialogApi.sendMessage({
						message: 'sendLayoutHtml',
						layoutElement: selectedLayout.outerHTML
					});
				}
			}
		});
	}
	const setLayoutData = (options) => {
		let { layoutData, layoutWrapperElement } = options;
		let repeaterReplacementExpression = layoutData.repeaterReplacementExpression;
		if (repeaterReplacementExpression) { // if true, this mean that there is a repeater expression we need to iterate over
			let cleanedExpression = repeaterReplacementExpression.replace(/[?]/g, '').replace(/\.\[/g, '[')	;
			let squareBracketIndex = cleanedExpression.search(/\[[0-9]\]/);
			let repeaterArray = cleanedExpression.slice(0, squareBracketIndex);
			let repeatedElement = layoutWrapperElement.querySelector(layoutData.repeatedSelector);
			if (repeatedElement) {
				repeatedElement.setAttribute('buildfire-repeat', `layoutItem in ${repeaterArray}`);
			} else if (layoutData.repeatedSelector == `div#${layoutData.id}`) {
				layoutWrapperElement.setAttribute('buildfire-repeat', `layoutItem in ${repeaterArray}`);
			}
		}
		layoutData.expressionFields.forEach((expressionField) => {
			let expression = expressionField.value || '';
			let layoutTargetElement = layoutWrapperElement.querySelector(expressionField.selector);
			if (layoutTargetElement) {
				if (repeaterReplacementExpression) {
					expression = expression.replaceAll(repeaterReplacementExpression, 'layoutItem');
				}
				if (expressionField.attribute) {
					if (expressionField.attribute == 'src' && layoutTargetElement.nodeName == 'IMG') {
						if (expression.search(/\${[^{}]*}/) > -1) {
							layoutTargetElement.setAttribute('data-expr-src', expression);
						} else {
							layoutTargetElement.removeAttribute('data-expr-src');
							layoutTargetElement.setAttribute('data-mce-src', expression);
							layoutTargetElement.setAttribute('src', expression);
						}
					} else {
						layoutTargetElement.setAttribute(expressionField.attribute, expression);
					}
				} else {
					layoutTargetElement.innerHTML = expression;
				}
			}
		});
	};
	return {
		getMetadata: function () {
			return {
				name: 'Layouts Plugin',
			};
		},
	};
});