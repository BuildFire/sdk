tinymce.PluginManager.add("bf_layouts", function (editor, url) {
    let selectedLayout;
    editor.ui.registry.addButton("bf_edit_layout", {
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
            editor.fire("change");
        }
    });
    editor.ui.registry.addContextMenu('bf_customLayouts', {
        update: function (element) {
            if (element.dataset.bfLayout) {
                selectedLayout = element;
                return 'bf_editLayout bf_copyLayout bf_deleteLayout';
            }
            return '';
        }
    });
  
    function showDialog(isEditing) {
        let querystring = '';
        let title = "Select Layout";
        let cancelButton = {text: 'Cancel', type: 'cancel'};
        let insertLayoutButton = {text: "Insert", name: 'Insert Layout', type: 'custom', primary : true};
        let changeLayoutButton = {text: 'Save', name: 'Change Layout', type: 'custom', primary : true};
        let buttons = [cancelButton, insertLayoutButton]
        if (isEditing) {
            title = "Edit Layout";
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
            height: 600,
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
                            image.setAttribute('data-mce-src', image.src);
                        })

                        let data = {};
                        data.id = layout.id;
                        data.cssUrl = layout.cssUrl;
                        data.htmlUrl = layout.htmlUrl;
                        let stringifiedData = escape(JSON.stringify(data));
                        layoutDiv.setAttribute('data-bf-layout', stringifiedData);
                        layoutDiv.setAttribute('data-layout-name', layout.id);
                        editor.insertContent(layoutDiv.outerHTML + '&nbsp;');
                    } else {
                        selectedLayout.id = layout.id;
                        let data = {};
                        data.id = layout.id;
                        data.cssUrl = layout.cssUrl;
                        data.htmlUrl = layout.htmlUrl;
                        let stringifiedData = escape(JSON.stringify(data));
                        selectedLayout.setAttribute('data-bf-layout', stringifiedData);
                        selectedLayout.setAttribute('data-layout-name', layout.id);
                        editor.isNotDirty = false;
                        editor.fire("change");
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
				}
            }
        });
    }

    return {
        getMetadata: function () {
            return {
                name: "Layouts Plugin",
            };
        },
    };
});