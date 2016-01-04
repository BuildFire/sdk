/**
 * Created by zain on 12/12/15.
 */

describe('buildfire.notifications', function () {
    describe('buildfire.notifications.alert', function () {
        var options = {message:'alert notification test'}

        beforeEach( function () {
            spyOn(buildfire.notifications, 'alert');

            buildfire.notifications.alert(options);
        });

        it("buildfire.notifications.alert should exist and be a function", function () {
            expect(typeof buildfire.notifications.alert).toEqual("function");
        });

        it("buildfire.notifications.alert", function () {
            expect(buildfire.notifications.alert).toHaveBeenCalledWith(options);
        });
    });

    describe('buildfire.notifications.prompt', function () {
        var options = {message:'prompt notification test',defaultText:'this is a test'}

        beforeEach( function () {
            spyOn(buildfire.notifications, 'confirm');

            buildfire.notifications.confirm(options);
        });

        it("buildfire.notifications.confirm should exist and be a function", function () {
            expect(typeof buildfire.notifications.confirm).toEqual("function");
        });

        it("buildfire.notifications.prompt", function () {
            expect(buildfire.notifications.confirm).toHaveBeenCalledWith(options);
        });
    });

    describe('buildfire.notifications.beep', function () {
        beforeEach( function () {
            spyOn(buildfire.notifications, 'beep');

            buildfire.notifications.beep();
        });

        it("buildfire.notifications.beep should exist and be a function", function () {
            expect(typeof buildfire.notifications.beep).toEqual("function");
        });

        it("buildfire.notifications.beep", function () {
            expect(buildfire.notifications.beep).toHaveBeenCalled();
        });
    });

    describe('buildfire.notifications', function () {
        beforeEach( function () {
            spyOn(buildfire.notifications, 'vibrate');

            buildfire.notifications.vibrate(1);
        });

        it("buildfire.notifications.vibrate should exist and be a function", function () {
            expect(typeof buildfire.notifications.vibrate).toEqual("function");
        });

        it("buildfire.notifications.vibrate", function () {
            expect(buildfire.notifications.vibrate).toHaveBeenCalledWith(1);
        });
    });
});