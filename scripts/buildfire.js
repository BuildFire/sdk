
function Packet(id,cmd,data){
    this.id= id?id:new Date().toISOString();
    this.cmd= cmd;
    this.data = data;
}

var buildfire = {
     _callbacks:{}
    ,init:function(){
        // Listen to message from child window
        window.removeEventListener('message',buildfire.postMessageHandler,false);
        window.addEventListener('message',buildfire.postMessageHandler,false);
        buildfire.appearance.attachCSSFiles();
        buildfire.getContext(function(err,context){
            if(err){
                debugger;
                console.error(err);
            }
            else buildfire.context = context;
        });
    }
    ,postMessageHandler: function (e) {
        if (e.source === window) return;//e.origin != "null"
        console.log('buildfire.js received << ' + e.data);
		var packet = JSON.parse(e.data);

        if(packet.id && buildfire._callbacks[packet.id]){
            buildfire._callbacks[packet.id](packet.error,packet.data);
            delete buildfire._callbacks[packet.id];
        }
        else if(packet.cmd){

            var sequence = packet.cmd.split('.');
            var obj = buildfire;
            var parent=buildfire;
            for (var i = 0; i < sequence.length; i++){
                if(i>0)parent=obj;
                if(obj[sequence[i]])
                    obj = obj[sequence[i]];
                else
                    return; // sorry i cant help you
            }
            obj.apply(parent,[packet.data]);
        }
        else{
            console.warn( window.location + ' unhandled packet',packet);
            //alert('parent sent: ' + packet.data);
        }
    }
    ,getContext: function (callback) {
        var p = new Packet(null, 'getContext');
        buildfire.sendPacket(p, callback);
    }
    ,navigateTo:function(pluginId,instanceId, title){
        var p = new Packet(null, 'navigateTo',{pluginId:pluginId,instanceId:instanceId, title:title});
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
            if(window.location.pathname.indexOf('/control/') > 0)
                base ='/';
            else {
                var scripts = document.getElementsByTagName("script");
                for (var i = 0; i < scripts.length; i++)
                    if (scripts[i].src.indexOf('buildfire.js') > 0) {
                        base = scripts[i].src.replace('scripts/buildfire.js', '');
                        break;
                    }
            }
            document.write('<link rel="stylesheet" href="' + base + 'styles/bootstrap.css"/>');

        }
    }
    ,sendPacket: function(packet,callback){
        if(typeof (callback) =="function")
            buildfire._callbacks[packet.id] = callback;

        var p = JSON.stringify(packet);
        console.log("BuildFire.js Send >> " + p);
        if(parent)parent.postMessage( p ,"*");
    }
    ,analytics: {
        trackAction: function(actionName, metadata) {
            var p = new Packet(null, "analytics.trackActionCommand", {
                value: actionName,
                metadata: metadata
            }); // wrap object to follow the command(obj, callback)
            buildfire.sendPacket(p);
        },
        trackView: function(actionName, metadata) {
            var p = new Packet(null, "analytics.trackViewCommand", {
                value: actionName,
                metadata: metadata
            }); // wrap object to follow the command(obj, callback)
            buildfire.sendPacket(p);
        }
    }
    ,datastore:{
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
        ,save:function(obj,tag,callback){

            var tagType = typeof(tag);
            if(tagType == "undefined")
                tag='';
            else if(tagType=="function" && typeof(callback)=="undefined"){
                callback=tag;
                tag='';
            }

            var p = new Packet(null, 'datastore.save',{tag:tag,obj:obj});
            buildfire.sendPacket(p, function(err, result){
                if(result)buildfire.datastore.triggerOnUpdated(result);
                callback(err, result);
            });
        }
        ,onUpdate:function(callback){
            document.addEventListener('datastoreOnUpdate',callback,false);
        }
        ,triggerOnUpdated: function(data){
            var onUpdateEvent = new CustomEvent('datastoreOnUpdate',{'detail':data});
            console.log("Announce the data has changed!!!");
            document.dispatchEvent(onUpdateEvent);
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