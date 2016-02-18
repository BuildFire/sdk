/**
 * Created by danielhindi on 1/25/16.
 */


var fnTests = require('./fnTests.js');

/// create http server //////////////////////////////////////////////////////
var express = require('express');
var http = require('http');

var app = express();
app.set('port', process.env.PORT || 8888);


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



/// Expose static content /////////////////////////////////////////////////////////////////
app.use('/',express.static(__dirname + "/../"));


/// Run server /////////////////////////////////////////////////////////////////
http.createServer(app).listen(app.get('port'), function () {
    console.log('server started localhost:',app.get('port'));
    console.log('start running tests'  );

    fnTests.run(app.get('port'), function(exit_code) {
        process.exit(exit_code);
    });
});

