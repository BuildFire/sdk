tinymce.PluginManager.add("buttons", function (editor, url) {
    console.log('!!!!!editor', editor);

    var appContext = buildfire.getContext();
    var appThemeUrl = encodeURIComponent(appContext.endPoints.appHost + '/api/app/styles/appTheme.css?appId=' + appContext.appId + '&liveMode=' + appContext.liveMode);
    var queryString = '?appThemeUrl=' + appThemeUrl;
    editor.addButton("buttons", {
        text: "Buttons",
        icon: false,
        onclick: function () {
            window.currentEditor = editor;
            editor.windowManager.open({
                title: "Buttons",
                url: url + "/dialog.html" +  queryString,
                width: 600,
                height: 400,
                buttons: [
                    {
                        text: 'Cancel',
                        onclick: function () {
                            const modal = editor.windowManager.getWindows()[0];
                            modal.close();
                        }
                    },
                    {
                        text: "Select Button Action",
                        classes: 'widget btn primary',
                        onclick: function () {
                            const modal = editor.windowManager.getWindows()[0];
                            modal.getContentWindow().validate({}, (err, result) => {
                                if (err) return console.error(err);
                                if (result) {
                                    modal.close();  
                                    buildfire.actionItems.showDialog(
                                        {},
                                        { allowNoAction: false, showIcon: false, showTitle: false },
                                        (err, actionItem) => {
                                            if (err) return console.error(err);
                                            if (!actionItem) return;
                                            let stringifiedActionItem = escape(JSON.stringify(actionItem));
                                            let content = `<a class="${result.type === 'button' ? 'btn btn-' + result.buttonStyle : 'text-' + result.buttonStyle}" data-execute="${stringifiedActionItem}"
                                            onclick="buildfire.actionItems.execute(JSON.parse(unescape('${stringifiedActionItem}')), ()=>{})">${actionItem.title}</a>&nbsp;`
                                            editor.insertContent(content);
                                        }
                                    );
                                };
                            })
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
                // url: ""
            };
        },
    };
  });
  