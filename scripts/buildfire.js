
function Packet(id,cmd,data){
    this.id= id?id:new Date().toISOString();
    this.cmd= cmd;
    this.data = data;
}

var buildfire = {
     _callbacks:{}
    ,init:function(){

        var eventHandler = function (e) {
            var packet = JSON.parse(e.data);
            if(packet.id && buildfire._callbacks[packet.id]){
                buildfire._callbacks[packet.id](packet.error,packet.data);
                delete buildfire._callbacks[packet.id];
            }
            else{
                console.warn( window.location + ' unhandled packet',packet);
                //alert('parent sent: ' + packet.data);
            }
        };
        // Listen to message from child window
        window.removeEventListener('message',eventHandler,false);
        window.addEventListener('message',eventHandler,false);
        buildfire.appearance.attachCSSFiles();
        buildfire.getContext(function(err,context){
            if(err){
                debugger;
                console.error(err);
            }
            else buildfire.context = context;
        });
    }
    ,getContext: function (callback) {
        var p = new Packet(null, 'getContext');
        buildfire.sendPacket(p, callback);
    }
    ,navigateTo:function(widgetId,instanceId, title){
        var p = new Packet(null, 'navigateTo',{widgetId:widgetId,instanceId:instanceId, title:title});
        this.sendPacket(p);
    }
    ,navigateHome:function(){
        var p = new Packet(null, 'navigateHome');
        this.sendPacket(p);
    }
    ,appearance: {
        getCSSFiles: function (callback) {
            var p = new Packet(null, 'appearance.getCSSFiles');
            buildfire.sendPacket(p, callback);
        }
        ,attachCSSFiles: function(){
            var base;
            var scripts = document.getElementsByTagName("script");
            for(var i = 0 ; i < scripts.length ; i++)
                if (scripts[i].src.indexOf('buildfire.js') > 0 ) {
                    base =scripts[i].src.replace('scripts/buildfire.js','');
                    break;
                }

            document.write('<link rel="stylesheet" href="' + base + 'styles/bootstrap.min.css"/>');
        }
    }
    ,sendPacket: function(packet,callback){
        if(typeof (callback) =="function")
            buildfire._callbacks[packet.id] = callback;
        parent.postMessage( JSON.stringify(packet) ,"*");
    }
    ,dataStore:{
        get:function(tag,callback){
            var tagType = typeof(tag);
            if(tagType == "undefined")
                tag='';
            else if(tagType=="function" && typeof(callback)=="undefined"){
                callback=tag;
                tag='';
            }

            var p = new Packet(null, 'datastore.get',tag);
            buildfire.sendPacket(p, callback);

        }
        ,set:function(obj,tag,callback){

            var tagType = typeof(tag);
            if(tagType == "undefined")
                tag='';
            else if(tagType=="function" && typeof(callback)=="undefined"){
                callback=tag;
                tag='';
            }

            var p = new Packet(null, 'datastore.set',{tag:tag,obj:obj});
            buildfire.sendPacket(p, callback);
        }
    }
    ,imageStore:{
        getAll:function(callback){

        }
        ,post:function(img,callback){

        }
        ,show:function(imgUrl,callback){

        }
    }
};
buildfire.init();