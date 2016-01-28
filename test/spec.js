'use strict';
/**
 * Created by Daniel on 8/4/2015.
 */


var expect = chai.expect;


/*******************************************************/
describe('buildfire', function () {
    console.log('test');
    it("buildfire", function () {
        expect(buildfire).to.a("object");
    });

    it("buildfire.logger should exist and be a object", function () {
        expect(buildfire.logger).to.a("object");
    });
    it("buildfire._callbacks should exist and be a object", function () {
        expect(buildfire._callbacks).to.a("object");
    });
    it("buildfire.init should exist and be a function", function () {
        expect(buildfire.init).to.a("function");
    });
    it("buildfire._postMessageHandler should exist and be a function", function () {
        expect(buildfire._postMessageHandler).to.a("function");
    });
    it("buildfire.getContext should exist and be a function", function () {
        expect(buildfire.getContext).to.a("function");
    });
    it("buildfire.navigation should exist and be a object", function () {
        expect(buildfire.navigation).to.a("object");
    });
    it("buildfire.appearance should exist and be a object", function () {
        expect(buildfire.appearance).to.a("object");
    });
    it("buildfire._sendPacket should exist and be a function", function () {
        expect(buildfire._sendPacket).to.a("function");
    });
    it("buildfire.analytics should exist and be a object", function () {
        expect(buildfire.analytics).to.a("object");
    });
    it("buildfire.datastore should exist and be a object", function () {
        expect(buildfire.datastore).to.a("object");
    });
    it("buildfire.imageLib should exist and be a object", function () {
        expect(buildfire.imageLib).to.a("object");
    });
    it("buildfire.notifications should exist and be a object", function () {
        expect(buildfire.notifications).to.a("object");
    });
    it("buildfire.actionItems should exist and be a object", function () {
        expect(buildfire.actionItems).to.a("object");
    });
});

/*******************************************************/
describe('buildfire.navigation', function () {

    it("buildfire.navigateTo should exist and be a function", function () {
        expect(buildfire.navigation.navigateTo).to.a("function");
    });
    it("buildfire.navigateHome should exist and be a function", function () {
        expect(buildfire.navigation.navigateHome).to.a("function");
    });
    it("buildfire.openWindow should exist and be a function", function () {
        expect(buildfire.navigation.openWindow).to.a("function");
    });
});
/*******************************************************/
describe('buildfire.logger', function () {
    it("buildfire.logger._suppress should exist and be a boolean", function () {
        expect(buildfire.logger._suppress).to.a("boolean");
    });
    it("buildfire.logger.show should exist and be a function", function () {
        expect(buildfire.logger.show).to.a("function");
    });
    it("buildfire.logger.hide should exist and be a function", function () {
        expect(buildfire.logger.hide).to.a("function");
    });
    it("buildfire.logger.error should exist and be a function", function () {
        expect(buildfire.logger.error).to.a("function");
    });
    it("buildfire.logger.log should exist and be a function", function () {
        expect(buildfire.logger.log).to.a("function");
    });
    it("buildfire.logger.warn should exist and be a function", function () {
        expect(buildfire.logger.warn).to.a("function");
    });
    it("buildfire.logger.debug should exist and be a function", function () {
        expect(buildfire.logger.debug).to.a("function");
    });
});

