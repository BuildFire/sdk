/**
 * Created by Daniel on 5/23/2015.
 */
logger = console;
pluginAPI.init(-1, 0, 1, 0);
pluginAPI.datastore.dataStoreUrl = 'http://ds.buildfire.com:88';


pluginAPI.datastore.addEventListener('onUpdate',function(e){
    alert('update!');
});