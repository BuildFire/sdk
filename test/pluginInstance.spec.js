/**
 * Created by zain on 12/27/15.
 */

describe('buildfire.pluginInstance', function () {
    describe('pluginInstance showDialog', function () {
        beforeEach( function () {
            spyOn(buildfire.pluginInstance, 'showDialog');

            buildfire.pluginInstance.showDialog({
                prop1:""
            });
        });

        it("pluginInstance showDialog should exist and be a function", function () {
            expect(typeof buildfire.pluginInstance.showDialog).toEqual("function");
        });

        it("pluginInstance showDialog", function () {
            expect(buildfire.pluginInstance.showDialog).toHaveBeenCalled();
        });
    });

    describe('pluginInstance get', function () {
        beforeEach( function () {
            spyOn(buildfire.pluginInstance, 'get');

            buildfire.pluginInstance.get(['123','321']);
        });

        it("pluginInstance get should exist and be a function", function () {
            expect(typeof buildfire.pluginInstance.get).toEqual("function");
        });

        it("pluginInstance get", function () {
            expect(buildfire.pluginInstance.get).toHaveBeenCalledWith(['123','321']);
        });
    });


    describe('pluginInstance search', function () {
        beforeEach( function () {
            spyOn(buildfire.pluginInstance, 'search');

            buildfire.pluginInstance.search({});
        });

        it("pluginInstance search should exist and be a function", function () {
            expect(typeof buildfire.pluginInstance.search).toEqual("function");
        });

        it("pluginInstance search", function () {
            expect(buildfire.pluginInstance.search).toHaveBeenCalledWith({});
        });
    });
});

