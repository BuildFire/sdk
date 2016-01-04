/**
 * Created by zain on 12/27/15.
 */

//only set header visibility is documented !

describe('buildfire.appearance', function () {
    describe('buildfire.appearance.setHeaderVisibility', function () {
        beforeEach( function () {
            spyOn(buildfire.appearance, 'setHeaderVisibility');

            buildfire.appearance.setHeaderVisibility(true);
        });

        it("buildfire.actionItems.setHeaderVisibility should exist and be a function", function () {
            expect(typeof buildfire.appearance.setHeaderVisibility).toEqual("function");
        });

        it("buildfire.actionItems.showDialog should be called with an actionItem", function () {

            expect(buildfire.appearance.setHeaderVisibility).toHaveBeenCalledWith(true);
        });
    });
});