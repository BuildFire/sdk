/**
 * Created by zain on 12/12/15.
 */

var mockErr, mockResult;

describe('buildfire.geo', function () {

    describe('buildfire.geo.getCurrentPosition', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                err: null,
                position: {
                    coords: {
                        accuracy: 35,
                        latitude: 31.959641299999994,
                        longitude: 35.9137322,
                    },
                    timestamp: 1451173050145
                }
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.geo.getCurrentPosition should be exist and be a function", function () {
            expect(typeof buildfire.geo.getCurrentPosition).toBe("function");
        });

        it("buildfire.geo.getCurrentPosition to get the current position of the device", function () {
            buildfire.geo.getCurrentPosition(null, function (err, result) {
                expect(err).toBeNull();
                expect(result.position).toEqual(jasmine.objectContaining({
                    coords: {
                        accuracy: 35,
                        latitude: 31.959641299999994,
                        longitude: 35.9137322,
                    },
                    timestamp: 1451173050145
                }));
            });

        });
    });

    describe('buildfire.geo.watchPosition', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                err: null,
                position: {
                    coords: {
                        accuracy: 35,
                        latitude: 31.959641299999994,
                        longitude: 35.9137322,
                    },
                    timestamp: 1451173050145,
                    watchId: 1
                }
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.geo.watchPosition should be exist and be a function", function () {
            expect(typeof buildfire.geo.watchPosition).toBe("function");
        });

        it("buildfire.geo.watchPosition to watch current position of the device", function () {
            buildfire.geo.watchPosition(null, function (err, result) {
                expect(err).toBeNull();
                expect(result.position).toEqual(jasmine.objectContaining({
                    coords: {
                        accuracy: 35,
                        latitude: 31.959641299999994,
                        longitude: 35.9137322,
                    },
                    timestamp: 1451173050145
                }));
            });

        });
    });

    describe('buildfire.geo.clearWatch', function () {
        it("buildfire.geo.clearWatch should be exist and be a function", function () {
            expect(typeof buildfire.geo.clearWatch).toBe("function");
        });

        it("buildfire.geo.clearWatch to stop watching the device position ", function () {
            var watchId = 1;

            buildfire.geo.clearWatch(watchId, function () {
                expect(watchId).not.toBeNull();
            });
        });
    });
});