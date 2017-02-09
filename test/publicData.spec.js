/**
 * Created by Ayman on 01/16/17.
 */

var mockErr, mockResult;

describe('buildfire.publicData', function () {
    describe('publicData save', function () {
        beforeEach(function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name: 'buildfire'}
            }
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("publicData.save should exist and be a function", function () {
            expect(typeof buildfire.publicData.save).toEqual("function");
        });

        it("publicData.save({name:buildfire},'info') should add name:'buildfire' with tag:info "
            , function () {
                buildfire.publicData.save({name: 'buildfire'}, 'info', function (err, status) {
                    expect(err).toBeNull();
                    expect(status).toEqual(jasmine.any(Object));
                    expect(status.tag).toEqual('info');
                    expect(status.data).toEqual(jasmine.objectContaining({
                        name: 'buildfire'
                    }));
                });
            });
    });

    describe('publicData get', function () {
        beforeEach(function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name: 'buildfire'}
            }
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.get should exist and be a function", function () {
            expect(typeof buildfire.publicData.get).toEqual("function");
        });

        it("publicData.get should return retrieve an object with tag:info and data:{name:'buildfire'}"
            , function () {
                buildfire.publicData.get('info', function (err, result) {
                    expect(err).toBeNull();
                    expect(result).toEqual(jasmine.any(Object));
                    expect(result.tag).toEqual('info');
                    expect(result.data).toEqual(jasmine.objectContaining({
                        name: 'buildfire'
                    }));
                });
            });
    });

    describe('publicData getById', function () {
        beforeEach(function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name: 'buildfire'}
            }
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.getById should exist and be a function", function () {
            expect(typeof buildfire.publicData.getById).toEqual("function");
        });

        it("publicData.getById('5668de2247308714115776de','info') " +
            "should retrieve an object with tag:info and data:{name:'buildfire'}", function () {
            buildfire.publicData.getById('5668de2247308714115776de', 'info', function (err, result) {
                expect(err).toBeNull();
                expect(result).toEqual(jasmine.any(Object));
                expect(result.tag).toEqual('info');
                expect(result.data).toEqual(jasmine.objectContaining({
                    name: 'buildfire'
                }));
            });
        });
    });

    describe('publicData insert', function () {
        beforeEach(function () {
            mockErr = null;
            mockResult = {
                tag: 'record',
                data: {uid: 101}
            }
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.insert should exist and be a function", function () {
            expect(typeof buildfire.publicData.insert).toEqual("function");
        });

        it("publicData.insert({id:001},'record',true) " +
            "should add {id:001} with tag:record and check for duplicates", function () {
            buildfire.publicData.insert({uid: 101}, 'record', true, function (err, status) {
                //debugger;
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('record');
                expect(status.data).toEqual(jasmine.objectContaining({
                    uid: 101
                }));
            });
        });

        it("publicData.insert({uid:001},'record',false) " +
            "should add duplicate {uid:101} with tag:record", function () {
            buildfire.publicData.insert({uid: 101}, 'record', false, function (err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('record');
                expect(status.data).toEqual(jasmine.objectContaining({
                    uid: 101
                }));
            });
        });

        it("publicData.insert({uid:101},'record',true) " +
            "should return duplicate error addition", function () {
            mockErr = {};
            buildfire.publicData.insert({id: 101}, 'record', true, function (err, status) {
                expect(err).toEqual(jasmine.any(Object));
            });
        });
    });

    describe('publicData bulkInsert', function () {
        var data = [{name: 'miles', tel: '667-341-988'}, {name: 'davis', tel: '444-565-499'}];
        beforeEach(function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: data
            }
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.bulkInsert should exist and be a function", function () {
            expect(typeof buildfire.publicData.bulkInsert).toEqual("function");
        });

        it("publicData.bulkInsert should insert bulk objects to info tag", function () {
            buildfire.publicData.bulkInsert(data, 'info', function (err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('info');
                expect(status.data[0]).toEqual(jasmine.objectContaining({
                    name: 'miles',
                    tel: '667-341-988'
                }));

                expect(status.data[1]).toEqual(jasmine.objectContaining({
                    name: 'davis',
                    tel: '444-565-499'
                }));
            });
        });
    });

    describe('publicData update', function () {

        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.update should exist and be a function", function () {
            expect(typeof buildfire.publicData.update).toEqual("function");
        });

        it("buildfire.publicData.update should update an object", function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name: 'buildfire@2016'}
            };

            var newData = {name: 'buildfire@2016'}
            buildfire.publicData.update(1, newData, 'info', function (err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('info');
                expect(status.data).toEqual(jasmine.objectContaining({
                    name: 'buildfire@2016'
                }));
            });
        });

        it("buildfire.publicData.update ", function () {
            mockErr = {};
            mockResult = {
                tag: 'info',
                data: {salary: 1000}
            };
            buildfire.publicData.update('5668de22eeeeeeeeeeeeeeee', {salary: 1000}, 'info', function (err, status) {
                expect(err).toEqual(jasmine.any(Object));
            });
        });

    });

    describe('publicData search and update', function () {

        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.update should exist and be a function", function () {
            expect(typeof buildfire.publicData.searchAndUpdate).toEqual("function");
        });

        it("buildfire.publicData.searchAndUpdate should search and update an object", function () {
            mockErr = null;
            mockResult = {
                nModified: 1,
                status: "updated"
            };

            var newData = {name: 'buildfire@2016'};
            buildfire.publicData.searchAndUpdate({id: 1}, newData, 'info', function (err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.status).toEqual('updated');
            });
        });
    });

    describe('publicData delete', function () {
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.delete should exist and be a function", function () {
            expect(typeof buildfire.publicData.delete).toEqual("function");
        });

        it("buildfire.publicData.delete should delete an object ", function () {
            mockErr = null;
            mockResult = {
                status: "deleted"
            };
            buildfire.publicData.delete(1, 'info', function (err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.status).toEqual('deleted');
            });
        });

        it("buildfire.publicData.delete {salary:1000} should return an error", function () {
            mockErr = {};
            mockResult = {
                tag: 'info',
                data: {salary: 1000}
            };
            buildfire.publicData.delete({salary: 1000}, 'info', function (err, status) {
                expect(err).toEqual(jasmine.any(Object));
            });
        });
    });

    describe('publicData search', function () {
        beforeEach(function () {
            mockErr = null;
            mockResult = [
                {
                    data: {name: 'buildfire'},
                    id: 1
                }
            ]
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.search should exist and be a function", function () {
            expect(typeof buildfire.publicData.search).toEqual("function");
        });

        it("buildfire.publicData.search {$json.name:buildfire} on info tag should retrun this object", function () {
            buildfire.publicData.search({
                '$json.name': 'buildfire',
                page: 0,
                pageSize: 20
            }, 'info', function (err, result) {
                expect(err).toBeNull();
                expect(result.length).toBeGreaterThan(0);
                expect(result[0].data).toEqual(jasmine.objectContaining({
                    name: 'buildfire'
                }));
            });
        });
    });

    describe('publicData onUpdate', function () {
        beforeEach(function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name: 'buildfire'}
            }
        });
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.publicData.onUpdate should exist and be a function", function () {
            expect(typeof buildfire.publicData.onUpdate).toEqual("function");
        });

        it("buildfire.publicData.onUpdate should trigger afterAll save a new data  ", function () {
            buildfire.publicData.onUpdate(function (event) {
                expect(event).toEqual(jasmine.any(Object));
                expect(event.name).toEqual('buildfire');
            });
            var data = {name: 'buildfire'};
            buildfire.publicData.triggerOnUpdate(data);
        });
    });

    describe('publicData onRefresh', function () {
        it("buildfire.publicData.onRefresh should exist and be a function", function () {
            expect(typeof buildfire.publicData.onRefresh).toEqual("function");
        });

        it("buildfire.publicData.onRefresh trigger onRefresh event", function () {
            buildfire.publicData.onRefresh(function (event) {
                expect(event).toEqual(jasmine.any(Object));
                expect(event.name).toEqual('buildfire');
            });
            var data = {name: 'buildfire'};
            buildfire.publicData.triggerOnRefresh(data);
        });
    });

    describe('publicData triggerOnUpdate', function () {
        it("buildfire.publicData.triggerOnUpdate should exist and be a function", function () {
            expect(typeof buildfire.publicData.triggerOnUpdate).toEqual("function");
        });
    });

    describe('publicData triggerOnRefresh', function () {
        it("buildfire.publicData.triggerOnRefresh should exist and be a function", function () {
            expect(typeof buildfire.publicData.triggerOnRefresh).toEqual("function");
        });
    });

    describe('publicData disableRefresh', function () {
        it("buildfire.publicData.disableRefresh should exist and be a function", function () {
            expect(typeof buildfire.publicData.disableRefresh).toEqual("function");
        });
    });
});