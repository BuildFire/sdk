/**
 * Created by zain on 09/12/15.
 */

var mockErr, mockResult;

describe('buildfire.datastore', function () {
    describe('datastore save', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                    tag: 'info',
                    data: {name:'buildfire'}
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("datastore.save should exist and be a function", function () {
            expect(typeof buildfire.datastore.save).toEqual("function");
        });

        it("datastore.save({name:buildfire},'info') should add name:'buildfire' with tag:info "
            , function () {
            buildfire.datastore.save({name:'buildfire'},'info', function(err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('info');
                expect(status.data).toEqual(jasmine.objectContaining({
                    name:'buildfire'
                }));
            });
        });
    });

    describe('datastore get', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name:'buildfire'}
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.get should exist and be a function", function () {
            expect(typeof buildfire.datastore.get).toEqual("function");
        });

        it("datastore.get should return retrieve an object with tag:info and data:{name:'buildfire'}"
            , function () {
                buildfire.datastore.get('info',function (err, result) {
                    expect(err).toBeNull();
                    expect(result).toEqual(jasmine.any(Object));
                    expect(result.tag).toEqual('info');
                    expect(result.data).toEqual(jasmine.objectContaining({
                        name:'buildfire'
                    }));
            });
        });
    });

    describe('datastore getById', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name:'buildfire'}
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.getById should exist and be a function", function () {
            expect(typeof buildfire.datastore.getById).toEqual("function");
        });

        it("datastore.getById('5668de2247308714115776de','info') " +
            "should retrieve an object with tag:info and data:{name:'buildfire'}", function () {
            buildfire.datastore.getById('5668de2247308714115776de', 'info',function(err,result) {
                expect(err).toBeNull();
                expect(result).toEqual(jasmine.any(Object));
                expect(result.tag).toEqual('info');
                expect(result.data).toEqual(jasmine.objectContaining({
                    name:'buildfire'
                }));
            });
        });
    });

    describe('datastore insert', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                tag: 'record',
                data: {uid:101}
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.insert should exist and be a function", function () {
            expect(typeof buildfire.datastore.insert).toEqual("function");
        });

        it("datastore.insert({id:001},'record',true) " +
            "should add {id:001} with tag:record and check for duplicates", function () {
            buildfire.datastore.insert({uid:101},'record',true,function(err,status){
                //debugger;
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('record');
                expect(status.data).toEqual(jasmine.objectContaining({
                    uid:101
                }));
            });
        });

        it("datastore.insert({uid:001},'record',false) " +
            "should add duplicate {uid:101} with tag:record", function () {
            buildfire.datastore.insert({uid:101},'record',false,function(err,status){
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('record');
                expect(status.data).toEqual(jasmine.objectContaining({
                    uid:101
                }));
            });
        });

        it("datastore.insert({uid:101},'record',true) " +
            "should return duplicate error addition", function () {
            mockErr = {};
            buildfire.datastore.insert({id:101},'record',true,function(err,status){
                expect(err).toEqual(jasmine.any(Object));
            });
        });
    });

    describe('datastore bulkInsert', function () {
        var data = [{name:'miles',tel:'667-341-988'},{name:'davis',tel:'444-565-499'}];
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: data
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.bulkInsert should exist and be a function", function () {
            expect(typeof buildfire.datastore.bulkInsert).toEqual("function");
        });

        it("datastore.bulkInsert should insert bulk objects to info tag", function () {

                buildfire.datastore.bulkInsert(data, 'info', function (err, status) {
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

    describe('datastore update', function () {

        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.update should exist and be a function", function () {
            expect(typeof buildfire.datastore.update).toEqual("function");
        });

        it("buildfire.datastore.update should update an object", function () {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name: 'buildfire@2016'}
            }

            var newData = {name: 'buildfire@2016'}
            buildfire.datastore.update(1, newData,'info',function(err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.tag).toEqual('info');
                expect(status.data).toEqual(jasmine.objectContaining({
                    name: 'buildfire@2016'
                }));
            });
        });

        it("buildfire.datastore.update ", function () {
            mockErr = {};
            mockResult = {
                tag: 'info',
                data: {salary:1000}
            }
            buildfire.datastore.update('5668de22eeeeeeeeeeeeeeee',{salary:1000},'info',function(err, status) {
                expect(err).toEqual(jasmine.any(Object));
            });
        });

    });

    describe('datastore search and update', function () {
        afterAll(function () {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.searchAndUpdate should exist and be a function", function () {
            expect(typeof buildfire.datastore.searchAndUpdate).toEqual("function");
        });

        it("buildfire.datastore.searchAndUpdate should search and update an object", function () {
            mockErr = null;
            mockResult = {
                nModified: 1,
                status: "updated"
            };

            var newData = {name: 'buildfire@2016'};
            buildfire.datastore.searchAndUpdate({id: 1}, newData, 'info', function (err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.status).toEqual('updated');
            });
        });
    });

    describe('datastore delete', function () {
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.delete should exist and be a function", function () {
            expect(typeof buildfire.datastore.delete).toEqual("function");
        });

        it("buildfire.datastore.delete should delete an object ", function () {
            mockErr = null;
            mockResult = {
                status: "deleted"
            }
            buildfire.datastore.delete(1,'info',function(err, status) {
                expect(err).toBeNull();
                expect(status).toEqual(jasmine.any(Object));
                expect(status.status).toEqual('deleted');
            });
        });

        it("buildfire.datastore.delete {salary:1000} should return an error", function () {
            mockErr = {};
            mockResult = {
                tag: 'info',
                data: {salary: 1000}
            }
            buildfire.datastore.delete({salary:1000},'info',function(err, status) {
                expect(err).toEqual(jasmine.any(Object));

            });
        });
    });

    describe('datastore search', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = [
                {
                    data:{name: 'buildfire'},
                    id: 1
                }
            ]
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.search should exist and be a function", function () {
            expect(typeof buildfire.datastore.search).toEqual("function");
        });

        it("buildfire.datastore.search {$json.name:buildfire} on info tag should retrun this object", function () {
            buildfire.datastore.search({'$json.name':'buildfire', page:0,pageSize:20}, 'info',function(err,result) {
                expect(err).toBeNull();
                expect(result.length).toBeGreaterThan(0);
                expect(result[0].data).toEqual(jasmine.objectContaining({
                    name: 'buildfire'
                }));
            });
        });
    });

    describe('datastore onUpdate', function () {
        beforeEach (function() {
            mockErr = null;
            mockResult = {
                tag: 'info',
                data: {name:'buildfire'}
            }
        });
        afterAll (function() {
            mockErr = null;
            mockResult = null;
        });

        it("buildfire.datastore.onUpdate should exist and be a function", function () {
            expect(typeof buildfire.datastore.onUpdate).toEqual("function");
        });

        it("buildfire.datastore.onUpdate should trigger afterAll save a new data  ", function () {
            buildfire.datastore.onUpdate(function(event){
                expect(event).toEqual(jasmine.any(Object));
                expect(event.name).toEqual('buildfire');
            });
            var data = {name:'buildfire'};
            buildfire.datastore.triggerOnUpdate(data);
        });
    });

    describe('datastore onRefresh', function () {
        it("buildfire.datastore.onRefresh should exist and be a function", function () {
            expect(typeof buildfire.datastore.onRefresh).toEqual("function");
        });

        it("buildfire.datastore.onRefresh trigger onRefresh event", function () {
            buildfire.datastore.onRefresh(function(event) {
                expect(event).toEqual(jasmine.any(Object));
                expect(event.name).toEqual('buildfire');
            });
            var data = {name:'buildfire'};
            buildfire.datastore.triggerOnRefresh(data);
        });
    });

    describe('datastore triggerOnUpdate', function () {
        it("buildfire.datastore.triggerOnUpdate should exist and be a function", function () {
            expect(typeof buildfire.datastore.triggerOnUpdate).toEqual("function");
        });
    });

    describe('datastore triggerOnRefresh', function () {
        it("buildfire.datastore.triggerOnRefresh should exist and be a function", function () {
            expect(typeof buildfire.datastore.triggerOnRefresh).toEqual("function");
        });
    });

    describe('datastore disableRefresh', function () {
        it("buildfire.datastore.disableRefresh should exist and be a function", function () {
            expect(typeof buildfire.datastore.disableRefresh).toEqual("function");
        });
    });
});