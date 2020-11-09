
tinymce.PluginManager.add("rating", function (editor, url) {
  let onNodeSelected = (e) => {
    if (!editor.selection.isCollapsed()) return;
    if (!e || !e.element) return
    let ratingComponent;
    if (e && e.element) {
      if (e.element.dataset && e.element.className == "rating-system-tinymce") {
        ratingComponent = e.element;
      }
      if (e.element.nodeName == "SPAN" && e.element.parentElement && e.element.parentElement.className == "rating-system-tinymce") {
        ratingComponent = e.element.parentElement;
      }
    }
    if (ratingComponent) {
      if (ratingComponent.nextElementSibling) {
        editor.selection.select(ratingComponent.nextElementSibling, true);
        editor.selection.collapse(true);
      } else {
        let el = editor.dom.create("p");
        editor.dom.insertAfter(el, ratingComponent)
        editor.selection.select(el, true);
        editor.selection.collapse(true);
      }
    }
  }
  editor.on("NodeChange", onNodeSelected)
  editor.on('click', onNodeSelected);
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
                                  <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
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
