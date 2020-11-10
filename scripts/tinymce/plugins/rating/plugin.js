
tinymce.PluginManager.add("rating", function (editor, url) {
  editor.on('keydown', function (e) {
    if (e.keyCode == 13) {
      let currentNode = tinymce.activeEditor.selection.getNode();
      let ratingComponent;
      if (currentNode.dataset && currentNode.className == "rating-system-tinymce") {
        ratingComponent = currentNode;
      } else if (currentNode.nodeName == "SPAN" && currentNode.parentElement && currentNode.parentElement.className == "rating-system-tinymce") {
        ratingComponent = currentNode.parentElement;
      }
      if (ratingComponent) {
        e.preventDefault();
        let br = editor.dom.create("br");
        editor.dom.insertAfter(br, ratingComponent)
        let el = editor.dom.create("p");
        editor.dom.insertAfter(el, ratingComponent)
        editor.selection.select(el, true);
        editor.selection.collapse(true);
      }
    }
  });
  editor.addButton("rating", {
    text: "Rating",
    icon: false,
    onclick: function () {
      editor.windowManager.open({
        title: "Add new rating",
        url: url + "/dialog.html",
        width: 400,
        height: 100,
        buttons: [
          {
            text: "Add",
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
                                  <div class="rating-system-tinymce" data-rating-id="${val}" style="text-align: center;" data-mce-style="text-align: center;">
                                      &#9733;&#9733;&#9733;&#9733;&#9733;
                                  </div><br>`
              );
              modal.close();
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
        name: "Rating Plugin",
        // url: ""
      };
    },
  };
});
