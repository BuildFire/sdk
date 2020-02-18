/**
 * Created by zain on 12/12/15.
 */

describe('buildfire.imageLib', function () {

    describe('buildfire.imageLib showDialog', function () {
        beforeEach( function () {
            spyOn(buildfire.imageLib, 'showDialog');

            buildfire.imageLib.showDialog({});
        });

        it("buildfire.imageLib.showDialog should exist and be a function", function () {
            expect(typeof buildfire.imageLib.showDialog).toEqual("function");
        });

        it("buildfire.imageLib.showDialog should open imageLib dialog", function () {
            expect(buildfire.imageLib.showDialog).toHaveBeenCalledWith({});
        });
    });

    describe('buildfire.imageLib resizeImage', function () {
        beforeEach( function () {
            spyOn(buildfire.imageLib, 'resizeImage');

            buildfire.imageLib.resizeImage('https://www.google.com/images/srpr/logo11w.png', {width:100,height:150});
        });
        it("buildfire.imageLib.resizeImage should exist and be a function", function () {
            expect(typeof buildfire.imageLib.resizeImage).toEqual("function");
        });

        it("buildfire.imageLib.resizeImage should  return resized image url ", function () {
            expect(buildfire.imageLib.resizeImage).toHaveBeenCalledWith('https://www.google.com/images/srpr/logo11w.png', {width:100,height:150});
        });

    });

    describe('buildfire.imageLib cropImage', function () {
        beforeEach( function () {
            spyOn(buildfire.imageLib, 'cropImage');

            buildfire.imageLib.cropImage('https://www.google.com/images/srpr/logo11w.png', {width:100,height:150});
        });

        it("buildfire.imageLib.cropImage should exist and be a function", function () {
            expect(typeof buildfire.imageLib.cropImage).toEqual("function");
        });

        it("buildfire.imageLib.cropImage should  return cropped image url ", function () {
            expect(buildfire.imageLib.cropImage).toHaveBeenCalledWith('https://www.google.com/images/srpr/logo11w.png', {width:100,height:150});
        });
    });

    describe('buildfire.imageLib.ENUMS.SIZES', function () {
        beforeEach( function () {
            spyOn(buildfire.imageLib.ENUMS, 'SIZES');

            buildfire.imageLib.ENUMS.SIZES;
        });
        it("buildfire.imageLib.ENUMS.SIZES should exist and return an object", function () {
            expect(typeof buildfire.imageLib.ENUMS.SIZES).toEqual("object");
        });
    });

    describe('buildfire.imageLib.ENUMS.ASPECT_RATIOS', function () {
        beforeEach( function () {
            spyOn(buildfire.imageLib.ENUMS, 'ASPECT_RATIOS');

            buildfire.imageLib.ENUMS.ASPECT_RATIOS;
        });
        it("buildfire.imageLib.ENUMS.ASPECT_RATIOS should exist and return an object", function () {
            expect(typeof buildfire.imageLib.ENUMS.ASPECT_RATIOS).toEqual("object");
        });
    });
});