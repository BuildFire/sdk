
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
  