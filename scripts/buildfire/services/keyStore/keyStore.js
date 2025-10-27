if (typeof (buildfire) === 'undefined') throw ('please add buildfire.js first to use Buildfire services');

if (typeof (buildfire.services) === 'undefined') buildfire.services = {};
if (typeof (buildfire.services.keyStore) === 'undefined') buildfire.services.keyStore = {};

buildfire.services.keyStore = {
  
  /**
   * /**
   *  * @param {Object} options Configuration options for the key pair setup.
   *   * @param {string} options.id.
   *  * @param {Function} Callback to handle the response.
   *  */
  get: function (options, callback) {
    if (!callback || typeof(callback) !== 'function') {
      callback({'code': 'error', 'message': 'callback is required'}, null);
      return;
    }
    
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }
    
    const packetId = null;
    const command = "keyStore.get";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);  },
  
  /**
   * /**
   *  * @param {Object} options Configuration options for the key pair setup.
   *   * @param {string} options.allowCancel.
   *   * @param {Object} translations Optional custom labels for UI texts.
   *  * @param {Function} Callback to handle the response.
   *  */
  initiateSetup: function (options, callback) {
    if (!callback || typeof(callback) !== 'function') {
      callback({'code': 'error', 'message': 'callback is required'}, null);
      return;
    }
    
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }
    
    const packetId = null;
    const command = "keyStore.initiateSetup";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
  },
  
  /**
   * /**
   *  * @param {Object} options Configuration options for the key pair setup.
   *   * @param {string} options.allowCancel.
   *   * @param {Object} translations Optional custom labels for UI texts.
   *  * @param {Function} Callback to handle the response.
   *  */
  initiateRecovery: function (options, callback) {
    if (!callback || typeof(callback) !== 'function') {
      callback({'code': 'error', 'message': 'callback is required'}, null);
      return;
    }
    
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }

    const packetId = null;
    const command = "keyStore.initiateRecovery";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
  },
  
  /**
   * /**
   *  * @param {Object} options Configuration options for the key pair setup.
   *   * @param {string} options.allowCancel.
   *   * @param {Object} translations Optional custom labels for UI texts.
   *  * @param {Function} Callback to handle the response.
   *  */
  initiatePinChange: function (options, callback) {
    if (!callback || typeof(callback) !== 'function') {
      callback({'code': 'error', 'message': 'callback is required'}, null);
      return;
    }
    
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }
    
    const packetId = null;
    const command = "keyStore.initiatePinChange";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
  },
};
