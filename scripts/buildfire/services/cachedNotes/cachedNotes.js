(function () {
	var cachedNotes = buildfire.notes,
		context = buildfire.getContext(),
		fileSystemConfig = {
			path: '/data/cachedNotes',
			fileName: `cachedNotes_${context.instanceId}_$userId_$id.json`,
		};

	function isOnline() { return navigator.onLine; }

	function isMobile() { return context.device.platform !== 'web'; }

	function getFileSystemConfig(note, withContent, callback) {
		buildfire.auth.getCurrentUser(function (err, user) {
			if (err || !user) return callback('User not found.', null);
			else if (user && user._id) {
				let config = JSON.parse(JSON.stringify(fileSystemConfig));
				config.fileName = config.fileName.replace('$userId', user._id).replace('$id', note.itemId);
				if (withContent) config.content = JSON.stringify(note);
				callback(null, config);
			}
		});
	}

	function saveNoteOffline(note, callback) {
		getFileSystemConfig(note, true, function (error, config) {
			if (error || !config) return callback(error || true, null);
			buildfire._sendPacket(new Packet(null, 'fileManager.writeFileAsText', config), callback);
		});
	}

	function deleteNoteOffline(note, callback) {
		getFileSystemConfig(note, false, function (error, config) {
			if (error || !config) return callback(error || true, null);
			buildfire._sendPacket(new Packet(null, 'fileManager.deleteFile', config), callback);
		});
	}

	var openDialog = buildfire.notes.openDialog;

	cachedNotes.openDialog = function (options, callback) {
		if (!isOnline())
			return callback('This functionality is not available when offline.', null);
		openDialog(options, function (error, result) {
			if (error) return callback(error, null);
			if (result) {
				if (isMobile() && isOnline()) {
					result.hasNotes && result.noteCount !== 0 ?
						saveNoteOffline(Object.assign(options, result), (error, isWritten) => {
							if (error) return callback(error, null);
							if (isWritten) return callback(null, result);
							else callback(true, null);
						})
						: deleteNoteOffline(result, (error, isDeleted) => {
							if (error) return callback(error, null);
							if (isDeleted) return callback(null, result);
							else callback(true, null);
						});
				}
				else callback(null, result);
			} else return callback(true, null);
		});
	};

	var getByItemId = buildfire.notes.getByItemId;

	cachedNotes.getByItemId = function (options, callback) {
		if (isOnline()) {
			getByItemId(options, callback);
		} else {
			if (!isMobile()) return callback('This functionality is not available on Web when offline.', null);
			getFileSystemConfig({ itemId: options.itemId }, false, function (error, config) {
				if (error || !config) return callback(error || true, null);
				buildfire._sendPacket(new Packet(null, 'fileManager.readFileAsText', config),
					function (error, result) {
						if (error) return callback(error, null);
						if (result) callback(null, result);
						else callback(true, null);
					});
			});
		}
	};

	var onSeekTo = buildfire.notes.onSeekTo;

	cachedNotes.onSeekTo = function (callback, allowMultipleHandlers) {
		if (!isOnline()) return callback('This functionality is not available when offline.', null);
		onSeekTo(callback, allowMultipleHandlers);
	};

	buildfire.notes.openDialog = cachedNotes.openDialog;
	buildfire.notes.getByItemId = cachedNotes.getByItemId;
	buildfire.notes.onSeekTo = cachedNotes.onSeekTo;
})();
