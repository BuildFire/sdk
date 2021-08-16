
tinymce.PluginManager.add("bf_rating", function (editor, url) {
    editor.ui.registry.addButton("bf_rating", {
        text: "Rating",
        icon: false,
        onAction: function () {
            showRatingDialog(editor, url);
        },
        showDialog: function() {
            showRatingDialog(editor, url);
        }
  });

    return {
        getMetadata: function () {
            return {
                name: "Rating Plugin",
            };
        },
    };
});

function showRatingDialog(editor, url) {
    editor.windowManager.openUrl({
        title: "Add new rating",
        url: url + "/dialog.html",
        width: 400,
        height: 250,
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
                    `<img src="trigger_errorasd" onerror="typeof buildfire !== 'undefined' && buildfire.ratingSystem.inject()" style="display: none">
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