/*******************************************************/
describe('buildfire.appearance', function () {
    it("buildfire.appearance.getCSSFiles should exist and be a function", function () {
        expect(buildfire.appearance.getCSSFiles).to.a("function");
    });
    it("buildfire.appearance.attachCSSFiles should exist and be a function", function () {
        expect(buildfire.appearance.attachCSSFiles).to.a("function");
    });
    it("buildfire.appearance.attachAppThemeCSSFiles should exist and be a function", function () {
        expect(buildfire.appearance.attachAppThemeCSSFiles).to.a("function");
    });
    it("buildfire.appearance._resizedTo should exist and be a number", function () {
        expect(buildfire.appearance._resizedTo).to.a("number");
    });
    it("buildfire.appearance.autosizeContainer should exist and be a function", function () {
        expect(buildfire.appearance.autosizeContainer).to.a("function");
    });
    it("buildfire.appearance.setHeaderVisibility should exist and be a function", function () {
        expect(buildfire.appearance.setHeaderVisibility).to.a("function");
    });
});
/*******************************************************/
describe('buildfire.analytics', function () {
    it("buildfire.analytics.trackAction should exist and be a function", function () {
        expect(buildfire.analytics.trackAction).to.a("function");
    });
    it("buildfire.analytics.trackView should exist and be a function", function () {
        expect(buildfire.analytics.trackView).to.a("function");
    });
});
/*******************************************************/
describe('buildfire.datastore', function () {
    it("buildfire.datastore.get should exist and be a function", function () {
        expect(buildfire.datastore.get).to.a("function");

        buildfire.datastore.get(function (err, result) {
            expect(err).to.be.null();
            expect(result).to.be.a('object');
        });

    });
    it("buildfire.datastore.getById should exist and be a function", function () {
        expect(buildfire.datastore.getById).to.a("function");
    });
    it("buildfire.datastore.save should exist and be a function", function () {
        expect(buildfire.datastore.save).to.a("function");
    });
    it("buildfire.datastore.insert should exist and be a function", function () {
        expect(buildfire.datastore.insert).to.a("function");
    });
    it("buildfire.datastore.bulkInsert should exist and be a function", function () {
        expect(buildfire.datastore.bulkInsert).to.a("function");
    });
    it("buildfire.datastore.update should exist and be a function", function () {
        expect(buildfire.datastore.update).to.a("function");
    });
    it("buildfire.datastore.delete should exist and be a function", function () {
        expect(buildfire.datastore.delete).to.a("function");
    });
    it("buildfire.datastore.search should exist and be a function", function () {
        expect(buildfire.datastore.search).to.a("function");
    });
    it("buildfire.datastore.onUpdate should exist and be a function", function () {
        expect(buildfire.datastore.onUpdate).to.a("function");
    });
    it("buildfire.datastore.triggerOnUpdate should exist and be a function", function () {
        expect(buildfire.datastore.triggerOnUpdate).to.a("function");
    });
    it("buildfire.datastore.onRefresh should exist and be a function", function () {
        expect(buildfire.datastore.onRefresh).to.a("function");
    });
    it("buildfire.datastore.triggerOnRefresh should exist and be a function", function () {
        expect(buildfire.datastore.triggerOnRefresh).to.a("function");
    });
    it("buildfire.datastore.disableRefresh should exist and be a function", function () {
        expect(buildfire.datastore.disableRefresh).to.a("function");
    });
});
/*******************************************************/
describe('buildfire.imageLib', function () {
    it("buildfire.imageLib.showDialog should exist and be a function", function () {
        expect(buildfire.imageLib.showDialog).to.a("function");
    });
    it("buildfire.imageLib.resizeImage should exist and be a function", function () {
        expect(buildfire.imageLib.resizeImage).to.a("function");
    });
    it("buildfire.imageLib.cropImage should exist and be a function", function () {
        expect(buildfire.imageLib.cropImage).to.a("function");
    });
});
/*******************************************************/
describe('buildfire.notifications', function () {
    it("buildfire.notifications.alert should exist and be a function", function () {
        expect(buildfire.notifications.alert).to.a("function");
    });
    it("buildfire.notifications.confirm should exist and be a function", function () {
        expect(buildfire.notifications.confirm).to.a("function");
    });
    it("buildfire.notifications.prompt should exist and be a function", function () {
        expect(buildfire.notifications.prompt).to.a("function");
    });
    it("buildfire.notifications.beep should exist and be a function", function () {
        expect(buildfire.notifications.beep).to.a("function");
    });
    it("buildfire.notifications.vibrate should exist and be a function", function () {
        expect(buildfire.notifications.vibrate).to.a("function");
    });
});
/*******************************************************/
describe('buildfire.actionItems', function () {
    it("buildfire.actionItems.showDialog should exist and be a function", function () {
        expect(buildfire.actionItems.showDialog).to.a("function");
    });

    it("buildfire.actionItems.execute should exist and be a function", function () {
        expect(buildfire.actionItems.execute).to.a("function");
    });

    it("buildfire.actionItems.list should exist and be a function", function () {
        expect(buildfire.actionItems.list).to.a("function");
    });
});

function writeSchemaTest(objName) {
    var obj;
    try {
        obj = eval(objName);
    }
    catch (e) {
        return "";
    }
    var queue = [];
    var test = "/*******************************************************/\r"
        + " describe('" + objName + "', function() {";
    var hasProperties = false;
    for (var p in obj) {
        hasProperties = true;
        var t = typeof(obj[p]);
        test += 'it("' + objName + "." + p + ' should exist and be a ' + t + '", function() {'
        + '   expect(' + objName + "." + p + ').to.a("' + t + '");'
        + '});';
        queue.push(objName + "." + p);
    }
    test += "});";

    if (!hasProperties) return "";
    for (var i in queue)
        test += writeSchemaTest(queue[i]);

    return test;
}
