tinymce.PluginManager.add("bf_buttons", function (editor, url) {
    editor.ui.registry.addButton("bf_buttons", {
        text: "Buttons",
        icon: false,
        tooltip: 'Insert button or link',
        onAction: function () {
            showDialog(editor, url);
        },
        showDialog: function() {
            showDialog(editor, url);
        }
    });
  
    return {
        getMetadata: function () {
            return {
                name: "Buttons Plugin",
            };
        },
    };
});

function showDialog(editor, url) {
    editor.windowManager.openUrl({
        title: "Insert button or link",
        url: url + "/dialog.html",
        width: 500,
        height: 500,
        buttons: [
            {
                text: "Select Action",
                name: 'Select Action',
                type: 'custom',
                primary : true,
            },
            {
                text: 'Cancel',
                type: 'cancel',
            },
        ],
        onAction: (dialogApi, details) => {
            if (details.name === 'Select Action') {
                dialogApi.sendMessage({
                    message: 'getButtonData'
                });
            }
        },
        onMessage : (dialogApi, details) => {
            let result = details.data.content;
            let mceAction = details.mceAction;
            if (result && mceAction === 'setButtonData') {
                buildfire.actionItems.showDialog(
                    {},
                    { allowNoAction: true, showIcon: false, showTitle: false },
                    (err, actionItem) => {
                        if (err) return console.error(err);
                        if (!actionItem) return;
                        let stringifiedActionItem = escape(JSON.stringify(actionItem));
                        let buttonOrlink = document.createElement(result.type === 'button' ? 'button' : 'a');
                        buttonOrlink.className = result.type === 'button' ? 'bf-btn bf-btn-' + result.buttonStyle : 'bf-text-' + result.buttonStyle;
                        buttonOrlink.setAttribute('data-execute', stringifiedActionItem);
                        buttonOrlink.setAttribute('onclick', 'buildfire.actionItems.execute(JSON.parse(unescape(this.getAttribute("data-execute"))), ()=>{})')
                        buttonOrlink.innerText = actionItem.title;
                        editor.insertContent(buttonOrlink.outerHTML + '&nbsp;');
                        dialogApi.close();
                    }
                );
            }
        }
    });
}

