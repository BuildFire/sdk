/**
 * Created by danielhindi on 1/25/16.
 */

var phantom = require('phantom');

module.exports = {
    run: function(port,callback){
        phantom.create(function (ph) {

            console.log('create page');

            ph.createPage(function (page) {
                console.log('set url');

                var url ="http://localhost:" + port + "/pluginTester/#/plugin/testPlugin";

                var failed = false
                page.onConsoleMessage(function(msg) {
                    console.log(msg);

                    if(/[0-9]+[\s]+failures/.test(msg)) {
                        failed = true;
                    }
                    if(/Run all tests [\S+]+/.test(msg)) {
                        var exit_code = 0;
                        if(failed)
                            exit_code = 1;

                        callback(exit_code);
                        ph.exit();
                    }
                });

                console.log('open page');

                page.open(url, function (status) {
                    console.log(url , " opened? ", status);
                });
            });
        });
    }
};