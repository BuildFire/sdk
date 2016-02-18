/**
 * Created by zain on 12/12/15.
 */

var mockErr, mockResult;

describe('buildfire.device', function () {

    describe('buildfire.device.calender.addEvent', function () {

        beforeEach (function() {
            mockErr = null;
            mockResult = {
                event : 'event has been added to your calender'
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.device.calender.addEvent should be exist and be a function", function () {
            expect(typeof buildfire.device.calendar.addEvent).toBe("function");
        });

        it("buildfire.device.calender.addEvent", function () {
            buildfire.device.calendar.addEvent(
                {
                    title: 'Dannys Birthday'
                    , location: '1950 Main st, NYC, NY'
                    , notes: 'Better bring a gift'
                    , startDate: new Date(2015, 10, 20, 8, 0, 0)
                    , endDate: new Date(2015, 10, 20, 10, 0, 0)
                    , options: {
                        firstReminderMinutes: 120
                        , secondReminderMinutes: 5
                        , recurrence: "yearly"
                        , recurrenceEndDate: new Date(2025, 6, 1, 0, 0, 0, 0, 0)
                    }
                },
                function (err, result) {
                    expect(err).toBeNull();
                    expect(result.event).toEqual('event has been added to your calender');
                });
        });
    });

    describe('buildfire.device.calender.share', function () {

        beforeEach (function() {
            mockErr = null;
            mockResult = {
                data : true
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.device.calender.share", function () {
            buildfire.device.share({
                subject:'my message title',
                text:'my message text',
                image: 'http://myImageUrl',
                link: 'http://anyLink'
            }, function (err, result) {
                expect(err).toBeNull();
                expect(result.data).toEqual(true);
            });
        });
    });
});