tinymce.PluginManager.add("bf_buttons", function (editor, url) {
    editor.addButton("bf_buttons", {
        text: "Buttons",
        icon: false,
        onclick: function () {
            editor.windowManager.open({
                title: "Buttons",
                url: url + "/dialog.html",
                width: 470,
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
                                            let content = `<a class="${result.type === 'button' ? 'bf-btn bf-btn-' + result.buttonStyle : 'bf-text-' + result.buttonStyle}" data-execute="${stringifiedActionItem}"
                                            onclick="buildfire.actionItems.execute(JSON.parse(unescape('${stringifiedActionItem}')), ()=>{})">${actionItem.title}</a>&nbsp;`
                                            editor.insertContent(content);
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
  