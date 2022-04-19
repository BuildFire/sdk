(function () {
    var cachedNotes = buildfire.notes,
        context = buildfire.getContext(),
        fileSystemConfig = {
            path: "/data/cachedNotes",
            fileName: `cachedNotes_${context.instanceId}_$id.json`,
        };

    function isOnline() { return navigator.onLine; };

    function isMobile() { return context.device.platform !== "web" };

    function getFileSystemConfig(itemId) {
        let config = JSON.parse(JSON.stringify(fileSystemConfig));
        config.fileName = config.fileName.replace("$id", itemId);
        return config;
    };

    function getFileSystemConfigWithContent(note) {
        let config = JSON.parse(JSON.stringify(fileSystemConfig));
        config.fileName = config.fileName.replace("$id", note.itemId);
        config.content = JSON.stringify(note);
        return config;
    };

    function saveNoteOffline(note, callback) {
        buildfire._sendPacket(new Packet(null, "fileManager.writeFileAsText",
            getFileSystemConfigWithContent(note)), callback);
    };

    function deleteNoteOffline(note, callback) {
        buildfire._sendPacket(new Packet(null, "fileManager.deleteFile",
            getFileSystemConfig(note.itemId)), callback);
    };

    var openDialog = buildfire.notes.openDialog;

    cachedNotes.openDialog = function (options, callback) {
        openDialog(options, function (error, result) {
            if (error) return callback(error, null);
            if (result) {
                if(isMobile() && isOnline()) {
                    result.hasNotes && result.noteCount !== 0 ?
                    saveNoteOffline(Object.assign(options, result), (error, isWritten) => {
                        if (error) return callback(error, null);
                        if (isWritten) return callback(null, result);
                    })
                    : deleteNoteOffline(result, (error, isDeleted) => {
                        if (error) return callback(error, null);
                        if (isDeleted) return callback(null, result);
                    });
                } else {
                    callback(null, result);
                }
            }
        });
    };

    var getByItemId = buildfire.notes.getByItemId;

    cachedNotes.getByItemId = function (itemId, callback) {
        if (isOnline()) {
            getByItemId(itemId, callback);
        } else {
            if (!isMobile()) return callback;
            buildfire._sendPacket(new Packet(null, "fileManager.readFileAsText",
                getFileSystemConfig(itemId.itemId)), function (error, result) {
                    if (error) return callback(error, null);
                    if (result) callback(null, result);
                    else callback(null, null);
                });
        }
    };

    buildfire.notes.openDialog = cachedNotes.openDialog;
    buildfire.notes.getByItemId = cachedNotes.getByItemId;
})()
