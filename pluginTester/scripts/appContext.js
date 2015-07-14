window.appContext = {
    currentApp: {
        appId : null // [Place your app ID here]
        ,keys:{datastoreKey:'a1234-34f34-1awe234-23423'}
    }
    ,currentPlugin:{
        pluginId: "48567-84579-sd54d-d4565"
        ,pluginPath:"myPlugin" // [Enter your Plugin Folder Name here]
        ,instanceId: -1
        ,mode: 0
    }
};

if(window.appContext.currentApp.appId == null){
    alert('Your configuration has not yet been setup. ' +
    'Please sign up for a dev account at http://developer.buildfire.com and get your FREE app id.' +
    ' Then add it to the pluginTester/scripts/appContext.js file');
    throw ("window.appContext.currentApp.appId has not been set");
}
