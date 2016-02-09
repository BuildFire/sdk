/**
 * Created by zain on 12/12/15.
 */

var expect = chai.expect;

describe('buildfire.device', function () {

    describe('buildfire.device.calender.addEvent', function () {
        it("buildfire.device.calender.addEvent should be exist and be a function", function () {
            expect(buildfire.device.calendar.addEvent).to.a("function");
        });

        it("buildfire.device..calender.share", function (done) {
            buildfire.device.share({
                subject:'my message title',
                text:'my message text',
                image: 'http://myImageUrl',
                link: 'http://anyLink'
            }, function (err,result) {
                expect(err).to.null;
                done();
            });
        });
    });
});