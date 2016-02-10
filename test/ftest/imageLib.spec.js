/**
 * Created by zain on 12/12/15.
 */

var expect = chai.expect;

describe('buildfire.imageLib', function () {

    describe('buildfire.imageLib resizeImage', function () {
        it("buildfire.imageLib.resizeImage should exist and be a function", function () {
            expect(buildfire.imageLib.resizeImage).to.a("function");
        });

        it("buildfire.imageLib.resizeImage should  return resized image url ", function () {
            var newUrl = buildfire.imageLib.resizeImage('https://www.google.com/images/srpr/logo11w.png', {width:100,height:150});
            expect(newUrl).to.equal('http://s7obnu.cloudimage.io/s/resizenp/100x150/https://www.google.com/images/srpr/logo11w.png');
        });
    });

    describe('buildfire.imageLib cropImage', function () {
        it("buildfire.imageLib.cropImage should exist and be a function", function () {
            expect(buildfire.imageLib.cropImage).to.a("function");
        });

        it("buildfire.imageLib.cropImage should  return cropped image url ", function () {
            var newUrl = buildfire.imageLib.cropImage('https://www.google.com/images/srpr/logo11w.png', {width:100,height:150});
            expect(newUrl).to.equal('http://s7obnu.cloudimage.io/s/crop/100x150/https://www.google.com/images/srpr/logo11w.png');
        });
    });
});