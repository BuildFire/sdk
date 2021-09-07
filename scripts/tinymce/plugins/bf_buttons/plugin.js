tinymce.PluginManager.add("bf_buttons", function (editor, url) {
    editor.ui.registry.addButton("bf_edit_button", {
        icon: 'edit-block',
        tooltip: 'Edit button',
        onAction: function () {
            showDialog(true);
        },
    });
    editor.ui.registry.addButton("bf_edit_button_action", {
        icon: 'link',
        tooltip: 'Edit button action',
        onAction: function () {
            editAction();
        },
    });
    editor.ui.registry.addContextToolbar('editBfButton', {
        predicate: function (node) {
            let elementClasses = node.className;
            return elementClasses.includes('bf-btn') || elementClasses.includes('bf-text-');
        },
        items: 'bf_edit_button | bf_edit_button_action',
        position: 'node',
        scope: 'node'
    });
    editor.ui.registry.addMenuItem('bf_insertButtonOrLink', {
        text: 'Insert button/link',
        onAction: function() {
            showDialog(false);
        }
    });
    editor.ui.registry.addMenuItem('bf_editButtonOrLink', {
        text: 'Edit button/link',
        icon: 'edit-block',
        onAction: function() {
            showDialog(true);
        }
    });
    editor.ui.registry.addMenuItem('bf_editButtonOrLinkAction', {
        text: 'Edit button/link action',
        icon: 'link',
        onAction: function() {
            editAction();
        }
    });
    editor.ui.registry.addContextMenu('bf_buttonOrLinkContextMenu', {
        update: function (element) {
            let elementClasses = element.className;
            return elementClasses.includes('bf-btn') || elementClasses.includes('bf-text-') ? 'bf_editButtonOrLink | bf_editButtonOrLinkAction' : '';
        }
    });

    function showDialog(isEditing) {
        let elementNode = editor.selection.getNode();
        let querystring = '';
        let title = 'Insert Button/Link';
        let cancelButton = {text: 'Cancel', type: 'cancel'};
        let selectActionButton = {text: 'Select Action', name: 'Select Action', type: 'custom', primary : true};
        let EditButton = {text: 'Save', name: 'Edit Button', type: 'custom', primary : true};
    
        let dialogButtons = isEditing ? [cancelButton, EditButton] : [cancelButton, selectActionButton];
        if (isEditing) {
            title = 'Edit Button/Link'
            let data = { 
                classes: elementNode.className,
            };
            let stringifiedData = JSON.stringify(data);
            querystring = `?data=${encodeURIComponent(stringifiedData)}`;
        } else {
            let stylesToInject = `
            button[title="Select Action"].tox-button {
                background-color: #05acf0;
                border-color: #05acf0;
            }
            button[title="Select Action"].tox-button:hover {
                background-color: #0089d1 !important;
                border-color: #0089d1 !important;
            }`;
        buildfire.wysiwyg.injectPluginStyles(stylesToInject);
        }    
        editor.windowManager.openUrl({
            title,
            url: `${url}/dialog.html${querystring}`,
            width: 500,
            height: 500,
            buttons: dialogButtons,
            onAction: (dialogApi, details) => {
                if (details.name === 'Select Action') {
                    dialogApi.sendMessage({
                        message: 'getButtonData'
                    });
                } else if (details.name === 'Edit Button') {
                    dialogApi.sendMessage({
                        message: 'getButtonData'
                    });
                }
            },
            onMessage : (dialogApi, details) => {
                let result = details.data.content;
                let mceAction = details.mceAction;
                if (result && mceAction === 'setButtonData') {
                    if (!isEditing) {
                        showAcionItemDialog(options = {}, (err, res) => {
                            if (err) return console.error(err);
                            let buttonOrlink = document.createElement(result.type === 'button' ? 'button' : 'a');
                            buttonOrlink.className = result.type === 'button' ? 'bf-btn bf-btn-' + result.buttonStyle : 'bf-text-' + result.buttonStyle;
                            buttonOrlink.setAttribute('data-execute', res.stringifiedActionItem);
                            buttonOrlink.setAttribute('onclick', 'buildfire.actionItems.execute(JSON.parse(unescape(this.getAttribute("data-execute"))), ()=>{})')
                            buttonOrlink.innerText = res.actionItem.title;
                            editor.insertContent(buttonOrlink.outerHTML + '&nbsp;');
                            dialogApi.close();
                        })
                    } else {
                        let classIndexToOverride = -1;
                        let newClass = result.type === 'button' ? 'bf-btn-' + result.buttonStyle : 'bf-text-' + result.buttonStyle;
                        let elementClasses = elementNode.className.split(' ');
                        elementClasses.forEach((elementClass, index) => {
                            if (result.type === 'button') {
                                if (elementClass.includes('bf-btn-')) {
                                    classIndexToOverride = index;
                                }
                            } else if (result.type === 'link') {
                                if (elementClass.includes('bf-text-')) {
                                    classIndexToOverride = index;
                                }
                            } 
                        }) 
                        if (classIndexToOverride > -1) {
                            elementClasses[classIndexToOverride] = newClass;
                            elementNode.className = elementClasses.join(' ');
                        }
                        dialogApi.close();
                        editor.isNotDirty = false;
                        editor.fire("change");
                    }
                }
            }
        });
    }

    function showAcionItemDialog(options, callback) {
        let result = {};
        options = options || {};
        options.actionItem = options.actionItem || {};
        buildfire.actionItems.showDialog(
            options.actionItem,
            { allowNoAction: true, showIcon: false, showTitle: false },
            (err, actionItem) => {
                if (err) return callback(err, null);
                if (!actionItem) return callback('There is no action item', null);
                result.actionItem = actionItem;
                result.stringifiedActionItem = escape(JSON.stringify(actionItem));
                callback(null, result)
            }
        );
    }

    function editAction() {
        let options = {};
        let elementNode = editor.selection.getNode();
        options.actionItem = JSON.parse(unescape(elementNode.dataset.execute));
        showAcionItemDialog(options, (err, res) => {
            if (err) return console.error(err);
            elementNode.innerText = res.actionItem.title;
            elementNode.setAttribute('data-execute', res.stringifiedActionItem);
            editor.isNotDirty = false;
            editor.fire("change");
        })
    }

    return {
        getMetadata: function () {
            return {
                name: "Buttons Plugin",
            };
        },
    };
});
