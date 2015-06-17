/**
 * Created by Daniel on 5/23/2015.
 */
var config=null;

var shell= {
    initFrames: function () {
        var pluginFolder = window.location.hash.replace('#', '');
        if (!pluginFolder) pluginFolder = 'examplePlugin';

        var xmlhttp = new XMLHttpRequest();
        var url = '../plugins/' + pluginFolder + "/plugin.json";

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                config = JSON.parse(xmlhttp.responseText);
                shell.loadFrames(pluginFolder, config);
            }
        };

        xmlhttp.open("GET", url, true);
        xmlhttp.send();

    }
    , loadFrames: function (pluginFolder, config) {
        var root = '../plugins/';
        ///load widget

        window.widget.src = root + pluginFolder + '/widget/index.html';
        var loadCPPage = true;
        ///load control
        if (config.control.content.enabled) {
            btnLoadContent.onclick = function () {
                control.src = root + pluginFolder + '/control/content/index.html';
            };
            btnLoadContent.style.display = 'inline';
            btnLoadContent.click();
            loadCPPage = false;
        }

        if (config.control.design.enabled) {
            btnLoadDesign.onclick = function () {
                control.src = root + pluginFolder + '/control/design/index.html';
            };
            btnLoadDesign.style.display = 'inline';
            if (loadCPPage)btnLoadDesign.click();
            loadCPPage = false;
        }

        if (config.control.settings.enabled) {
            btnLoadDesign.onclick = function () {
                control.src = root + pluginFolder + '/control/settings/index.html';
            };
            btnLoadSettings.style.display = 'inline';
            if (loadCPPage)btnLoadSettings.click();
            loadCPPage = false;
        }

    }
};