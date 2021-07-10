tinymce.PluginManager.add("carousel", function (editor, url) {
    editor.on('PreProcess', function (e) {
        editor.addButton('editButton', {
            text: '',
            image:tinymce.baseURL+"/plugins/buildfire/plugins/carousel/icons/edit.svg",
            onclick: function(el) {
                let element=tinymce.activeEditor.selection.getNode();
                renderDialog(element,element.dataset.carousel)
            }
        });
        editor.addContextToolbar(function(node){
            return node.nodeName === 'IMG' && node.dataset.carousel;
        }, 'editButton');     
    });

    function renderDialog(element,id) {
        var name=(id==null)?uuidv4():id;
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
        }
        function cancelButton(){
            return {
                text: 'Cancel',
                onclick: function () {
                    const modal = editor.windowManager.getWindows()[0];
                    modal.close(); 
                }
            };
        }
        function saveButton(id){
            return {
                text: (id==null)?"Save":"Done",
                classes: 'widget btn primary',
                onclick: function () {
                    const modal = editor.windowManager.getWindows()[0];
                     buildfire.components.carousel.getPlaceHolders(name,(err,data)=>{
                        let image=(data[0]&&data[0].iconUrl)?buildfire.imageLib.resizeImage(data[0].iconUrl, {width: 170,height: 75  }):
                        tinymce.baseURL+"/plugins/buildfire/plugins/carousel/icons/holder-2x1.png";
                        let onerror="function call(img){img.src='"+image+"';try {buildfire.components.carousel.renderWWG('"+name+"');}catch(err) {}};call(this);";
                        let content=`
                        <img 
                            src="trigger_errorasd"
                            data-carousel="${name}"
                            style="height:150px; width:90%; display:block; margin:auto; object-fit:contain; border:2px solid #a1ddfa;" 
                            onerror="${onerror}"
                        >`

                        if(id==null)
                            editor.insertContent(content);
                        else 
                        {
                            var parser = new DOMParser();
                            var htmlDoc = parser.parseFromString(tinyMCE.activeEditor.getContent(), 'text/html');
                            var obj=htmlDoc.querySelectorAll('[data-carousel="'+name+'"]')[0];
                            obj.setAttribute("onerror",onerror);
                            tinyMCE.activeEditor.setContent(htmlDoc.body.innerHTML);

                        }
                         }); 
                    modal.close();
                }
            };
        }
        let myButtons=[];
        if(id==null)myButtons.push(cancelButton());
        myButtons.push(saveButton(id));
        editor.windowManager.open({
            title: "Add Carousel",
            url: url + "/dialog.html",
            width: 550,
            height: 300,
            onPostRender: function (e, f) {
                const modal = editor.windowManager.getWindows()[0];
                function getElementById(id) {
                  return modal.getContentWindow().document.getElementById(id);
                }
                setTimeout(() => {
                    var myEditor = new buildfire.components.carousel.editor(getElementById("wwgCarouselInput"),{},name);
                }, 500);
            },
            buttons: myButtons
        });
    }
    editor.addButton("carousel", {
        text: "Carousel",
        icon: false,
        onclick: function () {
            renderDialog(null,null);
        }
    });
  
    return {
        getMetadata: function () {
            return {
                name: "Carousel Plugin",
                // url: ""
            };
        },
        render: function (element,id) { renderDialog(element,id) }
    };
  });
