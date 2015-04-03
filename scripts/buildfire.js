
function Packet(id,cmd,data){
    this.id= id?id:new Date().toISOString();
    this.cmd= cmd;
    this.data = data;
}

var buildfire = {
     _callbacks:{}
    ,init:function(){

        function eventHandler(e) {

            var packet = JSON.parse(e.data);
            if(packet.id && buildfire._callbacks[packet.id]){
                buildfire._callbacks[packet.id](packet.data);
                delete buildfire._callbacks[packet.id];
            }
            else{
                console.warn('unhandled packet',packet);
                //alert('parent sent: ' + packet.data);
            }

        }
        // Listen to message from child window
        window.removeEventListener('message',eventHandler,false);
        window.addEventListener('message',eventHandler,false);
        buildfire.appearance.attacheCSSFiles();
    }
    ,appearance: {
        getCSSFiles: function (callback) {
            var p = new Packet(null, 'appearance.getCSSFiles');
            buildfire.sendPacket(p, callback);
        }
        ,attacheCSSFiles: function(){
            buildfire.appearance.getCSSFiles(function(files){
                ///because this may happen after document is ready this may cause a flicker
                if(!(files && files.length)) return;
                var header = document.querySelector('head');
                for(var i = 0 ; i < files.length; i++ ){
                    css = document.createElement('link');
                    css.rel="stylesheet";
                    css.href=files[i];
                    header.appendChild(css);
                }
            });
        }
    }
    ,sendPacket: function(packet,callback){
        if(typeof (callback) =="function")
            buildfire._callbacks[packet.id] = callback;
        parent.postMessage( JSON.stringify(packet) ,"*");
    }
};
buildfire.init();