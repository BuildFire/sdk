/**
 * Created by zain on 09/12/15.
 */

var expect = chai.expect;

describe('buildfire.navigation', function () {
    describe('buildfire.navigation.openWindow', function () {
        it("buildfire.navigateTo should exist and be a function", function () {
            expect(buildfire.navigation.navigateTo).to.a("function");
        });
    });
    describe('buildfire.navigation.openWindow', function () {
        it("buildfire.navigateHome should exist and be a function", function () {
            expect(buildfire.navigation.navigateHome).to.a("function");
        });
    });
    describe('buildfire.navigation.openWindow', function () {
        it("buildfire.openWindow should exist and be a function", function () {
            expect(buildfire.navigation.openWindow).to.a("function");
        });
    });

    describe('buildfire.navigation.scrollTop', function () {
        it("buildfire.scrollTop should exist and be a function", function () {
            expect(buildfire.navigation.scrollTop).to.a("function");
        });
    });

    describe('buildfire.navigation.goBack', function () {
        it("buildfire.goBack should exist and be a function", function () {
            expect(buildfire.navigation.goBack).to.a("function");
        });
    });
});
