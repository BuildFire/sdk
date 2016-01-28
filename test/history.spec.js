/**
 * Created by zain on 12/12/15.
 */

var mockErr, mockResult;

describe('buildfire.history', function () {

    describe('buildfire.history push', function () {
        beforeEach( function () {
            spyOn(buildfire.history, 'push');

            buildfire.history.push('Home', { elementToShow: 'Home' });
        });

        it("buildfire.history.push should exist and be a function", function () {
            expect(typeof buildfire.history.push).toBe("function");
        });

        it("buildfire.history.push should push history one level", function () {
           expect(buildfire.history.push).toHaveBeenCalledWith('Home', { elementToShow: 'Home' });
        });
    });

    describe('buildfire.history pop', function () {
        beforeEach( function () {
            spyOn(buildfire.history, 'pop');

            buildfire.history.pop();
        });

        it("buildfire.history.pop should exist and be a function", function () {
            expect(typeof buildfire.history.pop).toBe("function");
        });

        it("buildfire.history.pop should pop history one level", function () {
            expect(buildfire.history.pop).toHaveBeenCalled();
        });
    });

    describe('buildfire.history get', function () {

        beforeEach( function () {
            spyOn(buildfire.history, 'get');

            buildfire.history.get();
        });

        it("buildfire.history.pop should exist and be a function", function () {
            expect(typeof buildfire.history.get).toBe("function");
        });

        it("buildfire.history.pop should pop history one level", function () {
            expect(buildfire.history.get).toHaveBeenCalled();
        });
    });

    describe('buildfire.history onPop', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                home:'home'
            }
        });

        it("buildfire.history.onPop should exist and be a function", function () {
            expect(typeof buildfire.history.onPop).toBe("function");
        });

        it("buildfire.history.onPop should retrieve the passed object  ", function () {

            buildfire.history.onPop(function(result) {
                expect(result).toEqual(jasmine.objectContaining({
                    home:'home'
                }));
            });

            buildfire.history.triggerOnPop({home:'home'});
        });
    });
});
