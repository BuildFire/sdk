tinymce.PluginManager.add("bf_buttons", function (editor, url) {
    editor.addButton("bf_buttons", {
        text: "Buttons",
        icon: false,
        onclick: function () {
            editor.windowManager.open({
                title: "Buttons and Links",
                url: url + "/dialog.html",
                width: 500,
                height: 400,
                buttons: [
                    {
                        text: "Select Action",
                        classes: 'widget btn primary',
                        onclick: function () {
                            const modal = editor.windowManager.getWindows()[0];
                            modal.getContentWindow().validate({}, (err, result) => {
                                if (err) return console.error(err);
                                if (result) {
                                    modal.close();  
                                    buildfire.actionItems.showDialog(
                                        {},
                                        { allowNoAction: true, showIcon: false, showTitle: false },
                                        (err, actionItem) => {
                                            if (err) return console.error(err);
                                            if (!actionItem) return;
                                            let stringifiedActionItem = escape(JSON.stringify(actionItem));
                                            let buttonOrlink = document.createElement('a');
                                            buttonOrlink.className = result.type === 'button' ? 'bf-btn bf-btn-' + result.buttonStyle : 'bf-text-' + result.buttonStyle;
                                            buttonOrlink.setAttribute('data-execute', stringifiedActionItem);
                                            buttonOrlink.setAttribute('onclick', 'buildfire.actionItems.execute(JSON.parse(unescape(this.getAttribute("data-execute"))), ()=>{})')
                                            buttonOrlink.innerText = actionItem.title;
                                            editor.insertContent(buttonOrlink.outerHTML + '&nbsp;');
                                        }
                                    );
                                };
                            })
                        }
                    },
                    {
                        text: 'Cancel',
                        onclick: function () {
                            const modal = editor.windowManager.getWindows()[0];
                            modal.close();
                        }
                    },
                ]
            });
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
  