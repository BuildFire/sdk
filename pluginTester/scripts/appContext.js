window.appContext = {
    currentApp: {
        appId : null // [Place your app ID here]
    }
    ,currentPlugin:{
        pluginId: "48567-84579-sd54d-d4565"
        ,pluginPath:"myPlugin" // [Enter your Plugin Folder Name here]
        ,instanceId: -1
        ,mode: 0
    }
};
if(window.appContext.currentApp.appId == null)
    window.appContext.currentApp.appId = prompt('No App ID was found in appContext.js please enter in your App ID');


//still
if(window.appContext.currentApp.appId == null){
    console.log('Your configuration has not yet been setup. ' +
    'Please sign up for a dev account at http://developer.buildfire.com and get your FREE app id.' +
    ' Then add it to the pluginTester/scripts/appContext.js file');
}
