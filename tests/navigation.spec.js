/**
 * Created by zain on 12/12/15.
 */

describe('buildfire.navigation', function () {
    describe('buildfire.navigation.navigateTo', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'navigateTo');

            buildfire.navigation.navigateTo(1, 1, 'home')
        });

        it("buildfire.navigateTo should exist and be a function", function () {
            expect(typeof buildfire.navigation.navigateTo).toEqual("function");
        });

        it("buildfire.navigateTo should navigate to a plugin", function () {
            expect(buildfire.navigation.navigateTo).toHaveBeenCalledWith(1, 1, 'home')
        });
    });

    describe('buildfire.navigation.navigateHome', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'navigateHome');

            buildfire.navigation.navigateHome()
        });

        it("buildfire.navigateHome should exist and be a function", function () {
            expect(typeof buildfire.navigation.navigateHome).toEqual("function");
        });

        it("buildfire.navigateTo should navigate to a plugin", function () {
            expect(buildfire.navigation.navigateHome).toHaveBeenCalled();
        });
    });

    describe('buildfire.navigation.openWindow', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'openWindow');

            buildfire.navigation.openWindow('http://google.com','_blank');
        });

        it("buildfire.openWindow should exist and be a function", function () {
            expect(typeof buildfire.navigation.openWindow).toEqual("function");
        });

        it("buildfire.openWindow should open a webpage", function () {
            expect(buildfire.navigation.openWindow).toHaveBeenCalled();
        });
    });

    describe('buildfire.navigation.onBackButtonClick', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'onBackButtonClick');

            buildfire.navigation.goBack();
        });

        it("buildfire.onBackButtonClick should exist and be a function", function () {
            expect(typeof buildfire.navigation.onBackButtonClick).toEqual("function");
        });

        it("buildfire.onBackButtonClick should be called", function () {
            buildfire.navigation.onBackButtonClick = function() {
                expect(buildfire.navigation.onBackButtonClick).toHaveBeenCalled();
            }
        });
    });

    describe('buildfire.navigation.restoreBackButtonClick', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'restoreBackButtonClick');

            buildfire.navigation.restoreBackButtonClick();
        });

        it("buildfire.restoreBackButtonClick should exist and be a function", function () {
            expect(typeof buildfire.navigation.restoreBackButtonClick).toEqual("function");
        });

        it("buildfire.restoreBackButtonClick should restore backButton function", function () {
            expect(buildfire.navigation.restoreBackButtonClick).toHaveBeenCalled();
        });
    });

    describe('buildfire.navigation.goBack', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'goBack');

            buildfire.navigation.goBack();
        });

        it("buildfire.goBack should exist and be a function", function () {
            expect(typeof buildfire.navigation.goBack).toEqual("function");
        });

        it("buildfire.goBack should trigger back function", function () {
            expect(buildfire.navigation.goBack).toHaveBeenCalled();
        });
    });

    describe('buildfire.navigation.makeSafeLinks', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'makeSafeLinks');

            buildfire.navigation.makeSafeLinks(1111);
        });

        it("buildfire.makeSafeLinks should exist and be a function", function () {
            expect(typeof buildfire.navigation.makeSafeLinks).toEqual("function");
        });

        it("buildfire.makeSafeLinks should be called", function () {
            expect(buildfire.navigation.makeSafeLinks).toHaveBeenCalledWith(1111);
        });
    });

    describe('buildfire.navigation.scrollTop', function () {
        beforeEach( function () {
            spyOn(buildfire.navigation, 'scrollTop');

            buildfire.navigation.scrollTop();
        });

        it("buildfire.scrollTop should exist and be a function", function () {
            expect(typeof buildfire.navigation.makeSafeLinks).toEqual("function");
        });

        it("buildfire.scrollTop should be called", function () {
            expect(buildfire.navigation.scrollTop).toHaveBeenCalled();
        });
    });
});
