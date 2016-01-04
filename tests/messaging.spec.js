/**
 * Created by zain on 12/12/15.
 */

describe('buildfire.messaging', function () {

    describe('buildfire.messaging.sendMessageToWidget', function () {
        beforeEach( function () {
            spyOn(buildfire.messaging, 'sendMessageToWidget');

            buildfire.messaging.sendMessageToWidget({name:'buildfire'});
        });

        it("buildfire.messaging.sendMessageToWidget should exist and be a function", function () {
            expect(typeof buildfire.messaging.sendMessageToWidget).toEqual("function");
        });

        it("buildfire.messaging.sendMessageToWidget should send message to widget", function () {
            expect(buildfire.messaging.sendMessageToWidget).toHaveBeenCalledWith({name:'buildfire'});
        });
    });

    describe('buildfire.messaging.sendMessageToControl', function () {
        beforeEach( function () {
            spyOn(buildfire.messaging, 'sendMessageToControl');

            buildfire.messaging.sendMessageToControl({name:'buildfire'});
        });

        it("buildfire.messaging.sendMessageToControl should exist and be a function", function () {
            expect(typeof buildfire.messaging.sendMessageToControl).toEqual("function");
        });

        it("buildfire.messaging.sendMessageToControl should send message to control", function () {
            expect(buildfire.messaging.sendMessageToControl).toHaveBeenCalledWith({name:'buildfire'});
        });
    });

    describe('buildfire.messaging.onReceivedMessage', function () {
        it("buildfire.messaging.onReceivedMessage should exist and be a function", function () {
            expect(typeof buildfire.messaging.onReceivedMessage).toEqual("function");
        });
    });
});