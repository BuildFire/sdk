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

                var url ="http://localhost:" + port + "/pluginTester/#/plugin/myPlugin";

                console.log('open page');
                page.open(url, function (status) {
                    console.log(url , " opened? ", status);

                    ph.exit();
                    callback();
                });
            });



        });

    }
};