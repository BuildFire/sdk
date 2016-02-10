/**
 * Created by zain on 09/12/15.
 */

expect = chai.expect;

describe('buildfire.datastore', function () {

    describe('datastore save', function () {
        it("datastore.save should exist and be a function", function () {
            expect(buildfire.datastore.save).to.a("function");
        });

        it("datastore.save({name:buildfire},'info') should add {name:'buildfire'} with tag:info "
            , function (done) {
            buildfire.datastore.save({name:'buildfire'},'info', function(err, status) {
                expect(err).to.null;
                expect(status).to.an('object');
                expect(status.tag).to.equal('info');
                expect(status.data).to.have.property('name','buildfire');
                done();
            });

        });
    });

    describe('datastore get', function () {
            it("buildfire.datastore.get should exist and be a function", function () {
                expect(buildfire.datastore.get).to.a("function");
            });

            it("datastore.get should return retrieve an object with tag:info and data:{name:'buildfire'}"
                , function (done) {
                buildfire.datastore.get('info',function (err, result) {
                    expect(err).to.null;
                    expect(result).to.an('object');
                    expect(result.tag).to.equal('info');
                    expect(result.data).to.have.property('name','buildfire');
                    done();
            });
        });
    });

    describe('datastore getById', function () {
        it("buildfire.datastore.getById should exist and be a function", function () {
            expect(buildfire.datastore.getById).to.a("function");
        });

        it("datastore.getById('569bf5c83fe1e26a62d90562','info') " +
            "should retrieve an object with tag:info and data:{name:'buildfire'}", function (done) {
            buildfire.datastore.getById('569bf5c83fe1e26a62d90562', 'info',function(err,result) {
                expect(err).to.null;
                expect(result).to.an('object');
                expect(result.tag).to.equal('info');
                done();
            });
        });
    });

    describe('datastore insert', function () {
        it("buildfire.datastore.insert should exist and be a function", function () {
            expect(buildfire.datastore.insert).to.a("function");
        });
    });

    describe('datastore bulkInsert', function () {
        it("buildfire.datastore.bulkInsert should exist and be a function", function () {
            expect(buildfire.datastore.bulkInsert).to.a("function");
        });

        it("datastore.bulkInsert should insert bulk objects to info tag", function (done) {
                var data = [{name:'miles',tel:'667-341-988'},{name:'davis',tel:'444-565-499'}]
                buildfire.datastore.bulkInsert(data, 'info', function (err, status) {
                    expect(err).to.null;
                    expect(status).to.an('object');
                    expect(status.tag).to.equal('info');
                    expect(status.data[0]).to.have.property('name','miles');
                    expect(status.data[0]).to.have.property('tel','667-341-988');
                    expect(status.data[1]).to.have.property('name', 'davis');
                    expect(status.data[1]).to.have.property('tel', '444-565-499');
                    done();
            });
        });
    });

    describe('datastore update', function () {
        it("buildfire.datastore.update should exist and be a function", function () {
            expect(buildfire.datastore.update).to.a("function");
        });

        it("buildfire.datastore.update should update an object", function (done) {
            buildfire.datastore.get('info',function (err, result) {
                var newData = result.data;
                newData.name = "buildfire@2016";

                buildfire.datastore.update(result.id, newData,'info',function(err, status) {
                    expect(err).to.null;
                    expect(status).to.an('object');
                    expect(status.tag).to.equal('info');
                    expect(status.data).to.have.property('name','buildfire@2016');
                    done();
                });

            });
        });
    });

    describe('datastore delete', function () {
        it("buildfire.datastore.delete should exist and be a function", function () {
            expect(buildfire.datastore.delete).to.a("function");
        });

        it("buildfire.datastore.delete should delete an object ", function (done) {
            buildfire.datastore.get('info',function (err, result) {
                buildfire.datastore.delete(result.id,'info',function(err, status) {
                    expect(err).to.null;
                    expect(status).to.an('object');
                    expect(status.status).to.equal('deleted');
                    done();
                });
            });
        });

        it("buildfire.datastore.delete {salary:1000} should return an error", function (done) {
            buildfire.datastore.delete({salary:1000},'info',function(err, status) {
                expect(err).to.an('object');
                done();
            });
        });
    });

    describe('datastore search', function () {
        it("buildfire.datastore.search should exist and be a function", function () {
            expect(buildfire.datastore.search).to.a("function");
        });
    });

    describe('datastore onUpdate', function () {
        it("buildfire.datastore.onUpdate should exist and be a function", function () {
            expect(buildfire.datastore.onUpdate).to.a("function");
        });

        it("buildfire.datastore.onUpdate should trigger after save a new data  ", function (done) {

            buildfire.datastore.save({name:'buildfire'},'info', function(err, status) {
            });

            buildfire.datastore.onUpdate(function(event){
                expect(event).to.an('object');
                expect(event.tag).to.equal('info');
                expect(event.data.name).to.equal('buildfire');
                done();
            });
        });
    });

    describe('datastore onRefresh', function () {
        this.timeout(3000);
        it("buildfire.datastore.onRefresh should exist and be a function", function () {
            expect(buildfire.datastore.onRefresh).to.a("function");
        });

        it("buildfire.datastore.onRefresh trigger onRefresh event", function (done) {

            buildfire.datastore.onRefresh(function(event) {

                expect(event).to.an('object');
                expect(event.name).to.equal('buildfire');
                done();
            });

            var data = {name:'buildfire'};
            buildfire.datastore.triggerOnRefresh(data);
        });
    });

    describe('datastore triggerOnUpdate', function () {
        it("buildfire.datastore.triggerOnUpdate should exist and be a function", function () {
            expect(buildfire.datastore.triggerOnUpdate).to.a("function");
        });
    });

    describe('datastore triggerOnRefresh', function () {
        it("buildfire.datastore.triggerOnRefresh should exist and be a function", function () {
            expect(buildfire.datastore.triggerOnRefresh).to.a("function");
        });
    });

    describe('datastore disableRefresh', function () {
        it("buildfire.datastore.disableRefresh should exist and be a function", function () {
            expect(buildfire.datastore.disableRefresh).to.a("function");
        });
    });
});