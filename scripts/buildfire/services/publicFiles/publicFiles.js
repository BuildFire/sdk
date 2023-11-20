if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) == 'undefined') buildfire.services = {};

if (typeof (buildfire.services.publicFiles) == 'undefined')
	buildfire.services.publicFiles = {};

buildfire.services.publicFiles.showDialog = function (options, onProgress, onComplete, callback) {
	options = options || {};
	options._operationId = new Date().getTime();

	if (typeof onProgress == 'function') {
		buildfire.eventManager.add('publicFilesOnProgress', function (data) {
			if(data.file && data.file._operationId === options._operationId) {
				onProgress(data);
			}
		}, true);
	}

	if (typeof onComplete == 'function') {
		buildfire.eventManager.add('publicFilesOnComplete', function (data) {
			if(data.file && data.file._operationId === options._operationId) {
				onComplete(data);
			}
		}, true);
	}



	var p = new Packet(null, 'publicFiles.showDialog', options);
	buildfire._sendPacket(p, callback);
};

buildfire.services.publicFiles.getFileUrl = function (options, callback) {
	var p = new Packet(null, 'publicFiles.getFileUrl', options);
	buildfire._sendPacket(p, callback);
};

buildfire.services.publicFiles.modifyPermissions = function (options, callback) {
	var p = new Packet(null, 'publicFiles.modifyPermissions', options);
	buildfire._sendPacket(p, callback);
};

buildfire.services.publicFiles.deleteFile = function (options, callback) {
	var p = new Packet(null, 'publicFiles.deleteFile', options);
	buildfire._sendPacket(p, callback);
};

buildfire.services.publicFiles._triggerOnProgress = function (data) {
	buildfire.eventManager.trigger('publicFilesOnProgress', data);
};

buildfire.services.publicFiles._triggerOnComplete = function (data) {
	buildfire.eventManager.trigger('publicFilesOnComplete', data);
};

buildfire.services.publicFiles.uploadFiles = function (files, options, onProgress, onComplete, callback) {
	options = options || {};
	options._operationId = new Date().getTime();

	if (typeof onProgress == 'function') {
		buildfire.eventManager.add('publicFilesOnProgress', function (data) {
			if(data.file && data.file._operationId === options._operationId) {
				onProgress(data);
			}
		}, true);
	}

	if (typeof onComplete == 'function') {
		buildfire.eventManager.add('publicFilesOnComplete', function (data) {
			if(data.file && data.file._operationId === options._operationId) {
				onComplete(data);
			}
		}, true);
	}

	if (!options) options = {};
	options.files = files;
	var p = new Packet(null, 'publicFiles.uploadFilesManually', options);
	buildfire._sendPacket(p, callback);
};
