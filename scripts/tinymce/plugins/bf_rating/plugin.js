
tinymce.PluginManager.add("bf_rating", function (editor, url) {
    editor.ui.registry.addMenuItem('bf_insertRating', {
        text: 'Insert rating',
        onAction: function() {
            showDialog();
        }
    });

    function showDialog() {
        editor.windowManager.openUrl({
            title: "Add New Rating",
            url: url + "/dialog.html",
            width: 400,
            buttons: [
                {
                    text: 'Cancel',
                    type: 'cancel'
                },
                {
                    text: "Add",
                    type: 'custom',
                    name: 'Add Rating',
                    primary: true,
                },
            ],
            onAction: (dialogApi, details) => {
                if (details.name === 'Add Rating') {
                    dialogApi.sendMessage({
                        message: 'getDataId'
                    });
                }
            },
            onMessage : (dialogApi, details) => {
                let result = details.data.content;
                let mceAction = details.mceAction;
                if (result && mceAction === 'setDataId') {
                    let val = result.trim();
                    val = escape(val);
                    editor.insertContent(
                        `<img src="trigger_errorasd" onerror="typeof buildfire !== 'undefined' && buildfire.ratingSystem.inject()" style="display: none !important;">
                            <p data-rating-id="${val}-tinymce" style="text-align: center;" data-mce-style="text-align: center;">
                                &#9733; &#9733; &#9733; &#9733; &#9733;
                            </p><br>
                        `
                    );
                    dialogApi.close();
                }
            }
        });
    }

    return {
        getMetadata: function () {
            return {
                name: "Rating Plugin",
            };
        },
    };
});
