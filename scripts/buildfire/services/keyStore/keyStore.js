if (typeof (buildfire) === 'undefined') throw ('please add buildfire.js first to use Buildfire services');

if (typeof (buildfire.services) === 'undefined') buildfire.services = {};
if (typeof (buildfire.services.keyStore) === 'undefined') buildfire.services.keyStore = {};

/**
 * /**
 *  * Generate, reset, or retrieve a key pair for the currently authenticated user.
 *  * @param {Object} options Configuration options for the key pair setup.
 *  * @param {string} [options.id='default'] Optional identifier for the key pair.
 *   * @param {Object} translations Optional custom labels for UI texts.
 *  * @param {Function} Callback to handle the response.
 *  */

buildfire.services.keyStore = {
  startKeyPairSetup: function (options, callback) {
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }
    
    if (!options.id) {
      options.id = 'default'
    }
    
    const packetId = null;
    const command = "keyStore.startKeyPairSetup";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
  },
  
  startKeyPairRecovery: function (options, callback) {
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }
    
    if (!options.id) {
      options.id = 'default'
    }

    const packetId = null;
    const command = "keyStore.startKeyPairRecovery";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
  },
  
  startKeyPairChange: function (options, callback) {
    if (!options) {
      callback({'code': 'error', 'message': 'Options is required'}, null);
      return;
    }
    
    if (!options.id) {
      options.id = 'default'
    }
    
    const packetId = null;
    const command = "keyStore.startKeyPairChange";
    
    const packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
  },
};
