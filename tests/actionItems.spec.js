/**
 * Created by zain on 12/12/15.
 */

var mockErr, mockResult;

describe('buildfire.actionItems', function () {

    describe('buildfire.actionItems showDialog', function () {
        var item;
        beforeEach( function () {
            spyOn(buildfire.actionItems, 'showDialog');

            item = {
                title: "build fire",
                url: "https://www.facebook.com/buildfireapps",
                action: "linkToWeb",
                openIn: "_blank"
            };
            buildfire.actionItems.showDialog(item, {showIcon:true});
        });

        it("buildfire.actionItems.showDialog should exist and be a function", function () {
            expect(typeof buildfire.actionItems.showDialog).toEqual("function");
        });

        it("buildfire.actionItems.showDialog should be called with an actionItem", function () {

            expect(buildfire.actionItems.showDialog).toHaveBeenCalledWith(item, {showIcon:true});
        });
    });

    describe('buildfire.actionItems execute', function () {

        beforeEach (function() {
            mockErr = null;
            mockResult = {
                data: true
            }
        });

        afterAll (function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.actionItems.execute should exist and be a function", function () {
            expect(typeof buildfire.actionItems.execute).toEqual("function");
        });

        it("buildfire.actionItems.execute", function () {

            var item = {
                title: "build fire",
                url: "https://www.facebook.com/buildfireapps",
                action: "linkToWeb",
                openIn: "_blank"
            };

            buildfire.actionItems.execute(item, null, function (err, data) {
                expect(err).toBeNull();
                expect(data.data).toEqual(true);
            });
        });
    });

    describe('buildfire.actionItems list', function () {

        var items = [ {title: "facebook", url: "https://www.facebook.com", action: "linkToWeb", openIn: "_blank"},
            {title: "google", url: "https://www.go.aogle.com", action: "linkToWeb", openIn: "_blank"},
            {title: "buildfire", url: "https://www.buildfire.com", action: "linkToWeb", openIn: "_blank"}
        ];

        beforeEach (function() {
            mockErr = null;
            mockResult = items;
        });

        afterAll (function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.actionItems.list should exist and be a function", function () {
            expect(typeof buildfire.actionItems.list).toEqual("function");
        });

        it("buildfire.actionItems.list should list action items list", function () {

            buildfire.actionItems.list(items,null,function (err, actionItems) {
                expect(err).toBeNull();
                expect(actionItems.length).toEqual(3);
                expect(actionItems[0]).toEqual(jasmine.objectContaining({
                    title: "facebook",
                    url: "https://www.facebook.com",
                    action: "linkToWeb",
                    openIn: "_blank"
                }));
            });
        });
    });
//not documented **
    describe('buildfire.actionItems create', function () {
        it("buildfire.actionItems.list should exist and be a function", function () {
            expect(typeof buildfire.actionItems.create).toEqual("function");
        });

        it("buildfire.actionItems.create", function () {
            var item = buildfire.actionItems.create('linkToWeb','','buildfire');

            expect(item).toEqual(jasmine.objectContaining({
                action: 'linkToWeb',
                title: 'buildfire'
            }));
        });
    });
});