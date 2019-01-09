/**
 * Created by AhmadFHamed on 1/07/2019.
 * Ref: https://github.com/BuildFire/app/wiki/Search-Engine-Tech-Spec
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.searchEngine) == "undefined") buildfire.services.searchEngine = {};

/**
 * Insert data in buildfire search engine.
 * @param {Object} options - insert options.
 * @param {boolean=} options.linkedUser - This will make the data linked to the current logged user, which means it will be private.
 * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
 * @param {string} options.title - Title for your data, this will be searchable by our search engine.
 * @param {string=} options.description - Description for your data, this will be searchable by our search engine.
 * @param {string=} options.keywords - Any keywords related to your data, this will be searchable by our search engine.
 * @param {string=} options.image_url.
 * @param {Object=} options.data - You can add whatever you want here, this won't be searchable by our search engine.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 * @param {string} response.id - The id of the newly inserted document.
 */
buildfire.services.searchEngine.insert = function(options, cb){
    var packetId = null;
    var command = 'searchEngine.insert';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * Update data in buildfire search engine.
 * @param {Object} options - update options.
 * @param {string} options.id - An id for your document to update it.
 * @param {string=} options.linkedUser - This will make the data linked to the current logged user, which means it will be private.
 * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
 * @param {string} options.title - Title for your data, this will be searchable by our search engine.
 * @param {string=} options.description - Description for your data, this will be searchable by our search engine.
 * @param {string=} options.keywords - Any keywords related to your data, this will be searchable by our search engine.
 * @param {string=} options.image_url.
 * @param {Object=} options.data - You can add whatever you want here, this won't be searchable by our search engine.
 */

/**
 * @callback cb
 * @param {Object} error
 *
 * @param {Object} response
 * @param {string} response.id - The id of the updated document.
 */
buildfire.services.searchEngine.update = function(options, cb){
    var packetId = null;
    var command = 'searchEngine.update';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

buildfire.services.searchEngine.search = function(options, cb){
    var packetId = null;
    var command = 'searchEngine.search';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

buildfire.services.searchEngine.feeds = {
    /**
     * Insert data in buildfire search engine.
     * @param {Object} options - insert options.
     * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
     * @param {string} options.title - Title for your data.
     * @param {string} options.feed_type - feed type, available types : [rss].
     * @param {Object} options.feed_config
     * @param {string} options.feed_config.url - Your feed service url.
     * @param {Object} options.feed_item_config.
     * @param {string} options.feed_item_config.unique_key - Your feed unique id.
     * @param {string} options.feed_item_config.title_key
     * @param {string=} options.feed_item_config.description_key
     * @param {string=} options.feed_item_config.url_key
     * @param {string=} options.feed_item_config.publish_date_key
     * @param {string=} options.feed_item_config.image_url_key
     */

    /**
     * @callback cb
     * @param {Object} error
     * @param {Object} response
     * @param {string} response - return true.
     */
    insert: function (options, cb) {
        var packetId = null;
        var command = 'searchEngine.feeds.insert';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, cb);
    },
    /**
     * Insert data in buildfire search engine.
     * @param {Object} options - insert options.
     * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
     * @param {string} options.feed_id - Feed Id returned from feeds.get method.
     * @param {boolean=} options.remove_feed_data - If true, this will remove all feed data inside the app that's related to this feed.
     */

    /**
     * @callback cb
     * @param {Object} error
     * @param {Object} response
     * @param {string} response - return true.
     */
    delete: function (options, cb) {
        var packetId = null;
        var command = 'searchEngine.feeds.delete';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, cb);
    },
    /**
     * Insert data in buildfire search engine.
     * @param {Object} options - insert options.
     * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
     * @param {string} options.feed_type - feed type, available types : [rss].
     */

    /**
     * @callback cb
     * @param {Object} error
     * @param {Object} response
     * @param {string} response - return array of feeds.
     */
    get: function (options, cb) {
        var packetId = null;
        var command = 'searchEngine.feeds.get';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, cb);
    }
};