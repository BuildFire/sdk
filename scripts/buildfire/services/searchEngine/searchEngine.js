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
 * @param {boolean} [options.linkedUser] - This will make the data linked to the current logged user, which means it will be private.
 * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
 * @param {string} options.title - Title for your data, this will be searchable by our search engine.
 * @param {string} [options.description] - Description for your data, this will be searchable by our search engine.
 * @param {string} [options.keywords] - Any keywords related to your data, this will be searchable by our search engine.
 * @param {string} [options.imageUrl].
 * @param {Object} [options.data] - You can add whatever you want here, this won't be searchable by our search engine.
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
 * Save data in buildfire search engine.
 * @param {Object} options - save options.
 * @param {boolean} [options.linkedUser] - This will make the data linked to the current logged user, which means it will be private.
 * @param {string} options.key - A unique key for your document, this will be the id of your document.
 * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
 * @param {string} options.title - Title for your data, this will be searchable by our search engine.
 * @param {string} [options.description] - Description for your data, this will be searchable by our search engine.
 * @param {string} [options.keywords] - Any keywords related to your data, this will be searchable by our search engine.
 * @param {string} [options.imageUrl].
 * @param {Object} [options.data] - You can add whatever you want here, this won't be searchable by our search engine.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 * @param {string} response.id - The id of the saved document.
 */
buildfire.services.searchEngine.save = function(options, cb){
    var packetId = null;
    var command = 'searchEngine.save';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * Update data in buildfire search engine.
 * @param {Object} options - update options.
 * @param {string} options.id - An id for your document to update it.
 * @param {boolean} [options.linkedUser] - This will make the data linked to the current logged user, which means it will be private.
 * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
 * @param {string} options.title - Title for your data, this will be searchable by our search engine.
 * @param {string} [options.description] - Description for your data, this will be searchable by our search engine.
 * @param {string} [options.keywords] - Any keywords related to your data, this will be searchable by our search engine.
 * @param {string} [options.imageUrl].
 * @param {Object} [options.data] - You can add whatever you want here, this won't be searchable by our search engine.
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

/**
 * Delete data in buildfire search engine.
 * @param {Object} options - delete options.
 * @param {string} options.id - An id for your document to delete it.
 * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {boolean} response
 */
buildfire.services.searchEngine.delete = function(options, cb){
    var packetId = null;
    var command = 'searchEngine.delete';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * Search data in buildfire search engine.
 * @param {Object} options - search options.
 * @param {string} options.searchText - Your search text.
 * @param {boolean} [options.linkedUser] - If true this will return all public data and the data added by the current logged user.
 * @param {string} [options.pageSize = 50]  - Size of data returned per page size.
 * @param {string} [options.pageIndex = 0] - Index of returned page.
 * @param {string} [options.preHighlightTag] - Use in conjunction with post tags to define the HTML tags to use for the highlighted text.
 * @param {string} [options.postHighlightTag] - Use in conjunction with pre tags to define the HTML tags to use for the highlighted text.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 * @param {Object} response.hits
 * @param {Object} response.hits.total
 * @param {Object} response.hits.max_score
 * @param {Object[]} response.hits.hits - Array of matched documents.
 */
buildfire.services.searchEngine.search = function(options, cb){
    var packetId = null;
    var command = 'searchEngine.search';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

buildfire.services.searchEngine.feeds = {
    /**
     * Attach feed in buildfire search engine.
     * @param {Object} options - attach options.
     * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
     * @param {string} options.title - Title for your data.
     * @param {string} options.feedType - feed type, available types : [rss].
     * @param {Object} options.feedConfig
     * @param {string} options.feedConfig.url - Your feed service url.
     * @param {Object} [options.feedItemConfig]
     * @param {string} [options.feedItemConfig.uniqueKey - Your feed unique id]
     * @param {string} [options.feedItemConfig.titleKey]
     * @param {string} [options.feedItemConfig.descriptionKey]
     * @param {string} [options.feedItemConfig.urlKey]
     * @param {string} [options.feedItemConfig.publishDateKey]
     * @param {string} [options.feedItemConfig.imageUrlKey]
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
     * delete feed from buildfire search engine.
     * @param {Object} options - delete options.
     * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
     * @param {string} options.feedId - Feed Id returned from feeds.get method.
     * @param {boolean} [options.removeFeedData] - If true, this will remove all feed data inside the app that's related to this feed.
     */

    /**
     * @callback cb
     * @param {Object} error
     * @param {boolean} response
     */
    delete: function (options, cb) {
        var packetId = null;
        var command = 'searchEngine.feeds.delete';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, cb);
    },
    /**
     * get feeds from buildfire search engine.
     * @param {Object} options - get options.
     * @param {string} options.tag - A unique key for your data, this is important for categorizing your data.
     * @param {string} options.feedType - feed type, available types : [rss].
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