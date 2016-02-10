/**
 * Created by zain on 12/12/15.
 */

var expect = chai.expect;

describe('buildfire.geo', function () {

    describe('buildfire.geo.getCurrentPosition', function () {
        it("buildfire.geo.getCurrentPosition should be exist and be a function", function () {
            expect(buildfire.geo.getCurrentPosition).to.a("function");
        });
    });

    describe('buildfire.geo.watchPosition', function () {
        it("buildfire.geo.watchPosition should be exist and be a function", function () {
            expect(buildfire.geo.watchPosition).to.a("function");
        });
    });

    describe('buildfire.geo.clearWatch', function () {
        it("buildfire.geo.clearWatch should be exist and be a function", function () {
            expect(buildfire.geo.clearWatch).to.a("function");
        });


        it("buildfire.geo.clearWatch to stop watching the device position ", function (done) {
            var watchId;
            buildfire.geo.watchPosition(null, function (err,position) {
                watchId = position.watchid;
            });
            buildfire.geo.clearWatch(watchId, function () {
                expect(watchId).to.not.exist
                done();
            });

        });
    });
});