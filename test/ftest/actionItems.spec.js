/**
 * Created by zain on 12/12/15.
 */

var expect = chai.expect;

describe('buildfire.actionItems', function () {
    describe('buildfire.actionItems showDialog', function () {
        it("buildfire.actionItems.showDialog should exist and be a function", function () {
            expect(buildfire.actionItems.showDialog).to.a("function");
        });
    });

    describe('buildfire.actionItems execute', function () {
        it("buildfire.actionItems.execute should exist and be a function", function () {
            expect(buildfire.actionItems.execute).to.a("function");
        });
    });

    describe('buildfire.actionItems list', function () {
        it("buildfire.actionItems.list should exist and be a function", function () {
            expect(buildfire.actionItems.list).to.a("function");
        });
    });

    describe('buildfire.actionItems create', function () {
        it("buildfire.actionItems.list should exist and be a function", function () {
            expect(buildfire.actionItems.create).to.a("function");
        });

        it("buildfire.actionItems.create", function () {
            var item = buildfire.actionItems.create('linkToWeb','','buildfire');
            expect(item).to.an('object');
            expect(item).to.have.property('action','linkToWeb');
        });

    });
});