
tinymce.PluginManager.add("collage", function (editor, url) {
    editor.on('PreProcess', function (e) {
        console.log(e.node);
    });
    editor.addButton("collage", {
        text: "Collage",
        icon: false,
        onclick: function () {
            editor.windowManager.open({
                title: "Insert Image Collage",
                url: url + "/dialog.html",
                width: 581,
                height: 350,
                buttons: [
                    {
                        text: 'Cancel',
                        onclick: function () {
                            const modal = editor.windowManager.getWindows()[0];
                            modal.close();
                        }
                    },
                    {
                        text: "Add Images",
                        classes: 'widget btn primary',
                        onclick: function () {
                            const modal = editor.windowManager.getWindows()[0];
  
                            function getElementById(id) {
                                return modal.getContentWindow().document.getElementById(id);
                            }
                            let val = getElementById('data_id').value.trim();
                            val = escape(val);
                            editor.insertContent(
                                `<img src="trigger_errorasd" onerror="typeof buildfire !== 'undefined' && buildfire.ratingSystem.inject()" style="display: none">
                                    <p data-rating-id="${val}-tinymce" style="text-align: center;" data-mce-style="text-align: center;">
                                        &#9733; &#9733; &#9733; &#9733; &#9733;
                                    </p><br>
                                `
                            );
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
                name: "Collage Plugin",
                // url: ""
            };
        },
    };
  });
  