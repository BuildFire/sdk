/**
 * Created by zain on 12/12/15.
 */

var mockErr, mockResult;

describe('buildfire.auth', function () {

    describe('buildfire.auth.login', function () {

        beforeEach (function() {
            mockErr = null;
            mockResult = {
                err: null,
                data: {
                    _id: "567f1098ee6a3c481d001761",
                    createdOn: "2015-12-26T22:11:36.902Z",
                    email: "zelabedeen@madaincorp.com",
                    isActive: true
                }
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.auth.login should be exist and be a function", function () {
            expect(typeof buildfire.auth.login).toEqual("function");
        });

        it("buildfire.auth.login", function () {
            buildfire.auth.login(null, function(err, result) {
                expect(err).toBeNull();
                expect(result.data).toEqual(jasmine.objectContaining({
                    _id: "567f1098ee6a3c481d001761",
                    createdOn: "2015-12-26T22:11:36.902Z",
                    email: "zelabedeen@madaincorp.com",
                    isActive: true
                }));
            });
        });
    });
//function is called after login or registration is successful.
    describe('buildfire.auth.loginOut', function () {

        beforeEach( function () {
            spyOn(buildfire.auth, 'logout');

            buildfire.auth.logout();
        });

        it("buildfire.auth.logout should be exist and be a function", function () {
            expect(typeof buildfire.auth.logout).toEqual("function");
        });

        it("buildfire.auth.logout", function () {

            expect(buildfire.auth.logout).toHaveBeenCalled();
        });
    });

    describe('buildfire.auth.getCurrentUser', function () {

        beforeEach (function() {
            mockErr = null;
            mockResult = {
                err: null,
                data: {
                    _id: "567f1098ee6a3c481d001761",
                    createdOn: "2015-12-26T22:11:36.902Z",
                    email: "zelabedeen@madaincorp.com",
                    isActive: true
                }
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.auth.getCurrentUser should be exist and be a function", function () {
            expect(typeof buildfire.auth.getCurrentUser).toEqual("function");
        });

        it("buildfire.auth.getCurrentUser", function () {
            buildfire.auth.getCurrentUser(function(err ,result) {
                expect(err).toBeNull();
                expect(result.data).toEqual(jasmine.objectContaining({
                    _id: "567f1098ee6a3c481d001761",
                    createdOn: "2015-12-26T22:11:36.902Z",
                    email: "zelabedeen@madaincorp.com",
                    isActive: true
                }));
            });
        });
    });

    describe('buildfire.auth.onLogin', function () {

        beforeEach( function () {
            spyOn(buildfire.auth, 'onLogin');

            buildfire.auth.onLogin();
        });

        it("buildfire.auth.onLogin should be exist and be a function", function () {
            expect(typeof buildfire.auth.onLogin).toEqual("function");
        });

        it("buildfire.auth.onLogin", function () {

            expect(buildfire.auth.onLogin).toHaveBeenCalled();
        });
    });

    describe('buildfire.auth.onLogout', function () {

        beforeEach( function () {
            spyOn(buildfire.auth, 'onLogout');

            buildfire.auth.onLogout();
        });

        it("buildfire.auth.onLogout should be exist and be a function", function () {
            expect(typeof buildfire.auth.onLogout).toEqual("function");
        });

        it("buildfire.auth.onLogout", function () {

            expect(buildfire.auth.onLogout).toHaveBeenCalled();
        });
    });
});