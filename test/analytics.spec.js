/**
 * Created by zain on 12/27/15.
 */

describe('buildfire.analytics', function () {
    describe('buildfire.analytics.trackView', function () {
        beforeEach( function () {
            spyOn(buildfire.analytics, 'trackView');

            buildfire.analytics.trackView('contact-us',  { number : 1 });
        });

        it("buildfire.analytics.trackView should exist and be a function", function () {
            expect(typeof buildfire.analytics.trackView).toEqual("function");
        });

        it("buildfire.analytics.trackView ", function () {

            expect(buildfire.analytics.trackView).toHaveBeenCalledWith('contact-us',  { number : 1 });
        });
    });

    describe('buildfire.analytics.trackAction', function () {
        beforeEach( function () {
            spyOn(buildfire.analytics, 'trackAction');

            buildfire.analytics.trackAction('contact-us', { number : 1 });
        });

        it("buildfire.analytics.trackAction should exist and be a function", function () {
            expect(typeof buildfire.analytics.trackAction).toEqual("function");
        });

        it("buildfire.analytics.trackAction ", function () {

            expect(buildfire.analytics.trackAction).toHaveBeenCalledWith('contact-us', { number : 1 });
        });
    });
});