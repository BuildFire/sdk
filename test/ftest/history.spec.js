/**
 * Created by zain on 12/12/15.
 */

var expect = chai.expect;

describe('buildfire.history', function () {

    describe('buildfire.history push', function () {
        it("buildfire.history.push should exist and be a function", function () {
            expect(buildfire.history.push).to.a("function");
        });
    });

    describe('buildfire.history pop', function () {
        it("buildfire.history.pop should exist and be a function", function () {
            expect(buildfire.history.pop).to.a("function");
        });
    });

    describe('buildfire.history get', function () {
        it("buildfire.history.get should exist and be a function", function () {
            expect(buildfire.history.get).to.a("function");
        });

        it("buildfire.history.get should retrieve history ", function (done) {
            buildfire.history.get({ pluginBreadcrumbsOnly: true }, function(err, result) {
                expect(err).to.null;
                done();
            });
        });
    });

    describe('buildfire.history onPop', function () {
        it("buildfire.history.onPop should exist and be a function", function () {
            expect(buildfire.history.onPop).to.a("function");
        });

        it("buildfire.history.onPop should retrieve the passed object  ", function (done) {

            buildfire.history.onPop(function(result) {
                expect(result).to.an('object');
                expect(result).to.have.property('home','home');
                done();
            });

            buildfire.history.triggerOnPop({home:'home'});
        });
    });
});
