/**
 * Created by zain on 12/27/15.
 */
var expect = chai.expect;
describe('buildfire.pluginInstance', function () {
    describe('pluginInstance showDialog', function () {
        it("pluginInstance showDialog should exist and be a function", function () {
            expect(buildfire.pluginInstance.showDialog).to.a("function");
        });
    });

    describe('pluginInstance get', function () {
        it("pluginInstance get should exist and be a function", function () {
            expect(buildfire.pluginInstance.get).to.a("function");
        });
    });
});

