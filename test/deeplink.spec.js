/**
 * Created by zain on 12/27/15.
 */

var mockErr, mockResult;

describe('buildfire.deeplink', function () {


    describe('deeplink getData', function () {
        var link =  "app999e0f7c-9d2f-11e5-aa33-02f7ca55c361://plugin?dld=\"section:7\"";

        beforeEach (function() {
            mockErr = null;
            mockResult = {
                pluginLink : link
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("deeplink getData should exist and be a function", function () {
            expect(typeof buildfire.deeplink.getData).toEqual("function");
        });

        it("deeplink getData should retrieve available links", function () {
            buildfire.deeplink.getData(function(err, data){
                pluginLink : link;

            });
        });
    });

});