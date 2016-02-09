/**
 * Created by zain on 12/12/15.
 */

var expect = chai.expect;
describe('buildfire.messaging', function () {

    describe('buildfire.messaging.sendMessageToWidget', function () {
        it("buildfire.messaging.sendMessageToWidget should exist and be a function", function () {
            expect(buildfire.messaging.sendMessageToWidget).to.a("function");
        });
    });

    describe('buildfire.messaging.sendMessageToControl', function () {
        it("buildfire.messaging.sendMessageToControl should exist and be a function", function () {
            expect(buildfire.messaging.sendMessageToControl).to.a("function");
        });
    });
});